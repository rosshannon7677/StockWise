import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonButton, IonIcon, IonModal, IonItem, 
  IonLabel, IonInput, IonSelect, IonSelectOption, IonList
} from '@ionic/react';
import { addOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import OrderList from '../components/OrderList';
import { getOrders, addOrder, getInventoryItems, getSuppliers } from '../firestoreService';
import type { SupplierOrder, InventoryItem, Supplier } from '../firestoreService';
import './Orders.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  
  useEffect(() => {
    const unsubscribeOrders = getOrders((fetchedOrders) => {
      setOrders(fetchedOrders);
    });

    const unsubscribeInventory = getInventoryItems((items) => {
      setInventoryItems(items);
    });

    const unsubscribeSuppliers = getSuppliers((fetchedSuppliers) => {
      setSuppliers(fetchedSuppliers);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeInventory();
      unsubscribeSuppliers();
    };
  }, []);

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { itemId: '', name: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    if (field === 'itemId') {
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        newItems[index] = {
          ...newItems[index],
          itemId: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price,
          quantity: 1
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    try {
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      if (!supplier) return;

      const orderData: Omit<SupplierOrder, 'id'> = {
        supplier: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone
        },
        items: selectedItems,
        status: 'pending',
        totalAmount: calculateTotal(),
        orderDate: new Date().toISOString(),
        metadata: {
          addedBy: '',
          addedDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };

      await addOrder(orderData);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setSelectedSupplier('');
  };

  return (
    <IonContent>
      <div className="orders-container">
        
        <div className="actions-bar">
          <IonButton onClick={() => setShowModal(true)}>
            <IonIcon slot="start" icon={addOutline} />
            New Order
          </IonButton>
        </div>
        <OrderList orders={orders} />

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <div className="modal-content">
            <h2>Create Supply Order</h2>
            
            <div className="form-section">
              <h3>Select Supplier</h3>
              <IonItem>
                <IonLabel position="floating">Supplier</IonLabel>
                <IonSelect value={selectedSupplier} onIonChange={e => setSelectedSupplier(e.detail.value)}>
                  {suppliers.map(supplier => (
                    <IonSelectOption key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </div>

            <div className="form-section">
              <h3>Order Items</h3>
              <IonButton onClick={handleAddItem} size="small">
                <IonIcon slot="start" icon={addCircleOutline} />
                Add Item
              </IonButton>
              
              {selectedItems.map((item, index) => (
                <div key={index} className="order-item-row">
                  <IonSelect
                    value={item.itemId}
                    placeholder="Select Item"
                    onIonChange={e => handleItemChange(index, 'itemId', e.detail.value)}
                  >
                    {inventoryItems.map(invItem => (
                      <IonSelectOption key={invItem.id} value={invItem.id}>
                        {invItem.name} (€{invItem.price})
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                  <IonInput
                    type="number"
                    value={item.quantity}
                    placeholder="Qty"
                    min="1"
                    onIonChange={e => handleItemChange(index, 'quantity', parseInt(e.detail.value!))}
                  />
                  <div className="item-total">€{(item.price * item.quantity).toFixed(2)}</div>
                  <IonButton 
                    fill="clear" 
                    color="danger" 
                    onClick={() => handleRemoveItem(index)}
                  >
                    <IonIcon icon={removeCircleOutline} />
                  </IonButton>
                </div>
              ))}
              
              <div className="order-total">
                Total: €{calculateTotal().toFixed(2)}
              </div>
            </div>

            <div className="modal-actions">
              <IonButton 
                fill="outline" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </IonButton>
              <IonButton 
                color="primary"
                onClick={handleCreateOrder}
                disabled={!selectedSupplier || selectedItems.length === 0}
              >
                Submit Order
              </IonButton>
            </div>
          </div>
        </IonModal>
      </div>
    </IonContent>
  );
};

export default Orders;