  const mongoose = require("mongoose");

  const RemedySchema = new mongoose.Schema(
    {
      journalId: {
        type: String,
        required: false,
        default: null,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      emotion: {
        type: String,
        required: true,
        trim: true,
      },
      remedyText: {
        type: String,
        required: true,
        trim: true,
      },
      feedback: {
        type: String,
        default: undefined,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: false,
    }
  );

  module.exports = mongoose.model("Remedy", RemedySchema);

