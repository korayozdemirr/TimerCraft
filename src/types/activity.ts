export type ActivityCategory = 'Work' | 'Exercise' | 'Leisure' | 'Study' | 'Personal';

export interface Activity {
  id: string;
  userId: string;
  title: string;
  category: ActivityCategory;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityGoal {
  userId: string;
  category: ActivityCategory;
  targetDuration: number; // in seconds
  period: 'daily' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
} 