// src/app/(logs)/logs/[id]/page.tsx
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, Timestamp, query, where } from "firebase/firestore"; // Import Timestamp, query, where
import type { Log } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  try {
    const logsQuery = query(collection(db, "logs"), where("isPublic", "==", true)); // Hanya log publik
    const querySnapshot = await getDocs(logsQuery);
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
  const { id } = await params; // Perbaikan: await params
  try {
    const logRef = doc(db, "logs", id);
    const logSnap = await getDoc(logRef);

    if (!logSnap.exists()) {
      return <div className="container mx-auto p-4 text-center text-destructive">Log not found</div>;
    }

    // Ambil data log terkait dan filter hanya yang publik
    const rawData = logSnap.data();
    const relatedLogTitles: string[] = [];
    const publicRelatedLogIds: string[] = [];

    if (rawData.relatedLogs && Array.isArray(rawData.relatedLogs)) {
      for (const relatedId of rawData.relatedLogs) {
        if (typeof relatedId === 'string' && relatedId.trim() !== "") {
          try {
            const relatedLogRef = doc(db, "logs", relatedId);
            const relatedLogSnap = await getDoc(relatedLogRef);
            if (relatedLogSnap.exists() && relatedLogSnap.data()?.isPublic) {
              relatedLogTitles.push(relatedLogSnap.data()?.title || "Untitled Related Log");
              publicRelatedLogIds.push(relatedId);
            }
          } catch (e) {
            console.error(`[LogDetailPage] Error fetching related log title for ID ${relatedId}:`, e);
          }
        }
      }
    }

    const data = logSnap.data();
    const logData: Log = {
      id: logSnap.id,
      title: data.title || "Untitled Log",
      description: data.description || "",
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      relatedLogs: publicRelatedLogIds, // Gunakan ID log terkait yang sudah difilter publik
      relatedLogTitles: relatedLogTitles, // Gunakan judul log terkait yang sudah difilter
      isPublic: data.isPublic || false,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString()),
    };

    const imageUrls = (logData.imageUrls || []).filter((img) => img.url);
    const mainImage = imageUrls.find((img) => img.isMain) || (imageUrls.length > 0 ? imageUrls[0] : null);

    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 text-center md:text-left">{logData.title}</h1>
        {mainImage && mainImage.url && (
          <div className="mb-6">
            <img
              src={mainImage.url}
              alt={mainImage.caption || logData.title}
              style={{ width: "400px", height: "300px", objectFit: "cover" }}
              className="rounded-lg"
              data-ai-hint="log detail image"
            />
            {mainImage.caption && <p className="text-sm text-muted-foreground mt-2">{mainImage.caption}</p>}
          </div>
        )}
        <p className="mb-6 whitespace-pre-wrap">{logData.description}</p>
        {logData.relatedLogs && logData.relatedLogs.length > 0 && (
          <div className="mb-6"> 
            <h2 className="text-xl font-semibold mb-3">Log Terkait</h2>
            <div className="flex flex-wrap gap-3">
              {logData.relatedLogs.map((relatedId, idx) => ( // logData.relatedLogs sudah difilter
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
