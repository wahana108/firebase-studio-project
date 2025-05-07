
import type { Log } from "@/types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

async function getLogs(): Promise<Log[]> {
  try {
    const logsCollection = collection(db, "logs");
    const logsQuery = query(logsCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(logsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
  } catch (error) {
    console.error("Error fetching logs: ", error);
    // Check if Firebase is configured
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        console.warn("Firebase environment variables might not be configured. Please check your .env.local file.");
    }
    return []; // Return empty array on error
  }
}

export async function LogList() {
  const logs = await getLogs();

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return (
      <Card className="mt-8 bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Configuration Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">
            Firebase is not configured. Please ensure your <code>.env.local</code> file is set up correctly with your Firebase project credentials.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Refer to <code>src/lib/firebase.ts</code> for instructions on setting up the environment variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg">No mind map logs yet.</p>
        <p>Create your first log using the form above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {logs.map((log) => (
        <Card key={log.id} className="overflow-hidden shadow-md transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{log.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-1 relative w-full h-48 md:h-full rounded-md overflow-hidden group">
              <Image
                src={log.imageUrl}
                alt={log.title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="abstract technology"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
            <div className="md:col-span-2">
              <CardDescription className="text-base text-foreground/80 whitespace-pre-wrap">{log.description}</CardDescription>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
