// src/components/CommentForm.tsx
"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { commentCategories, type CommentCategory } from '@/types';

const commentFormSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(1000, 'Comment too long.'),
  category: z.enum(commentCategories, {
    errorMap: () => ({ message: "Please select a category." }),
  }),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  logId: string;
  onCommentAdded: () => void;
}

export default function CommentForm({ logId, onCommentAdded }: CommentFormProps) {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: '',
      category: 'other',
    },
  });

  const onSubmit: SubmitHandler<CommentFormValues> = async (data) => {
    if (!currentUser) {
      setError('You must be logged in to comment.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const commentData = {
        logId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        content: data.content,
        category: data.category,
        createdAt: new Date().toISOString(), // ISO string for consistency
      };
      await addDoc(collection(db, 'logs', logId, 'comments'), commentData);
      reset();
      onCommentAdded(); // Notify parent to refresh comment list
    } catch (e) {
      console.error('Error adding comment:', e);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return <p className="text-sm text-muted-foreground">Please log in to add a comment.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
      <div>
        <Label htmlFor="content" className="block text-sm font-medium mb-1">Your Comment</Label>
        <Textarea
          id="content"
          {...register('content')}
          rows={3}
          placeholder="Write your comment..."
          className={errors.content ? 'border-destructive' : ''}
        />
        {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
      </div>
      <div>
        <Label htmlFor="category" className="block text-sm font-medium mb-1">Category</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="category" className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {commentCategories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Comment'}
      </Button>
    </form>
  );
}
