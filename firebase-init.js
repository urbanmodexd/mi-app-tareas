import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSzMBRL9sReSitMVi85rBMO_5wBNmd84I",
  authDomain: "mi-app-personal-531d5.firebaseapp.com",
  projectId: "mi-app-personal-531d5",
  storageBucket: "mi-app-personal-531d5.firebasestorage.app",
  messagingSenderId: "1061205277473",
  appId: "1:1061205277473:web:ce345d78718d235defdc60"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);