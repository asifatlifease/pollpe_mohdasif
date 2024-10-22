const VoteModel = require("./model");
const PollModel = require("../poll/model");
const kafkaProducer = require("../../services/kafka/producer");

const setUserVote = async (req, res) => {
  const { optionText, isVoted, pollId } = req.body;
  const anonymousId = req.anonymousId;

  //TODO: This process can done later because when the users vote increases it might not be the good to query here for each request so later it can be process after pushing into kafka for not i put here because i am not assuming for large user base and have millions of concurrent users

  //  Checking if the user has already voted
  const isUserAlreadyVoted = await VoteModel.findOne({
    pollId,
    anonymousId,
  });

  // When User tries to vote on the same option again
  if (
    isUserAlreadyVoted &&
    isUserAlreadyVoted.optionText === optionText &&
    isVoted
  ) {
    // When User tries to vote on the same option again
    return res.json({ message: "Already voted with the same option" });
  }

  // validation for if user is first time voter and isVoted is false
  if (!isUserAlreadyVoted && !isVoted) {
    return res.json({ message: "isVoted must be true for first time voter" });
  }

  const poll = await PollModel.findOne({ _id: pollId });

  if (!poll) {
    return res.status(404).json({ message: "Poll not found" });
  }

  await kafkaProducer({
    topicName: "voteTopic",
    key: pollId,
    value: {
      poll,
      isUserAlreadyVoted,
      userVote: {
        optionText,
        isVoted,
        pollId,
        anonymousId,
      },
    },
  });

  return res.status(200).json({ message: "Vote Successfully." });
};

module.exports = {
  setUserVote,
};
