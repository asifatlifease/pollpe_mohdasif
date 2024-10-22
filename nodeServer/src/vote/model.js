const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  anonymousId: {
    type: String,
    required: true,
  },
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poll",
    required: true,
  },
  optionText: {
    type: String,
    required: true,
  },
  isVoted: {
    type: Boolean,
    default: true,
  },
  optionVoteCounts: {
    type: Number,
  },
  voteDate: {
    type: Date,
    default: Date.now,
  },
});

voteSchema.index({ pollId: 1 });
voteSchema.index({ anonymousToken: 1 }, { unique: true });
voteSchema.index({ anonymousToken: 1, pollId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
