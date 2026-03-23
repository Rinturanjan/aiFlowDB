import mongoose from "mongoose";

const flowResultSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const FlowResult = mongoose.model("FlowResult", flowResultSchema);

export default FlowResult;