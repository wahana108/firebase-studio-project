"use server";

import { z } from "zod";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "./firebase"; // Pastikan ini mengimpor instance yang sudah terhubung emulator
import { revalidatePath } from "next/cache";

const LogSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().min(1, "Description is required").max(500, "Description must be 500 characters or less"),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const FileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported."
  );

export async function createLogAction(prevState: any, formData: FormData) {
  console.log('--- [createLogAction] Invoked ---');

  // Log untuk memeriksa koneksi emulator pada instance storage
  if (storage) {
    // (storage as any) digunakan untuk mengakses properti internal _emulator untuk debugging
    console.log('[createLogAction] Storage Emulator Config:', (storage as any)._emulator);
  } else {
    console.error('[createLogAction] Storage instance is not available!');
  }
  // Log untuk memeriksa koneksi emulator pada instance db
  if (db) {
    console.log('[createLogAction] Firestore Emulator Config:', (db as any)._settings?.host, (db as any)._settings?.ssl);
  } else {
    console.error('[createLogAction] DB instance is not available!');
  }


  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const imageFile = formData.get("image") as File | null;

  const validatedFields = LogSchema.safeParse({
    title: rawTitle,
    description: rawDescription,
  });

  if (!validatedFields.success) {
    console.log('[createLogAction] Validation failed for fields:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!imageFile || imageFile.size === 0) {
    console.log('[createLogAction] Image file is missing or empty.');
    return {
      success: false,
      message: "Image is required.",
      errors: { image: ["Image is required."] },
    };
  }
  
  const validatedFile = FileSchema.safeParse(imageFile);
  if(!validatedFile.success) {
    console.log('[createLogAction] Validation failed for file:', validatedFile.error.flatten().formErrors);
    return {
        success: false,
        message: "Invalid image file.",
        errors: { image: validatedFile.error.flatten().formErrors }
    }
  }

  console.log(`[createLogAction] Attempting to upload image: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`);

  try {
    // Upload image to Firebase Storage
    const storageRef = ref(storage, `logs/${Date.now()}_${imageFile.name}`);
    console.log(`[createLogAction] Storage reference created: ${storageRef.toString()}`);
    
    await uploadBytes(storageRef, imageFile);
    console.log(`[createLogAction] Image uploaded successfully to: ${storageRef.fullPath}`);
    
    const imageUrl = await getDownloadURL(storageRef);
    console.log(`[createLogAction] Image URL obtained: ${imageUrl}`);

    // Save log to Firestore
    console.log('[createLogAction] Attempting to save log to Firestore...');
    await addDoc(collection(db, "logs"), {
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      imageUrl: imageUrl,
      createdAt: serverTimestamp(),
    });
    console.log('[createLogAction] Log saved to Firestore successfully.');

    revalidatePath("/");
    return { success: true, message: "Log created successfully!" };
  } catch (error) {
    console.error("[createLogAction] Error during log creation process:", error);
    let errorMessage = "Failed to create log. An unexpected error occurred.";
    if (error instanceof Error) {
        // Lebih spesifik jika ini adalah FirebaseError
        if ('code' in error) { // Cek apakah properti 'code' ada (indikasi FirebaseError)
            errorMessage = `Firebase Error (${(error as any).code}): ${error.message}`;
        } else {
            errorMessage = error.message;
        }
    }
    return { success: false, message: errorMessage };
  }
}
