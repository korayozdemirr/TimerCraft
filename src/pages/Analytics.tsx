import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Activity, ActivityCategory } from '../types/activity';
import { getUserActivities } from '../services/activity';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const COLORS = [
  'rgba(54, 162, 235, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(153, 102, 255, 0.8)',
];

const Analytics = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        if (currentUser) {
          const now = new Date();
          const start = timeRange === 'week' ? startOfWeek(now) : startOfMonth(now);
          const end = timeRange === 'week' ? endOfWeek(now) : endOfMonth(now);
          const fetchedActivities = await getUserActivities(currentUser.uid);
          const filteredActivities = fetchedActivities.filter(
            (activity) =>
              activity.startTime >= start &&
              (activity.endTime ? activity.endTime <= end : true)
          );
          setActivities(filteredActivities);
        }
      } catch (error) {
        setError('Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currentUser, timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getCategoryData = () => {
    const categoryDurations: { [key in ActivityCategory]?: number } = {};
    
    activities.forEach((activity) => {
      if (activity.endTime) {
        const duration = Math.floor(
          (activity.endTime.getTime() - activity.startTime.getTime()) / (1000 * 60 * 60)
        );
        categoryDurations[activity.category] = (categoryDurations[activity.category] || 0) + duration;
      }
    });

    const labels = Object.keys(categoryDurations);
    const data = Object.values(categoryDurations);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: COLORS,
          borderColor: COLORS.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  const getDailyData = () => {
    const dailyData: { [date: string]: { [key in ActivityCategory]?: number } } = {};
    
    activities.forEach((activity) => {
      if (activity.endTime) {
        const date = format(activity.startTime, 'MM/dd');
        const duration = Math.floor(
          (activity.endTime.getTime() - activity.startTime.getTime()) / (1000 * 60 * 60)
        );
        
        if (!dailyData[date]) {
          dailyData[date] = {};
        }
        
        dailyData[date][activity.category] = (dailyData[date][activity.category] || 0) + duration;
      }
    });

    const dates = Object.keys(dailyData);
    const categories = Array.from(
      new Set(
        activities.map((activity) => activity.category)
      )
    );

    return {
      labels: dates,
      datasets: categories.map((category, index) => ({
        label: category,
        data: dates.map((date) => dailyData[date][category] || 0),
        backgroundColor: COLORS[index % COLORS.length],
        borderColor: COLORS[index % COLORS.length].replace('0.8', '1'),
        borderWidth: 1,
        stack: 'stack',
      })),
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
            className="input"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Time Distribution by Category
          </h2>
          <div className="h-[400px]">
            <Pie data={getCategoryData()} options={pieOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Activity Breakdown
          </h2>
          <div className="h-[400px]">
            <Bar data={getDailyData()} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 