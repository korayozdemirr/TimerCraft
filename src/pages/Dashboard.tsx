import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createActivity, stopActivity } from '../services/activity';
import { ActivityCategory } from '../types/activity';
import Pomodoro from '../components/Pomodoro';

const Dashboard = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Work');
  const [isTracking, setIsTracking] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTracking = async () => {
    if (!title) {
      setError('Please enter an activity title');
      return;
    }

    try {
      const activityId = await createActivity(currentUser!.uid, title, category);
      setCurrentActivityId(activityId);
      setIsTracking(true);
      setSuccess('Activity tracking started');
      setError(null);
    } catch (error) {
      setError('Failed to start activity tracking');
      setSuccess(null);
    }
  };

  const handleStopTracking = async () => {
    if (!currentActivityId) return;

    try {
      await stopActivity(currentActivityId);
      setIsTracking(false);
      setCurrentActivityId(null);
      setTimer(0);
      setTitle('');
      setSuccess('Activity tracking stopped');
      setError(null);
    } catch (error) {
      setError('Failed to stop activity tracking');
      setSuccess(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Activity Tracker
          </h2>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter activity title"
                  disabled={isTracking}
                  className="input"
                />
              </div>
              <div className="w-full md:w-48">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                  disabled={isTracking}
                  className="input"
                >
                  <option value="Work">Work</option>
                  <option value="Exercise">Exercise</option>
                  <option value="Leisure">Leisure</option>
                  <option value="Study">Study</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div className="text-center">
              <div className="font-mono text-4xl text-gray-900">
                {formatTime(timer)}
              </div>
            </div>

            <button
              onClick={isTracking ? handleStopTracking : handleStartTracking}
              className={`w-full ${
                isTracking
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              } text-white font-semibold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
          </div>
        </div>

        <Pomodoro />
      </div>
    </div>
  );
};

export default Dashboard; 