import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonButton, IonIcon, IonModal, IonItem, 
  IonLabel, IonInput, IonSelect, IonSelectOption, IonList
} from '@ionic/react';
import { addOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import OrderList from '../../components/orders/OrderList';
import { getOrders, addOrder, getInventoryItems, getSuppliers } from '../../firestoreService';
import type { SupplierOrder, InventoryItem, Supplier } from '../../firestoreService';
import './Orders.css';
import { auth } from '../../../firebaseConfig';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Add this
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<{
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

  // Get unique supplier categories
  const supplierCategories = Array.from(new Set(suppliers.map(s => s.category)));

  // Filter suppliers based on selected category
  const filteredSuppliers = suppliers.filter(s => s.category === selectedCategory);
  
  useEffect(() => {
    const unsubscribeOrders = getOrders((fetchedOrders) => {
      setOrders(fetchedOrders);
    });

    const unsubscribeSuppliers = getSuppliers((fetchedSuppliers) => {
      setSuppliers(fetchedSuppliers);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSuppliers();
    };
  }, []);

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { 
      itemId: `temp-${Date.now()}`,  // Generate a temporary unique ID
      name: '', 
      quantity: 1, 
      price: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0
      }
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    if (field === 'dimensions') {
      newItems[index] = { ...newItems[index], dimensions: value };
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
          phone: supplier.phone,
          category: supplier.category // Add supplier category
        },
        items: selectedItems,
        status: 'pending',
        totalAmount: calculateTotal(),
        orderDate: new Date().toISOString(),
        statusHistory: [  // Add this field
          {
            status: 'pending',
            date: new Date().toISOString(),
            updatedBy: auth.currentUser?.email || 'unknown'
          }
        ],
        metadata: {
          addedBy: auth.currentUser?.email || '',
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
    setSelectedCategory(''); // Add this
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
              <h3>Select Category</h3>
              <IonItem>
                <IonLabel position="floating">Category</IonLabel>
                <IonSelect 
                  value={selectedCategory} 
                  onIonChange={e => {
                    setSelectedCategory(e.detail.value);
                    setSelectedSupplier(''); // Reset supplier when category changes
                  }}
                >
                  {supplierCategories.map(category => (
                    <IonSelectOption key={category} value={category}>
                      {category}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </div>

            {selectedCategory && (
              <div className="form-section">
                <h3>Select Supplier</h3>
                <IonItem>
                  <IonLabel position="floating">Supplier</IonLabel>
                  <IonSelect 
                    value={selectedSupplier} 
                    onIonChange={e => setSelectedSupplier(e.detail.value)}
                  >
                    {filteredSuppliers.map(supplier => (
                      <IonSelectOption key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </div>
            )}

            {selectedSupplier && (
              <div className="form-section">
                <h3>Order Items</h3>
                <IonButton onClick={handleAddItem} size="small">
                  <IonIcon slot="start" icon={addCircleOutline} />
                  Add Item
                </IonButton>
                
                {selectedItems.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <div className="item-basic-info">
                      <div className="input-group">
                        <label>Item Name</label>
                        <IonInput
                          placeholder="Enter item name"
                          value={item.name}
                          onIonChange={e => handleItemChange(index, 'name', e.detail.value)}
                        />
                      </div>
                      
                      <div className="quantity-price-group">
                        <div className="input-group">
                          <label>Quantity</label>
                          <IonInput
                            type="number"
                            placeholder="Enter quantity"
                            value={item.quantity}
                            onIonChange={e => handleItemChange(index, 'quantity', parseInt(e.detail.value!))}
                          />
                        </div>
                        <div className="input-group">
                          <label>Price (€)</label>
                          <IonInput
                            type="number"
                            placeholder="Enter price"
                            value={item.price}
                            onIonChange={e => handleItemChange(index, 'price', parseFloat(e.detail.value!))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="dimensions-group">
                      <h4>Dimensions (cm)</h4>
                      <div className="dimensions-inputs">
                        <div className="dimension-input">
                          <label>Length</label>
                          <IonInput
                            type="number"
                            placeholder="Length"
                            value={item.dimensions.length}
                            onIonChange={e => {
                              const value = parseFloat(e.detail.value || '0');
                              handleItemChange(index, 'dimensions', {
                                ...item.dimensions,
                                length: value
                              });
                            }}
                          />
                        </div>
                        <div className="dimension-input">
                          <label>Width</label>
                          <IonInput
                            type="number"
                            placeholder="Width"
                            value={item.dimensions.width}
                            onIonChange={e => {
                              const value = parseFloat(e.detail.value || '0');
                              handleItemChange(index, 'dimensions', {
                                ...item.dimensions,
                                width: value
                              });
                            }}
                          />
                        </div>
                        <div className="dimension-input">
                          <label>Height</label>
                          <IonInput
                            type="number"
                            placeholder="Height"
                            value={item.dimensions.height}
                            onIonChange={e => {
                              const value = parseFloat(e.detail.value || '0');
                              handleItemChange(index, 'dimensions', {
                                ...item.dimensions,
                                height: value
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
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
            )}

            <div className="modal-actions">
              <IonButton 
                fill="outline" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </IonButton>
              <IonButton 
              
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