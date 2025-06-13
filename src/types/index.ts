
export interface Log {
  id: string;
  title: string;
  description: string;
  imageLink?: string; // External URL for image
  youtubeLink?: string; // YouTube video link
  isPublic: boolean;
  ownerId: string; // Firebase Auth UID
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  // Optional: for displaying comment counts or like counts directly on the log
  commentCount?: number;
  likeCount?: number;
}

export interface Comment {
  id: string;
  logId: string; // To know which log this comment belongs to
  content: string;
  userId: string; // Firebase Auth UID of the commenter
  userName: string; // Display name of the commenter
  category: 'politics' | 'social' | 'economy' | 'technology' | 'other';
  createdAt: string; // ISO Date String
}

export interface LikedLog {
  logId: string; // ID of the log that is liked
  userId: string; // ID of the user who liked the log
  createdAt: string; // ISO Date String
}

// For LogForm data
export type LogFormData = {
  title: string;
  description: string;
  imageLink?: string;
  youtubeLink?: string;
  isPublic: boolean;
};

export type CommentFormData = {
    content: string;
    category: 'politics' | 'social' | 'economy' | 'technology' | 'other';
};

// Developer specific image upload
export interface DeveloperUploadedImage {
    logId: string;
    imageName: string; // e.g., image1.png
    storagePath: string; // Full path in Firebase Storage
    downloadURL: string; // Public URL after upload
    uploadedAt: string; // ISO Date String
}
