import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Kunci Rahasia Firebase milik Kasir Joglo
const firebaseConfig = {
  apiKey: "AIzaSyADzU_CfjUYmWcMjlUaxCLVz9UfCSZMXS8",
  authDomain: "kasir-joglo.firebaseapp.com",
  projectId: "kasir-joglo",
  storageBucket: "kasir-joglo.firebasestorage.app",
  messagingSenderId: "261859906235",
  appId: "1:261859906235:web:8c8e6d8c6499198fdc4f9e"
};

// Menyalakan mesin Firebase
const app = initializeApp(firebaseConfig);

// Mengekspor database agar bisa dipakai untuk menyimpan pesanan
export const db = getFirestore(app);