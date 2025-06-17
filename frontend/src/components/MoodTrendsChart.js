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
        {moodData.length > 0 ? (
          <Line data={chartData} options={{
            ...options,
            maintainAspectRatio: false,
            plugins: {
              ...options.plugins,
              legend: {
                ...options.plugins.legend,
                labels: {
                  padding: 20,
                  font: {
                    size: 12
                  }
                }
              }
            }
          }} />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#666'
          }}>
            Loading chart...
          </div>
        )}
      </div>
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
