// Dummy Firebase Configuration
// Replace these with your actual Firebase project configuration from the Firebase Console

export const firebaseConfig = {
  apiKey: "AIzaSyDZ_EsV-CZFy65zFf9cldpyKgQAaCOSlOU",
  authDomain: "baas-demo-29e81.firebaseapp.com",
  projectId: "baas-demo-29e81",
  storageBucket: "baas-demo-29e81.firebasestorage.app",
  messagingSenderId: "472810178219",
  appId: "1:472810178219:web:c660dec911b9852f9fd9ee",
  measurementId: "G-GFBL3MWHKW"
};

import { initializeApp } from 'firebase/app';
// In a real scenario, you would initialize app here:
export const app = initializeApp(firebaseConfig);
