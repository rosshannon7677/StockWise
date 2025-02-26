import React, { useState } from "react";
import "./SupplierList.css";
import { addSupplier, updateSupplier, deleteSupplier } from '../../firestoreService';
import { IonIcon, IonModal, IonInput, IonSelect, IonSelectOption, IonButton, IonTextarea, IonAlert } from '@ionic/react';
import { chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';
import { getSupplierLocation, GOOGLE_MAPS_API_KEY, WORKSHOP_LOCATION } from '../../services/mapsService';

// Change from 'interface Supplier' to 'export interface Supplier'
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string; // Add this field
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
  const [category, setCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const itemsPerPage = 10;

  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedDistance, setSelectedDistance] = useState<string>('');
  const [searchAddress, setSearchAddress] = useState("");

  // Add state for delete alert
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const supplierCategories = [
    'Timber',
    'Countertops',
    'Tools',
    'Paint',
    'Edge/Trim',
    'Screw',
    'Nail',
    'Screw'
  ] as const;

  const columns = [
    { field: 'name', headerName: 'Name', width: '20%' },
    { field: 'email', headerName: 'Email', width: '20%' },
    { field: 'phone', headerName: 'Phone', width: '15%' },
    { field: 'category', headerName: 'Category', width: '15%' },
    { field: 'address', headerName: 'Address', width: '20%' },
    { field: 'actions', headerName: 'Actions', width: '10%' }
  ];

  // Update handleDelete
  const handleDelete = async (id: string) => {
    setSupplierToDelete(id);
    setShowDeleteAlert(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setEmail(supplier.email);
    setPhone(supplier.phone);
    setAddress(supplier.address);
    setCategory(supplier.category);
    setNotes(supplier.notes || "");
    setShowEditModal(true);
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateSupplier(id, {
        name,
        email,
        phone,
        address,
        notes,
        category
      });
      
      // Reset states
      setEditSupplierId(null);
      setShowEditModal(false); // Close the modal
      setEditingSupplier(null); // Clear editing supplier
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

  const handleAddressSearch = async () => {
    try {
      if (!searchAddress.trim()) {
        alert('Please enter an address to search');
        return;
      }
  
      const { location, formattedAddress } = await getSupplierLocation(searchAddress);
      setSelectedLocation({
        ...location,
        formattedAddress
      });
      setAddress(formattedAddress);
      setSearchAddress(formattedAddress);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error finding location. Please try again.');
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setCategory("");
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
                <div className="table-cell" style={{ width: '15%' }}>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="edit-input"
                  >
                    {supplierCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
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
                <div className="table-cell">{supplier.category}</div>
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
                  &destination={selectedLocation.lat},${selectedLocation.lng}
                  &mode=driving`}
              />
            </>
          )}
        </div>
      </IonModal>
      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
        <div className="modal-content">
          <h2>Edit Supplier</h2>
          {editingSupplier && (
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="supplier-basic-info">
                <div className="input-group">
                  <label>Company Name</label>
                  <IonInput
                    value={name}
                    onIonChange={e => setName(e.detail.value!)}
                    placeholder="Company Name"
                  />
                </div>
                
                <div className="input-group">
                  <label>Category</label>
                  <IonSelect 
                    value={category}
                    onIonChange={e => setCategory(e.detail.value)}
                  >
                    {supplierCategories.map(cat => (
                      <IonSelectOption key={cat} value={cat}>
                        {cat}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </div>
              </div>

              <div className="contact-info-group">
                <div className="input-group">
                  <label>Email</label>
                  <IonInput
                    type="email"
                    value={email}
                    onIonChange={e => setEmail(e.detail.value!)}
                    placeholder="Email"
                  />
                </div>
                <div className="input-group">
                  <label>Phone</label>
                  <IonInput
                    type="tel"
                    value={phone}
                    onIonChange={e => setPhone(e.detail.value!)}
                    placeholder="Phone"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Address & Notes</h3>
            <div className="address-input-container">
              <IonInput
                value={searchAddress}
                onIonChange={e => setSearchAddress(e.detail.value!)}
                placeholder="Search for supplier address..."
              />
              <IonButton 
                size="small"
                onClick={handleAddressSearch}
              >
                Search
              </IonButton>
            </div>
            <IonTextarea
              value={address}
              onIonChange={e => setAddress(e.detail.value!)}
              placeholder="Full address"
              rows={3}
            />
            <IonTextarea
              value={notes}
              onIonChange={e => setNotes(e.detail.value!)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <IonButton fill="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </IonButton>
            <IonButton onClick={() => handleUpdate(editingSupplier!.id)}>
              Save Changes
            </IonButton>
          </div>
        </div>
      </IonModal>
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message="Are you sure you want to delete this supplier?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            role: 'confirm',
            handler: async () => {
              if (supplierToDelete) {
                await deleteSupplier(supplierToDelete);
              }
            }
          }
        ]}
      />
    </div>
  );
};

export default SupplierList;