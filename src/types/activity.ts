export type ActivityCategory = 'Work' | 'Exercise' | 'Leisure' | 'Study' | 'Personal';

export interface Activity {
  id: string;
  userId: string;
  title: string;
  category: ActivityCategory;
  startTime: Date;
  endTime?: Date;
  isPomodoro?: boolean;
  pomodoroCount?: number;
}

export interface PomodoroSettings {
  workDuration: number;  // in minutes
  shortBreakDuration: number;  // in minutes
  longBreakDuration: number;  // in minutes
  longBreakInterval: number;  // number of pomodoros before long break
} 