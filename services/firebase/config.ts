import { FirebaseOptions, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, getFirestore } from 'firebase/firestore';

// Firebase Configuration
// Replace these with your actual Firebase project configuration from the Firebase Console
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDZ_EsV-CZFy65zFf9cldpyKgQAaCOSlOU",
  authDomain: "baas-demo-29e81.firebaseapp.com",
  projectId: "baas-demo-29e81",
  storageBucket: "baas-demo-29e81.firebasestorage.app",
  messagingSenderId: "472810178219",
  appId: "1:472810178219:web:c660dec911b9852f9fd9ee",
  measurementId: "G-GFBL3MWHKW"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// auth
export const auth = getAuth(app);
// database
export const db = getFirestore(app);

// collection refs
export const userRef = collection(db, 'profiles');
export const projectRef = collection(db, 'projects');
export const projectMembersRef = collection(db, 'project_members');