import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { app } from "./config";

const auth = getAuth(app);

export const signIn = async (email: string, password?: string) => {
  // Simulate network request
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Real implementation:
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password || "",
  );
  console.log(`[Firebase] Signed in user: ${email}`, { userCredential });

  return userCredential.user;
};

export const signUp = async (email: string, password?: string) => {
  // Simulate network request
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Real implementation:
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password || "",
  );
  console.log(`[Firebase] Signed up user: ${email}`, { userCredential });
  return userCredential.user;
};

export const signOut = async () => {
  // Simulate network request
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Real implementation:
  await fbSignOut(auth);

  console.log(`[Firebase] Signed out user`);
};
