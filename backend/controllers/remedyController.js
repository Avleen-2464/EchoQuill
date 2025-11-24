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

const buildMonthRange = (monthParam) => {
  const now = new Date();
  const [rawYear, rawMonth] = (
    monthParam ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  ).split("-");

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
  const prompt = `Based on these monthly journal summaries containing negative emotions, generate 2–3 short, achievable, and supportive remedies for the user. Keep them personal, compassionate, and non-clinical. Avoid generic advice and focus on gentle, doable actions.

Summary: ${summary}
Negative emotions observed: ${emotionLabels.join(", ")}

Return each remedy on its own line.`;

  const llamResponse = await callLlama(prompt, {
    max_tokens: 500,
    temperature: 0.5,
  });
  const suggestions = parseSuggestions(llamResponse, 3);

  if (!suggestions.length) {
    throw new Error("Model returned no remedies");
  }

  const primaryEmotion = emotionLabels[0] || "general";
  return storeRemedySuggestions({
    userId,
    monthKey,
    emotionLabel: primaryEmotion,
    suggestions,
  });
};

const getMonthlyRemedies = async (req, res) => {
  try {
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
    console.error("Error fetching monthly remedies:", error.message);
    res.status(500).json({ message: "Failed to fetch monthly remedies" });
  }
};

const generateMonthlyRemedies = async (req, res) => {
  try {
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
    console.error("Error generating monthly remedies:", error.message);
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
    const { remedyId, feedback, worked, month } = req.body;

    if (!remedyId) {
      return res
        .status(400)
        .json({ message: "remedyId is required for feedback" });
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

    let replacement = null;
    if (worked === false) {
      replacement = await createReplacementRemedy({
        userId: req.user.id,
        month: month || remedy.month,
        emotion: remedy.emotion,
      });
    }

    res.status(200).json({
      remedy: {
        id: remedy._id,
        emotion: remedy.emotion,
        text: remedy.remedyText,
        worked: remedy.worked,
        createdAt: remedy.createdAt,
      },
      replacement: replacement
        ? {
            id: replacement._id,
            emotion: replacement.emotion,
            text: replacement.remedyText,
            worked: replacement.worked,
            createdAt: replacement.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const createRemedySuggestion = async ({ userId, journalId, emotion }) => {
  if (!emotion || typeof emotion !== "string") {
    throw new Error("Emotion is required to generate a remedy");
  }

  const prompt = `You are an empathetic wellness assistant. Generate 5 short and simple comforting remedies (1–2 lines each) for someone feeling ${emotion}.
Avoid long paragraphs or intros—just direct, calming suggestions.
Use a warm, caring tone. Each suggestion should be practical and actionable.
Example format:
- Take a deep breath and let your shoulders relax.
- Step outside for a moment of fresh air.`;

  const suggestedRemedy = await callLlama(prompt, { max_tokens: 400 });

  if (!suggestedRemedy) {
    throw new Error("Remedy generation failed: empty response from model");
  }

  const remedy = new Remedy({
    journalId,
    userId,
    emotion,
    remedyText: suggestedRemedy,
  });

  return remedy.save();
};

const generateRemedy = async (req, res) => {
  try {
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
    console.error("Error generating remedy:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateRemedy,
  submitFeedback,
  createRemedySuggestion,
  getMonthlyRemedies,
  generateMonthlyRemedies,
};

