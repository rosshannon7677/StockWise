// src/components/AddSupplier.tsx
import React, { useState } from "react";
import { addSupplier } from "../firestoreService";
import { auth } from '../../firebaseConfig';
import { IonButton } from '@ionic/react';
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
            <textarea 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              required 
            />
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
    </div>
  );
};

export default AddSupplier;