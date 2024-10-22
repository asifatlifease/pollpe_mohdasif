const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema({
  createdBy: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  totalVotes: {
    type: Number,
    default: 0,
  },
  isTie: {
    type: Boolean,
    default: false,
  },
  pollStatus: {
    type: String,
    enum: ["active", "inactive", "finished", "deleted"],
    default: "active",
  },
  pollResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Option",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  finishDate: {
    type: Date,
    required: false,
  },
  options: [
    {
      text: {
        type: String,
        required: true,
      },
      voteCount: {
        type: Number,
        default: 0,
      },
    },
  ],
});

pollSchema.index({ pollId: 1 });
pollSchema.index({ createdBy: 1 });
pollSchema.index({ pollStatus: 1 });
pollSchema.index({ finishDate: 1 });

module.exports = mongoose.model("Poll", pollSchema);
