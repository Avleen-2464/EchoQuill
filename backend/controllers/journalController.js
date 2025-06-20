const JournalEntry = require("../models/JournalEntry");
const Message = require("../models/Message"); // adjust path if needed

const axios = require("axios");


// Get all journals
exports.getAllJournals = async (req, res) => {
  try {
    const journals = await JournalEntry.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(journals);
  } catch (err) {
    console.error("Error fetching journals:", err.message);
    res.status(500).json({ message: "Server error while fetching journals" });
  }
};

// Generate journal from saved messages
exports.generateFromChat = async (req, res) => {
  try {
    const date = new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const messages = await Message.find({
      userId: req.user.id,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ timestamp: 1 });

    if (messages.length === 0) {
      return res.status(400).json({ message: "No messages found for this date" });
    }

    const rawConversation = messages
      .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n");

    // Step 1: Generate summary bullet points
    const summaryResponse = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt: `Based on the following conversation, write summary bullet points:\n\n${rawConversation}`,
      stream: false,
      options: {
        temperature: 0.6,
        max_tokens: 500,
      },
    });

    const summaryBulletPoints = summaryResponse.data.response;
    if (!summaryResponse.data.response) {
  throw new Error("Summary generation failed: No response from model");
}


    // Step 2: Generate diary-style journal entry
    const finalJournalResponse = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2-friend",
      prompt: `You are writing a private diary entry at the end of the day. Use the following personal notes to reflect emotionally and naturally. Do not mention chat, AI, or conversations. Write in first person, starting with "Dear Diary" and ending with a warm, human sign-off like "Until tomorrow" or "Yours truly".\n\nPersonal Notes:\n${summaryBulletPoints}`,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 1000,
      },
    });
    if (!finalJournalResponse.data.response) {
  throw new Error("Journal generation failed: No response from model");
}


    // ✅ FIXED: moved this BEFORE emotion prediction
    const generatedContent = finalJournalResponse.data.response?.trim();
    if (!generatedContent) {
      throw new Error("Journal generation failed: empty response");
    }

    // Step 3: Predict emotions from the generated content
    const emotionResponse = await axios.post("http://localhost:5001/api/predict", {
      text: generatedContent,
    });

    const predictedEmotions = emotionResponse.data.predictions || [];
    const topEmotions = predictedEmotions.map(e => `${e.label} (${e.score})`).join(", ");

    // Step 4: Save to database
    const newJournal = new JournalEntry({
      userId: req.user.id,
      date: new Date(date),
      entry: generatedContent,
      mood: topEmotions || "neutral",
      aiGenerated: true,
    });

    const savedJournal = await newJournal.save();
    res.status(201).json(savedJournal);

  } catch (err) {
    console.error("Error generating journal:", err.response?.data || err.message);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};
exports.getMoodTrends = async (req, res) => {
  try {
    const userId = req.user.id; // if you're using auth middleware
    console.log("USER ID:", userId);

    
    const journals = await JournalEntry.find({ userId: userId }); // ✅ correct
    console.log("Found Journals:", journals.length);
    console.log("Journals:", journals);


    const moodTrends = [];
    
    for (const entry of journals) {
      const response = await axios.post('http://localhost:5001/api/predict', {
        text: entry.entry,
      });
      console.log('Sending to model:', entry.entry);
      
      moodTrends.push({
        date: entry.createdAt.toISOString().split('T')[0],
        predictions: response.data.predictions,
      });
    }

    res.json(moodTrends);
  } catch (error) {
    console.error('Error fetching mood trends:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Generate from passed conversationHistory (frontend)
// exports.createJournalFromChat = async (req, res) => {
//   try {
//     const { conversationHistory } = req.body;

//     if (!conversationHistory || conversationHistory.length === 0) {
//       return res.status(400).json({ message: "No conversation history provided" });
//     }

//     const formattedConversation = conversationHistory
//       .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
//       .join("\n");

//     // Step 1: Summarize the day into bullet points
//     const summaryResponse = await axios.post("http://localhost:11434/api/generate", {
//       model: "llama3",
//       prompt: `Read the following and extract the person’s day into life events and emotional reflections. Avoid any mention of AI, chat, or conversation.\n\n${formattedConversation}`,
//       stream: false,
//     });

//     // Generate journal entry using Llama
//     const response = await axios.post("http://localhost:11434/api/generate", {
//       model: "llama3",
//       prompt: `Based on the following conversation, write a personal journal entry for ${today}. Make it reflective, personal, and include key insights. Format it as a diary entry with a greeting and signature.\n\nConversation:\n${formattedConversation}`,
//       stream: false,
//       options: {
//         temperature: 0.7,
//         max_tokens: 1000,
//       },
//     });

//     const journalContent = journalResponse.data.response;

//     const journalEntry = new JournalEntry({
//       userId: req.user.id,
//       date: new Date().toISOString().split("T")[0],
//       entry: journalContent,
//       mood: "Neutral",
//       aiGenerated: true,
//     });

//     await journalEntry.save();

//     res.json({
//       success: true,
//       message: "Journal entry created successfully",
//       journalEntry,
//     });
//   } catch (error) {
//     console.error("Error creating journal from chat:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating journal entry",
//       error: error.message,
//     });
//   }
// };

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
