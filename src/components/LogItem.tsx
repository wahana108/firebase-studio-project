// src/components/LogItem.tsx
import type { LogEntry } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, MessageCircle, Heart, Edit } from 'lucide-react'; // Placeholder icons for now
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface LogItemProps {
  log: LogEntry;
  showControls?: boolean; // To show edit/delete if owner
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      videoId = urlObj.searchParams.get('v');
    } else if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      videoId = urlObj.pathname.split('/embed/')[1].split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch (e) {
    return null; // Invalid URL
  }
}


export default function LogItem({ log, showControls = false }: LogItemProps) {
  const { currentUser } = useAuth();
  const isOwner = currentUser && currentUser.uid === log.ownerId;
  const youtubeEmbedUrl = log.youtubeLink ? getYouTubeEmbedUrl(log.youtubeLink) : null;

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl md:text-2xl font-semibold">{log.title}</CardTitle>
          {log.isPublic ? (
            <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
              <Globe size={14} /> Public
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
              <Lock size={14} /> Private
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          By: {log.ownerId.substring(0, 8)}... | Updated: {new Date(log.updatedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {log.imageLink && (
          <div className="mb-4 aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <img 
              src={log.imageLink} 
              alt={log.title} 
              className="w-full h-full object-contain" 
              onError={(e) => e.currentTarget.style.display='none'} // Hide if image fails to load
            />
          </div>
        )}
        {youtubeEmbedUrl && (
          <div className="mb-4 aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={youtubeEmbedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="rounded-md"
            ></iframe>
          </div>
        )}
        <p className="text-muted-foreground whitespace-pre-wrap line-clamp-5 hover:line-clamp-none transition-all duration-300 ease-in-out">
          {log.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-4 text-muted-foreground">
          {/* Placeholder for future like/comment counts */}
          <span className="flex items-center gap-1 text-sm hover:text-primary cursor-pointer">
            <Heart size={16} /> 0
          </span>
          <span className="flex items-center gap-1 text-sm hover:text-primary cursor-pointer">
            <MessageCircle size={16} /> 0
          </span>
        </div>
        {showControls && isOwner && (
          <Link href={`/edit-log/${log.id}`}> {/* Placeholder for edit page */}
            <Button variant="outline" size="sm">
              <Edit size={16} className="mr-2" /> Edit
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
