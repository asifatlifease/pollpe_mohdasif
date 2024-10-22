const PollModel = require("./model");
const VoteModel = require("../vote/model");

const createPoll = async (req, res) => {
  try {
    const { title, options } = req.body;

    console.log({ body: req.body });
    let createdBy;
    if (req.anonymousId) {
      createdBy = req.anonymousId;
    }

    if (createdBy === undefined) {
      createdBy = "";
    }

    const poll = new PollModel({
      createdBy: createdBy,
      title,
      options,
    });

    console.log({ poll });

    const savedPoll = await poll.save();

    return res.json({
      message: "Poll created successfully",
      poll: savedPoll,
    });
  } catch (error) {
    console.log(error);
    return res.json({ message: error.message });
  }
};

const getPolls = async (req, res) => {
  try {

    const { page = 1, limit = 10, pollStatus = "active" } = req.query;
    const anonymousId = req.anonymousId;
    const skip = (page - 1) * limit;

    const userVotes = await VoteModel.find({ anonymousId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const userVotesMap = userVotes.reduce((acc, vote) => {
      if (!acc[vote.pollId]) {
        acc[vote.pollId] = vote;
      }
      return acc;
    }, {});

    const polls = await PollModel.find({ pollStatus })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const userVotedPolls = polls.map((poll) => {
      if (userVotesMap[poll._id]) {
        return {
          ...poll,
          votedOption: userVotesMap[poll._id].optionText,
          isVoted: userVotesMap[poll._id].isVoted,
        };
      }
      return poll;
    });

    return res.json({ message: "Getting polls", polls: userVotedPolls });
  } catch (error) {
    return res.json({ message: error.message });
  }
};

module.exports = {
  createPoll,
  getPolls,
};
