// services/firebase.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyD-s3l3tAly_hOhSec_sLLGNyKTZ45DoQI",
  authDomain: "capstone-app-63f66.firebaseapp.com",
  databaseURL: "https://capstone-app-63f66-default-rtdb.firebaseio.com",
  projectId: "capstone-app-63f66",
  storageBucket: "capstone-app-63f66.firebasestorage.app",
  messagingSenderId: "184543767933",
  appId: "1:184543767933:web:d9f39675f0cb697c757014"
};

const app = initializeApp(firebaseConfig);

export { app };
