const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

const startOllama = () => {
  exec("ollama serve", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting Ollama: ${error.message}`);
      return;
    }
    if (stderr) {
      console.warn(`Ollama Warning: ${stderr}`);
    }
    console.log(`Ollama Started: ${stdout}`);
  });
};

// Check if Ollama is running
const checkOllama = async () => {
  try {
    await axios.get("http://localhost:11434/api/generate");
    console.log("Ollama is already running.");
  } catch (error) {
    console.log("Ollama is not running. Starting it now...");
    startOllama();
  }
};

checkOllama();

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2:3b", // Use your preferred model
      prompt: userMessage,
      stream: false,
    });

    const botReply = response.data.response;
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Ollama API error:", error);
    res.status(500).json({ reply: "Sorry, I'm having trouble responding right now." });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
