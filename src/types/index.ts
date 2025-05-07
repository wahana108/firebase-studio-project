
import type { Timestamp } from 'firebase/firestore';

export interface Log {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Timestamp;
}

export interface LogFormData {
  title: string;
  description: string;
  image: FileList;
}
