import {
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, userRef } from "./config";

export const signIn = async (email: string, password?: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password || "",
  );
  console.log(`[Firebase] Signed in user: ${email}`, { userCredential });

  return userCredential.user;
};

export const signUp = async (email: string, password?: string) => {
  const username = email.split('@')[0];

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password || "",
  );
  console.log(`[Firebase] Signed up user: ${email}`, { userCredential });
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
  await fbSignOut(auth);

  console.log(`[Firebase] Signed out user`);
};
