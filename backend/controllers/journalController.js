const JournalEntry = require("../models/JournalEntry");
const Message = require("../models/Message");
const axios = require("axios");

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

exports.generateFromChat = async (req, res) => {
  try {
    const date = new Date(); // today

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const messages = await Message.find({
        userId: req.user.id,
        timestamp: { 
            $gte: startOfDay, 
            $lte: endOfDay 
        }
    }).sort({ timestamp: 1 });

    if (messages.length === 0) {
      return res
        .status(400)
        .json({ message: "No messages found for this date" });
    }

    const conversation = messages
      .map(
        (msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`
      )
      .join("\n");

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2-friend",
        prompt: `Based on the following conversation, write a personal journal entry for ${date} Donot mention the date. Make it reflective, personal, and include key insights. Format it as a diary entry.\n\nConversation:\n${conversation}`,
        stream: false,
      }),
    });
    // console.log(await response.text());

    const data = await response.json();
    const generatedContent = data.response;

    const newJournal = new JournalEntry({
      userId: req.user.id,
      date: new Date(date),
      entry: generatedContent,
      mood: "neutral",
      aiGenerated: true,
    });
    console.log("Generated content:", generatedContent);
    console.log("Saving journal with:", {
      userId: req.user.id,
      date: new Date(date),
      entry: generatedContent,
      mood: "neutral",
      aiGenerated: true});
    const savedJournal = await newJournal.save();
    res.status(201).json(savedJournal);
  } catch (err) {
    console.error("Error generating journal:", err.message);
    res.status(500).json({ message: err.message });
  }
};

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

exports.createJournalFromChat = async (req, res) => {
  try {
    const { conversationHistory } = req.body;

    if (!conversationHistory || conversationHistory.length === 0) {
      return res
        .status(400)
        .json({ message: "No conversation history provided" });
    }

    // Format conversation for the prompt
    const formattedConversation = conversationHistory
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Generate journal entry using Llama
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2-friend",
      prompt: `Based on the following conversation, write a personal journal entry for ${today}. Make it reflective, personal, and include key insights. Format it as a diary entry with a greeting and signature.\n\nConversation:\n${formattedConversation}`,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 1000,
      },
    });

    const journalContent = response.data.response;

    // Create new journal entry
    const journalEntry = new JournalEntry({
      userId: req.user.id,
      date: today,
      entry: journalContent,
      mood: "Neutral",
      keyMoments: [],
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
