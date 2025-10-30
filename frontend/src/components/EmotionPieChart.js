import React, { useEffect, useMemo, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const EmotionPieChart = ({ month }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = month ? `?month=${encodeURIComponent(month)}` : '';
        const res = await fetch(`http://localhost:5000/api/journals/emotion-distribution${params}` , {
          headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        setData(json.distribution || []);
      } catch (e) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDistribution();
  }, [month]);

  const labels = useMemo(() => data.map(d => capitalize(d.label)), [data]);
  const values = useMemo(() => data.map(d => Number(d.percentage?.toFixed?.(2) || 0)), [data]);
  const colors = useMemo(() => data.map(d => colorFor(d.label)), [data]);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.map(c => toRgba(c, 0.85)),
        borderColor: colors.map(c => toRgba(c, 1)),
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed} %`
        }
      }
    }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#666'}}>Loading pie...</div>;
  if (!data.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#666'}}>No data for this month.</div>;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      boxShadow: '0 2px 8px var(--shadow-color)',
      padding: '12px'
    }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

function capitalize(s='') { return s.charAt(0).toUpperCase() + s.slice(1); }

function colorFor(label='') {
  const map = {
    joy: '#4bc0c0', happiness: '#22c55e', sadness: '#ef4444', anger: '#f59e0b',
    surprise: '#8b5cf6', optimism: '#36a2eb', fear: '#ff9f40', anxiety: '#f97316',
    neutral: '#94a3b8', disgust: '#84cc16', trust: '#0ea5e9', anticipation: '#06b6d4',
  };
  const key = (label || '').toLowerCase().trim();
  if (map[key]) return map[key];
  // Deterministic fallback palette so each unknown emotion gets a stable distinct color
  const palette = ['#e11d48','#10b981','#3b82f6','#f59e0b','#8b5cf6','#14b8a6','#f97316','#ef4444','#22c55e','#a855f7','#06b6d4','#f43f5e'];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function toRgba(hex, a) {
  if (hex.startsWith('rgba')) return hex;
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

export default EmotionPieChart;


