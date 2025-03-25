import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDIChHGyvSdtSKnm-r7g81zI5-9u_IE3U",
  authDomain: "sample-firebase-ai-app-6dba9.firebaseapp.com",
  projectId: "sample-firebase-ai-app-6dba9",
  storageBucket: "sample-firebase-ai-app-6dba9.appspot.com", // Fixed domain
  messagingSenderId: "461818069656",
  appId: "1:461818069656:web:d181eb2ca0e252298246ed"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { auth, db, onAuthStateChanged };
