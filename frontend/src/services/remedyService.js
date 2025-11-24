const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api/remedy";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "x-auth-token": token || "",
  };
};

export const fetchMonthlyRemedies = async (month) => {
  const params = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await fetch(`${API_BASE}/monthly${params}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to load monthly remedies");
  }
  return res.json();
};

export const generateMonthlyRemedies = async (month) => {
  const res = await fetch(`${API_BASE}/monthly/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ month }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to generate remedies");
  }
  return res.json();
};

export const submitRemedyFeedback = async ({ remedyId, worked, month }) => {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ remedyId, worked, month }),
  });
  if (!res.ok) {
    throw new Error("Failed to update remedy");
  }
  return res.json();
};

