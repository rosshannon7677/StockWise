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
  increment,
  setDoc,
  getDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { app } from "./../firebaseConfig";
import { auth } from '../firebaseConfig';
import type { UserRole, UserRoleData } from './types/roles';

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
  used_stock?: {
    date: string;
    quantity: number;
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string; // Add supplier category
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

export interface SupplierOrder {
  id: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
    category: string; // Required field
  };
  items: {
    itemId: string; // Required field
    name: string;
    quantity: number;
    price: number;
    dimensions: {  // Add dimensions field
      length: number;
      width: number;
      height: number;
    };
  }[];
  status: 'pending' | 'sent' | 'received';
  totalAmount: number;
  orderDate: string;
  notes?: string;
  metadata: {
    addedBy: string;
    addedDate: string;
    lastUpdated: string;
  };
}

export interface StockPrediction {
  product_id: string;
  name: string;
  current_quantity: number;
  predicted_days_until_low: number;
  confidence_score: number;
  recommended_restock_date: string;
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

export const addOrder = async (order: Omit<SupplierOrder, 'id'>) => {
  try {
    // Remove inventory update since supplier orders are independent
    const orderRef = await addDoc(collection(db, "supplierOrders"), order);
    return orderRef.id;
  } catch (error) {
    console.error("Error adding order:", error);
    throw error;
  }
};

export const getOrders = (callback: (orders: SupplierOrder[]) => void) => {
  const collectionRef = collection(db, "supplierOrders");
  return onSnapshot(collectionRef, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as SupplierOrder[];
    callback(orders);
  });
};

export const addSupplierOrder = async (order: Omit<SupplierOrder, 'id'>) => {
  try {
    const orderRef = await addDoc(collection(db, "supplierOrders"), order);
    return orderRef.id;
  } catch (error) {
    console.error("Error adding supplier order:", error);
    throw error;
  }
};

export const getSupplierOrders = (callback: (orders: SupplierOrder[]) => void) => {
  const collectionRef = collection(db, "supplierOrders");
  return onSnapshot(collectionRef, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as SupplierOrder[];
    callback(orders);
  });
};

export const deleteOrder = async (id: string) => {
  try {
    const orderRef = doc(db, "supplierOrders", id);
    await deleteDoc(orderRef);
    console.log("Order deleted with ID: ", id);
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

export const updateOrder = async (id: string, orderData: Partial<SupplierOrder>) => {
  try {
    const orderRef = doc(db, "supplierOrders", id);
    await updateDoc(orderRef, {
      ...orderData,
      metadata: {
        ...orderData.metadata,
        lastUpdated: new Date().toISOString()
      }
    });
    console.log("Order updated with ID: ", id);
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const setUserRole = async (userId: string, userData: UserRoleData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, userData);
  } catch (error) {
    console.error("Error setting user role:", error);
    throw error;
  }
};

export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return 'employee'; // Default role
  } catch (error) {
    console.error("Error getting user role:", error);
    return 'employee'; // Default role on error
  }
};

export const setAdminRole = async (email: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    // First, ensure the user document exists
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create initial user document
      await setDoc(userRef, {
        email: user.email,
        role: user.email === email ? 'admin' : 'employee',
        name: user.displayName || '',
        userId: user.uid
      });
    } else if (user.email === email) {
      // Update existing user to admin if it matches
      await updateDoc(userRef, {
        role: 'admin'
      });
    }
    
    console.log("Admin role set successfully");
  } catch (error) {
    console.error("Error setting admin role:", error);
    throw error;
  }
};

export const setDefaultAdmin = async (email: string) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        role: 'admin',
        isDefaultAdmin: true
      });
    }
  } catch (error) {
    console.error("Error setting default admin:", error);
    throw error;
  }
};

export const getUsers = async (): Promise<UserRoleData[]> => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    } as UserRoleData));
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, newRole: UserRole) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    // Prevent changing role if user is default admin
    if (userData?.isDefaultAdmin) {
      throw new Error("Cannot change role of default admin");
    }

    // Prevent setting admin role
    if (newRole === 'admin') {
      throw new Error("Cannot set admin role");
    }

    await updateDoc(userRef, { role: newRole });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const getStockPredictions = async (): Promise<StockPrediction[]> => {
  try {
    const response = await fetch('http://localhost:8000/predictions');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const predictions = await response.json();
    return predictions;
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
};