import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createActivity, stopActivity } from '../services/activity';
import { PomodoroSettings } from '../types/activity';

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

type TimerState = 'work' | 'shortBreak' | 'longBreak';

const Pomodoro = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [timerState, setTimerState] = useState<TimerState>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [settings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startNewActivity = useCallback(async () => {
    if (!currentUser) return;
    try {
      const activityId = await createActivity(currentUser.uid, 'Pomodoro Session', 'Work', true);
      setCurrentActivityId(activityId);
      setSuccess('Pomodoro session started');
      setError(null);
    } catch (error) {
      setError('Failed to start Pomodoro session');
      setSuccess(null);
    }
  }, [currentUser]);

  const endActivity = useCallback(async () => {
    if (!currentActivityId) return;
    try {
      await stopActivity(currentActivityId);
      setCurrentActivityId(null);
      setSuccess('Pomodoro session completed');
      setError(null);
    } catch (error) {
      setError('Failed to end Pomodoro session');
      setSuccess(null);
    }
  }, [currentActivityId]);

  const handleTimerComplete = useCallback(() => {
    const audio = new Audio('/notification.mp3');
    audio.play();

    if (timerState === 'work') {
      setPomodoroCount((prev) => prev + 1);
      const isLongBreak = (pomodoroCount + 1) % settings.longBreakInterval === 0;
      setTimerState(isLongBreak ? 'longBreak' : 'shortBreak');
      setTimeLeft(
        (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60
      );
    } else {
      setTimerState('work');
      setTimeLeft(settings.workDuration * 60);
    }
  }, [timerState, pomodoroCount, settings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const handleStartStop = async () => {
    if (!isRunning) {
      if (timerState === 'work' && !currentActivityId) {
        await startNewActivity();
      }
    } else {
      if (timerState === 'work') {
        await endActivity();
      }
    }
    setIsRunning(!isRunning);
  };

  const handleReset = async () => {
    setIsRunning(false);
    setTimerState('work');
    setTimeLeft(settings.workDuration * 60);
    if (currentActivityId) {
      await endActivity();
    }
  };

  const getTimerColor = () => {
    switch (timerState) {
      case 'work':
        return 'text-primary-600';
      case 'shortBreak':
        return 'text-green-600';
      case 'longBreak':
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
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

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {timerState === 'work'
            ? 'Work Time'
            : timerState === 'shortBreak'
            ? 'Short Break'
            : 'Long Break'}
        </h2>
        <div className={`font-mono text-6xl font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleStartStop}
          className={`px-6 py-2 rounded-md font-semibold text-white ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-md font-semibold text-primary-600 border-2 border-primary-600 hover:bg-primary-50"
        >
          Reset
        </button>
      </div>

      <div className="text-center">
        <p className="text-gray-600">
          Completed Pomodoros: <span className="font-bold">{pomodoroCount}</span>
        </p>
      </div>
    </div>
  );
};

export default Pomodoro; 