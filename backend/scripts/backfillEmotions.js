const mongoose = require("mongoose");
const axios = require("axios");
const JournalEntry = require("../models/JournalEntry");
const path = require("path");
const dotenvPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: dotenvPath });

const EMOTION_API_URL =
  process.env.EMOTION_API_URL || "http://localhost:5001/api/predict";

async function backfill() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in environment");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const total = await JournalEntry.countDocuments();
  if (!total) {
    console.log("⚠️ No journals found in this database. Check MONGODB_URI.");
    await mongoose.disconnect();
    return;
  }

  console.log(`📚 Found ${total} journals. Starting backfill…`);

  const cursor = JournalEntry.find({}).cursor();

  let processed = 0;
  for await (const journal of cursor) {
    processed += 1;
    console.log(
      `\n📓 Processing journal ${journal._id} (${journal.date || journal.createdAt})`
    );

    try {
      const { data } = await axios.post(EMOTION_API_URL, {
        text: journal.entry?.slice(-4000) || "",
      });

      const predictions = data?.predictions || [];
      const primaryEmotion = predictions[0]?.label || "neutral";

      journal.emotions = predictions;
      journal.primaryEmotion = primaryEmotion;
      if ("mood" in journal) {
        journal.mood = primaryEmotion;
      }

      await journal.save();
      console.log(
        `✅ Updated journal ${journal._id} with ${predictions.length} emotions`
      );
    } catch (err) {
      console.error(
        `❌ Failed to update journal ${journal._id}:`,
        err.response?.data || err.message
      );
    }
  }

  await mongoose.disconnect();
  console.log(`\n🎉 Backfill complete. Processed ${processed} journals.`);
}

backfill().catch((err) => {
  console.error("Unhandled error in backfill script:", err);
  process.exit(1);
});

