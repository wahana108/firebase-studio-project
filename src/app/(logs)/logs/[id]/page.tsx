
// src/app/(logs)/logs/[id]/page.tsx
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, Timestamp as FirestoreTimestamp } from "firebase/firestore";
import type { LogEntry } from "@/types";
import LogItem from "@/components/LogItem"; 
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  try {
    const logsCollection = collection(db, "logs");
    const querySnapshot = await getDocs(logsCollection);
    const logIds = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
    }));
    return logIds;
  } catch (error) {
    console.error("[LogDetailPage.generateStaticParams] Error fetching log IDs:", error);
    return [];
  }
}

async function getLog(id: string): Promise<LogEntry | null> {
  try {
    const logRef = doc(db, "logs", id);
    const logSnap = await getDoc(logRef);

    if (!logSnap.exists()) {
      return null;
    }
    const data = logSnap.data();
    
    const relatedLogTitles: string[] = [];
    if (data.relatedLogIds && Array.isArray(data.relatedLogIds) && data.relatedLogIds.length > 0) {
      for (const relatedId of data.relatedLogIds) {
        if (typeof relatedId === 'string' && relatedId.trim() !== '') {
          try {
            const relatedLogRef = doc(db, "logs", relatedId);
            const relatedLogSnap = await getDoc(relatedLogRef);
            if (relatedLogSnap.exists()) {
              relatedLogTitles.push(relatedLogSnap.data()?.title || "Untitled Related Log");
            } else {
              relatedLogTitles.push("Deleted/Unknown Log");
            }
          } catch (e) {
            console.error(`Error fetching title for related log ID ${relatedId}:`, e);
            relatedLogTitles.push("Error fetching title");
          }
        }
      }
    }

    return {
      id: logSnap.id,
      ...data,
      createdAt: data.createdAt instanceof FirestoreTimestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt),
      updatedAt: data.updatedAt instanceof FirestoreTimestamp ? data.updatedAt.toDate().toISOString() : String(data.updatedAt),
      relatedLogIds: data.relatedLogIds || [],
      relatedLogTitles: relatedLogTitles,
    } as LogEntry;
  } catch (error) {
    console.error(`[LogDetailPage.getLog] Error fetching log data for ID ${id}:`, error);
    return null; 
  }
}


export default async function LogDetailPage({ params }: { params: { id: string } }) {
  const logData = await getLog(params.id);

  if (!logData) {
    notFound(); 
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <LogItem log={logData} showControls={true} />
    </div>
  );
}
