import { supabase } from "./config";

export const signIn = async (email: string, password?: string) => {
  // Simulate network request
  //   await new Promise((resolve) => setTimeout(resolve, 1500));

  // Real implementation:
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password || "",
  });
  console.log(`[Supabase] Signed in user: `, { data, error });
  if (error) throw error;
  return data.user;
};

export const signUp = async (email: string, password?: string) => {
  // Simulate network request
  //   await new Promise((resolve) => setTimeout(resolve, 1500));

  // Real implementation:
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password || "",
  });
  if (error) throw error;
  console.log(`[Supabase] Signed up user: ${data}`, { data, error });
  return data.user;
};

export const signOut = async () => {
  // Simulate network request
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Real implementation:
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  console.log(`[Supabase] Signed out user`);
};
