// src/app/(logs)/logs/[id]/page.tsx
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, Timestamp as FirestoreTimestamp } from "firebase/firestore";
import type { LogEntry } from "@/types";
import LogItem from "@/components/LogItem"; // Import LogItem
import { notFound } from "next/navigation";

// generateStaticParams remains important for static export if you want to pre-render known log pages
export async function generateStaticParams() {
  try {
    const logsCollection = collection(db, "logs");
    // Optimization: Only fetch IDs of public logs if this page is meant for public access too
    // For now, fetches all, assuming access control is handled by LogItem or page logic
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
    // Convert Timestamps to ISO strings
    return {
      id: logSnap.id,
      ...data,
      createdAt: data.createdAt instanceof FirestoreTimestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt),
      updatedAt: data.updatedAt instanceof FirestoreTimestamp ? data.updatedAt.toDate().toISOString() : String(data.updatedAt),
    } as LogEntry;
  } catch (error) {
    console.error(`[LogDetailPage.getLog] Error fetching log data for ID ${id}:`, error);
    return null; 
  }
}


export default async function LogDetailPage({ params }: { params: { id: string } }) {
  const logData = await getLog(params.id);

  if (!logData) {
    // Use notFound() for a proper 404 page if the log isn't found
    // This is better than returning a custom div for SEO and Next.js conventions
    notFound(); 
  }
  
  // Here, you could add logic to check if the user has permission to view this log,
  // especially if it's private. For now, LogItem itself might handle some display aspects
  // based on auth, but server-side checks are more secure for sensitive data.
  // For Phase-6, LogItem will be sufficient as it hides edit controls for non-owners.

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Use LogItem to display the log. showControls can be false as actions like edit/delete
          are typically from lists where ownership is clearer or from a dedicated edit page.
          The LogItem itself handles comments and like status internally. */}
      <LogItem log={logData} showControls={true} />
    </div>
  );
}
