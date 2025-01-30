import React, { useState } from 'react';
import { IonIcon, IonModal, IonButton, IonInput, IonSelect, IonSelectOption } from '@ionic/react';
import { chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';
import './OrderList.css';
import { SupplierOrder, deleteOrder, updateOrder } from '../firestoreService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

// Add type declaration for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

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

  const handleDelete = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(orderId);
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const generateEmailBody = (order: SupplierOrder): string => {
    return `Dear ${order.supplier.name},\n\nWe would like to request the following items:\n\n${order.items.map(item => `${item.name} x${item.quantity}`).join('\n')}\n\nThank you,\nYour Company`;
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
      head: [['Item', 'Quantity', 'Price', 'Dimensions', 'Total']],
      body: order.items.map(item => [
        item.name,
        item.quantity,
        `€${item.price.toFixed(2)}`,
        `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}cm`,
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <div className="orders-container">
      <div className="table-header">
        <div className="header-cell">Supplier</div>
        <div className="header-cell">Items</div>
        <div className="header-cell">Total</div>
        <div className="header-cell">Date</div>
        <div className="header-cell">Actions</div>
      </div>
      <div className="table-body">
        {currentOrders.map((order) => (
          <div key={order.id} className="table-row">
            <div className="table-cell">{order.supplier.name}</div>
            <div className="table-cell">
              {order.items.map(item => (
                <div key={item.itemId} className="order-item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                  {item.dimensions && (
                    <div className="item-dimensions">
                      <span>L: {item.dimensions.length}</span>
                      <span>W: {item.dimensions.width}</span>
                      <span>H: {item.dimensions.height}</span>
                      <span className="unit">cm</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="table-cell">€{order.totalAmount.toFixed(2)}</div>
            <div className="table-cell">
              {new Date(order.orderDate).toLocaleDateString()}
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
    </div>
  );
};

export default OrderList;