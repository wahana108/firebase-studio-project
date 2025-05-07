
import type { Log } from "@/types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type GetLogsResult = Log[] | { error: string; type: 'firebase_setup' | 'generic' };

async function getLogs(): Promise<GetLogsResult> {
  try {
    const logsCollection = collection(db, "logs");
    const logsQuery = query(logsCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(logsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
  } catch (error: any) {
    console.error("Error fetching logs: ", error);

    // Check for specific Firebase error codes that might indicate setup issues
    if (error.code === 'invalid-argument' || (typeof error.message === 'string' && error.message.includes('Invalid resource field value'))) {
      return {
        error: "Failed to fetch logs. This might be due to an incorrect Firebase Project ID or Firestore not being enabled/initialized for your project.",
        type: 'firebase_setup'
      };
    }
    // Generic error
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        console.warn("Firebase environment variables might not be configured. Please check your .env.local file.");
         return {
            error: "Firebase Project ID is not configured. Please check your .env.local file.",
            type: 'firebase_setup'
         };
    }
    return { error: "An unexpected error occurred while fetching logs.", type: 'generic' };
  }
}

export async function LogList() {
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
            Firebase is not configured. Please ensure your <code>.env.local</code> file is set up correctly with your Firebase project credentials, especially <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Refer to <code>src/lib/firebase.ts</code> for instructions on setting up the environment variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  const logsData = await getLogs();

  if (!Array.isArray(logsData)) { // Error object was returned
    return (
      <Card className="mt-8 bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            {logsData.type === 'firebase_setup' ? 'Firebase Setup Issue' : 'Error Fetching Logs'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">{logsData.error}</p>
          {logsData.type === 'firebase_setup' && (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                Please take the following steps:
              </p>
              <ul className="list-disc list-inside mt-1 text-sm text-muted-foreground">
                <li>Ensure you have created a <code>.env.local</code> file in the root of your project.</li>
                <li>Verify that all Firebase configuration values (<code>NEXT_PUBLIC_FIREBASE_API_KEY</code>, <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>, etc.) in <code>.env.local</code> are correct and match your Firebase project.</li>
                <li>Go to the Firebase Console, select your project (ID: <strong>{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</strong>), and ensure that Cloud Firestore has been created/enabled. You might need to click "Create database".</li>
                 <li>Check your Firestore security rules to ensure they allow read access to the 'logs' collection. For testing, you can set them to allow all reads: <code>allow read: if true;</code> (but be cautious with this in production).</li>
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const logs = logsData; // logsData is Log[]
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
