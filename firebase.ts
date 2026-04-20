import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCcbZDyNDDwd-F_rOdXBhYPaf2Y2ZmAVa8",
  authDomain: "peackybarbers.firebaseapp.com",
  projectId: "peackybarbers",
  storageBucket: "peackybarbers.firebasestorage.app",
  messagingSenderId: "829434360528",
  appId: "1:829434360528:web:f385d861cc1921a393a4d5",
  measurementId: "G-7T8380HT57"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const bookingsCollection = collection(db, 'bookings');
export const unavailableCollection = collection(db, 'unavailable');
