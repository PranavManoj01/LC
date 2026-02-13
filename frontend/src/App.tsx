import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

function App() {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Fetch the JSON file from the public folder
    fetch('/stats.json')
      .then(res => res.json())
      .then(data => {
        const datasets = Object.keys(data).map((user, index) => {
          // Color palette for lines
          const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
          const color = colors[index % colors.length];
          
          return {
            label: user,
            data: data[user].map((entry: any) => ({
              x: entry.date,
              y: entry.count
            })),
            borderColor: color,
            backgroundColor: color,
            tension: 0.1,
            pointRadius: 4,
          };
        });

        setChartData({ datasets });
      })
      .catch(err => console.error("Error loading stats:", err));
  }, []);

  if (!chartData) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading stats...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{textAlign: 'center', marginBottom: '40px'}}>🏆 LeetCode Leaderboard</h1>
      <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Line 
          data={chartData} 
          options={{
            responsive: true,
            scales: {
              x: {
                type: 'time',
                time: { unit: 'day' },
                title: { display: true, text: 'Date' }
              },
              y: {
                title: { display: true, text: 'Problems Solved' }
              }
            },
            plugins: {
              legend: { position: 'bottom' }
            }
          }} 
        />
      </div>
    </div>
  );
}

export default App;