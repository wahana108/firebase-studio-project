
import type { Timestamp } from 'firebase/firestore';

export type Log = {
  id: string;
  title: string;
  description: string;
  imageUrls: { url: string | null; isMain: boolean; caption?: string }[]; // url bisa null
  relatedLogs?: string[]; // Untuk menyimpan ID log terkait
  createdAt: Date | Timestamp; // Memungkinkan Date atau Timestamp
  updatedAt?: Date | Timestamp; // Field baru, opsional
  relatedLogTitles?: string[]; // Ditambahkan untuk mendukung LogList.tsx
};

export type LogFormData = {
  id?: string; // Opsional, berguna untuk form edit
  title: string;
  description: string;
  imageUrls?: { url: string | null; isMain: boolean; caption?: string }[]; // url bisa null, untuk initialData
  // FileList untuk gambar baru akan ditangani secara terpisah oleh react-hook-form dan server action
  relatedLogs?: string[]; // Untuk mengelola pilihan log terkait di form
};
