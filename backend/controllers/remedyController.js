const axios = require("axios");
const Remedy = require("../models/Remedy");
const JournalEntry = require("../models/JournalEntry");

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

const NEGATIVE_EMOTIONS = new Set(
  [
    "sadness",
    "disappointment",
    "anger",
    "nervousness",
    "fear",
    "anxiety",
    "grief",
    "embarrassment",
    "confusion",
    "pessimism",
    "loneliness",
    "frustration",
    "stress",
    "shame",
    "guilt",
    "hopelessness",
    "resentment",
  ].map((e) => e.toLowerCase())
);

// Predefined remedies list
const PREDEFINED_REMEDIES = [
  "Start a simple daily routine with one fixed wake-up time.",
  "Go outside for at least 5 minutes each day.",
  "Take a slow 10-minute walk to clear mental fog.",
  "Practice 2 minutes of deep breathing to calm your mind.",
  "Limit social media and news for a few days to reduce overwhelm.",
  "Send one message to a friend or family member each week.",
  "Write one sentence about your feelings every night.",
  "Do one tiny joy activity daily (music, tea, sunlight).",
  "Clean or organize one small spot in your room.",
  "Drink a glass of water whenever you feel mentally heavy.",
  "Set one mini-goal for the week and complete it.",
  "Replace one negative thought with a realistic alternative.",
  "Spend 1–2 minutes sitting quietly with eyes closed.",
  "Celebrate one small win from your day, no matter how tiny.",
  "Choose one comforting song and listen mindfully.",
  "Stretch your body for 20 seconds to release tension.",
  "Reduce late-night scrolling to improve sleep.",
  "Say one gentle thing to yourself daily ('I'm trying, and that's enough').",
  "Engage in one small act of kindness toward yourself.",
  "Reach out to one supportive person if things feel too heavy.",
];

// ---------- Helpers ----------

const callLlama = async (prompt, options = {}) => {
  const payload = {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: {
      temperature: options.temperature ?? 0.4,
      top_p: options.top_p ?? 0.9,
      max_tokens: options.max_tokens ?? 700,
    },
  };

  const response = await axios.post(OLLAMA_URL, payload);
  return response.data?.response?.trim();
};

// Select random remedies from predefined list, excluding those marked "not helpful"
const selectRandomRemedies = async (userId, count = 4) => {
  // Get remedies marked as "not helpful" by this user
  const notHelpful = await Remedy.find({
    userId,
    worked: false,
  }).select("remedyText");

  const notHelpfulTexts = new Set(notHelpful.map((r) => r.remedyText));

  // Filter out "not helpful" remedies
  const availableRemedies = PREDEFINED_REMEDIES.filter(
    (remedy) => !notHelpfulTexts.has(remedy)
  );

  // If not enough available, use all available
  const actualCount = Math.min(count, availableRemedies.length);

  // Shuffle and select
  const shuffled = availableRemedies.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, actualCount);
};

const buildMonthRange = (monthParam) => {
  const now = new Date();

  let monthStr = monthParam;

  // Accept "YYYY-MM", "YYYY-MM-DD" or Date
  if (monthStr instanceof Date) {
    const y = monthStr.getFullYear();
    const m = String(monthStr.getMonth() + 1).padStart(2, "0");
    monthStr = `${y}-${m}`;
  } else if (typeof monthStr === "string") {
    // If "YYYY-MM-DD", trim to "YYYY-MM"
    if (/^\d{4}-\d{2}-\d{2}/.test(monthStr)) {
      monthStr = monthStr.slice(0, 7);
    }
  }

  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }

  const [rawYear, rawMonth] = monthStr.split("-");
  const year = Number(rawYear);
  const monthIndex = Number(rawMonth) - 1;

  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  const pad = (n) => String(n).padStart(2, "0");

  return {
    start,
    end,
    startDateStr: `${year}-${pad(monthIndex + 1)}-01`,
    endDateStr: `${year}-${pad(monthIndex + 1)}-${pad(end.getDate())}`,
    monthKey: `${year}-${pad(monthIndex + 1)}`,
  };
};

const fetchMonthlyJournals = async (userId, range) => {
  const dateQuery = {
    userId,
    $or: [
      { date: { $gte: range.startDateStr, $lte: range.endDateStr } },
      {
        date: { $exists: false },
        createdAt: { $gte: range.start, $lte: range.end },
      },
      {
        date: { $not: /^\d{4}-\d{2}-\d{2}$/ },
        createdAt: { $gte: range.start, $lte: range.end },
      },
    ],
  };

  return JournalEntry.find(dateQuery).sort({ date: 1, createdAt: 1 });
};

const collectNegativeEntries = (journals, targetEmotions) => {
  const allowed = targetEmotions
    ? new Set(targetEmotions.map((e) => e.toLowerCase()))
    : null;

  const entries = [];
  const totals = {};

  journals.forEach((entry) => {
    const matches = (entry.emotions || []).filter((emotion) => {
      const label = (emotion.label || "").toLowerCase();
      if (!NEGATIVE_EMOTIONS.has(label)) return false;
      if (allowed && !allowed.has(label)) return false;
      return true;
    });

    if (!matches.length) return;
    entries.push({ entry, matches });

    matches.forEach((match) => {
      const label = (match.label || "").toLowerCase();
      const score = Number(match.score) || 0;
      totals[label] = (totals[label] || 0) + score;
    });
  });

  const totalScore =
    Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;

  const sortedTotals = Object.entries(totals)
    .map(([label, score]) => ({
      label,
      score,
      percentage: (score / totalScore) * 100,
    }))
    .sort((a, b) => b.score - a.score);

  return { entries, emotionBreakdown: sortedTotals };
};

const formatEntrySnippet = ({ entry, matches }) => {
  const date =
    entry.date ||
    (entry.createdAt instanceof Date
      ? entry.createdAt.toISOString().split("T")[0]
      : "Unknown date");
  const emotions = matches.map((m) => m.label).join(", ");
  const text = (entry.entry || "").replace(/\s+/g, " ").trim();
  const snippet = text.slice(0, 500);
  return `Date: ${date}
Emotions: ${emotions}
Excerpt: ${snippet}`;
};

const buildMonthlySummary = async (entries) => {
  if (!entries.length) return "";
  const snippets = entries.slice(0, 6).map(formatEntrySnippet).join("\n---\n");
  const prompt = `Summarize the recurring themes, triggers, and needs in these journal excerpts. Focus on emotional tone and context rather than rephrasing each entry.

${snippets}`;
  const summary = await callLlama(prompt, { max_tokens: 400, temperature: 0.3 });
  return summary || snippets.slice(0, 700);
};

const parseSuggestions = (text, limit = 3) => {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^[\s•\-*\d.)]+/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, limit);
};

const getMonthlyContext = async (userId, month, options = {}) => {
  const range = buildMonthRange(month);
  const journals = await fetchMonthlyJournals(userId, range);
  const { entries, emotionBreakdown } = collectNegativeEntries(
    journals,
    options.targetEmotions
  );

  let summary = null;
  if (options.includeSummary && entries.length) {
    summary = await buildMonthlySummary(entries);
  }

  return {
    range,
    emotionBreakdown,
    negativeEntries: entries,
    hasNegative: emotionBreakdown.length > 0,
    summary,
  };
};

const storeRemedySuggestions = async ({
  userId,
  monthKey,
  emotionLabel,
  suggestions,
}) => {
  const docs = suggestions.map((text) => ({
    userId,
    month: monthKey,
    emotion: emotionLabel,
    remedyText: text,
    worked: null,
  }));
  if (!docs.length) return [];
  return Remedy.insertMany(docs);
};

const generateMonthlyRemedySet = async ({
  userId,
  monthKey,
  summary,
  emotionLabels,
}) => {
  // Select 3-4 random remedies from predefined list
  const selectedRemedies = await selectRandomRemedies(userId, 3);

  if (!selectedRemedies.length) {
    throw new Error("No remedies available");
  }

  const primaryEmotion = emotionLabels[0] || "general";
  return storeRemedySuggestions({
    userId,
    monthKey,
    emotionLabel: primaryEmotion,
    suggestions: selectedRemedies,
  });
};

// ---------- Controllers ----------

const getMonthlyRemedies = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { month } = req.query;
    const userId = req.user.id;

    const context = await getMonthlyContext(userId, month, {
      includeSummary: false,
    });

    const remedies = await Remedy.find({
      userId,
      month: context.range.monthKey,
      $or: [{ worked: { $exists: false } }, { worked: null }, { worked: true }],
    }).sort({ worked: -1, createdAt: -1 });

    const filteredRemedies = remedies
      .filter((remedy) => remedy.worked !== false)
      .map((remedy) => ({
        id: remedy._id,
        emotion: remedy.emotion,
        text: remedy.remedyText,
        worked: remedy.worked,
        createdAt: remedy.createdAt,
      }));

    res.json({
      month: context.range.monthKey,
      negativeEmotions: context.emotionBreakdown,
      hasNegativeEmotions: context.hasNegative,
      remedies: filteredRemedies,
    });
  } catch (error) {
    console.error("Error fetching monthly remedies:", error);
    res.status(500).json({ message: "Failed to fetch monthly remedies" });
  }
};

const generateMonthlyRemedies = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { month } = req.body;
    const userId = req.user.id;

    const context = await getMonthlyContext(userId, month, {
      includeSummary: true,
    });

    if (!context.hasNegative) {
      return res
        .status(400)
        .json({ message: "No negative emotions detected for this month." });
    }

    const existingSuccessful = await Remedy.find({
      userId,
      month: context.range.monthKey,
      worked: true,
    });

    if (existingSuccessful.length) {
      return res.status(200).json({
        message: "Existing remedies already available.",
        remedies: existingSuccessful,
      });
    }

    const emotionLabels = context.emotionBreakdown.map((e) => e.label);
    const summaryText =
      context.summary || (await buildMonthlySummary(context.negativeEntries));

    const created = await generateMonthlyRemedySet({
      userId,
      monthKey: context.range.monthKey,
      summary: summaryText,
      emotionLabels,
    });

    res.status(201).json({
      month: context.range.monthKey,
      remedies: created.map((doc) => ({
        id: doc._id,
        emotion: doc.emotion,
        text: doc.remedyText,
        worked: doc.worked,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error generating monthly remedies:", error);
    res.status(500).json({ message: "Failed to generate remedies" });
  }
};

const createReplacementRemedy = async ({ userId, month, emotion }) => {
  const context = await getMonthlyContext(userId, month, {
    includeSummary: true,
    targetEmotions: [emotion],
  });

  if (!context.hasNegative) {
    return null;
  }

  const summaryText =
    context.summary || (await buildMonthlySummary(context.negativeEntries));

  const created = await generateMonthlyRemedySet({
    userId,
    monthKey: context.range.monthKey,
    summary: summaryText,
    emotionLabels: [emotion],
  });

  return created[0] || null;
};

const submitFeedback = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let { remedyId, feedback, worked, month } = req.body;

    if (!remedyId) {
      return res
        .status(400)
        .json({ message: "remedyId is required for feedback" });
    }

    // Normalize worked: allow "true"/"false" strings from frontend
    if (typeof worked === "string") {
      const lower = worked.toLowerCase();
      if (lower === "true") worked = true;
      else if (lower === "false") worked = false;
      else worked = undefined;
    }

    const remedy = await Remedy.findOne({
      _id: remedyId,
      userId: req.user.id,
    });

    if (!remedy) {
      return res.status(404).json({ message: "Remedy not found" });
    }

    if (typeof feedback === "string") {
      remedy.feedback = feedback.trim();
    }
    if (typeof worked === "boolean") {
      remedy.worked = worked;
    }

    await remedy.save();

    res.status(200).json({
      remedy: {
        id: remedy._id,
        emotion: remedy.emotion,
        text: remedy.remedyText,
        worked: remedy.worked,
        createdAt: remedy.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: error.message || "Feedback failed" });
  }
};

const createRemedySuggestion = async ({ userId, journalId, emotion }) => {
  if (!emotion || typeof emotion !== "string") {
    throw new Error("Emotion is required to generate a remedy");
  }

  // Select 3-4 random remedies from predefined list
  const selectedRemedies = await selectRandomRemedies(userId, 4);

  if (!selectedRemedies.length) {
    throw new Error("No remedies available");
  }

  // Combine selected remedies into a single text string
  const remedyText = selectedRemedies.join("\n");

  const remedy = new Remedy({
    journalId,
    userId,
    emotion,
    remedyText,
  });

  return remedy.save();
};

const generateRemedy = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { journalId, emotion } = req.body;

    if (!emotion) {
      return res.status(400).json({ message: "emotion is required" });
    }

    const remedy = await createRemedySuggestion({
      userId: req.user.id,
      journalId: journalId || null,
      emotion,
    });

    res.status(201).json(remedy);
  } catch (error) {
    console.error("Error generating remedy:", error);
    res.status(500).json({ message: error.message || "Failed to generate" });
  }
};

module.exports = {
  generateRemedy,
  submitFeedback,
  createRemedySuggestion,
  getMonthlyRemedies,
  generateMonthlyRemedies,
};
