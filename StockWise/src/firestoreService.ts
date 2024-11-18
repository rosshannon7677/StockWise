// src/firestoreService.ts
import { addDoc, collection, getFirestore, onSnapshot, QuerySnapshot, DocumentData, updateDoc, doc } from "firebase/firestore";
import { app } from "./../firebaseConfig"; // Adjust path as needed


interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
}

// Initialize Firestore
const db = getFirestore(app);

// Function to add an inventory item
export const addInventoryItem = async (item: { name: string; quantity: number; price: number; description?: string }) => {
  try {
    const docRef = await addDoc(collection(db, "inventoryItems"), item);
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

// Function to listen to inventory items in real-time
export const getInventoryItems = (callback: (items: any[]) => void) => {
  const collectionRef = collection(db, "inventoryItems");
  onSnapshot(collectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(items);
  });
};

// Function to update an inventory item
export const updateInventoryItem = async (id: string, updatedItem: Partial<InventoryItem>) => {
  try {
    const itemRef = doc(db, "inventoryItems", id);
    await updateDoc(itemRef, updatedItem);
    console.log("Document updated with ID: ", id);
  } catch (error) {
    console.error("Error updating document: ", error);
  }
};