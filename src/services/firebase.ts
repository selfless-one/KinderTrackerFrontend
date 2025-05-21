// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAMm5xeNnLZFl_y5rjpqLitK9zamCHh6a0",
  authDomain: "gps-link-3ffb0.firebaseapp.com",
  databaseURL: "https://gps-link-3ffb0-default-rtdb.firebaseio.com",
  projectId: "gps-link-3ffb0",
  storageBucket: "gps-link-3ffb0.firebasestorage.app",
  messagingSenderId: "551324661137",
  appId: "1:551324661137:web:8edca5f3710742397a1630"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
