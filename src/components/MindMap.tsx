
// src/components/MindMap.tsx
"use client";

import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Pastikan path ini benar
import type { Log } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Link as LinkIcon, ArrowLeft, Home, Globe } from "lucide-react";

interface CustomNodeData {
  label: string;
  image?: string;
}

const nodeTypesDefinition = {
  custom: ({ data }: { data: CustomNodeData }) => (
    <div
      style={{
        textAlign: "center",
        padding: "10px",
        border: "1px solid #777",
        borderRadius: "5px",
        background: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {data.image && (
        <div
          style={{
            width: "80px",
            height: "80px",
            position: "relative",
            marginBottom: "5px",
            overflow: "hidden",
            borderRadius: "4px",
            border: "1px solid #eee",
          }}
        >
          <img
            src={data.image}
            alt={data.label || "Node image"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onError={(e) => {
              // Handle image error, e.g., by setting a placeholder
              // e.currentTarget.src = "/placeholder-image.png"; // Pastikan placeholder ada
            }}
            data-ai-hint="node image"
          />
        </div>
      )}
      <div style={{ fontSize: "12px", fontWeight: "bold", wordBreak: "break-word" }}>
        {data.label}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: "#555" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
    </div>
  ),
};

export default function MindMap({ logId, logData: initialLogData }: { logId: string; logData: Log | null }) {
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [currentLogData, setCurrentLogData] = useState<Log | null>(initialLogData);

  // Ambil data terbaru dari Firestore
  useEffect(() => {
    async function fetchLatestLogData() {
      if (!logId) {
        console.warn("[MindMap] logId is undefined, skipping fetch.");
        setCurrentLogData(null);
        return;
      }
      try {
        console.log("[MindMap] Fetching latest log data for ID:", logId);
        const logRef = doc(db, "logs", logId);
        const logSnap = await getDoc(logRef);
        if (logSnap.exists()) {
          const data = logSnap.data();
          const relatedLogs = Array.isArray(data.relatedLogs) ? data.relatedLogs : [];
          const relatedLogTitles = Array.isArray(data.relatedLogTitles) ? data.relatedLogTitles : [];
          setCurrentLogData({
            id: logSnap.id,
            title: data.title || "Untitled",
            description: data.description || "",
            imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.filter((img: any) => img.url) : [],
            relatedLogs,
            relatedLogTitles,
            isPublic: data.isPublic || false,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        } else {
          console.warn("[MindMap] Log not found for ID:", logId);
          setCurrentLogData(null);
        }
      } catch (error) {
        console.error("[MindMap] Error fetching latest log data:", error);
        setCurrentLogData(null);
      }
    }
    if (logId) { 
        fetchLatestLogData();
    }
  }, [logId]);

  // Update nodes dan edges berdasarkan currentLogData
  useEffect(() => {
    if (!currentLogData) {
      setNodes([]);
      setEdges([]);
      return;
    }

    console.log("[MindMap] Updating nodes and edges with currentLogData:", currentLogData);

    const imageUrls = (currentLogData.imageUrls || []).filter((img) => img.url && typeof img.url === "string");
    const mainImageObj = imageUrls.find((img) => img.isMain) || (imageUrls.length > 0 ? imageUrls[0] : null);

    const mainNodeX = 500; // Posisi X tengah untuk node utama
    const mainNodeY = 400; // Posisi Y tengah untuk node utama

    const mainNode: Node<CustomNodeData> = {
      id: "main-node",
      type: "custom",
      data: { label: currentLogData.title, image: mainImageObj?.url },
      position: { x: mainNodeX, y: mainNodeY }, // Posisi node utama di tengah
      style: {
        width: 180,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid hsl(var(--primary))",
        borderRadius: "8px",
        padding: "15px",
        background: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))"
      },
    };

    const newNodes: Node<CustomNodeData>[] = [mainNode];
    const newEdges: Edge[] = [];

    // Pengaturan untuk node gambar pendukung
    const supportingImages = imageUrls.filter((img) => img.url !== mainImageObj?.url);
    const subNodeWidth = 130;
    const subNodeHeight = 100; // Perkiraan tinggi node pendukung
    // Jarak dari pusat node utama ke pusat node pendukung
    const imgSpacingX = subNodeWidth + 90; 
    const imgSpacingY = subNodeHeight + 90;
    // Offset horizontal untuk tiga item dalam satu baris (kiri/kanan dari item tengah)
    const imgHorizontalOffsetForThree = subNodeWidth + 30; 

    supportingImages.forEach((img, idx) => {
      const subNodeId = `sub-img-node-${idx}`;
      let position: { x: number; y: number };

      // Tata letak: 1 kiri, 1 kanan, 3 atas, 3 bawah (untuk hingga 8 item)
      // Urutan pengisian: kiri, kanan, atas-tengah, bawah-tengah, atas-kiri, atas-kanan, bawah-kiri, bawah-kanan
      switch (idx) {
        case 0: // Kiri
          position = { x: mainNodeX - imgSpacingX, y: mainNodeY };
          break;
        case 1: // Kanan
          position = { x: mainNodeX + imgSpacingX, y: mainNodeY };
          break;
        case 2: // Atas-Tengah
          position = { x: mainNodeX, y: mainNodeY - imgSpacingY };
          break;
        case 3: // Bawah-Tengah
          position = { x: mainNodeX, y: mainNodeY + imgSpacingY };
          break;
        case 4: // Atas-Kiri
          position = { x: mainNodeX - imgHorizontalOffsetForThree, y: mainNodeY - imgSpacingY };
          break;
        case 5: // Atas-Kanan
          position = { x: mainNodeX + imgHorizontalOffsetForThree, y: mainNodeY - imgSpacingY };
          break;
        case 6: // Bawah-Kiri
          position = { x: mainNodeX - imgHorizontalOffsetForThree, y: mainNodeY + imgSpacingY };
          break;
        case 7: // Bawah-Kanan
          position = { x: mainNodeX + imgHorizontalOffsetForThree, y: mainNodeY + imgSpacingY };
          break;
        default: // Fallback untuk lebih dari 8 gambar pendukung
          const fallbackIndex = idx - 8;
          position = { 
            x: mainNodeX - imgHorizontalOffsetForThree + (fallbackIndex * (subNodeWidth + 15)),
            y: mainNodeY + imgSpacingY + subNodeHeight + 50 // Baris tambahan di bawah
          }; 
          break;
      }

      newNodes.push({
        id: subNodeId,
        type: "custom",
        data: { label: img.caption || `Item Gambar ${idx + 1}`, image: img.url },
        position, // Gunakan posisi yang telah dihitung
        style: {
          width: subNodeWidth,
          minHeight: subNodeHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid hsl(var(--border))",
          borderRadius: "4px",
          padding: "10px",
          background: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))"
        },
      });
      newEdges.push({
        id: `edge-main-${subNodeId}`,
        source: mainNode.id,
        target: subNodeId,
        animated: true,
        style: { stroke: "hsl(var(--foreground))" },
      });
    });

    // Pengaturan untuk node log terkait
    const relatedLogsArray = currentLogData.relatedLogs || [];
    const relatedLogTitlesArray = currentLogData.relatedLogTitles || [];

    if (relatedLogsArray.length > 0) {
        const relatedNodeW = 130;
        const relatedNodeH = 60; // Perkiraan tinggi node log terkait
        const gapBetweenRelated = 30; // Jarak horizontal antar node log terkait
        
        // Posisi Y: di bawah node gambar pendukung terbawah + jarak
        // Node pendukung terbawah berpusat di mainNodeY + imgSpacingY
        // Tepi bawah node pendukung terbawah: (mainNodeY + imgSpacingY) + (subNodeHeight / 2)
        const yPositionForRelatedLogsTop = (mainNodeY + imgSpacingY) + (subNodeHeight / 2) + 40; // 40 adalah jarak vertikal

        const numRelatedLogs = relatedLogsArray.length;
        const totalWidthOfRelatedBlock = numRelatedLogs * relatedNodeW + Math.max(0, numRelatedLogs - 1) * gapBetweenRelated;
        const startXForRelatedBlock = mainNodeX - totalWidthOfRelatedBlock / 2;

        relatedLogsArray.forEach((relatedId, idx) => {
            const relatedNodeId = `related-node-${idx}`;
            const nodeX = startXForRelatedBlock + idx * (relatedNodeW + gapBetweenRelated);
            
            newNodes.push({
                id: relatedNodeId,
                type: "custom",
                data: { label: relatedLogTitlesArray[idx] || `Related Log ${idx + 1}` },
                position: { x: nodeX, y: yPositionForRelatedLogsTop },
                style: { // Gaya dari kode asli untuk log terkait
                    width: relatedNodeW,
                    minHeight: relatedNodeH,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "4px",
                    padding: "10px",
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))"
                },
            });
            newEdges.push({
                id: `edge-main-${relatedNodeId}`,
                source: mainNode.id,
                target: relatedNodeId,
                animated: true,
                style: { stroke: "hsl(var(--foreground))" },
            });
        });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [currentLogData]);

  if (!currentLogData && !initialLogData) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Memuat data log...
      </div>
    );
  }

  if (!currentLogData && initialLogData === null) { 
     return (
      <div className="text-center p-8 text-muted-foreground">
        Data log tidak dapat dimuat atau tidak ditemukan.
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-0">
      <div className="mb-4 flex flex-wrap gap-2">
        {currentLogData?.isPublic ? (
          <>
            <Button variant="outline" asChild>
              <Link href="/public">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Log Publik
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" asChild>
              <Link href={`/logs/${logId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Detail Log
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Utama
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/public">
                <Globe className="mr-2 h-4 w-4" />
                Lihat Halaman Publik
              </Link>
            </Button>
          </>
        )}
      </div>

      <div
        style={{
          width: "100%",
          height: "600px",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          marginBottom: "24px",
          background: "hsl(var(--background))",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypesDefinition}
          fitView
          attributionPosition="bottom-left"
        >
          <Background gap={16} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>
      {currentLogData && currentLogData.relatedLogs && currentLogData.relatedLogs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-lg font-semibold flex items-center mb-3">
            <LinkIcon className="h-5 w-5 mr-2 text-primary" />
            Log Terkait:
          </p>
          <div className="flex flex-wrap gap-3">
            {currentLogData.relatedLogs.map((id, idx) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                asChild
                className="text-primary hover:bg-primary/10"
              >
                <Link href={`/logs/${id}`}>
                  {currentLogData.relatedLogTitles?.[idx] || `Log ${id.substring(0, 6)}...`}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
    
