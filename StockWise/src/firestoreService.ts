// src/firestoreService.ts
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { app } from "./../firebaseConfig"; // adjust path as needed

// Initialize Firestore
const db = getFirestore(app);

// Function to listen to inventory items in real-time
export const getInventoryItems = (callback: (items: any[]) => void) => {
  const collectionRef = collection(db, "inventoryItems");
  
  // Use Firestore's onSnapshot to listen for real-time updates
  onSnapshot(collectionRef, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(items); // Pass the items to the callback for updating state
  });
};
