
import type { Timestamp } from 'firebase/firestore';

export type Log = {
  id: string;
  title: string;
  description: string;
  imageUrls: { url: string | null; isMain: boolean; caption?: string }[]; // url bisa null
  relatedLogs?: string[]; // Untuk menyimpan ID log terkait
  createdAt: Date | Timestamp | string; // Memungkinkan Date, Timestamp, atau string ISO
  updatedAt?: Date | Timestamp | string; // Field baru, opsional
  relatedLogTitles?: string[]; // Ditambahkan untuk mendukung LogList.tsx
  isPublic?: boolean; // New field for public/private logs
  ownerId?: string; // Future use for Firebase Auth
};

export type LogFormData = {
  id?: string; // Opsional, berguna untuk form edit
  title: string;
  description: string;
  imageUrls?: { url: string | null; isMain: boolean; caption?: string }[]; // url bisa null, untuk initialData
  // FileList untuk gambar baru akan ditangani secara terpisah oleh react-hook-form dan server action
  relatedLogs?: string[]; // Untuk mengelola pilihan log terkait di form
  isPublic?: boolean; // New field for public/private logs
};

