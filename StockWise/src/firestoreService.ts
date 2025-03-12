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

// Remove 'partially_received' and 'confirmed' from the type
export type OrderStatus = 'pending' | 'sent' | 'shipped' | 'received' | 'canceled';

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
    lastUpdated?: string;
  };
}

// In firestoreService.ts
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string; // Add this field
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

// Update SupplierOrder interface to use OrderStatus type
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
    receivedQuantity?: number; // Add this for partial receipts
  }[];
  status: OrderStatus; // Use the OrderStatus type here
  totalAmount: number;
  orderDate: string;
  notes?: string;
  statusHistory: {
    status: string;
    date: string;
    updatedBy: string;
    notes?: string;
  }[];
  metadata: {
    addedBy: string;
    addedDate: string;
    lastUpdated: string;
  };
}

interface StockUsageHistory {
  date: string;
  quantity: number;
}

export interface StockPrediction {
  product_id: string;
  name: string;
  current_quantity: number;
  predicted_days_until_low: number;
  confidence_score: number;
  recommended_restock_date: string;
  usage_history?: Array<{
    date: string;
    quantity: number;
  }>;
  daily_consumption: number;
  price: number;
  category: string;
  recommended_quantity: number; // Add this field
  dimensions?: {
    length: number;
    width: number;
    height: number;
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

// Function to update an inventory item with role check
export const updateInventoryItem = async (id: string, updatedItem: Partial<InventoryItem>) => {
  try {
    const userRole = await getUserRole(auth.currentUser?.uid || '');
    // Allow employees to update inventory
    if (!['admin', 'manager', 'employee'].includes(userRole)) {
      throw new Error('Insufficient permissions');
    }

    const itemRef = doc(db, "inventoryItems", id);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error('Item not found');
    }

    const currentData = itemDoc.data();
    await updateDoc(itemRef, {
      ...updatedItem,
      metadata: {
        ...currentData.metadata,
        ...updatedItem.metadata
      }
    });
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

// Function to delete an inventory item
export const deleteInventoryItem = async (id: string) => {
  try {
    const userRole = await getUserRole(auth.currentUser?.uid || '');
    // Allow employees to delete inventory items
    if (!['admin', 'manager', 'employee'].includes(userRole)) {
      throw new Error('Insufficient permissions');
    }

    const itemRef = doc(db, "inventoryItems", id);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
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

export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, notes?: string) => {
  try {
    // Change from "orders" to "supplierOrders" to match the collection name
    const orderRef = doc(db, "supplierOrders", orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const currentOrder = { id: orderDoc.id, ...orderDoc.data() } as SupplierOrder;

    const statusUpdate = {
      status: newStatus,
      date: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || 'unknown',
      notes: notes
    };

    await updateDoc(orderRef, {
      status: newStatus,
      statusHistory: [...(currentOrder.statusHistory || []), statusUpdate],
      'metadata.lastUpdated': new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

const updateInventoryOnReceival = async (order: SupplierOrder) => {
  try {
    // Process each item in the order
    for (const item of order.items) {
      const itemRef = doc(db, "inventoryItems", item.itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        console.warn(`Item ${item.itemId} not found in inventory`);
        continue;
      }

      // Update the inventory quantity
      const currentQuantity = itemDoc.data().quantity || 0;
      const receivedQuantity = item.receivedQuantity || item.quantity; // Use receivedQuantity if available

      await updateDoc(itemRef, {
        quantity: currentQuantity + receivedQuantity,
        'metadata.lastUpdated': new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating inventory on receival:', error);
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

export const deleteUser = async (userId: string, userEmail: string) => {
  try {
    // Check if current user is admin
    const currentUser = auth.currentUser;
    const userRole = await getUserRole(currentUser?.uid || '');
    
    if (!currentUser || userRole !== 'admin') {
      throw new Error('Only administrators can delete users');
    }
    
    // Prevent deleting the admin account
    if (userEmail === 'rosshannonty@gmail.com') {
      throw new Error('Cannot delete admin account');
    }

    // Delete user document from Firestore
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getStockPredictions = async (): Promise<StockPrediction[]> => {
  try {
    console.log('Fetching predictions...');
    // Remove /predictions from the base URL
    const ML_SERVICE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://ml-service-519269717450.europe-west1.run.app' // Remove /predictions here
      : 'http://localhost:8000';
      
    const response = await fetch(`${ML_SERVICE_URL}/predictions`); // /predictions is added here
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const predictions = await response.json();
    console.log('Raw predictions response:', predictions);
    
    const validatedPredictions = predictions.map((p: Partial<StockPrediction>) => ({
      ...p,
      daily_consumption: Number(p.daily_consumption) || 0
    }));
    
    return validatedPredictions as StockPrediction[];
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
};

export const getConsumptionPlot = async (itemName: string): Promise<string | null> => {
  try {
    // Use the same ML service URL as predictions
    const ML_SERVICE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://ml-service-519269717450.europe-west1.run.app'
      : 'http://localhost:8000';
      
    const response = await fetch(`${ML_SERVICE_URL}/consumption-plot/${encodeURIComponent(itemName)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.plot;
  } catch (error) {
    console.error('Error fetching consumption plot:', error);
    return null;
  }
};