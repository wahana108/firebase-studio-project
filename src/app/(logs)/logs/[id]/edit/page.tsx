// src/app/(logs)/logs/[id]/edit/page.tsx
// export const revalidate = 0; // Coba komentari atau hapus baris ini

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { LogForm } from "@/components/LogForm";
import { LogFormData } from "@/types";

export async function generateStaticParams() {
  try {
    const logsCollection = collection(db, "logs");
    const querySnapshot = await getDocs(logsCollection);
    const logIds = querySnapshot.docs.map((doc) => ({
      id: doc.id,
    }));
    console.log("[generateStaticParams] Edit page IDs:", logIds);
    return logIds;
  } catch (error) {
    console.error("[generateStaticParams] Error fetching log IDs for edit page:", error);
    return [];
  }
}

export default async function EditLogPage({ params }: { params: { id: string } }) {
  let logData: LogFormData & {
    imageUrls?: { url: string | null; isMain?: boolean; caption?: string }[];
    relatedLogs?: string[];
  } | null = null;

  try {
    const logRef = doc(db, "logs", params.id);
    const logSnap = await getDoc(logRef);

    if (!logSnap.exists()) {
      return <div className="container mx-auto p-4 text-center text-destructive">Log not found</div>;
    }
    const data = logSnap.data();
    logData = {
      id: logSnap.id,
      title: data.title || "",
      description: data.description || "",
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      relatedLogs: Array.isArray(data.relatedLogs) ? data.relatedLogs : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[EditLogPage] Error fetching log data for ID ${params.id}:`, error);
    return <div className="container mx-auto p-4 text-center text-destructive">Error loading log data. Please try again.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Edit Log</h1>
      {logData && <LogForm initialData={{ id: params.id, ...logData }} />}
    </div>
  );
}