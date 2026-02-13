import { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

type ProgressEntry = {
  date: string;
  count: number;
  easy?: number;
  medium?: number;
  hard?: number;
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

  const progressChartData = useMemo(() => {
    if (!stats) return null;

    const labels = Array.from(
      new Set(Object.values(stats).flatMap(entries => entries.map(entry => entry.date))),
    ).sort((a, b) => a.localeCompare(b));

    const lineColors = ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'];

    return {
      labels,
      datasets: Object.entries(stats).map(([user, entries], index) => {
        const byDate = new Map(entries.map(item => [item.date, item.count]));

        return {
          label: user,
          data: labels.map(date => byDate.get(date) ?? null),
          borderColor: lineColors[index % lineColors.length],
          backgroundColor: lineColors[index % lineColors.length],
          borderWidth: 2,
          tension: 0.26,
          spanGaps: true,
          pointRadius: 3,
          pointHoverRadius: 4,
        };
      }),
    };
  }, [stats]);

  const difficultyChartData = useMemo(() => {
    if (!stats || !leaderboard.length) return null;

    return {
      labels: leaderboard.map(item => item.user),
      datasets: [
        {
          label: 'Easy',
          data: leaderboard.map(item => {
            const latest = stats[item.user][stats[item.user].length - 1];
            return latest?.easy ?? 0;
          }),
          backgroundColor: '#7dd3fc',
        },
        {
          label: 'Medium',
          data: leaderboard.map(item => {
            const latest = stats[item.user][stats[item.user].length - 1];
            return latest?.medium ?? 0;
          }),
          backgroundColor: '#f59e0b',
        },
        {
          label: 'Hard',
          data: leaderboard.map(item => {
            const latest = stats[item.user][stats[item.user].length - 1];
            return latest?.hard ?? 0;
          }),
          backgroundColor: '#ef4444',
        },
      ],
    };
  }, [stats, leaderboard]);

  const hasDifficultyData = useMemo(() => {
    if (!stats) return false;

    return Object.values(stats).some(entries => {
      const latest = entries[entries.length - 1];
      return (
        typeof latest?.easy === 'number' ||
        typeof latest?.medium === 'number' ||
        typeof latest?.hard === 'number'
      );
    });
  }, [stats]);

  if (loading) return <div className="status">Loading stats...</div>;

  if (!leaderboard.length || !progressChartData || !difficultyChartData) {
    return (
      <div className="status">
        No stats found. Run <code>scripts/update_progress.py</code> to generate data.
      </div>
    );
  }

  return (
    <main className="page">
      <section className="analysis-panel">
        <h1>LeetCode Leaderboard</h1>
        <p className="subtitle">Questions solved over time</p>
        <div className="chart-wrap">
          <Line
            data={progressChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#d4c7f6' } },
                tooltip: {
                  backgroundColor: '#1e1231',
                  borderColor: '#4c1d95',
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  ticks: { color: '#d4c7f6' },
                  grid: { color: 'rgba(212, 199, 246, 0.1)' },
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

      <section className="leaderboard-panel">
        <h2>Current Leaderboard</h2>
        <p className="subtitle">Ranked by total solved problems</p>
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
        <h2>Difficulty Distribution</h2>
        <p className="subtitle">Stacked Easy / Medium / Hard totals per user</p>
        <div className="chart-wrap">
          <Bar
            data={difficultyChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#d4c7f6' } },
                tooltip: {
                  backgroundColor: '#1e1231',
                  borderColor: '#4c1d95',
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: { color: '#d4c7f6' },
                  grid: { display: false },
                },
                y: {
                  stacked: true,
                  ticks: { color: '#d4c7f6', stepSize: 10 },
                  grid: { color: 'rgba(212, 199, 246, 0.16)' },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
        {!hasDifficultyData && (
          <p className="helper-note">
            Difficulty split needs one fresh run of <code>scripts/update_progress.py</code> to populate easy/medium/hard.
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
