import React, { useState } from "react";
import "./SupplierList.css";
import { addSupplier, updateSupplier, deleteSupplier } from '../firestoreService';
import { IonIcon, IonModal } from '@ionic/react';
import { chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';
import { getSupplierLocation, GOOGLE_MAPS_API_KEY, WORKSHOP_LOCATION } from '../services/mapsService';

// Change from 'interface Supplier' to 'export interface Supplier'
export interface Supplier {
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

interface SupplierListProps {
  suppliers: Supplier[];
}

const SupplierList: React.FC<SupplierListProps> = ({ suppliers = [] }) => {
  const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedDistance, setSelectedDistance] = useState<string>('');

  const columns = [
    { field: 'name', headerName: 'Name', width: '15%' },
    { field: 'email', headerName: 'Email', width: '20%' },
    { field: 'phone', headerName: 'Phone', width: '15%' },
    { field: 'address', headerName: 'Address', width: '25%' }, // Reduced from 30%
    { field: 'actions', headerName: 'Actions', width: '15%' }  // Increased from 10%
  ];

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this supplier?");
    if (confirmDelete) {
      await deleteSupplier(id);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditSupplierId(supplier.id);
    setName(supplier.name);
    setEmail(supplier.email);
    setPhone(supplier.phone);
    setAddress(supplier.address);
    setNotes(supplier.notes || "");
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateSupplier(id, {
        name,
        email,
        phone,
        address,
        notes
      });
      setEditSupplierId(null);
      resetForm();
    } catch (error) {
      console.error('Error updating supplier:', error);
    }
  };

  const handleAddressClick = async (address: string) => {
    try {
      const { location, formattedAddress } = await getSupplierLocation(address);
      setSelectedLocation({
        ...location,
        formattedAddress
      });
      setShowMap(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = suppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);

  return (
    <div className="supplier-table">
      <div className="table-header">
        {columns.map((col) => (
          <div key={col.field} className="header-cell" style={{ width: col.width }}>
            {col.headerName}
          </div>
        ))}
      </div>
      <div className="table-body">
        {currentSuppliers.map((supplier) => (
          <div key={supplier.id} className={`table-row ${editSupplierId === supplier.id ? 'editing' : ''}`}>
            {editSupplierId === supplier.id ? (
              <>
                <div className="table-cell" style={{ width: '15%' }}>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="edit-input"
                  />
                </div>
                <div className="table-cell" style={{ width: '20%' }}>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="edit-input"
                  />
                </div>
                <div className="table-cell" style={{ width: '15%' }}>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="edit-input"
                  />
                </div>
                <div className="table-cell" style={{ width: '25%' }}> {/* Reduced from 40% */}
                  <input 
                    type="text" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    className="edit-input"
                  />
                </div>
                <div className="actions-cell" style={{ width: '15%' }}> {/* Increased from 10% */}
                  <button onClick={() => handleUpdate(supplier.id)} className="save-button">Save</button>
                  <button onClick={() => setEditSupplierId(null)} className="cancel-button">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="table-cell">{supplier.name}</div>
                <div className="table-cell">{supplier.email}</div>
                <div className="table-cell">{supplier.phone}</div>
                <div 
                  className="table-cell address-cell" 
                  onClick={() => handleAddressClick(supplier.address)}
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {supplier.address}
                </div>
                <div className="actions-cell">
                  <button onClick={() => handleEdit(supplier)} className="edit-button">Edit</button>
                  <button onClick={() => handleDelete(supplier.id)} className="delete-button">Delete</button>
                </div>
              </>
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
      <IonModal isOpen={showMap} onDidDismiss={() => setShowMap(false)} className="map-modal">
        <div style={{ width: '100%', height: '80vh' }}>
          {selectedLocation && (
            <>
              <div style={{ 
                padding: '1.5rem',
                borderBottom: '1px solid var(--ion-color-light-shade)',
                background: 'var(--ion-background-color)'
              }}>
                <h2 style={{ 
                  margin: '0 0 1rem 0',
                  color: 'var(--ion-color-primary)',
                  fontSize: '1.5rem'
                }}>Location Details</h2>
                <div style={{ 
                  display: 'grid',
                  gap: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  <p style={{ margin: 0 }}>
                    <strong>{WORKSHOP_LOCATION.name}</strong> ↔ 
                    <strong> {selectedLocation.formattedAddress}</strong>
                  </p>
                </div>
              </div>
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}
                  &origin=${WORKSHOP_LOCATION.lat},${WORKSHOP_LOCATION.lng}
                  &destination=${selectedLocation.lat},${selectedLocation.lng}
                  &mode=driving`}
              />
            </>
          )}
        </div>
      </IonModal>
    </div>
  );
};

export default SupplierList;