// c:\Users\ramaw\firebase-studio-project\src\components\LogList.tsx
"use client";

import type { Log } from "@/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Edit, Map, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getLogs } from "@/lib/firestoreUtils";

type GetLogsResult = Log[] | { error: string; type: "firebase_setup" | "generic" };

export function LogList({ refreshKey }: { refreshKey: number }) {
  const [logsResult, setLogsResult] = useState<GetLogsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      console.log("[LogList] Fetching logs, refreshKey:", refreshKey);
      const result = await getLogs();
      setLogsResult(result);
      setIsLoading(false);
      console.log("[LogList] Logs fetched:", Array.isArray(result) ? `Count: ${result.length}` : result);
    }
    fetchLogs();
  }, [refreshKey]);

  if (isLoading) {
    return <p className="text-center text-muted-foreground">Loading logs...</p>;
  }

  if (!logsResult) {
    return <p className="text-center text-muted-foreground">No logs data available.</p>;
  }

  if ("error" in logsResult) {
    if (logsResult.type === "firebase_setup") {
      return (
        <div className="text-center text-destructive p-4 border border-destructive rounded-md">
          <AlertCircle className="inline-block mr-2" />
          <strong>Firebase Setup Error:</strong> {logsResult.error}
          <p className="text-sm mt-2">
            Please ensure your Firebase project is correctly configured, environment variables are set,
            and Firestore/Storage rules allow access. If using emulators, make sure they are running.
          </p>
        </div>
      );
    }
    return (
      <div className="text-center text-destructive p-4">
        <AlertCircle className="inline-block mr-2" />
        Error fetching logs: {logsResult.error}
      </div>
    );
  }

  const allLogs = logsResult as Log[];
  const filteredLogs = searchQuery
    ? allLogs.filter(
        (log) =>
          (log.title?.toLowerCase() || "").includes(searchQuery) ||
          (log.description?.toLowerCase() || "").includes(searchQuery)
      )
    : allLogs;

  if (allLogs.length === 0 && !searchQuery) {
    return <p className="text-center text-muted-foreground">No logs found. Create one to get started!</p>;
  }

  return (
    <div className="space-y-6 w-full max-w-4xl">
      {filteredLogs.length === 0 && searchQuery && (
        <p className="text-center text-muted-foreground">
          Tidak ada log yang cocok dengan pencarian "{searchParams.get("q")}". 
        </p>
      )}

      {filteredLogs.map((log) => {
        const validImageUrls = log.imageUrls?.filter((img) => typeof img.url === "string" && img.url.trim() !== "") || [];
        return (
          <Card key={log.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{log.title}</CardTitle>
              <CardDescription>
                Last updated:{" "}
                {log.updatedAt ? new Date(log.updatedAt as string).toLocaleString() : "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{log.description}</p>
              {validImageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {validImageUrls.map((img, idx) => (
                    <Dialog key={`${log.id}-img-${idx}`}>
                      <DialogTrigger asChild>
                        <div className="relative aspect-square cursor-pointer group border rounded-md overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.caption || `Log image ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            className="group-hover:scale-105 transition-transform duration-300"
                          />
                          {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                              {img.caption}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ImageIcon className="h-8 w-8 text-white" />
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
              {log.relatedLogs && log.relatedLogs.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-sm font-semibold flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2 text-primary" />
                    Log Terkait:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {log.relatedLogs.map((id, idx) => (
                      <Button
                        key={id}
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-primary hover:bg-primary/10"
                      >
                        <Link href={`/logs/${id}`}>
                          {log.relatedLogTitles?.[idx] || `Log ${id.substring(0, 6)}...`}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/mindmap/${log.id}`}>
                  <Map className="mr-2 h-4 w-4" /> View Mind Map
                </Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/logs/${log.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}