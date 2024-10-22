const LeaderboardModel = require("./model");

const getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 10, pollStatus = "active" } = req.body;
    const skip = (page - 1) * 10;

    const aggPipeline = [
      {
        $lookup: {
          from: "polls",
          localField: "pollId",
          foreignField: "_id",
          as: "poll",
        },
      },
      {
        $unwind: "$poll",
      },
      {
        $match: {
          "poll.pollSatus": pollStatus,
        },
      },
      {
        $project: {
          _id: 1,
          optionText: 1,
          totalVotes: 1,
          optionVoteCounts: 1,
          poll: 1,
        },
      },
      {
        $sort: {
          totalVotes: -1
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    // This can be use for other use cases where poll data sent along with leaderboard
    // const leaderboard = await LeaderboardModel.aggregate(aggPipeline);

    // for now i am just sending the small data
    const leaderboard = await LeaderboardModel.find({ pollStatus })
      .sort({
        totalVotes: -1
      })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return res.json({ message: "Leaderboard", leaderboard });
  } catch (error) {
    return res.json({ message: error.message });
  }
};

module.exports = {
  getLeaderboard,
};
