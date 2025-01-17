import React, { useState } from "react";
import "./SupplierList.css";
import { addSupplier, updateSupplier, deleteSupplier } from '../firestoreService';
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';

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
                <div className="table-cell">{supplier.address}</div>
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
    </div>
  );
};

export default SupplierList;