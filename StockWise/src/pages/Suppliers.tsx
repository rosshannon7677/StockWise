import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import SupplierList from '../components/SupplierList';
import { getSuppliers } from '../firestoreService';
import AddSupplier from '../components/AddSupplier';

// Add interface for Supplier
interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  metadata: {
    addedBy: string;
    addedDate: string;
  };
}

const Suppliers: React.FC = () => {
  // Update state type to Supplier[]
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    getSuppliers((fetchedSuppliers: Supplier[]) => {
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