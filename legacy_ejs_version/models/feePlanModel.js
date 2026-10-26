const mongoose = require("mongoose");

const feePlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeePlan", feePlanSchema);
