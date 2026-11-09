import { getAdminStorage } from "@/lib/firebase/admin";

export async function uploadUserFile(firebaseUid, relativePath, buffer, contentType) {
  const storage = getAdminStorage();
  if (!storage) {
    throw new Error("Firebase Storage is not configured");
  }
  const bucket = storage.bucket();
  const fullPath = `users/${firebaseUid}/${relativePath}`;
  const file = bucket.file(fullPath);
  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });
  return fullPath;
}

export async function getSignedDownloadUrl(storagePath, expiresMinutes = 15) {
  const storage = getAdminStorage();
  if (!storage) {
    throw new Error("Firebase Storage is not configured");
  }
  const file = storage.bucket().file(storagePath);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresMinutes * 60 * 1000,
  });
  return url;
}
