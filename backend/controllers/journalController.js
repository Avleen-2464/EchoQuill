const JournalEntry = require("../models/JournalEntry");
const Message = require("../models/Message");
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
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: 1 });

    if (messages.length === 0) {
      return res.status(400).json({ message: "No messages found for this date" });
    }

    const rawConversation = messages
      .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n");

<<<<<<< Updated upstream
    // Step 1: Summarize the day (no AI, no chat)
   const summaryResponse = await axios.post("http://localhost:11434/api/generate", {
  model: "llama3",
  prompt: `You are a thoughtful person reflecting on your day. Read the following stream-of-consciousness and extract key moments, personal emotions, and life experiences. Summarize them as bullet points. Do not mention chat, AI, or conversations.\n\nInput:\n${rawConversation}`,
  stream: false,
});
=======
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Based on the following conversation, write a personal journal entry for ${date} Donot mention the date. Make it reflective, personal, and include key insights. Format it as a diary entry.\n\nConversation:\n${conversation}`,
        stream: false,
      }),
    });
    // console.log(await response.text());
>>>>>>> Stashed changes

const summaryBulletPoints = summaryResponse.data.response;

// Step 2: Create a diary-style journal from the summary
const finalJournalResponse = await axios.post("http://localhost:11434/api/generate", {
  model: "llama3.2-friend",
  prompt: `You are writing a private diary entry at the end of the day. Use the following personal notes to reflect emotionally and naturally. Do not mention chat, AI, or conversations. Write in first person, starting with "Dear Diary" and ending with a warm, human sign-off like "Until tomorrow" or "Yours truly".\n\nPersonal Notes:\n${summaryBulletPoints}`,
  stream: false,
  options: {
    temperature: 0.7,
    max_tokens: 1000,
  },
});


    const generatedContent = finalJournalResponse.data.response;

    const newJournal = new JournalEntry({
      userId: req.user.id,
      date: new Date(date),
      entry: generatedContent,
      mood: "neutral",
      aiGenerated: true,
    });

    const savedJournal = await newJournal.save();
    res.status(201).json(savedJournal);
  } catch (err) {
    console.error("Error generating journal:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Generate from passed conversationHistory (frontend)
exports.createJournalFromChat = async (req, res) => {
  try {
    const { conversationHistory } = req.body;

    if (!conversationHistory || conversationHistory.length === 0) {
      return res.status(400).json({ message: "No conversation history provided" });
    }

    const formattedConversation = conversationHistory
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    // Step 1: Summarize the day into bullet points
    const summaryResponse = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt: `Read the following and extract the person’s day into life events and emotional reflections. Avoid any mention of AI, chat, or conversation.\n\n${formattedConversation}`,
      stream: false,
    });

<<<<<<< Updated upstream
    const summary = summaryResponse.data.response;

    // Step 2: Turn summary into human journal
    const journalResponse = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2-friend",
      prompt: `Write a personal diary entry based on the following notes. Make it sound reflective, emotional, and natural. Use first-person writing. Do not mention any AI, chat, or conversation.\n\nNotes:\n${summary}`,
=======
    // Generate journal entry using Llama
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt: `Based on the following conversation, write a personal journal entry for ${today}. Make it reflective, personal, and include key insights. Format it as a diary entry with a greeting and signature.\n\nConversation:\n${formattedConversation}`,
>>>>>>> Stashed changes
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 1000,
      },
    });

    const journalContent = journalResponse.data.response;

    const journalEntry = new JournalEntry({
      userId: req.user.id,
      date: new Date().toISOString().split("T")[0],
      entry: journalContent,
      mood: "Neutral",
      aiGenerated: true,
    });

    await journalEntry.save();

    res.json({
      success: true,
      message: "Journal entry created successfully",
      journalEntry,
    });
  } catch (error) {
    console.error("Error creating journal from chat:", error);
    res.status(500).json({
      success: false,
      message: "Error creating journal entry",
      error: error.message,
    });
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
