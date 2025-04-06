// controllers/chatController.js
const axios = require('axios');

const handleChat = async (req, res) => {
    const userMessage = req.body.message;

    try {
        // Check if Ollama is running
        try {
            await axios.get("http://localhost:11434/api/tags");
        } catch (error) {
            throw new Error("Ollama service is not running. Please start Ollama first.");
        }

        const response = await axios.post("http://localhost:11434/api/generate", {
            model: "llama3.2-friend:latest",
            prompt: userMessage,
            stream: false,
            options: {
                temperature: 0.7,
                max_tokens: 500
            }
        });

        const botReply = response.data.response;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Llama API error:", error.message);
        res.status(500).json({ 
            message: error.message || "Error processing your message",
            error: error.message 
        });
    }
};

module.exports = { handleChat };
