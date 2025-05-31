
// src/components/LogForm.tsx
"use client";

import type { LogFormData } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, X } from "lucide-react";
import { collection, getDocs, query, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SUPPORTING_ITEMS = 8;

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().min(1, "Description is required").max(500, "Description must be 500 characters or less"),
  mainImage: z
    .custom<File | null>((val) => val === null || val instanceof File, "Expected a File or null")
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Main image size must be 5MB or less.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Main image must be .jpg, .jpeg, .png, or .webp."
    )
    .optional(),
  mainCaption: z.string().max(200, "Main caption must be 200 characters or less").optional(),
  supportingItems: z.array(
    z.object({
      image: z
        .custom<File | null>((val) => val === null || val instanceof File, "Expected a File or null")
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Supporting image size must be 5MB or less.`)
        .refine(
          (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
          "Supporting images must be .jpg, .jpeg, .png, or .webp."
        )
        .optional(),
      caption: z.string().max(200, "Caption must be 200 characters or less").optional(),
    })
  ).length(MAX_SUPPORTING_ITEMS, `Exactly ${MAX_SUPPORTING_ITEMS} supporting items required.`),
  relatedLogIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;
interface ExistingImage {
  url: string | null;
  isMain?: boolean;
  caption?: string;
}

interface LogFormComponentProps {
  initialData?: LogFormData & { imageUrls?: ExistingImage[]; relatedLogs?: string[] };
  onLogCreated?: () => void;
  variant?: 'card' | 'embedded'; // New prop
  action?: (prevState: any, formData: FormData) => Promise<any>; // if using server actions
}

function LogFormComponent({
  initialData,
  onLogCreated,
  variant = 'card', // Default to 'card'
}: LogFormComponentProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [supportingItemPreviews, setSupportingItemPreviews] = useState<(string | null)[]>(Array(MAX_SUPPORTING_ITEMS).fill(null));
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [allLogs, setAllLogs] = useState<{ id: string; title: string }[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      mainImage: null,
      mainCaption: initialData?.imageUrls?.find((img) => img.isMain)?.caption || "",
      supportingItems: Array(MAX_SUPPORTING_ITEMS)
        .fill(null)
        .map((_, i) => {
          const supImg = initialData?.imageUrls?.filter((img) => !img.isMain)[i];
          return {
            image: null,
            caption: supImg?.caption || "",
          };
        }),
      relatedLogIds: initialData?.relatedLogs || [],
    },
  });

  const watchedRelatedLogIds = form.watch("relatedLogIds", initialData?.relatedLogs || []);

  useEffect(() => {
    async function fetchLogs() {
      try {
        console.log("[LogForm] Fetching logs from Firestore");
        const logsCollection = collection(db, "logs");
        const logsQuery = query(logsCollection); // Removed orderBy for now, will sort client-side
        const querySnapshot = await getDocs(logsQuery);
        const logs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title as string,
        }));
        // Sort logs alphabetically by title
        const sortedLogs = logs.sort((a, b) => a.title.localeCompare(b.title));
        setAllLogs(sortedLogs.filter((log) => log.id !== initialData?.id));
      } catch (error) {
        console.error("[LogForm] Error fetching logs:", error);
        toast({
          title: "Error",
          description: "Could not fetch logs for relations.",
          variant: "destructive",
        });
      }
    }
    fetchLogs();
  }, [initialData?.id, toast]);

  useEffect(() => {
    if (initialData?.imageUrls) {
      console.log("[LogForm] Updating previews with initialData.imageUrls:", initialData.imageUrls);
      const mainImgData = initialData.imageUrls.find((img) => img.isMain);
      const supImgsData = initialData.imageUrls.filter((img) => !img.isMain);

      if (mainImagePreview && mainImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(mainImagePreview);
      }
      setMainImagePreview(mainImgData?.url || null);

      const newSupportingItemPreviews = Array(MAX_SUPPORTING_ITEMS).fill(null);
      supImgsData.slice(0, MAX_SUPPORTING_ITEMS).forEach((img, index) => {
        if (img.url) {
          newSupportingItemPreviews[index] = img.url;
        }
      });
      supportingItemPreviews.forEach((preview) => {
        if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
      setSupportingItemPreviews(newSupportingItemPreviews);
      setExistingImages(initialData.imageUrls);
    } else {
      if (mainImagePreview && mainImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(mainImagePreview);
      }
      setMainImagePreview(null);
      supportingItemPreviews.forEach((preview) => {
        if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
      setSupportingItemPreviews(Array(MAX_SUPPORTING_ITEMS).fill(null));
      setExistingImages([]);
    }
    form.reset({
      title: initialData?.title || "",
      description: initialData?.description || "",
      mainImage: null,
      mainCaption: initialData?.imageUrls?.find((img) => img.isMain)?.caption || "",
      supportingItems: Array(MAX_SUPPORTING_ITEMS)
        .fill(null)
        .map((_, i) => {
          const supImg = initialData?.imageUrls?.filter((img) => !img.isMain)[i];
          return {
            image: null,
            caption: supImg?.caption || "",
          };
        }),
      relatedLogIds: initialData?.relatedLogs || [],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Error", description: "Main image size exceeds 5MB.", variant: "destructive" });
        event.target.value = "";
        form.setValue("mainImage", null, { shouldValidate: true });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "Error", description: "Main image must be .jpg, .jpeg, .png, or .webp.", variant: "destructive" });
        event.target.value = "";
        form.setValue("mainImage", null, { shouldValidate: true });
        return;
      }
      if (mainImagePreview && mainImagePreview.startsWith("blob:")) URL.revokeObjectURL(mainImagePreview);
      setMainImagePreview(URL.createObjectURL(file));
      form.setValue("mainImage", file, { shouldValidate: true });
      if (mainImagePreview && existingImages.some((img) => img.isMain && img.url === mainImagePreview)) {
        setExistingImages((prev) => prev.filter((img) => !(img.isMain && img.url === mainImagePreview)));
      }
    } else {
      if (mainImagePreview && mainImagePreview.startsWith("blob:")) URL.revokeObjectURL(mainImagePreview);
      setMainImagePreview(null);
      form.setValue("mainImage", null, { shouldValidate: true });
      event.target.value = "";
    }
  };

  const handleSupportingItemChange = (index: number, field: "image" | "caption", value: File | string | null) => {
    const currentFormValues = form.getValues("supportingItems");
    const newPreviews = [...supportingItemPreviews];
    let updatedItem = { ...currentFormValues[index] };

    if (field === "image") {
      const file = value instanceof File && value.size > 0 ? value : null;
      const inputElement = document.getElementById(`supporting-image-${index}`) as HTMLInputElement;
      const oldPreviewUrl = newPreviews[index];

      if (newPreviews[index] && newPreviews[index]!.startsWith("blob:")) {
        URL.revokeObjectURL(newPreviews[index]!);
      }
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "Error", description: `Supporting image ${index + 1} size exceeds 5MB.`, variant: "destructive" });
          if (inputElement) inputElement.value = "";
          updatedItem.image = null;
          newPreviews[index] = null;
          form.setValue(`supportingItems.${index}.image`, null, { shouldValidate: true });
          setSupportingItemPreviews(newPreviews);
          return;
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          toast({ title: "Error", description: `Supporting image ${index + 1} must be .jpg, .jpeg, .png, or .webp.`, variant: "destructive" });
          if (inputElement) inputElement.value = "";
          updatedItem.image = null;
          newPreviews[index] = null;
          form.setValue(`supportingItems.${index}.image`, null, { shouldValidate: true });
          setSupportingItemPreviews(newPreviews);
          return;
        }
        newPreviews[index] = URL.createObjectURL(file);
        updatedItem.image = file;
        if (oldPreviewUrl && existingImages.some((img) => !img.isMain && img.url === oldPreviewUrl)) {
          setExistingImages((prev) => prev.filter((img) => img.url !== oldPreviewUrl));
        }
      } else {
        newPreviews[index] = null;
        updatedItem.image = null;
        if (inputElement) inputElement.value = "";
      }
    } else if (field === "caption" && typeof value === "string") {
      updatedItem.caption = value;
    }

    setSupportingItemPreviews(newPreviews);
    const newSupportingItemsArray = currentFormValues.map((item, i) => (i === index ? updatedItem : item));
    form.setValue("supportingItems", newSupportingItemsArray, { shouldValidate: true });
  };

  const removeMainImage = () => {
    const urlToRemove = mainImagePreview;
    if (mainImagePreview && mainImagePreview.startsWith("blob:")) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(null);
    form.setValue("mainImage", null, { shouldValidate: true });
    const fileInput = document.getElementById("main-image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    if (urlToRemove) {
      setExistingImages((prev) => prev.filter((img) => !(img.isMain && img.url === urlToRemove)));
    }
  };

  const removeSupportingImage = (index: number) => {
    const newPreviews = [...supportingItemPreviews];
    const urlToRemove = newPreviews[index];

    if (newPreviews[index] && newPreviews[index]!.startsWith("blob:")) {
      URL.revokeObjectURL(newPreviews[index]!);
    }
    newPreviews[index] = null;
    setSupportingItemPreviews(newPreviews);

    const currentFormValues = form.getValues("supportingItems");
    const updatedItem = { ...currentFormValues[index], image: null };
    const newSupportingItemsArray = currentFormValues.map((item, i) => (i === index ? updatedItem : item));
    form.setValue("supportingItems", newSupportingItemsArray, { shouldValidate: true });

    const fileInput = document.getElementById(`supporting-image-${index}`) as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    if (urlToRemove) {
      setExistingImages((prev) => prev.filter((img) => img.url !== urlToRemove));
    }
  };

  const toggleLogSelection = (logId: string) => {
    console.log("[LogForm] Toggling log selection:", logId);
    const currentSelectedRHF = form.getValues("relatedLogIds") || [];
    let newSelectedRHF;
    if (currentSelectedRHF.includes(logId)) {
      newSelectedRHF = currentSelectedRHF.filter((id) => id !== logId);
    } else {
      newSelectedRHF = [...currentSelectedRHF, logId];
    }
    console.log("[LogForm] New RHF relatedLogIds:", newSelectedRHF);
    form.setValue("relatedLogIds", newSelectedRHF, { shouldValidate: true });
  };

  const onClientSubmit = async (data: FormValues) => {
    console.log("[LogForm] onClientSubmit called with data:", data);
    setIsPending(true);

    try {
      const imageUrls: ExistingImage[] = [];

      let mainImageUrl: string | null = null;
      if (data.mainImage instanceof File) {
        console.log("[LogForm] Uploading main image:", data.mainImage.name);
        const mainImageRef = ref(storage, `logs/${Date.now()}_${data.mainImage.name}`);
        await uploadBytes(mainImageRef, data.mainImage);
        mainImageUrl = await getDownloadURL(mainImageRef);
        imageUrls.push({ url: mainImageUrl, isMain: true, caption: data.mainCaption });
      } else if (existingImages.some((img) => img.isMain && mainImagePreview === img.url)) { 
        const existingMainImage = existingImages.find((img) => img.isMain && mainImagePreview === img.url);
        if (existingMainImage) {
          imageUrls.push({...existingMainImage, caption: data.mainCaption});
        }
      } else if (!data.mainImage && data.mainCaption){
         imageUrls.push({ url: null, isMain: true, caption: data.mainCaption });
      }

      for (let i = 0; i < data.supportingItems.length; i++) {
        const item = data.supportingItems[i];
        const previewUrl = supportingItemPreviews[i];
        if (item.image instanceof File) {
          console.log("[LogForm] Uploading supporting image", i, ":", item.image.name);
          const supportingImageRef = ref(storage, `logs/${Date.now()}_${item.image.name}`);
          await uploadBytes(supportingImageRef, item.image);
          const supportingImageUrl = await getDownloadURL(supportingImageRef);
          imageUrls.push({ url: supportingImageUrl, isMain: false, caption: item.caption });
        } else if (previewUrl && existingImages.some((img) => img.url === previewUrl && !img.isMain)) {
          const existingSupportingImage = existingImages.find((img) => img.url === previewUrl && !img.isMain);
          if (existingSupportingImage) {
            imageUrls.push({ ...existingSupportingImage, caption: item.caption });
          }
        } else if (!item.image && item.caption){ 
           imageUrls.push({ url: null, isMain: false, caption: item.caption });
        }
      }
      
      let mainImageFound = false;
      const processedImageUrls = imageUrls.map(img => {
          if (img.isMain) {
              if (!mainImageFound && img.url) {
                  mainImageFound = true;
                  return img;
              } else if (mainImageFound && img.url) { 
                  return { ...img, isMain: false };
              }
          }
          return img;
      });

      if (!mainImageFound && processedImageUrls.some(img => img.url)) {
          const firstValidImageIndex = processedImageUrls.findIndex(img => img.url);
          if (firstValidImageIndex !== -1) {
              processedImageUrls[firstValidImageIndex].isMain = true;
              mainImageFound = true;
          }
      }

      const logData = {
        title: data.title,
        description: data.description,
        imageUrls: processedImageUrls.filter((img) => img.url || img.caption),
        relatedLogs: data.relatedLogIds || [],
        relatedLogTitles: (data.relatedLogIds || []).map(
          (id) => allLogs.find((log) => log.id === id)?.title || `Log ${id.substring(0, 6)}...`
        ),
        updatedAt: new Date().toISOString(),
        ...(initialData?.id ? {} : { createdAt: new Date().toISOString() }), 
        ...(initialData?.createdAt && initialData?.id ? { createdAt: initialData.createdAt } : {}),
      };

      console.log("[LogForm] Saving log data to Firestore:", logData);

      let logId: string;
      if (initialData?.id) {
        const logRef = doc(db, "logs", initialData.id);
        await updateDoc(logRef, logData);
        logId = initialData.id;
        toast({ title: "Success!", description: "Log updated successfully." });
      } else {
        const logsCollection = collection(db, "logs");
        const docRef = await addDoc(logsCollection, { ...logData, createdAt: new Date().toISOString() });
        logId = docRef.id;
        toast({ title: "Success!", description: "Log created successfully." });
      }

      form.reset({
        title: "",
        description: "",
        mainImage: null,
        mainCaption: "",
        supportingItems: Array(MAX_SUPPORTING_ITEMS).fill({ image: null, caption: "" }),
        relatedLogIds: [],
      });
      if (mainImagePreview && mainImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(mainImagePreview);
      }
      setMainImagePreview(null);
      supportingItemPreviews.forEach(preview => {
        if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      });
      setSupportingItemPreviews(Array(MAX_SUPPORTING_ITEMS).fill(null));
      setExistingImages([]);
      if (formRef.current) formRef.current.reset();

      if (onLogCreated) {
        onLogCreated();
      }
      console.log("[LogForm] Redirecting to /mindmap/", logId);
      router.push(`/mindmap/${logId}`);
    } catch (error) {
      console.error("[LogForm] Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const formContent = (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Enter topic title" {...form.register("title")} className={form.formState.errors.title ? "border-destructive" : ""} />
        {form.formState.errors.title && (<p className="text-sm text-destructive">{form.formState.errors.title.message}</p>)}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe your topic" rows={4} {...form.register("description")} className={form.formState.errors.description ? "border-destructive" : ""} />
        {form.formState.errors.description && (<p className="text-sm text-destructive">{form.formState.errors.description.message}</p>)}
      </div>

      <div className="space-y-4">
        <Label>Main Idea (optional)</Label>
        <div className="p-4 border rounded-md space-y-2 flex flex-col items-center">
          <div className="flex items-center justify-between w-full">
            <Label htmlFor="main-image">Main Image</Label>
            {mainImagePreview && (
              <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={removeMainImage}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Input
            id="main-image"
            type="file"
            accept="image/*"
            className="w-full max-w-xs"
            onChange={handleMainImageChange}
          />
          {mainImagePreview && (
            <div className="relative h-32 w-32 mt-2">
              <img
                src={mainImagePreview}
                alt="Main Image Preview"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                className="rounded-md border"
              />
            </div>
          )}
          {form.formState.errors.mainImage && (<p className="text-sm text-destructive">{form.formState.errors.mainImage.message}</p>)}

          <div className="w-full space-y-2">
            <Label htmlFor="main-caption">Main Caption</Label>
            <Input
              id="main-caption"
              placeholder="Enter main caption (max 200 characters)"
              {...form.register("mainCaption")}
              className={form.formState.errors.mainCaption ? "border-destructive" : ""}
            />
            {form.formState.errors.mainCaption && (<p className="text-sm text-destructive">{form.formState.errors.mainCaption.message}</p>)}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Supporting Items (up to {MAX_SUPPORTING_ITEMS}, optional images/captions)</Label>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Image</TableHead>
              <TableHead>Caption</TableHead>
              <TableHead className="w-12 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: MAX_SUPPORTING_ITEMS }).map((_, index) => (
              <TableRow key={`supporting-item-${index}`}>
                <TableCell>
                  <Input
                    id={`supporting-image-${index}`}
                    type="file"
                    accept="image/*"
                    className="w-full"
                    onChange={(e) => handleSupportingItemChange(index, "image", e.target.files?.[0] || null)}
                  />
                  {supportingItemPreviews[index] && (
                    <div className="relative h-16 w-16 mt-2">
                      <img
                        src={supportingItemPreviews[index]!}
                        alt={`Supporting Item ${index + 1} Preview`}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        className="rounded-md border"
                      />
                    </div>
                  )}
                  {form.formState.errors.supportingItems?.[index]?.image && (
                    <p className="text-sm text-destructive">{form.formState.errors.supportingItems[index]?.image?.message as string}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    id={`supporting-caption-${index}`}
                    placeholder="Enter caption"
                    {...form.register(`supportingItems.${index}.caption`)}
                    className={form.formState.errors.supportingItems?.[index]?.caption ? "border-destructive" : ""}
                  />
                  {form.formState.errors.supportingItems?.[index]?.caption && (
                    <p className="text-sm text-destructive">{form.formState.errors.supportingItems[index]?.caption?.message}</p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {(supportingItemPreviews[index] || form.getValues(`supportingItems.${index}.image`)) && (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSupportingImage(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {form.formState.errors.supportingItems && typeof form.formState.errors.supportingItems.message === "string" && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.supportingItems.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Related Logs</Label>
        <div className="border rounded-md p-4 max-h-40 overflow-y-auto bg-muted/50">
          {allLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other logs available to relate.</p>
          ) : (
            allLogs.map((log) => (
              <div key={log.id} className="flex items-center space-x-2 py-1 hover:bg-muted/80 rounded px-2 transition-colors">
                <Checkbox
                  id={`related-log-${log.id}`}
                  checked={(watchedRelatedLogIds || []).includes(log.id)}
                  onCheckedChange={() => toggleLogSelection(log.id)}
                />
                <Label htmlFor={`related-log-${log.id}`} className="text-sm font-normal flex-1 cursor-pointer py-1">
                  {log.title}
                </Label>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(watchedRelatedLogIds || []).map((id) => {
            const relatedLog = allLogs.find((log) => log.id === id);
            return (
              <div key={id} className="flex items-center bg-primary/10 text-primary-foreground px-2 py-1 rounded-md text-xs">
                {relatedLog?.title || `Log ID: ${id.substring(0, 6)}...`}
                <button
                  type="button"
                  onClick={() => toggleLogSelection(id)}
                  className="ml-2 text-destructive hover:text-destructive-foreground"
                  aria-label={`Remove related log: ${relatedLog?.title || id}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        {form.formState.errors.relatedLogIds && (
          <p className="text-sm text-destructive">{form.formState.errors.relatedLogIds.message}</p>
        )}
      </div>
    </>
  );

  if (variant === 'embedded') {
    return (
      <form ref={formRef} onSubmit={form.handleSubmit(onClientSubmit)} className="space-y-6">
        <div className="space-y-4">
         {formContent}
        </div>
        <div className="mt-6"> {/* Mimicking CardFooter's spacing somewhat */}
          <Button type="submit" className="w-full" disabled={isPending || form.formState.isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isPending || form.formState.isSubmitting
              ? (initialData ? "Updating Log..." : "Adding Log...")
              : (initialData ? "Update Log" : "Add Log")
            }
          </Button>
        </div>
      </form>
    );
  }

  // Default 'card' variant
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? "Edit Log" : "Create New Log"}</CardTitle>
        <CardDescription>Create or edit your mind map with a main idea and up to {MAX_SUPPORTING_ITEMS} supporting items.</CardDescription>
      </CardHeader>
      <form ref={formRef} onSubmit={form.handleSubmit(onClientSubmit)} className="space-y-6">
        <CardContent className="space-y-4">
          {formContent}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending || form.formState.isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isPending || form.formState.isSubmitting
              ? (initialData ? "Updating Log..." : "Adding Log...")
              : (initialData ? "Update Log" : "Add Log")
            }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export const LogForm = React.memo(LogFormComponent);
