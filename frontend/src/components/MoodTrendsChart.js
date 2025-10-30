import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const MoodTrendsChart = () => {
  const [moodData, setMoodData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoodTrends = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch('http://localhost:5000/api/journals/mood-trends', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token, // ✅ Secure API call
          },
        });
        
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        // Normalize and sort by date ascending for consistent trend lines
        const sorted = Array.isArray(result)
          ? [...result].sort((a, b) => new Date(a.date) - new Date(b.date))
          : [];
       
        if (Array.isArray(sorted)) {
          // Convert predictions array into chart-ready format
          const transformed = sorted.map(entry => {
            const obj = {};
            entry.predictions.forEach(p => {
              obj[p.label] = p.score;
            });
            return { date: entry.date, predictions: obj };
          });

          setMoodData(transformed);

          // Extract all unique mood labels
          const allLabels = new Set();
          sorted.forEach(entry =>
            entry.predictions.forEach(p => allLabels.add(p.label))
          );
          setLabels(Array.from(allLabels));
        }
      } catch (error) {
        console.error('Error fetching mood trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodTrends();
  }, []);

  const chartLabels = useMemo(() => moodData.map(entry => entry.date), [moodData]);

  const datasets = useMemo(() => labels.map(label => {
    const color = getColor(label);
    const rgba = hexOrRgbaToRgba(color, 1);
    const rgbaFill = hexOrRgbaToRgba(color, 0.15);
    return {
      label,
      data: moodData.map(entry => entry.predictions[label] || 0),
      borderColor: rgba,
      backgroundColor: rgbaFill,
      pointBackgroundColor: rgba,
      pointBorderColor: rgba,
      pointRadius: 2,
      pointHoverRadius: 4,
      borderWidth: 2,
      fill: true,
      spanGaps: true,
      tension: 0.35,
    };
  }), [labels, moodData]);

  const chartData = {
    labels: chartLabels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
      },
      y: {
        min: 0,
        max: 1,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { stepSize: 0.2 }
      }
    }
  };

  return (
    <div className="mood-trends-container" style={{
      width: '100%',
      height: '100%',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}>
      <h3 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
        fontSize: '1.5rem',
        fontWeight: '600',
      }}>Mood Trends</h3>
      <div style={{ height: 'calc(100% - 60px)' }}>
        {loading ? (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '100%', color: '#666'
          }}>
            Loading chart...
          </div>
        ) : moodData.length > 0 ? (
          <Line data={chartData} options={{
            ...options
          }} />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#666'
          }}>
            No mood data yet. Create some journals to see trends.
          </div>
        )}
      </div>
    </div>
  );
};

// 🎨 Assign consistent colors to moods
const getColor = (label) => {
  const map = {
    joy: '#4bc0c0',
    happiness: '#22c55e',
    sadness: '#ef4444',
    anger: '#f59e0b',
    surprise: '#8b5cf6',
    optimism: '#36a2eb',
    fear: '#ff9f40',
    anxiety: '#f97316',
    neutral: '#94a3b8',
    disgust: '#84cc16',
    trust: '#0ea5e9',
    anticipation: '#06b6d4',
  };
  const key = label?.toLowerCase?.()?.trim?.() || '';
  if (map[key]) return map[key];
  // Deterministic fallback color for unknown labels
  const palette = ['#e11d48','#10b981','#3b82f6','#f59e0b','#8b5cf6','#14b8a6','#f97316','#ef4444','#22c55e','#a855f7','#06b6d4','#f43f5e'];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
};

// Utility: ensure we can create semi-transparent fills whether color is hex or rgba
function hexOrRgbaToRgba(color, alpha) {
  if (!color) return `rgba(100,100,100,${alpha})`;
  if (color.startsWith('rgba')) {
    // replace alpha
    return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/, (_, r, g, b) => `rgba(${r},${g},${b},${alpha})`);
  }
  if (color.startsWith('rgb(')) {
    return color.replace(/rgb\(([^,]+),([^,]+),([^\)]+)\)/, (_, r, g, b) => `rgba(${r},${g},${b},${alpha})`);
  }
  // hex #rrggbb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default MoodTrendsChart;
