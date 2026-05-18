import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app, db } from "./config";

// Initialize Firebase Storage
const storage = getStorage(app);

// NOTE: auth.ts writes user profile to 'users' collection on signup.
// If your Firestore collection is named differently (e.g. 'profiles'),
// update the collection name below to match.
const USERS_COLLECTION = "users";

export interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: any;
  updated_at: any;
}

export interface UpdateProfileData {
  username?: string;
  avatar_url?: string;
}

/**
 * Fetch a user's profile from Firestore.
 */
export const getProfile = async (userId: string): Promise<ProfileData> => {
  // getDoc fetches a single document by its reference
  const docRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error("Profile not found");
  }

  return { id: snapshot.id, ...snapshot.data() } as ProfileData;
};

/**
 * Update the current user's profile fields in Firestore.
 * Only sends the fields that are provided.
 */
export const updateProfile = async (
  userId: string,
  updates: UpdateProfileData
): Promise<ProfileData> => {
  // updateDoc merges only the provided fields
  const docRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(docRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });

  // Re-fetch the updated profile to return fresh data
  return await getProfile(userId);
};

/**
 * Upload an avatar image to Firebase Storage and update the profile's avatar_url.
 *
 * @param userId - The user's ID (used as folder name in storage)
 * @param fileUri - The local file URI from the image picker
 * @returns The public download URL of the uploaded avatar
 *
 * Firebase Console Setup Required:
 * 1. Go to Firebase Console → Storage
 * 2. Click "Get Started" if not already enabled
 * 3. Set security rules to allow authenticated uploads (see comment below)
 */
export const uploadAvatar = async (
  userId: string,
  fileUri: string
): Promise<string> => {
  // Extract file extension from URI
  const ext = fileUri.split(".").pop() || "jpg";
  const fileName = `avatar.${ext}`;
  const storagePath = `avatars/${userId}/${fileName}`;

  // Create a reference to the storage location
  const storageRef = ref(storage, storagePath);

  // Read the file as a blob for upload
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // Upload to Firebase Storage (overwrites if file already exists at this path)
  await uploadBytes(storageRef, blob, {
    contentType: `image/${ext}`,
  });

  // Get the public download URL
  const downloadUrl = await getDownloadURL(storageRef);

  // Update the profile document with the new avatar URL
  await updateProfile(userId, { avatar_url: downloadUrl });

  return downloadUrl;
};
