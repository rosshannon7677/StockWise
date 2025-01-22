// src/firestoreService.ts
import { 
  addDoc, 
  collection, 
  getFirestore, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData, 
  updateDoc, 
  doc,
  deleteDoc,
  increment // Add this import
} from "firebase/firestore";
import { app } from "./../firebaseConfig";
import { auth } from '../firebaseConfig';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
  category: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  location: {
    aisle: string;
    shelf: string;
    section: string;
  };
  metadata: {
    addedBy: string;
    addedDate: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  metadata: {
    addedBy: string;
    addedDate: string;
  };
}

export interface CustomerOrder {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  status: 'pending' | 'inProgress' | 'shipped' | 'delivered';
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  metadata: {
    addedBy: string;
    addedDate: string;
    lastUpdated: string;
  };
}

// Initialize Firestore
const db = getFirestore(app);

// Function to add an inventory item
export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
  try {
    await addDoc(collection(db, "inventoryItems"), {
      ...item,
      dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
      location: item.location || { aisle: '', shelf: '', section: '' },
      metadata: {
        addedBy: item.metadata?.addedBy || 'unknown',
        addedDate: item.metadata?.addedDate || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

// Function to listen to inventory items in real-time
export const getInventoryItems = (callback: (items: InventoryItem[]) => void) => {
  const collectionRef = collection(db, "inventoryItems");
  return onSnapshot(collectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[];
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

// Function to delete an inventory item
export const deleteInventoryItem = async (id: string) => {
  try {
    const itemRef = doc(db, "inventoryItems", id); // Reference the document by ID
    await deleteDoc(itemRef);
    console.log("Document deleted with ID: ", id);
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
};

export const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
  try {
    await addDoc(collection(db, "suppliers"), {
      ...supplier,
      metadata: {
        addedBy: supplier.metadata?.addedBy || 'unknown',
        addedDate: supplier.metadata?.addedDate || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error adding supplier: ", error);
    throw error;
  }
};

export const getSuppliers = (callback: (suppliers: Supplier[]) => void) => {
  const collectionRef = collection(db, "suppliers");
  return onSnapshot(collectionRef, (snapshot: QuerySnapshot<DocumentData>) => {
    const suppliers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Supplier[];
    callback(suppliers);
  });
};

export const updateSupplier = async (id: string, updatedSupplier: Partial<Supplier>) => {
  try {
    const supplierRef = doc(db, "suppliers", id);
    await updateDoc(supplierRef, updatedSupplier);
  } catch (error) {
    console.error("Error updating supplier: ", error);
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    const supplierRef = doc(db, "suppliers", id);
    await deleteDoc(supplierRef);
  } catch (error) {
    console.error("Error deleting supplier: ", error);
  }
};

export const addOrder = async (order: Omit<CustomerOrder, 'id'>) => {
  try {
    const orderRef = await addDoc(collection(db, "customerOrders"), order);
    // Update inventory quantities
    for (const item of order.items) {
      const itemRef = doc(db, "inventoryItems", item.itemId);
      await updateDoc(itemRef, {
        quantity: increment(-item.quantity) // This will now work correctly
      });
    }
    return orderRef.id;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

export const getOrders = (callback: (orders: CustomerOrder[]) => void) => {
  const collectionRef = collection(db, "customerOrders");
  return onSnapshot(collectionRef, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as CustomerOrder[];
    callback(orders);
  });
};