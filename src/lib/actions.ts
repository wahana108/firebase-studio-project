// c:\Users\ramaw\firebase-studio-project\src\lib\actions.ts
// "use server";

// import { z } from "zod";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { collection, addDoc, doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
// import { db, storage } from "./firebase";
// import { revalidatePath } from "next/cache";

// const LogSchema = z.object({
//   title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
//   description: z.string().min(1, "Description is required").max(500, "Description must be 500 characters or less"),
//   mainCaption: z.string().max(200, "Main caption must be 200 characters or less").optional(),
//   supportingItems: z.array(
//     z.object({
//       caption: z.string().max(200, "Caption must be 200 characters or less").optional(),
//       image: z.any().optional(), // Tetap any untuk saat ini, validasi file dilakukan terpisah
//     })
//   ).length(8, "Exactly 8 supporting items required."), // MAX_SUPPORTING_ITEMS
//   relatedLogIds: z.array(z.string()).optional(),
// });

// const MAX_FILE_SIZE = 5 * 1024 * 1024;
// const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
// const MAX_SUPPORTING_ITEMS = 8;
// const MAX_TOTAL_IMAGES = 9;

// const FileSchema = z.instanceof(File)
//   .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
//   .refine(
//     (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
//     "Only .jpg, .jpeg, .png and .webp formats are supported."
//   );

// export async function createLogAction(prevState: any, formData: FormData) {
//   console.log('--- [createLogAction] Invoked ---');
//   console.log('[createLogAction] FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({ key, value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value })));

//   try {
//     const testDocRef = doc(db, "test_collection", "test_doc_" + Date.now());
//     const testData = { message: "Hello from createLogAction", timestamp: serverTimestamp(), testId: Math.random() };
//     await setDoc(testDocRef, testData);
//     console.log('[createLogAction] Successfully wrote to test_collection with testId:', testData.testId);
//   } catch (e) {
//     console.error('[createLogAction] Error writing to test_collection:', e);
//   }

//   if (storage) {
//     console.log('[createLogAction] Storage Emulator Config:', (storage as any)._emulator);
//   } else {
//     console.error('[createLogAction] Storage instance is not available!');
//   }
//   if (db) {
//     console.log('[createLogAction] Firestore Emulator Config:', (db as any)._settings?.host, (db as any)._settings?.ssl);
//   } else {
//     console.error('[createLogAction] DB instance is not available!');
//   }

//   const rawTitle = formData.get("title");
//   const rawDescription = formData.get("description");
//   const mainImage = formData.get("mainImage");
//   const mainCaption = formData.get("mainCaption") as string;

//   // Perbaikan cara mengambil supportingItems
//   const supportingItemsData = Array.from({ length: MAX_SUPPORTING_ITEMS }).map((_, i) => {
//     const imageFile = formData.get(`supportingItems[${i}].image`); // Gunakan kurung siku
//     const captionValue = formData.get(`supportingItems[${i}].caption`); // Gunakan kurung siku
//     return {
//       image: imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
//       caption: typeof captionValue === 'string' ? captionValue : "",
//     };
//   });
//   const relatedLogIds = formData.getAll("relatedLogIds") as string[];

//   console.log('[createLogAction] formData mainImage:', mainImage instanceof File ? { name: mainImage.name, size: mainImage.size, type: mainImage.type } : mainImage);
//   console.log('[createLogAction] formData mainCaption:', mainCaption);
//   console.log('[createLogAction] formData supportingItems:', supportingItemsData.map((item, i) => ({
//     index: i,
//     image: item.image ? { name: item.image.name, size: item.image.size, type: item.image.type } : null,
//     caption: item.caption,
//   })));

//   const validatedFields = LogSchema.safeParse({
//     title: rawTitle,
//     description: rawDescription,
//     mainCaption,
//     supportingItems: supportingItemsData, // supportingItemsData sudah berisi File | null untuk image
//     relatedLogIds,
//   });

//   if (!validatedFields.success) {
//     console.log('[createLogAction] Validation failed for fields:', validatedFields.error.flatten().fieldErrors);
//     return {
//       success: false,
//       message: "Validation failed.",
//       errors: validatedFields.error.flatten().fieldErrors,
//     };
//   }

//   const imageUrls: { url: string | null; isMain: boolean; caption?: string }[] = [];
//   let totalImages = 0;

//   if (mainImage instanceof File && mainImage.size > 0) {
//     const validatedFile = FileSchema.safeParse(mainImage);
//     if (!validatedFile.success) {
//       console.log('[createLogAction] Validation failed for main image:', validatedFile.error.flatten().formErrors);
//       return {
//         success: false,
//         message: "Invalid main image file.",
//         errors: { mainImage: validatedFile.error.flatten().formErrors },
//       };
//     }
//     try {
//       const storageRef = ref(storage, `logs/${Date.now()}_${mainImage.name}`);
//       await uploadBytes(storageRef, mainImage);
//       const url = await getDownloadURL(storageRef);
//       imageUrls.push({
//         url,
//         isMain: true,
//         caption: validatedFields.data.mainCaption || undefined,
//       });
//       totalImages++;
//       console.log(`[createLogAction] Main image ${mainImage.name} uploaded successfully to: ${url}`);
//     } catch (error) {
//       console.error("[createLogAction] Error uploading main image:", error);
//       return { success: false, message: "Failed to upload main image." };
//     }
//   } else if (validatedFields.data.mainCaption) {
//     imageUrls.push({
//       url: null,
//       isMain: true,
//       caption: validatedFields.data.mainCaption,
//     });
//   }

//   for (let i = 0; i < MAX_SUPPORTING_ITEMS; i++) {
//     // Ambil dari supportingItemsData yang sudah diproses
//     const item = supportingItemsData[i];
//     const imageFile = item.image; // Ini sudah File | null
//     const caption = item.caption;

//     if (imageFile) { // imageFile adalah File object
//       const validatedFile = FileSchema.safeParse(imageFile);
//       if (!validatedFile.success) {
//         console.log('[createLogAction] Validation failed for supporting image at index', i, ':', validatedFile.error.flatten().formErrors);
//         return {
//           success: false,
//           message: `Invalid supporting image at item ${i + 1}.`,
//           errors: { [`supportingItems[${i}].image`]: validatedFile.error.flatten().formErrors },
//         };
//       }
//       totalImages++;
//       if (totalImages > MAX_TOTAL_IMAGES) {
//         console.log('[createLogAction] Total images exceed maximum:', totalImages);
//         return { success: false, message: `Maximum ${MAX_TOTAL_IMAGES} images allowed.` };
//       }
//       try {
//         const storageRef = ref(storage, `logs/${Date.now()}_${imageFile.name}`);
//         await uploadBytes(storageRef, imageFile);
//         const url = await getDownloadURL(storageRef);
//         imageUrls.push({
//           url,
//           isMain: false,
//           caption: caption || undefined,
//         });
//         console.log(`[createLogAction] Supporting image ${imageFile.name} (index ${i}) uploaded successfully to: ${url}`);
//       } catch (error) {
//         console.error("[createLogAction] Error uploading supporting image at index", i, ":", error);
//         return { success: false, message: `Failed to upload supporting image at item ${i + 1}.` };
//       }
//     } else if (caption) { // Jika tidak ada gambar TAPI ada caption
//       imageUrls.push({
//         url: null,
//         isMain: false,
//         caption: caption,
//       });
//     }
//   }

//   console.log('[createLogAction] Firestore DB instance details:', db);
//   console.log('[createLogAction] Firestore DB app name:', db.app.name);
//   console.log('[createLogAction] Firestore DB project ID (from app options):', db.app.options.projectId);
//   const dataToSave = {
//     title: validatedFields.data.title,
//     description: validatedFields.data.description,
//     imageUrls,
//     relatedLogs: validatedFields.data.relatedLogIds || [],
//     createdAt: serverTimestamp(),
//     updatedAt: serverTimestamp(),
//   };
//   console.log('[createLogAction] Attempting to save log to Firestore with data:', JSON.stringify(dataToSave, null, 2));

//   try {
//     console.log('[createLogAction] Attempting to save log to Firestore...');
//     await addDoc(collection(db, "logs"), dataToSave);
//     console.log('[createLogAction] Log saved to Firestore successfully.');

//     revalidatePath("/");
//     revalidatePath("/logs"); // Jika Anda punya halaman daftar log di /logs
//     return { success: true, message: "Log created successfully!" };
//   } catch (error) {
//     console.error("[createLogAction] Error during log Firestore save process:", error);
//     let errorMessage = "Failed to create log. An unexpected error occurred.";
//     if (error instanceof Error) {
//       errorMessage = `Firebase Error: ${error.message}`;
//     }
//     return { success: false, message: errorMessage };
//   }
// }

// export async function editLogAction(prevState: any, formData: FormData) {
//   console.log('--- [editLogAction] Invoked ---');
//   if (!(formData instanceof FormData)) {
//     console.error('[editLogAction] Received formData is NOT an instance of FormData.');
//     return { success: false, message: "Invalid form data received." };
//   }
//   console.log('[editLogAction] FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({ key, value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value })));


//   const id = formData.get("id") as string;
//   if (!id) {
//     console.error('[editLogAction] Log ID is missing in formData.');
//     return { success: false, message: "Log ID is required for editing." };
//   }

//   const rawTitle = formData.get("title");
//   const rawDescription = formData.get("description");
//   const mainImage = formData.get("mainImage");
//   const mainCaption = formData.get("mainCaption") as string;

//   // Perbaikan cara mengambil supportingItems
//   const supportingItemsData = Array.from({ length: MAX_SUPPORTING_ITEMS }).map((_, i) => {
//     const imageFile = formData.get(`supportingItems[${i}].image`); // Gunakan kurung siku
//     const captionValue = formData.get(`supportingItems[${i}].caption`); // Gunakan kurung siku
//     return {
//       image: imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
//       caption: typeof captionValue === 'string' ? captionValue : "",
//     };
//   });
//   const existingImageUrlsRaw = formData.get("existingImageUrls") as string | null;
//   const relatedLogIds = formData.getAll("relatedLogIds") as string[];

//   console.log(`[editLogAction] Log ID: ${id}`);
//   console.log('[editLogAction] formData mainImage:', mainImage instanceof File ? { name: mainImage.name, size: mainImage.size, type: mainImage.type } : mainImage);
//   console.log('[editLogAction] formData mainCaption:', mainCaption);
//   console.log('[editLogAction] formData supportingItems:', supportingItemsData.map((item, i) => ({
//     index: i,
//     image: item.image ? { name: item.image.name, size: item.image.size, type: item.image.type } : null,
//     caption: item.caption,
//   })));
//   console.log('[editLogAction] formData existingImageUrlsRaw:', existingImageUrlsRaw);

//   const validatedFields = LogSchema.safeParse({
//     title: rawTitle,
//     description: rawDescription,
//     mainCaption,
//     supportingItems: supportingItemsData,
//     relatedLogIds,
//   });

//   if (!validatedFields.success) {
//     console.log('[editLogAction] Validation failed for fields:', validatedFields.error.flatten().fieldErrors);
//     return {
//       success: false,
//       message: "Validation failed.",
//       errors: validatedFields.error.flatten().fieldErrors,
//     };
//   }

//   let finalImageUrls: { url: string | null; isMain: boolean; caption?: string }[] = [];
//   // let totalImagesUploadedThisSession = 0; // Tidak digunakan secara eksplisit

//   if (existingImageUrlsRaw) {
//     try {
//       const existingImagesFromForm = JSON.parse(existingImageUrlsRaw) as { url: string; isMain?: boolean; caption?: string }[];
//       finalImageUrls = existingImagesFromForm.map(img => ({
//         url: img.url,
//         isMain: img.isMain || false,
//         caption: img.caption || undefined,
//       }));
//       console.log(`[editLogAction] Initialized with ${finalImageUrls.length} existing images from form.`);
//     } catch (error) {
//       console.error("[editLogAction] Error parsing existingImageUrls:", error);
//       return { success: false, message: "Invalid existing images data format." };
//     }
//   }

//   let currentTotalImages = finalImageUrls.filter(img => img.url !== null).length;

//   // Handle new main image upload
//   if (mainImage instanceof File && mainImage.size > 0) {
//     const validatedFile = FileSchema.safeParse(mainImage);
//     if (!validatedFile.success) {
//       console.log('[editLogAction] Validation failed for new main image:', validatedFile.error.flatten().formErrors);
//       return {
//         success: false,
//         message: "Invalid new main image file.",
//         errors: { mainImage: validatedFile.error.flatten().formErrors },
//       };
//     }

//     const oldMainImageIndex = finalImageUrls.findIndex(img => img.isMain);
//     if (oldMainImageIndex === -1) { // Jika tidak ada main image sebelumnya, ini menambah jumlah gambar
//       currentTotalImages++;
//     }
//     // Jika ada main image sebelumnya, ini menggantikannya, jadi jumlah total tidak bertambah kecuali jika sebelumnya tidak ada.

//     if (currentTotalImages > MAX_TOTAL_IMAGES && oldMainImageIndex === -1) { // Cek hanya jika ini adalah gambar baru
//       console.log('[editLogAction] Total images exceed maximum after adding new main image:', currentTotalImages);
//       return { success: false, message: `Maximum ${MAX_TOTAL_IMAGES} images allowed.` };
//     }

//     try {
//       const storageRef = ref(storage, `logs/${Date.now()}_${mainImage.name}`);
//       await uploadBytes(storageRef, mainImage);
//       const newMainImageUrl = await getDownloadURL(storageRef);

//       // Hapus main image lama jika ada, lalu tambahkan yang baru
//       finalImageUrls = finalImageUrls.filter(img => !img.isMain);
//       finalImageUrls.push({
//         url: newMainImageUrl,
//         isMain: true,
//         caption: validatedFields.data.mainCaption || undefined,
//       });
//       // totalImagesUploadedThisSession++;
//       console.log(`[editLogAction] New main image ${mainImage.name} uploaded successfully to: ${newMainImageUrl}`);
//     } catch (error) {
//       console.error("[editLogAction] Error uploading new main image:", error);
//       return { success: false, message: "Failed to upload new main image." };
//     }
//   } else { // Tidak ada file main image baru yang diunggah
//     const existingMainImage = finalImageUrls.find(img => img.isMain);
//     if (existingMainImage) { // Jika ada main image lama, update captionnya
//       existingMainImage.caption = validatedFields.data.mainCaption || undefined;
//     } else if (validatedFields.data.mainCaption) { // Jika tidak ada main image lama tapi ada caption baru
//       finalImageUrls.push({
//         url: null, // Tidak ada URL baru
//         isMain: true,
//         caption: validatedFields.data.mainCaption,
//       });
//     }
//   }

//   // Handle new supporting images upload and existing ones
//   const updatedSupportingImageUrls: { url: string | null; isMain: boolean; caption?: string }[] = [];
//   const existingSupportingImagesFromFinal = finalImageUrls.filter(img => !img.isMain);

//   for (let i = 0; i < MAX_SUPPORTING_ITEMS; i++) {
//     const { image: newImageFile, caption: newCaption } = supportingItemsData[i];
//     let finalUrl: string | null = null;
//     let finalCaption: string | undefined = newCaption || undefined; // Default ke caption baru jika ada

//     // Coba cari gambar pendukung yang sudah ada di posisi ini (berdasarkan urutan)
//     // Ini asumsi sederhana, mungkin perlu logika lebih baik jika urutan bisa berubah drastis
//     const correspondingExistingImage = existingSupportingImagesFromFinal[i];

//     if (newImageFile) { // Jika ada file baru diunggah untuk slot ini
//       const validatedFile = FileSchema.safeParse(newImageFile);
//       if (!validatedFile.success) {
//         return {
//           success: false,
//           message: `Invalid supporting image at item ${i + 1}.`,
//           errors: { [`supportingItems[${i}].image`]: validatedFile.error.flatten().formErrors },
//         };
//       }

//       // Cek apakah ini menggantikan gambar yang ada atau menambah baru
//       if (!correspondingExistingImage || !correspondingExistingImage.url) {
//         currentTotalImages++;
//       }

//       if (currentTotalImages > MAX_TOTAL_IMAGES) {
//         console.log('[editLogAction] Total images exceed maximum with new supporting image:', currentTotalImages);
//         return { success: false, message: `Maximum ${MAX_TOTAL_IMAGES} images allowed.` };
//       }

//       try {
//         const storageRef = ref(storage, `logs/${Date.now()}_${newImageFile.name}`);
//         await uploadBytes(storageRef, newImageFile);
//         finalUrl = await getDownloadURL(storageRef);
//         // totalImagesUploadedThisSession++;
//         console.log(`[editLogAction] New supporting image ${newImageFile.name} for item ${i+1} uploaded to: ${finalUrl}`);
//       } catch (error) {
//         return { success: false, message: `Failed to upload supporting image at item ${i + 1}.` };
//       }
//     } else if (correspondingExistingImage && correspondingExistingImage.url) {
//       // Tidak ada file baru, gunakan URL yang sudah ada
//       finalUrl = correspondingExistingImage.url;
//       // Jika tidak ada caption baru, dan ada caption lama, gunakan caption lama
//       if (!newCaption && correspondingExistingImage.caption) {
//         finalCaption = correspondingExistingImage.caption;
//       }
//     }
//     // Jika tidak ada file baru DAN tidak ada gambar lama di posisi ini,
//     // tapi ada caption baru, maka finalUrl akan null, finalCaption akan diisi.

//     if (finalUrl || finalCaption) { // Hanya tambahkan jika ada URL atau caption
//       updatedSupportingImageUrls.push({
//         url: finalUrl,
//         isMain: false,
//         caption: finalCaption,
//       });
//     }
//   }

//   // Gabungkan main image dengan supporting images yang sudah diupdate
//   finalImageUrls = finalImageUrls.filter(img => img.isMain).concat(updatedSupportingImageUrls);

//   // Pastikan ada satu main image jika ada gambar
//   if (finalImageUrls.length > 0 && !finalImageUrls.some(img => img.isMain && img.url !== null)) {
//     const firstValidImageIndex = finalImageUrls.findIndex(img => img.url !== null);
//     if (firstValidImageIndex !== -1) {
//       finalImageUrls[firstValidImageIndex].isMain = true;
//     }
//   }
  
//   // Hapus entri yang tidak punya URL maupun caption
//   finalImageUrls = finalImageUrls.filter(img => img.url || img.caption);


//   const updateData: any = {
//     title: validatedFields.data.title,
//     description: validatedFields.data.description,
//     imageUrls: finalImageUrls,
//     relatedLogs: validatedFields.data.relatedLogIds || [],
//     updatedAt: serverTimestamp(),
//   };
//   console.log(`[editLogAction] Attempting to update log with ID: ${id} in Firestore with data:`, JSON.stringify(updateData, null, 2));

//   try {
//     await updateDoc(doc(db, "logs", id), updateData);
//     console.log('[editLogAction] Log updated successfully in Firestore.');

//     revalidatePath("/");
//     revalidatePath("/logs"); // Jika ada halaman daftar log
//     revalidatePath(`/logs/${id}`); // Jika ada halaman detail
//     revalidatePath(`/logs/${id}/edit`);
//     revalidatePath(`/mindmap/${id}`);
//     return { success: true, message: "Log updated successfully!" };
//   } catch (error) {
//     console.error("[editLogAction] Error during log Firestore update process:", error);
//     let errorMessage = "Failed to update log. An unexpected error occurred.";
//     if (error instanceof Error) {
//       errorMessage = `Firebase Error: ${error.message}`;
//     }
//     return { success: false, message: errorMessage };
//   }
// }
