// src/firestoreService.ts
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { app } from "./../firebaseConfig"; // adjust path as needed

// Initialize Firestore
const db = getFirestore(app);

// Function to add a new inventory item
export const addInventoryItem = async (item: { name: string; quantity: number; price: number; description?: string }) => {
  try {
    const docRef = await addDoc(collection(db, "inventoryItems"), item);
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};
