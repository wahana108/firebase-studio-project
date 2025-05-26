import { Suspense } from "react";
import ClientHomePage from "@/components/ClientHomePage";

export default function Home() {
  return (
    <div>
      <h1>Mindmapper Lite</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ClientHomePage />
      </Suspense>
    </div>
  );
}