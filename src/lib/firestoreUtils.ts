// c:\Users\ramaw\firebase-studio-project\src\lib\firestoreUtils.ts
import { collection, getDocs, query, orderBy, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Log } from "@/types";

// Helper function to process a single log document
async function processLogDoc(logDocSnapshot: any): Promise<Log> {
  const logData = logDocSnapshot.data();
  const relatedLogTitles: string[] = [];

  if (logData.relatedLogs && Array.isArray(logData.relatedLogs)) {
    for (const relatedId of logData.relatedLogs) {
      if (typeof relatedId === 'string' && relatedId.trim() !== "") {
        try {
          const relatedLogDocRef = doc(db, "logs", relatedId);
          const relatedLogDocSnap = await getDoc(relatedLogDocRef);
          if (relatedLogDocSnap.exists()) {
            relatedLogTitles.push(relatedLogDocSnap.data().title || "Log Tanpa Judul");
          } else {
            relatedLogTitles.push("Log Tidak Ditemukan");
          }
        } catch (e) {
          console.error(`Error mengambil judul log terkait untuk ID ${relatedId}:`, e);
          relatedLogTitles.push("Gagal Mengambil Judul");
        }
      } else if (typeof relatedId !== 'string' || relatedId.trim() === "") {
        // Handle invalid or empty string IDs if necessary, or skip
        // console.warn(`Invalid or empty relatedId found: '${relatedId}'`);
        // relatedLogTitles.push("ID Tidak Valid"); // Optional: if you want to show this
      }
    }
  }

  const createdAt = logData.createdAt;
  const updatedAt = logData.updatedAt;

  return {
    id: logDocSnapshot.id,
    title: logData.title || "Tanpa Judul",
    description: logData.description || "",
    imageUrls: logData.imageUrls || [],
    relatedLogs: logData.relatedLogs || [],
    relatedLogTitles: relatedLogTitles,
    createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : (typeof createdAt === 'string' ? createdAt : new Date().toISOString()),
    updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : (typeof updatedAt === 'string' ? updatedAt : new Date().toISOString()),
  } as Log;
}


export async function getLogs(): Promise<Log[] | { error: string; type: "firebase_setup" | "generic" }> {
  try {
    const logsCollection = collection(db, "logs");
    const logsQuery = query(logsCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(logsQuery);

    const logsPromises = querySnapshot.docs.map(logDoc => processLogDoc(logDoc));
    const logs = await Promise.all(logsPromises);
    return logs;

  } catch (error: any) {
    console.error("Error mengambil log dari Firestore:", error);
    if (error.code && (error.code === 'unavailable' || error.code === 'failed-precondition' || error.code === 'unimplemented')) {
      return { error: "Firebase (Firestore) tidak tersedia. Pastikan emulator berjalan atau koneksi valid dan indeks telah dibuat jika diperlukan.", type: "firebase_setup" };
    }
    return { error: error.message || "Terjadi kesalahan saat mengambil log.", type: "generic" };
  }
}

export async function searchLogs(searchTerm: string): Promise<Log[] | { error: string; type: "firebase_setup" | "generic" }> {
  if (!searchTerm.trim()) {
    return getLogs(); // Jika search term kosong, kembalikan semua log
  }
  try {
    const logsCollection = collection(db, "logs");
    // Untuk pencarian sederhana, kita tetap mengambil semua dan filter di client-side.
    // Untuk aplikasi skala besar, pertimbangkan solusi search server-side (mis. Algolia, Typesense).
    const logsQuery = query(logsCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(logsQuery);

    const lowerSearchTerm = searchTerm.toLowerCase();
    const allLogsProcessed = await Promise.all(querySnapshot.docs.map(logDoc => processLogDoc(logDoc)));

    const matchedLogs: Log[] = [];
    const addedLogIds = new Set<string>(); // Untuk menghindari duplikasi

    // Pass 1: Cari log yang cocok dengan judul atau deskripsi
    for (const log of allLogsProcessed) {
      const titleMatch = log.title?.toLowerCase().includes(lowerSearchTerm);
      const descriptionMatch = log.description?.toLowerCase().includes(lowerSearchTerm);

      if (titleMatch || descriptionMatch) {
        if (!addedLogIds.has(log.id)) {
          matchedLogs.push(log);
          addedLogIds.add(log.id);
        }
      }
    }
    
    // Pass 2: Cari log yang terkait dengan log hasil pencarian (dari Pass 1)
    // atau yang judul log terkaitnya cocok dengan search term
    const directMatchIds = new Set<string>(matchedLogs.map(log => log.id));

    for (const log of allLogsProcessed) {
        // Jika log ini belum ditambahkan
        if (!addedLogIds.has(log.id)) {
            // Cek apakah log ini terkait dengan salah satu log yang sudah cocok secara langsung
            const isRelatedToDirectMatch = log.relatedLogs?.some(relatedId => directMatchIds.has(relatedId));
            
            // Cek apakah salah satu judul log terkaitnya cocok dengan search term
            const relatedTitleMatchesSearch = log.relatedLogTitles?.some(title => title.toLowerCase().includes(lowerSearchTerm));

            if (isRelatedToDirectMatch || relatedTitleMatchesSearch) {
                matchedLogs.push(log);
                addedLogIds.add(log.id);
            }
        }
    }
    
    // Pastikan urutan tetap berdasarkan createdAt desc jika memungkinkan,
    // atau urutkan ulang jika urutan menjadi acak setelah pass kedua.
    // Karena kita memproses allLogsProcessed yang sudah diurutkan,
    // dan menambahkan ke matchedLogs, urutannya mungkin tidak sepenuhnya terjaga.
    // Jika urutan sangat penting, Anda bisa mengurutkan ulang `matchedLogs` di sini.
    // Contoh: matchedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


    return matchedLogs;

  } catch (error: any) {
    console.error("Error mencari log di Firestore:", error);
    if (error.code && (error.code === 'unavailable' || error.code === 'failed-precondition' || error.code === 'unimplemented')) {
      return { error: "Firebase (Firestore) tidak tersedia. Pastikan emulator berjalan atau koneksi valid dan indeks telah dibuat jika diperlukan.", type: "firebase_setup" };
    }
    return { error: error.message || "Terjadi kesalahan saat mencari log.", type: "generic" };
  }
}
