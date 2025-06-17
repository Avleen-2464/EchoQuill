import React, { useEffect, useState } from 'react';
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
        console.log('Mood Trends Response:', result);
       
        if (Array.isArray(result)) {
          // Convert predictions array into chart-ready format
          const transformed = result.map(entry => {
            const obj = {};
            entry.predictions.forEach(p => {
              obj[p.label] = p.score;
            });
            return { date: entry.date, predictions: obj };
          });

          setMoodData(transformed);

          // Extract all unique mood labels
          const allLabels = new Set();
          result.forEach(entry =>
            entry.predictions.forEach(p => allLabels.add(p.label))
          );
          setLabels(Array.from(allLabels));
        }
      } catch (error) {
        console.error('Error fetching mood trends:', error);
      }
    };

    fetchMoodTrends();
  }, []);

  const chartLabels = moodData.map(entry => entry.date);
  const datasets = labels.map(label => ({
    label,
    data: moodData.map(entry => entry.predictions[label] || 0),
    borderColor: getColor(label),
    fill: false,
    tension: 0.3,
  }));

  const chartData = {
    labels: chartLabels,
    datasets,
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, max: 1 },
    },
  };

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <h3 style={{ textAlign: 'center' }}>Mood Trends</h3>
      {moodData.length > 0 ? <Line data={chartData} options={options} /> : <p>Loading chart...</p>}
    </div>
  );
};

// 🎨 Assign consistent colors to moods
const getColor = (label) => {
  const colors = {
    joy: 'rgba(75,192,192,1)',
    sadness: 'rgba(255,99,132,1)',
    anger: 'rgba(255,206,86,1)',
    surprise: 'rgba(153,102,255,1)',
    optimism: 'rgba(54,162,235,1)',
    fear: 'rgba(255,159,64,1)',
  };
  return colors[label.toLowerCase()] || 'rgba(100,100,100,1)';
};

export default MoodTrendsChart;
