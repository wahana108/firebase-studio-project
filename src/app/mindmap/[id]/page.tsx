// src/app/mindmap/[id]/page.tsx
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore"; // Import Timestamp
import MindMap from "@/components/MindMap";
import type { Log } from "@/types";
import { collection, getDocs } from "firebase/firestore";

export async function generateStaticParams() {
  try {
    const logsCollection = collection(db, "logs");
    const querySnapshot = await getDocs(logsCollection);
    const logIds = querySnapshot.docs.map((doc) => ({
      id: doc.id,
    }));
    console.log("[generateStaticParams] MindMap page IDs:", logIds);
    return logIds;
  } catch (error) {
    console.error("[generateStaticParams] Error fetching log IDs for mindmap page:", error);
    return [];
  }
}

export default async function MindMapPage({ params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const logRef = doc(db, "logs", id);
    const logSnap = await getDoc(logRef);

    if (!logSnap.exists()) {
      return <div className="container mx-auto p-4 text-center text-destructive">Log not found</div>;
    }

    const data = logSnap.data();
    const logData: Log = {
      id: logSnap.id,
      title: data.title || "Untitled Log",
      description: data.description || "",
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      relatedLogs: Array.isArray(data.relatedLogs) ? data.relatedLogs : [],
      relatedLogTitles: Array.isArray(data.relatedLogTitles) ? data.relatedLogTitles : [],
      isPublic: data.isPublic || false,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString()),
    };

    return (
      <div className="container mx-auto p-4 md:p-8">
        <MindMap logId={id} logData={logData} />
      </div>
    );
  } catch (error) {
    console.error(`[MindMapPage] Error fetching log data for ID ${id}:`, error);
    return <div className="container mx-auto p-4 text-center text-destructive">Error loading mind map data. Please try again.</div>;
  }
}
