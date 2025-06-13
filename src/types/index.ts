import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface LogEntry {
  id?: string; // Firestore document ID
  title: string;
  description: string;
  imageLink?: string | null; // External image URL or Firebase Storage URL
  youtubeLink?: string | null; // YouTube video URL
  isPublic: boolean;
  ownerId: string; // UID of the user who created the log
  createdAt: string; // ISO8601 timestamp string
  updatedAt: string; // ISO8601 timestamp string
}

export interface CommentEntry {
  id?: string; // Firestore document ID
  logId: string; // ID of the log this comment belongs to
  userId: string; // UID of the user who wrote the comment
  userName: string; // Display name of the user
  category: 'politics' | 'social' | 'economy' | 'technology' | 'other';
  content: string;
  createdAt: string; // ISO8601 timestamp string
}

export interface LikedLogEntry {
  logId: string; // ID of the liked log
  userId: string; // UID of the user who liked the log
  createdAt: string; // ISO8601 timestamp string
}

// Props for LogForm component
export interface LogFormProps {
  initialData?: Partial<LogEntry>;
  onSave?: (logId: string) => void; // Callback after successful save
  isDeveloper?: boolean; // To enable developer-specific features like image upload
}
