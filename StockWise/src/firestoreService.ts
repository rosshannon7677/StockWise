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
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { app } from "./../firebaseConfig";
import { auth } from '../firebaseConfig';
import type { UserRole, UserRoleData, UserStatus } from './types/roles';

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

interface ActivityLog {
  id: string;
  action: 'add' | 'update' | 'delete' | 'order' | 'stock_use';
  itemName: string;
  timestamp: string;
  user: string;
  details: string;
}

// Initialize Firestore
const db = getFirestore(app);

// Function to add an inventory item
export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "inventoryItems"), {
      ...item,
      dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
      location: item.location || { aisle: '', shelf: '', section: '' },
      metadata: {
        addedBy: item.metadata?.addedBy || 'unknown',
        addedDate: item.metadata?.addedDate || new Date().toISOString()
      }
    });

    // Add user field to activity log
    await addActivityLog({
      action: 'add',
      itemName: item.name,
      details: `Added ${item.quantity} units of ${item.name}`,
      user: auth.currentUser?.email || 'unknown'
    });

    return docRef.id;
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
    if (!['admin', 'manager', 'employee'].includes(userRole)) {
      throw new Error('Insufficient permissions');
    }

    const itemRef = doc(db, "inventoryItems", id);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error('Item not found');
    }

    const currentData = itemDoc.data() as InventoryItem;

    // Only track quantity changes
    if (updatedItem.quantity !== undefined && updatedItem.quantity !== currentData.quantity) {
      const quantityChange = updatedItem.quantity - currentData.quantity;
      await addActivityLog({
        action: 'update',
        itemName: currentData.name,
        details: `quantity by ${quantityChange > 0 ? '+' : ''}${quantityChange} units`,
        user: auth.currentUser?.email || 'unknown'
      });
    }

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
    if (!['admin', 'manager', 'employee'].includes(userRole)) {
      throw new Error('Insufficient permissions');
    }

    const itemRef = doc(db, "inventoryItems", id);
    const itemDoc = await getDoc(itemRef);
    if (!itemDoc.exists()) throw new Error('Item not found');
    
    const item = itemDoc.data() as InventoryItem;
    await deleteDoc(itemRef);

    // Update the activity log call to include user
    await addActivityLog({
      action: 'delete',
      itemName: item.name,
      details: `Deleted ${item.name}`,
      user: auth.currentUser?.email || 'unknown'
    });
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

export const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
  try {
    const userRole = await getUserRole(auth.currentUser?.uid || '');
    if (!['admin', 'manager'].includes(userRole)) {
      throw new Error('Only admins and managers can add suppliers');
    }

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
    const userRole = await getUserRole(auth.currentUser?.uid || '');
    if (!['admin', 'manager'].includes(userRole)) {
      throw new Error('Only managers and admins can update suppliers');
    }

    const supplierRef = doc(db, "suppliers", id);
    await updateDoc(supplierRef, {
      ...updatedSupplier,
      metadata: {
        ...updatedSupplier.metadata,
        lastUpdated: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'unknown'
      }
    });
  } catch (error) {
    console.error("Error updating supplier: ", error);
    throw error;
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    const userRole = await getUserRole(auth.currentUser?.uid || '');
    if (!['admin', 'manager'].includes(userRole)) {
      throw new Error('Only admins and managers can delete suppliers');
    }

    const supplierRef = doc(db, "suppliers", id);
    await deleteDoc(supplierRef);
  } catch (error) {
    console.error("Error deleting supplier: ", error);
    throw error;
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
    const userRole = await getUserRole(auth.currentUser?.uid || '');
    const isStatusUpdate = 'status' in orderData;

    // Only managers can change order details, but employees can update status
    if (isStatusUpdate && !['admin', 'manager', 'employee'].includes(userRole)) {
      throw new Error('Insufficient permissions to update order status');
    } else if (!isStatusUpdate && !['admin', 'manager'].includes(userRole)) {
      throw new Error('Only managers and admins can modify order details');
    }

    const orderRef = doc(db, "supplierOrders", id);
    await updateDoc(orderRef, {
      ...orderData,
      metadata: {
        ...orderData.metadata,
        lastUpdated: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'unknown'
      }
    });
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, notes?: string) => {
  try {
    const orderRef = doc(db, "supplierOrders", orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const currentOrder = { id: orderDoc.id, ...orderDoc.data() } as SupplierOrder;

    // Prevent changing status if order is already received
    if (currentOrder.status === 'received') {
      throw new Error('Cannot change status of received orders');
    }

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

export const setUserRole = async (userId: string, userData: Partial<UserRoleData>) => {
  try {
    const userRef = doc(db, "users", userId);
    const newUserData: UserRoleData = {
      userId: userData.userId || userId,
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || 'employee',
      status: 'pending', // Always set new users to pending
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };

    await setDoc(userRef, newUserData);
    console.log("User role set with pending status");
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
      ...doc.data(),
      userId: doc.id
    })) as UserRoleData[];
  } catch (error) {
    console.error("Error fetching users:", error);
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

export const updateUserStatus = async (userId: string, newStatus: UserStatus) => {
  try {
    const currentUser = auth.currentUser;
    const userRole = await getUserRole(currentUser?.uid || '');
    
    if (!currentUser || userRole !== 'admin') {
      throw new Error('Only administrators can approve users');
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status: newStatus,
      'metadata.approvedBy': currentUser.email,
      'metadata.approvedAt': new Date().toISOString(),
      'metadata.lastUpdated': new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

// Update the ML_SERVICE_URL constant
const ML_SERVICE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ml-service-151501605989.europe-west1.run.app'
  : 'https://ml-service-151501605989.europe-west1.run.app'; // Use production URL for both

// Update the query in getStockPredictions
export const getStockPredictions = async (): Promise<StockPrediction[]> => {
  try {
    const ordersRef = collection(db, "supplierOrders");
    // Change the query to match the index we created
    const q = query(
      ordersRef, 
      where("status", "==", "received"),
      orderBy("metadata.lastUpdated", "asc") // Change to ascending to match the index
    );
    
    const recentOrders = await getDocs(q);
    const recentlyReceivedItems = new Map();
    
    // Filter by date in memory
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();
    
    recentOrders.docs.forEach(doc => {
      const order = doc.data() as SupplierOrder;
      if (order.metadata?.lastUpdated >= yesterdayStr) {
        order.items.forEach(item => {
          const current = recentlyReceivedItems.get(item.name) || 0;
          recentlyReceivedItems.set(item.name, current + item.quantity);
        });
      }
    });

    // Get predictions from ML service
    const response = await fetch(`${ML_SERVICE_URL}/predictions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
    if (!response.ok) {
      console.error('ML service response not OK:', await response.text());
      return [];
    }
    
    const predictions = await response.json();

    return predictions.map((pred: StockPrediction) => {
      const recentlyReceived = recentlyReceivedItems.get(pred.name) || 0;
      const adjustedQuantity = pred.current_quantity + recentlyReceived;
      const adjustedDays = Math.ceil((adjustedQuantity - 10) / pred.daily_consumption);
      const recommendedQuantity = Math.max(0, (pred.daily_consumption * 10) - adjustedQuantity);

      return {
        ...pred,
        current_quantity: adjustedQuantity,
        predicted_days_until_low: adjustedDays,
        recommended_quantity: recommendedQuantity
      };
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
};

export const getConsumptionPlot = async (itemName: string): Promise<string | null> => {
  try {
    console.log(`Requesting plot for ${itemName}`); // Add debug log
    const response = await fetch(`${ML_SERVICE_URL}/consumption-plot/${encodeURIComponent(itemName)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.plot) {
      throw new Error('No plot data received');
    }
    
    console.log('Plot data received successfully'); // Add debug log
    return data.plot;
  } catch (error) {
    console.error('Error fetching consumption plot:', error);
    return null;
  }
};

// Add this to firestoreService.ts after the existing interfaces
export const addActivityLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  try {
    let details = log.details;
    const match = log.details.match(/(-?\d+)/); // Extract quantity change

    // Only log if it's a quantity change
    if (log.action === 'stock_use' || 
        (log.action === 'update' && match) || 
        (log.action === 'add' && log.details.includes('units'))) {
      
      const activityLogData = {
        ...log,
        details,
        timestamp: new Date().toISOString(),
        user: auth.currentUser?.email || 'unknown'
      };
      
      await addDoc(collection(db, "activityLogs"), activityLogData);
    }
  } catch (error) {
    console.error("Error adding activity log:", error);
  }
};

export const getActivityLogs = (callback: (logs: ActivityLog[]) => void) => {
  const collectionRef = collection(db, "activityLogs");
  const q = query(collectionRef, orderBy("timestamp", "desc"), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityLog[];
    callback(logs);
  });
};