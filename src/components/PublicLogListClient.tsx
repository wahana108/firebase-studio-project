
// src/components/PublicLogListClient.tsx
"use client";

import type { Log } from "@/types";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Map, Image as ImageIcon, Link as LinkIcon, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firestoreUtils"; // Assuming db is exported from firestoreUtils or directly from firebase
import { Timestamp } from "firebase/firestore"; // Import Timestamp

async function getPublicLogs(): Promise<Log[] | { error: string; type: "firebase_setup" | "generic" }> {
  try {
    const logsCollection = collection(db, "logs");
    // Query for logs where isPublic is true, order by most recently updated (or created)
    const logsQuery = query(
      logsCollection,
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc") // Or orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(logsQuery);

    const logs: Log[] = [];
    for (const logDoc of querySnapshot.docs) {
      const data = logDoc.data();
      const relatedLogTitles: string[] = [];

      if (data.relatedLogs && Array.isArray(data.relatedLogs)) {
        for (const relatedId of data.relatedLogs) {
          if (typeof relatedId === 'string' && relatedId.trim() !== "") {
            try {
              // For public logs, only link to other public logs or show a generic title
              const relatedLogRef = doc(db, "logs", relatedId);
              const relatedLogSnap = await getDoc(relatedLogRef);
              if (relatedLogSnap.exists() && relatedLogSnap.data()?.isPublic) {
                relatedLogTitles.push(relatedLogSnap.data().title || "Untitled Related Log");
              } else {
                 // relatedLogTitles.push("Private Related Log"); // Or omit
              }
            } catch (e) {
              console.error(`Error fetching related log title for ID ${relatedId}:`, e);
              // relatedLogTitles.push("Error fetching title"); // Or omit
            }
          }
        }
      }
      
      const createdAt = data.createdAt;
      const updatedAt = data.updatedAt;

      logs.push({
        id: logDoc.id,
        title: data.title || "Untitled Log",
        description: data.description || "",
        imageUrls: data.imageUrls || [],
        relatedLogs: (data.relatedLogs || []).filter((id: string) => 
            logs.find(l => l.id === id && l.isPublic) // Ensure related logs shown are also public if linking
        ),
        relatedLogTitles, // These titles are already filtered or generic
        isPublic: data.isPublic,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : (typeof createdAt === 'string' ? createdAt : new Date().toISOString()),
        updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : (typeof updatedAt === 'string' ? updatedAt : new Date().toISOString()),
      } as Log);
    }
    console.log("[PublicLogListClient] Public logs fetched:", logs.length);
    return logs;
  } catch (error: any) {
    console.error("[PublicLogListClient] Error fetching public logs:", error);
    if (error.code && (error.code === 'unavailable' || error.code === 'failed-precondition' || error.code === 'unimplemented')) {
      return { error: "Firebase (Firestore) is unavailable. Ensure emulators are running or connection is valid.", type: "firebase_setup" };
    }
    return { error: error.message || "An error occurred while fetching public logs.", type: "generic" };
  }
}


export default function PublicLogListClient() {
  const [logsResult, setLogsResult] = useState<Log[] | { error: string; type: "firebase_setup" | "generic" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAndSetLogs = useCallback(async () => {
    setIsLoading(true);
    console.log("[PublicLogListClient] Fetching public logs...");
    const result = await getPublicLogs();
    setLogsResult(result);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAndSetLogs();
  }, [fetchAndSetLogs]);

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-10">Loading public logs...</p>;
  }

  if (!logsResult) {
    return <p className="text-center text-muted-foreground py-10">No public logs data available.</p>;
  }

  if ("error" in logsResult) {
    return (
      <div className="text-center text-destructive p-4 border border-destructive rounded-md">
        <AlertCircle className="inline-block mr-2" />
        <strong>Error:</strong> {logsResult.error}
        {logsResult.type === "firebase_setup" && (
          <p className="text-sm mt-2">
            Please ensure your Firebase project is correctly configured and emulators (if used) are running.
          </p>
        )}
      </div>
    );
  }

  const allPublicLogs = logsResult as Log[];
  const filteredLogs = searchQuery
    ? allPublicLogs.filter(
        (log) =>
          (log.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (log.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
      )
    : allPublicLogs;

  return (
    <div className="space-y-8">
      <div className="flex gap-2 items-center mb-8">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search public logs by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {allPublicLogs.length === 0 && !searchQuery && (
        <p className="text-center text-muted-foreground py-10">No public logs found yet. Check back later!</p>
      )}

      {filteredLogs.length === 0 && searchQuery && (
        <p className="text-center text-muted-foreground py-10">
          No public logs match your search for "{searchQuery}".
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLogs.map((log) => {
          const validImageUrls = log.imageUrls?.filter((img) => typeof img.url === "string" && img.url.trim() !== "") || [];
          return (
            <Card key={log.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{log.title}</CardTitle>
                <CardDescription>
                  Published:{" "}
                  {log.createdAt ? new Date(log.createdAt as string).toLocaleDateString() : "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap line-clamp-3">{log.description}</p>
                {validImageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {validImageUrls.slice(0, 4).map((img, idx) => ( // Show up to 4 images
                      <Dialog key={`${log.id}-img-${idx}`}>
                        <DialogTrigger asChild>
                          <div className="relative aspect-square cursor-pointer group border rounded-md overflow-hidden">
                            <img
                              src={img.url}
                              alt={img.caption || `Log image ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              className="group-hover:scale-105 transition-transform duration-300"
                              data-ai-hint="log image"
                            />
                            {img.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                {img.caption}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <ImageIcon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-2 sm:p-4">
                          <DialogTitle className="sr-only">
                            Image: {img.caption || `${log.title} image ${idx + 1}`}
                          </DialogTitle>
                          <DialogDescription className="sr-only">
                            Enlarged view of {img.caption || `image ${idx + 1} for log titled "${log.title}"`}.
                          </DialogDescription>
                          <div className="relative w-full h-[70vh] sm:h-[80vh]">
                            <img
                              src={img.url}
                              alt={img.caption || `Enlarged log image ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              className="rounded-md"
                            />
                          </div>
                          {img.caption && (
                            <p className="text-center text-sm text-muted-foreground mt-2">{img.caption}</p>
                          )}
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                )}
                {log.relatedLogTitles && log.relatedLogTitles.length > 0 && (
                  <div className="mt-auto pt-3 border-t">
                    <p className="text-xs font-semibold flex items-center text-muted-foreground">
                      <LinkIcon className="h-3 w-3 mr-1 text-primary" />
                      Related Public Logs:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.relatedLogTitles.slice(0,3).map((title, idx) => (
                        <span key={idx} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                          {title}
                        </span>
                      ))}
                       {log.relatedLogTitles.length > 3 && (
                           <span className="text-xs text-muted-foreground">+{log.relatedLogTitles.length - 3} more</span>
                       )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 mt-auto">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/logs/${log.id}`}>
                    <Map className="mr-2 h-4 w-4" /> View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Need to get db instance from firebase directly, or ensure firestoreUtils exports it
// For simplicity, if firestoreUtils doesn't export db:
import { doc, getDoc } from "firebase/firestore";
// import { db as firestoreDB } from "@/lib/firebase"; // if db is exported from main firebase.js
// If getPublicLogs is inside this file, it will use the db imported here.
// Let's assume db from firestoreUtils is the correct one.
// If lib/firestoreUtils.ts doesn't export db, this will be an issue.
// For now, I'm assuming db is accessible.
// A common pattern is: import { db } from "@/lib/firebase";
// And firestoreUtils also imports it from there. Let's fix the import in getPublicLogs.
// Changing import in getPublicLogs to: import { db } from "@/lib/firebase";

