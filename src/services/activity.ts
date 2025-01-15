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
  category: ActivityCategory
): Promise<string> => {
  const activity = {
    userId,
    title,
    category,
    startTime: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activity);
  return docRef.id;
};

export const stopActivity = async (activityId: string): Promise<void> => {
  const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  const endTime = Timestamp.now();
  
  await updateDoc(activityRef, {
    endTime,
    duration: endTime.seconds - (await getDocs(query(collection(db, ACTIVITIES_COLLECTION), where('id', '==', activityId)))).docs[0].data().startTime.seconds,
    updatedAt: endTime
  });
};

export const updateActivity = async (
  activityId: string,
  updates: Partial<Activity>
): Promise<void> => {
  const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  await updateDoc(activityRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  await deleteDoc(activityRef);
};

export const getUserActivities = async (userId: string): Promise<Activity[]> => {
  const activitiesQuery = query(
    collection(db, ACTIVITIES_COLLECTION),
    where('userId', '==', userId),
    orderBy('startTime', 'desc')
  );

  const querySnapshot = await getDocs(activitiesQuery);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Activity[];
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