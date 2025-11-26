const Message = require('../models/Message');
const axios = require('axios');

const handleChat = async (req, res) => {
  const userMessage = req.body.message;
  const conversationHistory = req.body.conversationHistory || [];

  if (!userMessage || userMessage.trim() === '') {
    return res.status(400).json({ message: 'No message provided. Please send a valid message.' });
  }

  try {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    // Check if Ollama service is running
    await axios.get(`${ollamaBaseUrl}/api/tags`);

    // 🧠 System / style instructions for the bot
    const SYSTEM_PROMPT = `
You are not a doctor or a robot.
You are a warm, understanding friend who deeply listens.
Talk like a real human — not formal, not like a textbook psychologist.

Rules:
- Keep replies short (max 2 sentences).
- Sound natural, like a friend texting.
- No over-dramatic therapy language.
- No generic motivational quotes.
- Be soft, calm, and real.

Just understand, don’t lecture.
`;

    // Format conversation history for the prompt
    const formattedHistory = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // 📝 Build final prompt
    const prompt =
      SYSTEM_PROMPT +
      '\n\nConversation so far:\n' +
      (formattedHistory ? formattedHistory + '\n' : '') +
      `User: ${userMessage}\nAssistant:`;

    // Send the message to Ollama for response
    const response = await axios.post(`${ollamaBaseUrl}/api/generate`, {
      model: "llama3",
      prompt,
      stream: false,
      options: {
        temperature: 0.4,   // calmer, less verbose
        num_predict: 50,     // 🔹 Ollama length limit (replaces max_tokens)
      }
    });

    const botReply = response.data.response?.trim?.() || '';

    // Save messages to database
    await Message.create({
      userId: req.user.id,
      conversationId: req.body.conversationId,
      sender: "user",
      text: userMessage
    });

    await Message.create({
      userId: req.user.id,
      conversationId: req.body.conversationId,
      sender: "bot",
      text: botReply
    });

    return res.json({ reply: botReply });
  } catch (error) {
    console.error("Error during chat processing:", error);

    if (error.response && error.response.status === 404) {
      return res.status(500).json({ message: 'Ollama service is not running. Please start the service.' });
    }

    return res.status(500).json({
      message: error.message || "There was an error processing your message.",
      error: error.stack || error.message,
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const messages = await Message.find({
      userId: req.user.id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: 1 });

    res.status(200).json({ message: "Chat history fetched successfully", messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};

module.exports = {
  handleChat,
  getChatHistory
};
