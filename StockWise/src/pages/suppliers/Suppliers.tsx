import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import SupplierList, { Supplier } from '../../components/suppliers/SupplierList';
import { getSuppliers } from '../../firestoreService';
import AddSupplier from '../../components/suppliers/AddSupplier';
import './Suppliers.css';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    getSuppliers((fetchedSuppliers) => {
      // Ensure all suppliers have a category
      const suppliersWithCategory = fetchedSuppliers.map(s => ({
        ...s,
        category: s.category || 'Uncategorized'
      }));
      setSuppliers(suppliersWithCategory);
    });
  }, []);

  return (
    <IonContent>
      <div className="suppliers-container">
        <div className="actions-bar">
          <IonButton
            onClick={() => setShowAddModal(true)}
            color="primary"
            className="add-supplier-button"
          >
            <IonIcon slot="start" icon={addOutline} />
            Add Supplier
          </IonButton>
        </div>
        <SupplierList suppliers={suppliers} />
      </div>
      <IonModal
        isOpen={showAddModal}
        onDidDismiss={() => setShowAddModal(false)}
        className="add-supplier-modal"
      >
        <AddSupplier onClose={() => setShowAddModal(false)} />
      </IonModal>
    </IonContent>
  );
};

export default Suppliers;