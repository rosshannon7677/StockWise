import React, { useState } from 'react';
import { IonIcon, IonModal, IonButton, IonInput, IonSelect, IonSelectOption } from '@ionic/react';
import { chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';
import './OrderList.css';
import { SupplierOrder, deleteOrder, updateOrder } from '../firestoreService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    newItems[index] = { ...newItems[index], [field]: value };
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
    
    // Add items table
    doc.autoTable({
      startY: 75,
      head: [['Item', 'Quantity', 'Price', 'Total']],
      body: order.items.map(item => [
        item.name,
        item.quantity,
        `€${item.price.toFixed(2)}`,
        `€${(item.quantity * item.price).toFixed(2)}`
      ]),
      foot: [[
        'Total',
        '',
        '',
        `€${order.totalAmount.toFixed(2)}`
      ]],
    });
    
    // Save the PDF
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
              {order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
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
              <h3>Order Items</h3>
              {editedItems.map((item, index) => (
                <div key={index} className="order-item-row">
                  <IonInput
                    value={item.name}
                    onIonChange={e => handleItemChange(index, 'name', e.detail.value)}
                    placeholder="Item Name"
                  />
                  <IonInput
                    type="number"
                    value={item.quantity}
                    onIonChange={e => handleItemChange(index, 'quantity', parseInt(e.detail.value!))}
                    placeholder="Quantity"
                  />
                  <IonInput
                    type="number"
                    value={item.price}
                    onIonChange={e => handleItemChange(index, 'price', parseFloat(e.detail.value!))}
                    placeholder="Price"
                  />
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
            <IonButton color="primary" onClick={handleUpdateOrder}>
              Save Changes
            </IonButton>
          </div>
        </div>
      </IonModal>
    </div>
  );
};

export default OrderList;