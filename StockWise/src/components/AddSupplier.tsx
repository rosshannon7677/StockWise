// src/components/AddSupplier.tsx
import React, { useState } from "react";
import { addSupplier } from "../firestoreService";
import { auth } from '../../firebaseConfig';
import { IonButton, IonModal } from '@ionic/react';
import { getSupplierLocation, GOOGLE_MAPS_API_KEY } from '../services/mapsService';
import './AddItem.css'; // We can reuse the AddItem styles

interface AddSupplierProps {
  onClose: () => void;
}

const AddSupplier: React.FC<AddSupplierProps> = ({ onClose }) => {
  const currentUser = auth.currentUser;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addSupplier({
      name,
      email,
      phone,
      address,
      notes,
      metadata: {
        addedBy: currentUser?.email || 'unknown',
        addedDate: new Date().toISOString()
      }
    });

    // Reset form
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    
    onClose();
    alert("Supplier added successfully!");
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

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h3>Add New Supplier</h3>
        <IonButton fill="clear" onClick={onClose}>Close</IonButton>
      </div>
      <form onSubmit={handleSubmit} className="add-item-form">
        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-group">
            <label>Company Name:</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Phone:</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Address & Notes</h4>
          <div className="form-group">
            <label>Address:</label>
            <div className="address-input-container">
              <input 
                type="text" 
                value={searchAddress} 
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Search for supplier address..."
              />
              <IonButton 
                onClick={handleAddressSearch}
                size="small"
                style={{ marginLeft: '8px' }}
              >
                Search
              </IonButton>
            </div>
            <textarea 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              required 
            />
            {selectedLocation && (
              <IonButton 
                onClick={() => setShowAddressModal(true)}
                expand="block"
                style={{ marginTop: '8px' }}
              >
                View on Map
              </IonButton>
            )}
          </div>
          
          <div className="form-group">
            <label>Notes:</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about the supplier..."
            />
          </div>

          <div className="form-group">
            <label>Added By:</label>
            <input 
              type="text" 
              value={currentUser?.email || 'Unknown'} 
              disabled
              className="added-by-input"
            />
          </div>
        </div>
        
        <button type="submit" className="submit-button">Add Supplier</button>
      </form>

      <IonModal 
        isOpen={showAddressModal} 
        onDidDismiss={() => setShowAddressModal(false)}
        className="map-modal"
      >
        <div style={{ width: '100%', height: '80vh' }}>
          {selectedLocation && (
            <>
              <div style={{ 
                padding: '1rem',
                borderBottom: '1px solid var(--ion-color-light-shade)',
                background: 'var(--ion-background-color)'
              }}>
                <h3>Selected Location</h3>
                <p>{selectedLocation.formattedAddress}</p>
              </div>
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}
                  &q=${selectedLocation.lat},${selectedLocation.lng}`}
              />
            </>
          )}
        </div>
      </IonModal>
    </div>
  );
};

export default AddSupplier;