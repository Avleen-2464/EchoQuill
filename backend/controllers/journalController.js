const Journal = require('../models/JournalEntry');
const Message = require('../models/Message');

exports.getAllJournals = async (req, res) => {
    try {
        const journals = await Journal.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(journals);
    } catch (err) {
        console.error('Error fetching journals:', err.message);
        res.status(500).json({ message: 'Server error while fetching journals' });
    }
};

exports.generateFromChat = async (req, res) => {
    try {
        const { date } = req.body;

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const messages = await Message.find({
            userId: req.user.id,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ timestamp: 1 });

        if (messages.length === 0) {
            return res.status(400).json({ message: 'No messages found for this date' });
        }

        const conversation = messages.map(msg =>
            `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
        ).join('\n');

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama2",
                prompt: `Based on the following conversation, write a personal journal entry for ${date}. Make it reflective, personal, and include key insights. Format it as a diary entry.\n\nConversation:\n${conversation}`,
                stream: false
            })
        });

        const data = await response.json();
        const generatedContent = data.response;

        const newJournal = new Journal({
            userId: req.user.id,
            date: new Date(date),
            content: generatedContent,
            mood: 'neutral',
            aiGenerated: true
        });

        const savedJournal = await newJournal.save();
        res.status(201).json(savedJournal);
    } catch (err) {
        console.error('Error generating journal:', err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.deleteJournal = async (req, res) => {
    try {
        const journal = await Journal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!journal) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }

        await journal.remove();
        res.json({ message: 'Journal entry deleted' });
    } catch (err) {
        console.error('Error deleting journal:', err.message);
        res.status(500).json({ message: err.message });
    }
};
