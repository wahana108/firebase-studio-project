// src/components/LogList.tsx
import type { LogEntry } from '@/types';
import LogItem from './LogItem';

interface LogListProps {
  logs: LogEntry[];
  showControls?: boolean; // Pass down to LogItem if needed
  emptyStateMessage?: string;
}

export default function LogList({ logs, showControls = false, emptyStateMessage = "No logs found." }: LogListProps) {
  if (!logs || logs.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{emptyStateMessage}</p>;
  }

  return (
    <div className="space-y-6">
      {logs.map((log) => (
        <LogItem key={log.id} log={log} showControls={showControls} />
      ))}
    </div>
  );
}
