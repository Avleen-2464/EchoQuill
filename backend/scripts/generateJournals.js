const mongoose = require('mongoose');
const Message = require('../models/Message');
const Journal = require('../models/Journal');
const User = require('../models/User');
require('dotenv').config();

const generateJournals = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all users
        const users = await User.find({});
        
        for (const user of users) {
            // Get yesterday's date
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            // Get all messages from yesterday
            const messages = await Message.find({
                userId: user._id,
                timestamp: {
                    $gte: yesterday,
                    $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
                }
            }).sort({ timestamp: 1 });

            if (messages.length > 0) {
                // Format conversation for journal
                const conversation = messages.map(msg => 
                    `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
                ).join('\n');

                // Generate journal entry using Llama
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "llama2",
                        prompt: `Based on the following conversation, write a personal journal entry for ${yesterday.toISOString().split('T')[0]}. Make it reflective, personal, and include key insights from the conversation. Format it as a diary entry with a greeting and signature.\n\nConversation:\n${conversation}`,
                        stream: false
                    })
                });

                const data = await response.json();
                const generatedContent = data.response;

                // Create journal entry
                const journal = new Journal({
                    userId: user._id,
                    date: yesterday,
                    content: generatedContent,
                    mood: 'neutral',
                    aiGenerated: true
                });

                await journal.save();
                console.log(`Generated journal for user ${user._id} on ${yesterday.toISOString().split('T')[0]}`);

                // Delete messages after generating journal
                await Message.deleteMany({
                    userId: user._id,
                    timestamp: {
                        $gte: yesterday,
                        $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
                    }
                });
            }
        }

        console.log('Journal generation completed');
        process.exit(0);
    } catch (error) {
        console.error('Error generating journals:', error);
        process.exit(1);
    }
};

// Run the script
// generateJournals(); 