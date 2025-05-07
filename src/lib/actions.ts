
"use server";

import { z } from "zod";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "./firebase";
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
  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const imageFile = formData.get("image") as File | null;

  const validatedFields = LogSchema.safeParse({
    title: rawTitle,
    description: rawDescription,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!imageFile || imageFile.size === 0) {
    return {
      success: false,
      message: "Image is required.",
      errors: { image: ["Image is required."] },
    };
  }
  
  const validatedFile = FileSchema.safeParse(imageFile);
  if(!validatedFile.success) {
    return {
        success: false,
        message: "Invalid image file.",
        errors: { image: validatedFile.error.flatten().formErrors }
    }
  }


  try {
    // Upload image to Firebase Storage
    const storageRef = ref(storage, `logs/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Save log to Firestore
    await addDoc(collection(db, "logs"), {
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      imageUrl: imageUrl,
      createdAt: serverTimestamp(),
    });

    revalidatePath("/");
    return { success: true, message: "Log created successfully!" };
  } catch (error) {
    console.error("Error creating log:", error);
    let errorMessage = "Failed to create log.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
}
