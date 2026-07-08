import supabase from "./config";

export interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  avatar_url?: string;
}

/**
 * Fetch a user's profile from the profiles table.
 */
export const getProfile = async (userId: string): Promise<ProfileData> => {
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as ProfileData;
};

/**
 * Update the current user's profile fields.
 * Only sends the fields that are provided.
 */
export const updateProfile = async (
  userId: string,
  updates: UpdateProfileData
): Promise<ProfileData> => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data as ProfileData;
};


/**
 * Upload an avatar image to Supabase Storage and update the profile's avatar_url.
 *
 * @param userId - The user's ID (used as folder name in storage)
 * @param fileUri - The local file URI from the image picker
 * @returns The public URL of the uploaded avatar
 */
export const uploadAvatar = async (
  userId: string,
  fileUri: string
): Promise<string> => {

  // -- PENDING --
  // ISSUE

  // Extract file extension from URI
  const ext = fileUri.split(".").pop() || "jpg";
  const fileName = `avatar.${ext}`;
  const filePath = `${userId}/${fileName}`;

  // Read the file as an ArrayBuffer (official Supabase docs pattern)
  const arrayBuffer = await fetch(fileUri).then((res) => res.arrayBuffer());

  // Upload to the "avatars" bucket (upsert to overwrite previous avatar)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, {
      contentType: `image/${ext}`,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update the profile with the new avatar URL
  await updateProfile(userId, { avatar_url: publicUrl });

  return publicUrl;
};
