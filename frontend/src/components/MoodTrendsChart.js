import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Simple spinner loader
const ChartLoader = () => {
  const spinnerStyle = {
    border: "6px solid #e5e7eb",
    borderTop: "6px solid #3b82f6",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    animation: "spin 1s linear infinite",
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <div style={spinnerStyle}></div>
        <p style={{ marginTop: "10px", color: "#555", fontSize: "0.9rem" }}>
          Analyzing your emotions...
        </p>
      </div>
    </>
  );
};

const MoodTrendsChart = () => {
  const [latestEntry, setLatestEntry] = useState(null); // {date, predictions}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoodTrends = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/journals/mood-trends`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // result should be: [{ date, predictions: [...] }, ...]
        if (Array.isArray(result) && result.length > 0) {
          const sorted = [...result].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          const last = sorted[sorted.length - 1];
          setLatestEntry(last);
        } else {
          setLatestEntry(null);
        }
      } catch (error) {
        console.error("Error fetching mood trends:", error);
        setLatestEntry(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodTrends();
  }, []);

  const emotions = latestEntry?.predictions || [];

  const labels = useMemo(
    () => emotions.map((e) => capitalize(e.label)),
    [emotions]
  );
  const values = useMemo(
    () => emotions.map((e) => Number(e.score) || 0),
    [emotions]
  );
  const colors = useMemo(
    () => emotions.map((e) => hexOrRgbaToRgba(getColor(e.label), 0.85)),
    [emotions]
  );
  const borderColors = useMemo(
    () => emotions.map((e) => hexOrRgbaToRgba(getColor(e.label), 1)),
    [emotions]
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Emotion intensity",
        data: values,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.label}: ${(ctx.parsed.y ?? 0).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          autoSkip: false,
          font: { size: 11 },
        },
      },
      y: {
        min: 0,
        max: 1,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          stepSize: 0.2,
          font: { size: 11 },
        },
      },
    },
  };

  const subtitle =
    latestEntry?.date != null
      ? `Based on your last journal entry (${formatDate(latestEntry.date)})`
      : "";

  return (
    <div
      className="mood-trends-container"
      style={{
        width: "100%",
        height: "100%",
        padding: "18px 18px 20px",
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.12)",
      }}
    >
      <h3
        style={{
          color: "#111827",
          fontSize: "1.1rem",
          fontWeight: "600",
          margin: 0,
        }}
      >
        Emotional Profile
      </h3>
      {subtitle && (
        <p
          style={{
            margin: "4px 0 10px",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          {subtitle}
        </p>
      )}

      <div style={{ height: "260px" }}>
        {loading ? (
          <ChartLoader />
        ) : emotions.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "#666",
              fontSize: "0.9rem",
              textAlign: "center",
              padding: "0 16px",
            }}
          >
            No emotion data yet. Create a journal
            entry to see your emotional breakdown.
          </div>
        )}
      </div>
    </div>
  );
};

// helpers

function capitalize(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const getColor = (label) => {
  const map = {
    joy: "#4bc0c0",
    happiness: "#22c55e",
    sadness: "#ef4444",
    anger: "#f59e0b",
    surprise: "#8b5cf6",
    optimism: "#36a2eb",
    fear: "#ff9f40",
    anxiety: "#f97316",
    neutral: "#94a3b8",
    disgust: "#84cc16",
    trust: "#0ea5e9",
    anticipation: "#06b6d4",
  };
  const key = label?.toLowerCase?.()?.trim?.() || "";
  if (map[key]) return map[key];
  const palette = [
    "#e11d48",
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#ef4444",
    "#22c55e",
    "#a855f7",
    "#06b6d4",
    "#f43f5e",
  ];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
};

function hexOrRgbaToRgba(color, alpha) {
  if (!color) return `rgba(100,100,100,${alpha})`;
  if (color.startsWith("rgba")) {
    return color.replace(
      /rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
      (_, r, g, b) => `rgba(${r},${g},${b},${alpha})`
    );
  }
  if (color.startsWith("rgb(")) {
    return color.replace(
      /rgb\(([^,]+),([^,]+),([^\)]+)\)/,
      (_, r, g, b) => `rgba(${r},${g},${b},${alpha})`
    );
  }
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default MoodTrendsChart;
