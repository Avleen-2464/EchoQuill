import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMonthlyRemedies,
  generateMonthlyRemedies,
  submitRemedyFeedback,
} from "../services/remedyService";

const buttonStyle = {
  border: "1px solid var(--border-color)",
  borderRadius: "8px",
  padding: "6px 12px",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  cursor: "pointer",
};

const MonthlyRemedies = ({ month }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [actioning, setActioning] = useState(null);
  const [autoRequested, setAutoRequested] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!month) return;
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const response = await fetchMonthlyRemedies(month);
        setData(response);
        setAutoRequested(false);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load remedies");
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [month]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const negativeEmotionLabels = useMemo(() => {
    if (!data?.negativeEmotions) return [];
    return data.negativeEmotions.map((e) => ({
      label: e.label,
      percentage: Number(e.percentage?.toFixed?.(1) || 0),
    }));
  }, [data]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateMonthlyRemedies(month);
      await loadData(true);
    } catch (err) {
      setError(err.message || "Failed to generate remedies");
    } finally {
      setGenerating(false);
    }
  };

  const handleFeedback = async (remedyId, worked) => {
    try {
      setActioning(remedyId);
      await submitRemedyFeedback({ remedyId, worked, month });
      await loadData(true);
    } catch (err) {
      setError(err.message || "Failed to update remedy");
    } finally {
      setActioning(null);
    }
  };

  useEffect(() => {
    if (
      !loading &&
      !generating &&
      data?.hasNegativeEmotions &&
      (!data.remedies || data.remedies.length === 0) &&
      !autoRequested
    ) {
      setAutoRequested(true);
      handleGenerate();
    }
  }, [loading, generating, data, autoRequested]);

  if (!month) return null;
  if (loading) {
    return (
      <div style={cardStyle()}>
        <h3 style={{ marginTop: 0 }}>Monthly Remedies</h3>
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (!data?.hasNegativeEmotions) {
    return null;
  }

  const canGenerate =
    !data.remedies?.length || data.remedies.every((r) => r.worked === null);

  return (
    <div style={cardStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Monthly Remedies</h3>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Based on {data.month} emotional trends
          </p>
        </div>
        <button
          style={{
            ...buttonStyle,
            background: "var(--accent-primary, #6366f1)",
            color: "#fff",
            opacity: generating ? 0.6 : 1,
            cursor: generating ? "not-allowed" : "pointer",
          }}
          disabled={generating}
          onClick={handleGenerate}
        >
          {generating ? "Generating…" : canGenerate ? "Generate Remedies" : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Key negative emotions this month:
        </div>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {negativeEmotionLabels.map((emotion) => (
            <span
              key={emotion.label}
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: "999px",
                padding: "4px 10px",
                fontSize: "0.85rem",
                background: "var(--bg-primary)",
              }}
            >
              {emotion.label}
              {emotion.percentage ? ` (${emotion.percentage}%)` : ""}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, position: "relative" }}>
        {refreshing && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
            }}
          >
            Updating…
          </div>
        )}
        {data.remedies?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.remedies.map((remedy) => (
              <div
                key={remedy.id}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  background: "var(--bg-primary)",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 6 }}>
                  {remedy.text}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    style={{
                      ...buttonStyle,
                      borderColor: "#10b981",
                      color: "#10b981",
                    }}
                    disabled={remedy.worked === true || actioning === remedy.id}
                    onClick={() => handleFeedback(remedy.id, true)}
                  >
                    ✔ Worked
                  </button>
                  <button
                    style={{
                      ...buttonStyle,
                      borderColor: "#ef4444",
                      color: "#ef4444",
                    }}
                    disabled={actioning === remedy.id}
                    onClick={() => handleFeedback(remedy.id, false)}
                  >
                    ✖ Didn’t Work
                  </button>
                  {remedy.worked === true && (
                    <span style={{ color: "#10b981", fontSize: "0.85rem" }}>
                      Saved as helpful
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              border: "1px dashed var(--border-color)",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            No remedies yet for this month. Generate personalized suggestions to
            start a supportive plan.
          </div>
        )}
      </div>
    </div>
  );
};

const cardStyle = () => ({
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-color)",
  borderRadius: "12px",
  padding: "16px",
  boxShadow: "0 4px 6px var(--shadow-color)",
});

export default MonthlyRemedies;

