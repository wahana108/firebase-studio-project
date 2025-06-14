
// src/components/LogForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import type { LogEntry, LogFormProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

const logFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().min(1, 'Description is required').max(5000),
  imageLink: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  youtubeLink: z.string()
    .url('Must be a valid YouTube URL')
    .refine(val => !val || val.includes('youtube.com') || val.includes('youtu.be'), {
      message: 'Must be a valid YouTube URL',
    })
    .or(z.literal(''))
    .optional(),
  isPublic: z.boolean().default(false),
  developerImageFile: z.custom<FileList | null>(val => val === null || val instanceof FileList).optional(),
  relatedLogIds: z.array(z.string()).optional().default([]),
});

type LogFormValues = z.infer<typeof logFormSchema>;

const DEVELOPER_UID = 'REPLACE_WITH_YOUR_ACTUAL_GOOGLE_UID';

interface SelectableLog {
  id: string;
  title: string;
}

export default function LogForm({ initialData, onSave }: LogFormProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableLogs, setAvailableLogs] = useState<SelectableLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  const isDeveloper = currentUser?.uid === DEVELOPER_UID;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      imageLink: initialData?.imageLink || '',
      youtubeLink: initialData?.youtubeLink || '',
      isPublic: initialData?.isPublic || false,
      developerImageFile: null,
      relatedLogIds: initialData?.relatedLogIds || [],
    },
  });

  const watchedRelatedLogIds = watch('relatedLogIds', initialData?.relatedLogIds || []);

  useEffect(() => {
    if (initialData) {
      setValue('title', initialData.title || '');
      setValue('description', initialData.description || '');
      setValue('imageLink', initialData.imageLink || '');
      setValue('youtubeLink', initialData.youtubeLink || '');
      setValue('isPublic', initialData.isPublic || false);
      setValue('relatedLogIds', initialData.relatedLogIds || []);
    }
  }, [initialData, setValue]);

  useEffect(() => {
    if (currentUser) {
      const fetchUserLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const logsCollection = collection(db, 'logs');
          const q = query(
            logsCollection,
            where('ownerId', '==', currentUser.uid),
            orderBy('title', 'asc')
          );
          const querySnapshot = await getDocs(q);
          const logsData = querySnapshot.docs
            .map(docSnap => ({
              id: docSnap.id,
              title: docSnap.data().title,
            }))
            .filter(log => log.id !== initialData?.id); // Exclude current log if editing
          setAvailableLogs(logsData as SelectableLog[]);
        } catch (fetchError) {
          console.error("Error fetching user logs for linking:", fetchError);
          setError("Could not load logs for linking.");
        } finally {
          setIsLoadingLogs(false);
        }
      };
      fetchUserLogs();
    }
  }, [currentUser, initialData?.id]);


  const onSubmit: SubmitHandler<LogFormValues> = async (data) => {
    if (!currentUser) {
      setError('You must be logged in to create or update a log.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    let finalImageLink = data.imageLink || null;

    if (isDeveloper && data.developerImageFile && data.developerImageFile.length > 0) {
      const file = data.developerImageFile[0];
      const storagePath = `logs/${initialData?.id || Date.now()}/images/${file.name}`;
      const imageRef = ref(storage, storagePath);
      try {
        await uploadBytes(imageRef, file);
        finalImageLink = await getDownloadURL(imageRef);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        setError('Failed to upload image. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    const logDataToSave: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt' | 'commentCount' | 'relatedLogTitles'> = {
      title: data.title,
      description: data.description,
      imageLink: finalImageLink,
      youtubeLink: data.youtubeLink || null,
      isPublic: data.isPublic,
      ownerId: currentUser.uid,
      relatedLogIds: data.relatedLogIds || [],
    };

    try {
      let docId = initialData?.id;
      if (initialData?.id) {
        const logRef = doc(db, 'logs', initialData.id);
        await updateDoc(logRef, {
          ...logDataToSave,
          updatedAt: new Date().toISOString(),
        });
        console.log('[LogForm] Log updated successfully:', initialData.id);
      } else {
        const docRef = await addDoc(collection(db, 'logs'), {
          ...logDataToSave,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        docId = docRef.id;
        console.log('[LogForm] Log created successfully:', docRef.id);
      }
      reset();
      if (onSave && docId) {
        onSave(docId);
      } else if (docId) {
        router.push('/');
      }
    } catch (e) {
      console.error('Error saving log:', e);
      setError('Failed to save log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRelatedLogChange = (logId: string, checked: boolean) => {
    const currentRelatedLogIds = watchedRelatedLogIds || [];
    const newRelatedLogIds = checked
      ? [...currentRelatedLogIds, logId]
      : currentRelatedLogIds.filter((id) => id !== logId);
    setValue('relatedLogIds', newRelatedLogIds, { shouldValidate: true });
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6 bg-card text-card-foreground rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-6">
        {initialData?.id ? 'Edit Log' : 'Create New Log'}
      </h2>

      {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

      <div>
        <Label htmlFor="title" className="block text-sm font-medium mb-1">Title</Label>
        <Input
          id="title"
          {...register('title')}
          className="w-full"
          placeholder="Enter log title"
          disabled={isSubmitting}
        />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description" className="block text-sm font-medium mb-1">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={5}
          className="w-full"
          placeholder="Enter log description"
          disabled={isSubmitting}
        />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="imageLink" className="block text-sm font-medium mb-1">Image Link (Optional)</Label>
        <Input
          id="imageLink"
          type="url"
          {...register('imageLink')}
          className="w-full"
          placeholder="https://example.com/image.jpg"
          disabled={isSubmitting}
        />
        {errors.imageLink && <p className="text-sm text-destructive mt-1">{errors.imageLink.message}</p>}
      </div>

      {isDeveloper && (
        <div>
          <Label htmlFor="developerImageFile" className="block text-sm font-medium mb-1">Upload Image (Developer Only)</Label>
          <Input
            id="developerImageFile"
            type="file"
            {...register('developerImageFile')}
            accept="image/png, image/jpeg, image/gif, image/webp"
            className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">If an image is uploaded here, it will override the Image Link above.</p>
          {errors.developerImageFile && <p className="text-sm text-destructive mt-1">{errors.developerImageFile.message}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="youtubeLink" className="block text-sm font-medium mb-1">YouTube Link (Optional)</Label>
        <Input
          id="youtubeLink"
          type="url"
          {...register('youtubeLink')}
          className="w-full"
          placeholder="https://www.youtube.com/watch?v=your_video_id"
          disabled={isSubmitting}
        />
        {errors.youtubeLink && <p className="text-sm text-destructive mt-1">{errors.youtubeLink.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="block text-sm font-medium">Related Logs (Optional)</Label>
        {isLoadingLogs ? (
          <p className="text-sm text-muted-foreground">Loading your logs...</p>
        ) : availableLogs.length > 0 ? (
          <ScrollArea className="h-40 w-full rounded-md border p-2">
            <div className="space-y-1">
              {availableLogs.map(log => (
                <div key={log.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded-sm">
                  <Checkbox
                    id={`related-${log.id}`}
                    checked={(watchedRelatedLogIds || []).includes(log.id)}
                    onCheckedChange={(checked) => handleRelatedLogChange(log.id, !!checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={`related-${log.id}`} className="text-sm font-normal cursor-pointer flex-grow">
                    {log.title}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">You have no other logs to link to, or they are still loading.</p>
        )}
        {errors.relatedLogIds && <p className="text-sm text-destructive mt-1">{errors.relatedLogIds.message}</p>}
      </div>


      <div className="flex items-center space-x-2">
        <Controller
          name="isPublic"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="isPublic"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        <Label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
          Make this log public
        </Label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (initialData?.id ? 'Updating...' : 'Creating...') : (initialData?.id ? 'Update Log' : 'Create Log')}
      </Button>
    </form>
  );
}
