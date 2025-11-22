const axios = require("axios");
const Remedy = require("../models/Remedy");
const JournalEntry = require("../models/JournalEntry");

const createRemedySuggestion = async ({ userId, journalId, emotion }) => {
  if (!emotion || typeof emotion !== "string") {
    throw new Error("Emotion is required to generate a remedy");
  }

  // const journalExists = await JournalEntry.findOne({
  //   _id: journalId,
  //   userId,
  // });

  // if (!journalExists) {
  //   throw new Error("Journal entry not found for this user");
  // }

  const prompt = `You are an empathetic wellness assistant. Generate 5 short and simple comforting remedies (1–2 lines each) for someone feeling ${emotion}. 
Avoid long paragraphs or intros—just direct, calming suggestions. 
Use a warm, caring tone. Each suggestion should be practical and actionable.
Example format:
- Take a deep breath and let your shoulders relax.
- Step outside for a moment of fresh air.`;

  let suggestedRemedy;
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2:3b",
      prompt,
      stream: false
    });
    console.log("Ollama raw response:", response.data);
    suggestedRemedy = response.data?.response?.trim();
  } catch (err) {
    console.error("Ollama API error:", err.response?.data || err.message);
    throw new Error("Remedy generation failed: " + (err.response?.data?.error || err.message));
  }

  if (!suggestedRemedy) {
    throw new Error("Remedy generation failed: empty response from model");
  }

  const remedy = new Remedy({
    journalId,
    userId,
    emotion,
    remedyText: suggestedRemedy,
  });

  return remedy.save();
};

const generateRemedy = async (req, res) => {
  try {
    const { journalId, emotion } = req.body;

    if (!emotion) {
      return res
        .status(400)
        .json({ message: "emotion is required" });
    }

    const remedy = await createRemedySuggestion({
      userId: req.user.id,
      journalId: journalId || null,
      emotion,
    });

    res.status(201).json(remedy);
  } catch (error) {
    console.error("Error generating remedy:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { remedyId, feedback } = req.body;

    if (!remedyId || typeof feedback !== "string") {
      return res
        .status(400)
        .json({ message: "remedyId and feedback are required" });
    }

    const remedy = await Remedy.findOne({
      _id: remedyId,
      userId: req.user.id,
    });

    if (!remedy) {
      return res.status(404).json({ message: "Remedy not found" });
    }

    remedy.feedback = feedback.trim();
    await remedy.save();

    res.status(200).json(remedy);
  } catch (error) {
    console.error("Error submitting feedback:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateRemedy,
  submitFeedback,
  createRemedySuggestion,
};

