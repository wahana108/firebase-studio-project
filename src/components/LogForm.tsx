// src/components/LogForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import type { LogEntry, LogFormProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

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
  developerImageFile: z.custom<FileList | null>(val => val === null || val instanceof FileList).optional(), // For developer upload
});

type LogFormValues = z.infer<typeof logFormSchema>;

const DEVELOPER_UID = 'REPLACE_WITH_YOUR_ACTUAL_GOOGLE_UID'; // Replace this!

export default function LogForm({ initialData, onSave }: LogFormProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDeveloper = currentUser?.uid === DEVELOPER_UID;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue('title', initialData.title || '');
      setValue('description', initialData.description || '');
      setValue('imageLink', initialData.imageLink || '');
      setValue('youtubeLink', initialData.youtubeLink || '');
      setValue('isPublic', initialData.isPublic || false);
    }
  }, [initialData, setValue]);

  const onSubmit: SubmitHandler<LogFormValues> = async (data) => {
    if (!currentUser) {
      setError('You must be logged in to create or update a log.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    let finalImageLink = data.imageLink || null;

    // Handle developer image upload
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

    const logDataToSave: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      title: data.title,
      description: data.description,
      imageLink: finalImageLink,
      youtubeLink: data.youtubeLink || null,
      isPublic: data.isPublic,
      ownerId: currentUser.uid,
    };

    try {
      let docId = initialData?.id;
      if (initialData?.id) {
        // Update existing log
        const logRef = doc(db, 'logs', initialData.id);
        await updateDoc(logRef, {
          ...logDataToSave,
          updatedAt: new Date().toISOString(),
        });
        console.log('[LogForm] Log updated successfully:', initialData.id);
      } else {
        // Create new log
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
        router.push('/'); // Redirect to dashboard after creation if no specific onSave
      }
    } catch (e) {
      console.error('Error saving log:', e);
      setError('Failed to save log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6 bg-card text-card-foreground rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-6">
        {initialData?.id ? 'Edit Log' : 'Create New Log'}
      </h2>

      {error && <p className="text-sm text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

      <div>
        <Label htmlFor="title" className="block text-sm font-medium mb-1">Title</Label>
        <Input
          id="title"
          {...register('title')}
          className="w-full"
          placeholder="Enter log title"
        />
        {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description" className="block text-sm font-medium mb-1">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={5}
          className="w-full"
          placeholder="Enter log description"
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="imageLink" className="block text-sm font-medium mb-1">Image Link (Optional)</Label>
        <Input
          id="imageLink"
          type="url"
          {...register('imageLink')}
          className="w-full"
          placeholder="https://example.com/image.jpg"
        />
        {errors.imageLink && <p className="text-sm text-red-500 mt-1">{errors.imageLink.message}</p>}
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
          />
          <p className="text-xs text-muted-foreground mt-1">If an image is uploaded here, it will override the Image Link above.</p>
          {errors.developerImageFile && <p className="text-sm text-red-500 mt-1">{errors.developerImageFile.message}</p>}
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
        />
        {errors.youtubeLink && <p className="text-sm text-red-500 mt-1">{errors.youtubeLink.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          {...register('isPublic')}
          defaultChecked={initialData?.isPublic || false}
        />
        <Label htmlFor="isPublic" className="text-sm font-medium">
          Make this log public
        </Label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (initialData?.id ? 'Updating...' : 'Creating...') : (initialData?.id ? 'Update Log' : 'Create Log')}
      </Button>
    </form>
  );
}
