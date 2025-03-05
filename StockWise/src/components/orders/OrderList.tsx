import React, { useState } from 'react';
import { auth } from '../../../firebaseConfig';

import { IonIcon, IonModal, IonButton, IonInput, IonSelect, IonSelectOption, useIonRouter, IonAlert } from '@ionic/react';
import { 
    chevronForwardOutline, 
    chevronBackOutline, 
    chevronDownOutline,
    timeOutline,
    paperPlaneOutline,
    checkmarkCircleOutline,
    carOutline,
    archiveOutline,
    checkmarkDoneCircleOutline,
    closeCircleOutline
} from 'ionicons/icons';
import './OrderList.css';
import { 
    OrderStatus, // Keep this import
    SupplierOrder as ImportedSupplierOrder,
    deleteOrder, 
    updateOrder, 
    updateOrderStatus, 
    addInventoryItem, 
    updateInventoryItem 
} from '../../firestoreService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { getFirestore } from 'firebase/firestore';
import { app } from '../../../firebaseConfig';

const db = getFirestore(app);
import type { UserOptions } from 'jspdf-autotable';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Add type declaration for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

// Remove this duplicate declaration
// export type OrderStatus = 'pending' | 'sent' | 'confirmed' | 'shipped' | 'partially_received' | 'received' | 'canceled';

// Update the interface to use the imported type
export interface SupplierOrder extends Omit<ImportedSupplierOrder, 'status'> {
    status: OrderStatus; // Use the imported OrderStatus type
}

const statusConfig: Record<OrderStatus, { color: string; icon: string }> = {
    pending: { color: 'warning', icon: timeOutline },
    sent: { color: 'primary', icon: paperPlaneOutline },
    shipped: { color: 'tertiary', icon: carOutline },
    received: { color: 'success', icon: checkmarkDoneCircleOutline },
    canceled: { color: 'danger', icon: closeCircleOutline }
};

interface OrderListProps {
  orders: SupplierOrder[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | null>(null);
  const [editedItems, setEditedItems] = useState<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  }[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [statusNotes, setStatusNotes] = useState<string>('');
  const router = useIonRouter();

  // Add state for alerts
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);

  // Add state for filter
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  const itemsPerPage = 10;

  const handleEdit = async (order: SupplierOrder) => {
    setEditingOrder(order);
    setEditedItems(order.items);
    setShowEditModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      await updateOrder(editingOrder.id, {
        ...editingOrder,
        items: editedItems,
        totalAmount: editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        metadata: {
          ...editingOrder.metadata,
          lastUpdated: new Date().toISOString()
        }
      });
      setShowEditModal(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editedItems];
    if (field.includes('dimensions')) {
      const [_, dimensionField] = field.split('.'); // Split 'dimensions.length' into ['dimensions', 'length']
      newItems[index] = {
        ...newItems[index],
        dimensions: {
          ...newItems[index].dimensions,
          [dimensionField]: value
        }
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setEditedItems(newItems);
  };

  // Modify handleDelete
  const handleDelete = async (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteAlert(true);
  };

  const generateEmailBody = (order: SupplierOrder): string => {
    return `Dear ${order.supplier.name},

We would like to request the following items:

${order.items.map(item => 
  `${item.name}
   Quantity: ${item.quantity}
   Dimensions: ${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}cm
   Price: €${item.price.toFixed(2)}`
).join('\n\n')}

Total: €${order.totalAmount.toFixed(2)}

Thank you,
Hannons Kitchens`;
  };

  const generatePDF = (order: SupplierOrder) => {
    const doc = new jsPDF();
      
    // Add header
    doc.setFontSize(20);
    doc.text('Supply Order', 14, 15);
      
    // Add order info
    doc.setFontSize(12);
    doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, 14, 25);
    doc.text(`Order ID: ${order.id}`, 14, 32);
      
    // Add supplier info
    doc.text('Supplier Details:', 14, 42);
    doc.setFontSize(11);
    doc.text(`Name: ${order.supplier.name}`, 14, 49);
    doc.text(`Email: ${order.supplier.email}`, 14, 56);
    doc.text(`Phone: ${order.supplier.phone}`, 14, 63);
      
    // Add items table with dimensions
    doc.autoTable({
      startY: 75,
      head: [['Item', 'Quantity', 'Dimensions', 'Price', 'Total']],
      body: order.items.map(item => [
        item.name,
        item.quantity,
        `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}cm`,
        `€${item.price.toFixed(2)}`,
        `€${(item.quantity * item.price).toFixed(2)}`
      ]),
      foot: [[
        'Total',
        '',
        '',
        '',
        `€${order.totalAmount.toFixed(2)}`
      ]]
    });
      
    doc.save(`order-${order.id}.pdf`);
  };

  // Modify handleStatusChange
  const handleStatusChange = async (status: OrderStatus) => {
    setNewStatus(status);
    setShowStatusAlert(true);
  };

  // Filter orders before pagination
  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  // By default, hide received orders
  const visibleOrders = filteredOrders.filter(order => 
    order.status !== 'received' || statusFilter === 'received'
  );

  // Update pagination to use visibleOrders
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = visibleOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(visibleOrders.length / itemsPerPage);

  return (
    <div className="orders-container">
      <div className="filters">
        <IonSelect 
          value={statusFilter}
          onIonChange={e => setStatusFilter(e.detail.value)}
        >
          <IonSelectOption value="all">All Orders</IonSelectOption>
          {Object.keys(statusConfig).map(status => (
            <IonSelectOption key={status} value={status}>
              {status.replace('_', ' ').toUpperCase()}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>
      <div className="table-header">
        <div className="header-cell">Supplier</div>
        <div className="header-cell">Items</div>
        <div className="header-cell">Total</div>
        <div className="header-cell">Date</div>
        <div className="header-cell">Actions</div>
      </div>
      <div className="table-body">
        {currentOrders.map((order) => (
          <div key={order.id}>
            <div className="table-row" onClick={() => toggleOrderExpansion(order.id)}>
              <div className="table-cell">{order.supplier.name}</div>
              <div className="table-cell">
                {order.items.length} items
                <IonIcon 
                  icon={expandedOrders.includes(order.id) ? chevronDownOutline : chevronForwardOutline}
                  style={{ marginLeft: '8px' }}
                />
              </div>
              <div className="table-cell">€{order.totalAmount.toFixed(2)}</div>
              <div className="table-cell">
                {new Date(order.orderDate).toLocaleDateString()}
              </div>
              <div className="table-cell">
                <span className={`status-badge ${order.status}`}>
                  <IonIcon icon={statusConfig[order.status as OrderStatus].icon} />
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="actions-cell">
                <button 
                  className="edit-button"
                  onClick={() => handleEdit(order)}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(order.id)}
                >
                  Delete
                </button>
                <button 
                  className="pdf-button"
                  onClick={() => generatePDF(order)}
                >
                  PDF
                </button>
                <button 
                  className="email-button"
                  onClick={() => {
                    const mailtoLink = `mailto:${order.supplier.email}?subject=Stock Order Request&body=${encodeURIComponent(generateEmailBody(order))}`;
                    window.location.href = mailtoLink;
                  }}
                >
                  Email
                </button>
              </div>
            </div>
            {expandedOrders.includes(order.id) && (
              <div className="order-items-dropdown">
                {order.items.map(item => (
                  <div key={item.itemId} className="order-item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">Quantity: {item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="pagination-controls">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          <IonIcon icon={chevronBackOutline} />
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          <IonIcon icon={chevronForwardOutline} />
        </button>
      </div>
      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
        <div className="modal-content">
          <h2>Edit Order</h2>
          {editingOrder && (
            <div className="form-section">
              <h3>Supplier Information</h3>
              <div className="supplier-info">
                <p><strong>Supplier:</strong> {editingOrder.supplier.name}</p>
                <p><strong>Category:</strong> {editingOrder.supplier.category}</p>
                <p><strong>Email:</strong> {editingOrder.supplier.email}</p>
              </div>
              
              <h3>Order Items</h3>
              {editedItems.map((item, index) => (
                <div key={index} className="order-item-row">
                  <div className="item-basic-info">
                    <div className="input-group">
                      <label>Item Name</label>
                      <IonInput
                        value={item.name}
                        onIonChange={e => handleItemChange(index, 'name', e.detail.value)}
                        placeholder="Item Name"
                      />
                    </div>
                    
                    <div className="quantity-price-group">
                      <div className="input-group">
                        <label>Quantity</label>
                        <IonInput
                          type="number"
                          value={item.quantity}
                          onIonChange={e => handleItemChange(index, 'quantity', parseInt(e.detail.value!))}
                          placeholder="Quantity"
                        />
                      </div>
                      <div className="input-group">
                        <label>Price (€)</label>
                        <IonInput
                          type="number"
                          value={item.price}
                          onIonChange={e => handleItemChange(index, 'price', parseFloat(e.detail.value!))}
                          placeholder="Price"
                        />
                      </div>
                    </div>

                    <div className="dimensions-group">
                      <h4>Dimensions (cm)</h4>
                      <div className="dimensions-inputs">
                        <div className="dimension-input">
                          <label>Length</label>
                          <IonInput
                            type="number"
                            value={item.dimensions.length}
                            onIonChange={e => handleItemChange(index, 'dimensions.length', parseFloat(e.detail.value || '0'))}
                          />
                        </div>
                        <div className="dimension-input">
                          <label>Width</label>
                          <IonInput
                            type="number"
                            value={item.dimensions.width}
                            onIonChange={e => handleItemChange(index, 'dimensions.width', parseFloat(e.detail.value || '0'))}
                          />
                        </div>
                        <div className="dimension-input">
                          <label>Height</label>
                          <IonInput
                            type="number"
                            value={item.dimensions.height}
                            onIonChange={e => handleItemChange(index, 'dimensions.height', parseFloat(e.detail.value || '0'))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="order-total">
                Total: €{editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
              </div>
              <div className="status-section">
                <h3>Order Status</h3>
                <IonSelect
                  value={editingOrder.status}
                  onIonChange={e => handleStatusChange(e.detail.value)}
                >
                  {Object.keys(statusConfig).map(status => (
                    <IonSelectOption key={status} value={status}>
                      <IonIcon icon={statusConfig[status as OrderStatus].icon} />
                      {status.replace('_', ' ').toUpperCase()}
                    </IonSelectOption>
                  ))}
                </IonSelect>
                <IonInput
                  placeholder="Add status notes (optional)"
                  value={statusNotes}
                  onIonChange={e => setStatusNotes(e.detail.value!)}
                />
              </div>

              {editingOrder.statusHistory && (
                <div className="status-history">
                  <h4>Status History</h4>
                  {editingOrder.statusHistory.map((history, index) => (
                    <div key={index} className="status-update">
                      <span className="status">{history.status}</span>
                      <span className="date">
                        {new Date(history.date).toLocaleDateString()}
                      </span>
                      <span className="updater">{history.updatedBy}</span>
                      {history.notes && <p className="notes">{history.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="modal-actions">
            <IonButton fill="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </IonButton>
            <IonButton onClick={handleUpdateOrder}>
              Save Changes
            </IonButton>
          </div>
        </div>
      </IonModal>

      {/* Add alerts */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message="Are you sure you want to delete this order?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            role: 'confirm',
            handler: async () => {
              if (orderToDelete) {
                try {
                  await deleteOrder(orderToDelete);
                } catch (error) {
                  console.error('Error deleting order:', error);
                }
              }
            }
          }
        ]}
      />

      <IonAlert
        isOpen={showStatusAlert}
        onDidDismiss={() => {
          setShowStatusAlert(false);
          setNewStatus(null);
        }}
        header="Confirm Status Change"
        message={`Are you sure you want to change the status to ${newStatus?.replace('_', ' ').toUpperCase()}?`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Confirm',
            role: 'confirm',
            handler: async () => {
              if (newStatus && editingOrder) {
                try {
                  // Update the editingOrder status
                  setEditingOrder(prev => ({
                    ...prev!,
                    status: newStatus
                  }));
                  
                  if (newStatus === 'received') {
                    // First inventory update happens here through updateInventoryOnReceival
                    await updateOrderStatus(editingOrder.id, newStatus, statusNotes);
                    // Shows "All items have been added to inventory" alert
                  } else {
                    await updateOrderStatus(editingOrder.id, newStatus, statusNotes);
                  }
                  
                  // Add to status history
                  const statusUpdate = {
                    status: newStatus,
                    date: new Date().toISOString(),
                    updatedBy: auth.currentUser?.email || 'unknown',
                    notes: statusNotes
                  };
                  
                  setEditingOrder(prev => ({
                    ...prev!,
                    statusHistory: [...(prev?.statusHistory || []), statusUpdate]
                  }));

                  if (newStatus === 'received') {
                    // Update existing inventory items instead of adding new ones
                    for (const item of editingOrder.items) {
                      // Try to find existing item by name
                      const inventoryRef = collection(db, "inventoryItems");
                      const q = query(inventoryRef, where("name", "==", item.name));
                      const querySnapshot = await getDocs(q);
                      
                      if (!querySnapshot.empty) {
                        // Update existing item
                        const existingItem = querySnapshot.docs[0];
                        await updateInventoryItem(existingItem.id, {
                          quantity: existingItem.data().quantity + item.quantity,
                          metadata: {
                            ...existingItem.data().metadata,
                            lastUpdated: new Date().toISOString()
                          }
                        });
                      } else {
                        // Only create new item if it doesn't exist
                        await addInventoryItem({
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price,
                          category: editingOrder.supplier.category,
                          dimensions: item.dimensions,
                          location: {
                            aisle: "",
                            shelf: "",
                            section: ""
                          },
                          metadata: {
                            addedBy: auth.currentUser?.email || 'unknown',
                            addedDate: new Date().toISOString()
                          }
                        });
                      }
                    }

                    // Force refresh of ML predictions
                    window.location.reload();
                    
                    alert('All items have been added to inventory');
                  }
                } catch (error) {
                  console.error('Error updating status:', error);
                }
              }
            }
          }
        ]}
      />
    </div>
  );
};

export default OrderList;