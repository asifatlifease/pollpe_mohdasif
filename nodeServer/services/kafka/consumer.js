const { kafka } = require("./index");
const kafkaProducer = require("./producer");
const PollModel = require("../../src/poll/model");
const VoteModel = require("../../src/vote/model");
const LeaderboardModel = require("../../src/leaderboard/model");

const consumeVoteTopic = async () => {
  const consumer = kafka.consumer({ groupId: "voteGroup" });
  await consumer.connect();

  await consumer.subscribe({ topics: ["voteTopic"] });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const { poll, isUserAlreadyVoted, userVote } = JSON.parse(
          message.value
        );
        let updatedPoll = {};
        let optionVoteCounts = 0;
        let voteOptionText = "";

        // Calculate updated options and total votes based on user's action
        if (isUserAlreadyVoted) {
          if (
            !userVote.isVoted &&
            userVote.optionText === isUserAlreadyVoted.optionText
          ) {
            // User removes their vote
            const updatedOptions = poll.options.map((option) => {
              if (option.text === userVote.optionText) {
                optionVoteCounts = option.voteCount - 1;
                voteOptionText = option.text;
                return { ...option, voteCount: optionVoteCounts };
              }
              return option;
            });

            updatedPoll = {
              options: updatedOptions,
              totalVotes: updatedOptions.reduce(
                (total, option) => total + option.voteCount,
                0
              ),
              action: "deleteVote",
            };

            // decrement the previous option and increment on the new option
          }

          if (
            userVote.isVoted &&
            userVote.optionText !== isUserAlreadyVoted.optionText
          ) {
            const updatedOptions = poll.options.map((option) => {
              if (option.text === userVote.optionText) {
                optionVoteCounts = option.voteCount + 1;
                voteOptionText = option.text;
                return { ...option, voteCount: optionVoteCounts };
              }
              if (option.text === isUserAlreadyVoted.optionText) {
                optionVoteCounts = option.voteCount - 1;
                voteOptionText = option.text;
                return { ...option, voteCount: optionVoteCounts };
              }
              return poll;
            });

            updatedPoll = {
              options: updatedOptions,
              totalVotes: updatedOptions.reduce(
                (total, option) => total + option.voteCount,
                0
              ),
              action: "castVote",
            };
          }
        } else {
          // New vote cast
          const updatedOptions = poll.options.map((option) => {
            if (option.text === userVote.optionText) {
              optionVoteCounts = option.voteCount + 1;
              voteOptionText = option.text;
              return { ...option, voteCount: optionVoteCounts };
            }
            return option;
          });

          updatedPoll = {
            options: updatedOptions,
            totalVotes: updatedOptions.reduce(
              (total, option) => total + option.voteCount,
              0
            ),
            action: "castVote",
          };
        }

        console.log(
          `Sending to voteProcessedTopic ===>: [${topic}]: PART:${partition}:`,
          {
            ...poll,
            ...updatedPoll,
            isVoted: userVote.isVoted,
            optionText: voteOptionText,
            anonymousId: userVote.anonymousId,
            optionVoteCounts,
          }
        );

        await kafkaProducer({
          topicName: "voteProcessedTopic",
          key: `${userVote.pollId}${userVote.anonymousId}`,
          value: {
            ...poll,
            ...updatedPoll,
            isVoted: userVote.isVoted,
            optionText: voteOptionText,
            anonymousId: userVote.anonymousId,
            optionVoteCounts,
          },
        });
      } catch (error) {
        console.error("Error processing vote:", error);
      }
    },
  });
};

const consumeVoteProcessedTopic = async () => {
  const consumer = kafka.consumer({ groupId: "updateDbAndLeaderboardGroup" });
  await consumer.connect();

  await consumer.subscribe({ topics: ["voteProcessedTopic"] });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const {
          isVoted,
          optionText,
          anonymousId,
          optionVoteCounts,
          totalVotes,
          action,
          ...pollDetails
        } = JSON.parse(message.value);

        console.log(
          `updateDbAndLeaderboard ===> : [${topic}]: PART:${partition}:`,
          message.value.toString()
        );

        // Handle vote deletion
        if (action === "deleteVote") {
          console.log("deleting the vote", {
            pollId: pollDetails._id,
            anonymousId,
          });
          await VoteModel.deleteOne({ pollId: pollDetails._id, anonymousId });
        }

        // Handle vote casting/updating
        if (action === "castVote") {
          console.log("Updating the vote", {
            optionText,
            optionVoteCounts,
            isVoted,
            pollId: pollDetails._id,
            anonymousId,
          });
          await VoteModel.updateOne(
            { pollId: pollDetails._id, anonymousId },
            {
              optionText,
              optionVoteCounts,
              isVoted,
              pollId: pollDetails._id,
              anonymousId,
            },
            { upsert: true }
          );
        }

        console.log("Updating the poll", pollDetails);
        // Update the poll
        await PollModel.updateOne(
          { _id: pollDetails._id },
          { options: pollDetails.options, totalVotes }
        );

        console.log("Updating the leaderbord", {
          pollId: pollDetails._id,
          optionText,
          optionVoteCounts,
          totalVotes,
          pollStatus: pollDetails.pollStatus,
        });

        // Update the leaderboard
        await LeaderboardModel.updateOne(
          { pollId: pollDetails._id },
          {
            title: pollDetails.title,
            optionText,
            optionVoteCounts,
            totalVotes,
            pollStatus: pollDetails.pollStatus,
          },
          { upsert: true }
        );

        console.log("Operation completed successfully.");

        // leaderboard updates to users via "leaderboardTopic"
        await kafkaProducer({
          topicName: "leaderboardTopic",
          key: `${pollDetails._id}${anonymousId}`,
          value: {
            pollId: pollDetails._id,
            title: pollDetails.title,
            optionText,
            optionVoteCounts,
            totalVotes,
            pollStatus: pollDetails.pollStatus,
          },
        });
      } catch (error) {
        console.error("Operation failed due to error:", error.message);
      }
    },
  });
};

module.exports = {
  consumeVoteTopic,
  consumeVoteProcessedTopic,
};
