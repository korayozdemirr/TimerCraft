import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { Activity, ActivityCategory } from '../types/activity';

const ACTIVITIES_COLLECTION = 'activities';

export const createActivity = async (
  userId: string,
  title: string,
  category: ActivityCategory,
  isPomodoro: boolean = false
): Promise<string> => {
  const activityRef = await addDoc(collection(db, 'activities'), {
    userId,
    title,
    category,
    startTime: new Date(),
    isPomodoro,
    pomodoroCount: isPomodoro ? 0 : undefined,
  });
  return activityRef.id;
};

export const stopActivity = async (activityId: string): Promise<void> => {
  const activityRef = doc(db, 'activities', activityId);
  await updateDoc(activityRef, {
    endTime: new Date(),
  });
};

export const updatePomodoroCount = async (activityId: string, count: number): Promise<void> => {
  const activityRef = doc(db, 'activities', activityId);
  await updateDoc(activityRef, {
    pomodoroCount: count,
  });
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  const activityRef = doc(db, 'activities', activityId);
  await deleteDoc(activityRef);
};

export const getUserActivities = async (userId: string): Promise<Activity[]> => {
  const activitiesRef = collection(db, 'activities');
  const q = query(activitiesRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime.toDate(),
      endTime: data.endTime?.toDate(),
    } as Activity;
  });
};

const convertTimestamps = (data: DocumentData): Partial<Activity> => {
  const converted = { ...data };
  if (data.startTime) {
    converted.startTime = data.startTime.toDate();
  }
  if (data.endTime) {
    converted.endTime = data.endTime.toDate();
  }
  if (data.createdAt) {
    converted.createdAt = data.createdAt.toDate();
  }
  if (data.updatedAt) {
    converted.updatedAt = data.updatedAt.toDate();
  }
  return converted;
}; 