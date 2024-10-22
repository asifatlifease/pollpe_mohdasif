const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
  optionText: {
    type: String,
    required: true,
  },
  optionVoteCounts: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  pollStatus: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
