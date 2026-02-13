import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend);

type ProgressEntry = {
  date: string;
  count: number;
};

type Stats = Record<string, ProgressEntry[]>;

function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/stats.json')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error loading stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const leaderboard = useMemo(() => {
    if (!stats) return [];

    return Object.entries(stats)
      .map(([user, entries]) => {
        const latest = entries[entries.length - 1];
        const previous = entries[entries.length - 2];
        const gain = previous ? latest.count - previous.count : 0;

        return {
          user,
          latestCount: latest?.count ?? 0,
          lastUpdated: latest?.date ?? '-',
          gain,
        };
      })
      .sort((a, b) => b.latestCount - a.latestCount);
  }, [stats]);

  const analysisData = useMemo(() => {
    if (!leaderboard.length) return null;

    return {
      labels: leaderboard.map(item => item.user),
      datasets: [
        {
          label: 'Problems Solved',
          data: leaderboard.map(item => item.latestCount),
          backgroundColor: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3b0764'],
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    };
  }, [leaderboard]);

  if (loading) return <div className="status">Loading stats...</div>;

  if (!leaderboard.length || !analysisData) {
    return (
      <div className="status">
        No stats found. Run <code>scripts/update_progress.py</code> to generate data.
      </div>
    );
  }

  return (
    <main className="page">
      <section className="leaderboard-panel">
        <h1>LeetCode Leaderboard</h1>
        <p className="subtitle">Minimal tracker for your squad</p>
        <div className="leaderboard-grid">
          {leaderboard.map((entry, index) => (
            <article className="leaderboard-card" key={entry.user}>
              <div className="card-rank">#{index + 1}</div>
              <div className="card-name">{entry.user}</div>
              <div className="card-total">{entry.latestCount}</div>
              <div className="card-meta">
                <span>{entry.gain >= 0 ? `+${entry.gain}` : entry.gain} recent</span>
                <span>{entry.lastUpdated}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="analysis-panel">
        <h2>Problem Analysis</h2>
        <p className="subtitle">Total solved problems per user</p>
        <div className="chart-wrap">
          <Bar
            data={analysisData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1e1231',
                  borderColor: '#4c1d95',
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  ticks: { color: '#d4c7f6' },
                  grid: { display: false },
                },
                y: {
                  ticks: { color: '#d4c7f6', stepSize: 10 },
                  grid: { color: 'rgba(212, 199, 246, 0.16)' },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
