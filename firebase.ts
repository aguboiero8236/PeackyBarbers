import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUUE4Rp9hmlq07YBH6fPzDNp9yo5nhCbQ",
  authDomain: "turnosapp-cae3f.firebaseapp.com",
  projectId: "turnosapp-cae3f",
  storageBucket: "turnosapp-cae3f.firebasestorage.app",
  messagingSenderId: "629146123734",
  appId: "1:629146123734:web:3adcf9d93ba0e552f9b877",
  measurementId: "G-WYPT6FJDQ8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const bookingsCollection = collection(db, 'bookings');
