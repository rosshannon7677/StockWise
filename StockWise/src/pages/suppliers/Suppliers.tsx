import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import SupplierList from '../../components/suppliers/SupplierList';
import { getSuppliers, Supplier } from '../../firestoreService'; // Import the type
import AddSupplier from '../../components/suppliers/AddSupplier';

// Remove local interface since we're importing it

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    getSuppliers((fetchedSuppliers) => {
      setSuppliers(fetchedSuppliers);
    });
  }, []);

  return (
    <IonContent>
      <div className="supplier-container">
        <div className="supplier-section">
          <div className="search-filter-container">
            <IonButton
              onClick={() => setShowAddModal(true)}
              color="primary"
              className="add-item-button"
            >
              <IonIcon slot="start" icon={addOutline} />
              Add Supplier
            </IonButton>
          </div>
          <SupplierList suppliers={suppliers} />
        </div>
      </div>
      <IonModal
        isOpen={showAddModal}
        onDidDismiss={() => setShowAddModal(false)}
        className="add-item-modal"
      >
        <AddSupplier onClose={() => setShowAddModal(false)} />
      </IonModal>
    </IonContent>
  );
};

export default Suppliers;