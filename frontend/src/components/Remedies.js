import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "../styles/Remedies.css";

export default function Remedies({ emotion: propEmotion, journalId: propJournalId }) {
  const [emotion, setEmotion] = useState(propEmotion || "");
  const [journalId, setJournalId] = useState(propJournalId || "");
  const [remedy, setRemedy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      if (propEmotion) {
        setEmotion(propEmotion);
        setJournalId(propJournalId || "");
        fetchRemedy(propEmotion, propJournalId || "");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/journals", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token, // ✅ FIXED
          },
        });

        if (res.ok) {
          const journals = await res.json();
          if (Array.isArray(journals) && journals.length > 0) {
            let latest = journals[0];
            if (journals.length > 1) {
              latest = journals.reduce((a, b) => {
                if (!a.createdAt) return b;
                if (!b.createdAt) return a;
                return new Date(a.createdAt) > new Date(b.createdAt) ? a : b;
              });
            }
            const em = latest.emotion || latest.detectedEmotion || "";
            const jId = latest._id || latest.id || "";
            if (em) {
              setEmotion(em);
              setJournalId(jId);
              fetchRemedy(em, jId);
              return;
            }
          }
        }
      } catch (err) {
        console.debug("Could not fetch latest journals", err);
      }

      console.log("Fallback triggered");
      fetchRemedy("anxious", "demo123");
    }

    init();
  }, [propEmotion, propJournalId]);

  async function fetchRemedy(em, jId) {
    setLoading(true);
    setError(null);
    setRemedy(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/remedy/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token, // ✅ FIXED
        },
        body: JSON.stringify({ emotion: em, journalId: jId }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      const id = data.remedyId || data.id || data._id;
      const text = data.remedyText || data.text || data.remedy;
      console.log("Fetched remedy text:", text);
      setRemedy({ id, text });
    } catch (err) {
      console.error("fetchRemedy error:", err);
      setError("Failed to fetch remedy. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(feedbackType) {
    if (!remedy?.id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/remedy/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token, // ✅ FIXED
        },
        body: JSON.stringify({ remedyId: remedy.id, feedback: feedbackType }),
      });
      if (!res.ok) throw new Error("Feedback failed");
      setFeedbackMsg("Thanks — your feedback was saved.");
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error("sendFeedback error:", err);
      setFeedbackMsg("Could not save feedback. Try again later.");
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  }

  console.log("Rendering Remedies:", { emotion, remedy, loading, error });

  return (
    <div className="remedies-container">
      {loading && <div className="alert alert-secondary">Fetching remedy...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && remedy && (
        <>
          <h2 className="remedy-header">Your Remedy for Today 💫</h2>
          <div className="remedy-list">
            {remedy.text
              .split(/\n+/)
              .map(line => line.trim().replace(/^[0-9.\-*]+/g, ""))
              .filter(line => line !== "")
              .slice(0, 6)
              .map((line, idx) => (
                <div className="remedy-line" key={idx}>
                  <div className="remedy-text">
                    <span className="emoji">🌿</span> {line}
                  </div>
                  <div className="mini-feedback">
                    <button onClick={() => sendFeedback("helpful")}>👍 Helpful</button>
                    <button onClick={() => sendFeedback("not helpful")}>👎 Not Helpful</button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {!remedy && !loading && !error && (
        <div className="alert alert-info">
          No remedy yet. Provide an emotion or create a journal to generate one.
        </div>
      )}

      {feedbackMsg && (
        <div
          className="toast show"
          role="alert"
          style={{ position: "fixed", bottom: 20, right: 20 }}
        >
          <div className="toast-body">{feedbackMsg}</div>
        </div>
      )}
    </div>
  );
}

Remedies.propTypes = {
  emotion: PropTypes.string,
  journalId: PropTypes.string,
};
