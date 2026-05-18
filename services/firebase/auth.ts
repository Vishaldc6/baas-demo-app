import {
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { auth, userRef } from "./config";

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

const checkUsernameExists = async (username: string) => {
  const q = query(
    userRef,
    where("username", "==", username)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
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
  const username = email.split('@')[0];
  // const userExists = await checkUsernameExists(username);
  // if (userExists) {
  //   throw new Error("Username already exists.");
  // }

  const uid = userCredential.user.uid;
  await setDoc(doc(userRef, uid), {
    id: uid,
    username,
    avatar_url: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return userCredential.user;
};

export const signOut = async () => {
  // Simulate network request
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Real implementation:
  await fbSignOut(auth);

  console.log(`[Firebase] Signed out user`);
};
