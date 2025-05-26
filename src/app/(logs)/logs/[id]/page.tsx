// src/app/(logs)/logs/[id]/page.tsx
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import type { Log } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  try {
    const logsCollection = collection(db, "logs");
    const querySnapshot = await getDocs(logsCollection);
    const logIds = querySnapshot.docs.map((doc) => ({
      id: doc.id,
    }));
    console.log("[generateStaticParams] Generated log IDs:", logIds);
    return logIds;
  } catch (error) {
    console.error("[generateStaticParams] Error fetching log IDs:", error);
    return [];
  }
}

export default async function LogDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const logRef = doc(db, "logs", id);
    const logSnap = await getDoc(logRef);

    if (!logSnap.exists()) {
      return <div className="container mx-auto p-4 text-center text-destructive">Log not found</div>;
    }

    const logData = logSnap.data() as Log;
    const imageUrls = (logData.imageUrls || []).filter((img) => img.url);
    const mainImage = imageUrls.find((img) => img.isMain) || imageUrls[0];

    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 text-center md:text-left">{logData.title}</h1>
        {mainImage && (
          <div className="mb-6">
            <img
              src={mainImage.url}
              alt={mainImage.caption || logData.title}
              style={{ width: "400px", height: "300px", objectFit: "cover" }}
              className="rounded-lg"
            />
            {mainImage.caption && <p className="text-sm text-muted-foreground mt-2">{mainImage.caption}</p>}
          </div>
        )}
        <p className="mb-6">{logData.description}</p>
        {logData.relatedLogs && logData.relatedLogs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Log Terkait</h2>
            <div className="flex flex-wrap gap-3">
              {logData.relatedLogs.map((relatedId, idx) => (
                <Button key={relatedId} variant="outline" size="sm" asChild>
                  <Link href={`/logs/${relatedId}`}>
                    {logData.relatedLogTitles?.[idx] || `Log ${relatedId.substring(0, 6)}...`}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
        <Button asChild>
          <Link href={`/mindmap/${id}`}>Lihat Mind Map</Link>
        </Button>
      </div>
    );
  } catch (error) {
    console.error(`[LogDetailPage] Error fetching log data for ID ${id}:`, error);
    return <div className="container mx-auto p-4 text-center text-destructive">Error loading log data. Please try again.</div>;
  }
}