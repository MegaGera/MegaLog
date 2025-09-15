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
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyData {
  date: string;
  count: number;
}

interface DailyUsersChartProps {
  data: DailyData[];
  loading?: boolean;
}

export function DailyUsersChart({ data, loading = false }: DailyUsersChartProps) {
  // Format dates for display (show day of week and date)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // For other days, show day name and date
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Users',
        data: data.map(item => item.count),
        borderColor: 'rgb(16, 185, 129)', // Green-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Green-500 with opacity
        borderWidth: 2,
        fill: true,
        tension: 0.4, // Smooth curves
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'rgb(16, 185, 129)',
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(16, 185, 129)',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we only have one dataset
      },
      title: {
        display: true,
        text: 'Distinct Users',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#374151', // Gray-700
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        callbacks: {
          title: (context: { dataIndex: number }[]) => {
            const dataIndex = context[0].dataIndex;
            const originalDate = data[dataIndex].date;
            const date = new Date(originalDate);
            return date.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric' 
            });
          },
          label: (context: { parsed: { y: number } }) => {
            const count = context.parsed.y;
            return `${count} user${count !== 1 ? 's' : ''}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280', // Gray-500
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)', // Gray-500 with opacity
        },
        ticks: {
          color: '#6B7280', // Gray-500
          font: {
            size: 12,
          },
          callback: function(value: string | number) {
            return Number(value).toLocaleString();
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
