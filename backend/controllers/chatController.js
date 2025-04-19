const Message = require('../models/Message');
const axios = require('axios');

const handleChat = async (req, res) => {
    const userMessage = req.body.message;
    const conversationHistory = req.body.conversationHistory || [];

    if (!userMessage || userMessage.trim() === '') {
        return res.status(400).json({ message: 'No message provided. Please send a valid message.' });
    }

    try {
        // Check if Ollama service is running
        await axios.get("http://localhost:11434/api/tags");

        // Format conversation history for the prompt
        const formattedHistory = conversationHistory.map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');

        // Create the prompt with conversation history
        const prompt = conversationHistory.length > 0
            ? `${formattedHistory}\nUser: ${userMessage}\nAssistant:`
            : `${userMessage}\nAssistant:`;

        // Sending the message to Ollama for response
        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "llama3:latest",
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,
                max_tokens: 500,
            }
        });

        const botReply = response.data.response;

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
        
        // Send back the bot reply
        return res.json({ reply: botReply });

    } catch (error) {
        // Logging the error for debugging
        console.error("Error during chat processing:", error);

        // Check if the error is related to Ollama service
        if (error.response && error.response.status === 404) {
            return res.status(500).json({ message: 'Ollama service is not running. Please start the service.' });
        }

        // Generic error response
        return res.status(500).json({
            message: error.message || "There was an error processing your message.",
            error: error.stack || error.message,
        });
    }
};

module.exports = { handleChat };
