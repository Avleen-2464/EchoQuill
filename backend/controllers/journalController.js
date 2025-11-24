const JournalEntry = require("../models/JournalEntry");
const Message = require("../models/Message"); // adjust path if needed
const { createRemedySuggestion } = require("./remedyController");
const axios = require("axios");

// Get all journals
exports.getAllJournals = async (req, res) => {
  try {
    const journals = await JournalEntry.find({ userId: req.user.id }).sort({
      date: -1,
    });
    res.json(journals);
  } catch (err) {
    console.error("Error fetching journals:", err.message);
    res.status(500).json({ message: "Server error while fetching journals" });
  }
};

// Generate journal from saved messages
// Generate journal from saved messages
// Generate journal from saved messages
exports.generateFromChat = async (req, res) => {
  try {
    console.log("\n==============================");
    console.log("▶ [generateFromChat] START");
    console.log("👤 User ID:", req.user?.id);

    // 1️⃣ Build today’s time window
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const dayStr = now.toISOString().split("T")[0];

    console.log("📅 Day string:", dayStr);
    console.log(
      "🕒 Query messages between:",
      startOfDay.toISOString(),
      "and",
      endOfDay.toISOString()
    );

    // 2️⃣ Fetch today's messages
    const messages = await Message.find({
      userId: req.user.id,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ timestamp: 1 });

    console.log("📨 Messages found for today:", messages.length);

    if (messages.length === 0) {
      console.log("⚠️ No messages found for this date.");
      return res
        .status(400)
        .json({ message: "No messages found for this date" });
    }

    // Log first + last message for sanity check
    console.log("🧾 First message:", {
      sender: messages[0].sender,
      timestamp: messages[0].timestamp,
      textPreview: messages[0].text.slice(0, 80),
    });

    console.log("🧾 Last message:", {
      sender: messages[messages.length - 1].sender,
      timestamp: messages[messages.length - 1].timestamp,
      textPreview: messages[messages.length - 1].text.slice(0, 80),
    });

    // 3️⃣ Build rawConversation string
    const rawConversation = messages
      .map(
        (msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`
      )
      .join("\n");

    console.log(
      "🧵 rawConversation length:",
      rawConversation.length
    );
    console.log(
      "🧵 rawConversation preview (first 400 chars):\n",
      rawConversation.slice(0, 400),
      rawConversation.length > 400 ? "..." : ""
    );

    // ---------- LLM PART (SUMMARY + DIARY) ----------
    console.log("🤖 Calling LLM for summary…");

    const summaryResponse = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3",
        prompt: `Based on the following conversation, write summary bullet points:\n\n${rawConversation}`,
        stream: false,
        options: {
          temperature: 0.6,
          max_tokens: 500,
        },
      }
    );

    console.log(
      "✅ Summary response keys:",
      Object.keys(summaryResponse.data || {})
    );
    console.log(
      "📝 Summary text preview:",
      (summaryResponse.data.response || "").slice(0, 300),
      "..."
    );

    if (!summaryResponse.data.response) {
      throw new Error("Summary generation failed: No response from model");
    }
    const summaryBulletPoints = summaryResponse.data.response;

    console.log("📔 Calling LLM for final diary entry…");

    const finalJournalResponse = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama3",
        prompt: `You are writing a private diary entry at the end of the day. Use the following personal notes to reflect emotionally and naturally. Do not mention chat, AI, or conversations. Write in first person, starting with "Dear Diary" and ending with a warm, human sign-off like "Until tomorrow" or "Yours truly".\n\nPersonal Notes:\n${summaryBulletPoints}`,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1000,
        },
      }
    );

    console.log(
      "✅ Final journal response keys:",
      Object.keys(finalJournalResponse.data || {})
    );
    console.log(
      "📓 Generated journal preview:",
      (finalJournalResponse.data.response || "").slice(0, 300),
      "..."
    );

    if (!finalJournalResponse.data.response) {
      throw new Error("Journal generation failed: No response from model");
    }

    const generatedContent = finalJournalResponse.data.response?.trim();
    if (!generatedContent) {
      throw new Error("Journal generation failed: empty response");
    }

    // ---------- EMOTION ANALYSIS PART (THIS IS WHAT YOU CARE ABOUT) ----------
    const MAX_CHARS = 4000;
    const safeText = rawConversation.slice(-MAX_CHARS);

    console.log(
      "💭 Sending text to emotion model.",
      "safeText length:",
      safeText.length
    );
    console.log(
      "💭 safeText preview (first 400 chars):\n",
      safeText.slice(0, 400),
      safeText.length > 400 ? "..." : ""
    );

    let emotionResponse;
    try {
      emotionResponse = await axios.post(
        "http://localhost:5001/api/predict",
        { text: safeText }
      );
    } catch (emotionErr) {
      console.error(
        "❌ Error calling emotion API:",
        emotionErr.response?.data || emotionErr.message
      );
      throw new Error("Emotion API call failed");
    }

    console.log("✅ Raw emotionResponse.data:", emotionResponse.data);

    const predictedEmotions = emotionResponse.data.predictions || [];

    console.log(
      "🎯 Predicted emotions FULL ARRAY:",
      JSON.stringify(predictedEmotions, null, 2)
    );
    console.log("🎯 Emotion count:", predictedEmotions.length);

    // You can keep or remove this:
    const primaryEmotion = predictedEmotions[0]?.label || "neutral";
    console.log("🌈 Primary emotion (first label):", primaryEmotion);

    // ---------- SAVE JOURNAL ----------
    const newJournal = new JournalEntry({
      userId: req.user.id,
      date: dayStr,
      entry: generatedContent,
      mood: primaryEmotion,       // optional
      aiGenerated: true,
      emotions: predictedEmotions, // 🔥 ALL emotions stored here
      primaryEmotion,             // optional
    });

    const savedJournal = await newJournal.save();

    console.log("💾 Saved journal:", {
      id: savedJournal._id.toString(),
      date: savedJournal.date,
      mood: savedJournal.mood,
      emotionCount: savedJournal.emotions?.length,
    });

    // ---------- REMEDY (optional) ----------
    let generatedRemedy = null;
    if (primaryEmotion) {
      console.log("🩹 Generating remedy for:", primaryEmotion);
      try {
        generatedRemedy = await createRemedySuggestion({
          userId: req.user.id,
          journalId: savedJournal._id,
          emotion: primaryEmotion,
        });
        console.log("✅ Remedy generated:", generatedRemedy?._id || generatedRemedy);
      } catch (remedyError) {
        console.error(
          "❌ Error generating remedy:",
          remedyError.message
        );
      }
    }

    console.log("✅ [generateFromChat] END – sending response");

    // EXTRA: send debug info back to frontend too
    res.status(201).json({
      journal: savedJournal,
      remedy: generatedRemedy,
      debug: {
        messageCount: messages.length,
        rawConversationLength: rawConversation.length,
        safeTextLength: safeText.length,
        predictedEmotions, // full array visible in response
        primaryEmotion,
      },
    });
  } catch (err) {
    console.error(
      "🔥 [generateFromChat] Error:",
      err.response?.data || err.message
    );
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};



exports.getMoodTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("USER ID:", userId);

    const journals = await JournalEntry.find({ userId }).sort({ createdAt: 1 });
    console.log("Found Journals:", journals.length);

    const moodTrends = journals
      .filter((j) => Array.isArray(j.emotions) && j.emotions.length > 0)
      .map((j) => {
        // j.date is a STRING (YYYY-MM-DD) in your schema
        let dateStr = j.date;

        // fallback: if date missing, use createdAt (a real Date)
        if (!dateStr && j.createdAt instanceof Date) {
          dateStr = j.createdAt.toISOString().split("T")[0];
        }

        if (!dateStr) {
          dateStr = String(j.createdAt || "");
        }

        return {
          date: dateStr,
          predictions: j.emotions,
        };
      });

    return res.json(moodTrends);
  } catch (error) {
    console.error("Error fetching mood trends:", error.message || error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Monthly emotion distribution (percentages) for a given month (YYYY-MM)
exports.getMonthlyEmotionDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query; // format YYYY-MM

    const now = new Date();
    const [y, m] = (
      month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    ).split("-");

    const year = parseInt(y, 10);
    const monthIndex = parseInt(m, 10) - 1; // 0-based

    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    // Prefer filtering on the explicit journal date string (YYYY-MM-DD)
    const startDateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
    const endDateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
      end.getDate()
    ).padStart(2, "0")}`;

    const dateQuery = {
      userId,
      $or: [
        { date: { $gte: startDateStr, $lte: endDateStr } },
        {
          date: { $exists: false },
          createdAt: { $gte: start, $lte: end },
        },
        {
          date: { $not: /^\d{4}-\d{2}-\d{2}$/ },
          createdAt: { $gte: start, $lte: end },
        },
      ],
    };

    const journals = await JournalEntry.find(dateQuery);

    const totals = {}; // label -> sum score

    journals.forEach((entry) => {
      if (!Array.isArray(entry.emotions)) return;
      entry.emotions.forEach((p) => {
        const key = (p.label || "").toLowerCase();
        const score = Number(p.score) || 0;
        totals[key] = (totals[key] || 0) + score;
      });
    });

    const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;

    const percentages = Object.entries(totals)
      .map(([label, value]) => ({
        label,
        percentage: (value / sum) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return res.json({
      month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      distribution: percentages,
    });
  } catch (error) {
    console.error(
      "Error computing monthly emotion distribution:",
      error.message || error
    );
    return res
      .status(500)
      .json({ error: "Failed to compute monthly emotion distribution" });
  }
};

// Delete a journal
exports.deleteJournal = async (req, res) => {
  try {
    const journal = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    await journal.remove();
    res.json({ message: "Journal entry deleted" });
  } catch (err) {
    console.error("Error deleting journal:", err.message);
    res.status(500).json({ message: err.message });
  }
};
