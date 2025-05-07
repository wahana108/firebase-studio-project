
"use client";

import type { LogFormData } from "@/types";
import { useActionState } from "react"; // Changed from react-dom
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createLogAction } from "@/lib/actions";
import { UploadCloud, Send } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().min(1, "Description is required").max(500, "Description must be 500 characters or less"),
  image: z.custom<FileList>()
    .refine((files) => files && files.length === 1, "Image is required.")
    .refine((files) => files && files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => files && ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type FormValues = z.infer<typeof formSchema>;

const initialState = {
  message: "",
  errors: {},
  success: false,
};

export function LogForm() {
  const [state, formAction] = useActionState(createLogAction, initialState); // Changed from useFormState
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      image: undefined,
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      form.setValue("image", event.target.files as FileList, { shouldValidate: true });
    } else {
      setImagePreview(null);
      form.setValue("image", undefined as any, { shouldValidate: true }); // Explicitly set to undefined for react-hook-form
    }
  };
  
  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success!",
        description: state.message,
      });
      form.reset();
      setImagePreview(null);
      if (formRef.current) {
        formRef.current.reset(); 
      }
    } else if (state.message && state.message !== "Validation failed." && state.message !== "Invalid image file." && state.message !== "Image is required.") { // Avoid showing generic validation messages as toasts
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast, form]);


  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create New Log</CardTitle>
        <CardDescription>Fill in the details for your mind map entry.</CardDescription>
      </CardHeader>
      <form ref={formRef} action={formAction} className="space-y-6">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter topic title"
              {...form.register("title")}
              className={form.formState.errors.title || (state.errors as any)?.title ? "border-destructive" : ""}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
            {(state.errors as any)?.title && (
              <p className="text-sm text-destructive">{(state.errors as any).title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your topic"
              rows={4}
              {...form.register("description")}
              className={form.formState.errors.description || (state.errors as any)?.description ? "border-destructive" : ""}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
            {(state.errors as any)?.description && (
              <p className="text-sm text-destructive">{(state.errors as any).description[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Upload Image</Label>
            <div className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-md ${form.formState.errors.image || (state.errors as any)?.image ? "border-destructive" : "border-border"} hover:border-primary transition-colors`}>
              <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                {imagePreview ? (
                  <div className="relative w-full h-40">
                    <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="contain" className="rounded-md" />
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
                <Input
                  id="image-upload"
                  name="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
             {form.formState.errors.image && (
              <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>
            )}
            {(state.errors as any)?.image && (
               <p className="text-sm text-destructive">{(state.errors as any).image[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting ? "Adding Log..." : "Add Log"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
