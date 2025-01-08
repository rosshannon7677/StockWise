// src/components/InventoryList.tsx
import React, { useState } from "react";
import "./InventoryList.css";
import { deleteInventoryItem, updateInventoryItem } from "../firestoreService";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  location: {
    aisle: string;
    shelf: string;
    section: string;
  };
  metadata: {
    addedBy: string;
    addedDate: string;
  };
}

interface InventoryListProps {
  items: InventoryItem[];
  categories: string[];
}

const InventoryList: React.FC<InventoryListProps> = ({ items = [], categories = [] }) => {
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [updatedItem, setUpdatedItem] = useState<Partial<InventoryItem>>({});

  if (!items || items.length === 0) {
    return <div className="no-items">No inventory items found</div>;
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");
    if (confirmDelete) {
      await deleteInventoryItem(id);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditItemId(item.id);
    setUpdatedItem({
      ...item,
      dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
      location: item.location || { aisle: '', shelf: '', section: '' },
      metadata: item.metadata || { addedBy: '', addedDate: new Date().toISOString() }
    });
  };

  const handleUpdate = async (id: string) => {
    if (!updatedItem) return;
    
    try {
      await updateInventoryItem(id, updatedItem);
      setEditItemId(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleChange = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setUpdatedItem(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
          ...(parent === 'metadata' ? { addedDate: prev.metadata?.addedDate || new Date().toISOString() } : {})
        }
      }));
    } else {
      setUpdatedItem(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="inventory-list">
      {items.map((item) => (
        <div key={item.id} className="inventory-item">
          {editItemId === item.id ? (
            <div className="edit-form">
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={updatedItem.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={updatedItem.quantity || 0}
                    onChange={(e) => handleChange("quantity", Number(e.target.value))}
                    placeholder="Quantity"
                  />
                </div>
                <div className="form-group">
                  <label>Price:</label>
                  <input
                    type="number"
                    value={updatedItem.price || 0}
                    onChange={(e) => handleChange("price", Number(e.target.value))}
                    placeholder="Price"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Dimensions</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Length:</label>
                    <input
                      type="number"
                      value={updatedItem.dimensions?.length || 0}
                      onChange={(e) => handleChange("dimensions.length", Number(e.target.value))}
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Width:</label>
                    <input
                      type="number"
                      value={updatedItem.dimensions?.width || 0}
                      onChange={(e) => handleChange("dimensions.width", Number(e.target.value))}
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Height:</label>
                    <input
                      type="number"
                      value={updatedItem.dimensions?.height || 0}
                      onChange={(e) => handleChange("dimensions.height", Number(e.target.value))}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Location</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Aisle:</label>
                    <input
                      type="text"
                      value={updatedItem.location?.aisle || ""}
                      onChange={(e) => handleChange("location.aisle", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Shelf:</label>
                    <input
                      type="text"
                      value={updatedItem.location?.shelf || ""}
                      onChange={(e) => handleChange("location.shelf", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Section:</label>
                    <input
                      type="text"
                      value={updatedItem.location?.section || ""}
                      onChange={(e) => handleChange("location.section", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Additional Information</h4>
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={updatedItem.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Description"
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label>Added By:</label>
                  <input
                    type="text"
                    value={updatedItem.metadata?.addedBy || ""}
                    onChange={(e) => handleChange("metadata.addedBy", e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
              </div>

              <div className="button-group">
                <button onClick={() => handleUpdate(item.id)} className="save-button">Save</button>
                <button onClick={() => setEditItemId(null)} className="cancel-button">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <h3>{item.name || 'Unnamed Item'}</h3>
              <div className="item-details">
                <div className="details-section">
                  <p><strong>Quantity:</strong> {item.quantity || 0}</p>
                  <p><strong>Price:</strong> ${(item.price || 0).toFixed(2)}</p>
                  <p><strong>Description:</strong> {item.description || "No description"}</p>
                </div>
                
                <div className="details-section">
                  <h4>Dimensions</h4>
                  <p>Length: {item.dimensions?.length || 0}cm</p>
                  <p>Width: {item.dimensions?.width || 0}cm</p>
                  <p>Height: {item.dimensions?.height || 0}cm</p>
                </div>

                <div className="details-section">
                  <h4>Location</h4>
                  <p>Aisle: {item.location?.aisle || 'Not set'}</p>
                  <p>Shelf: {item.location?.shelf || 'Not set'}</p>
                  <p>Section: {item.location?.section || 'Not set'}</p>
                </div>

                <div className="details-section">
                  <h4>Metadata</h4>
                  <p>Added By: {item.metadata?.addedBy || 'Unknown'}</p>
                  <p>Added Date: {item.metadata?.addedDate ? new Date(item.metadata.addedDate).toLocaleDateString() : 'Unknown'}</p>
                </div>
              </div>

              <div className="item-actions">
                <button onClick={() => handleEdit(item)}>Edit Item</button>
                <button onClick={() => handleDelete(item.id)} className="delete-button">Delete Item</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InventoryList;
