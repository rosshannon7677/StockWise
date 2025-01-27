import React, { useState } from 'react';
import { IonCard, IonCardHeader, IonCardContent, IonBadge, IonButton } from '@ionic/react';
import './OrderList.css';
import { SupplierOrder } from '../firestoreService';

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderListProps {
  orders: SupplierOrder[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'warning';
      case 'sent': return 'primary';
      case 'received': return 'success';
      default: return 'medium';
    }
  };

  const generateEmailBody = (order: SupplierOrder): string => {
    return `Dear ${order.supplier.name},\n\nWe would like to request the following items:\n\n${order.items.map(item => `${item.name} x${item.quantity}`).join('\n')}\n\nThank you,\nYour Company`;
  };

  return (
    <div className="orders-container">
      {orders.map((order) => (
        <IonCard key={order.id} className="order-card">
          <IonCardHeader>
            <div className="order-header">
              <h3>{order.supplier.name}</h3>
              <div className="order-actions">
                <IonBadge color={getStatusColor(order.status)}>
                  {order.status}
                </IonBadge>
                <IonButton 
                  fill="clear" 
                  size="small"
                  onClick={() => {
                    const mailtoLink = `mailto:${order.supplier.email}?subject=Stock Order Request&body=${encodeURIComponent(generateEmailBody(order))}`;
                    window.location.href = mailtoLink;
                  }}
                >
                  Send Email
                </IonButton>
              </div>
            </div>
          </IonCardHeader>
          <IonCardContent>
            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>€{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-footer">
              <p>Total: €{order.totalAmount.toFixed(2)}</p>
              <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
          </IonCardContent>
        </IonCard>
      ))}
    </div>
  );
};

export default OrderList;