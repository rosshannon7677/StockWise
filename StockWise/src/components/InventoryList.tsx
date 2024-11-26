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
  category: string;
}

interface InventoryListProps {
  items: InventoryItem[];
  categories: string[];
}

const InventoryList: React.FC<InventoryListProps> = ({ items, categories }) => {
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [updatedItem, setUpdatedItem] = useState<Partial<InventoryItem>>({});

  // This function handles the deletion of an inventory item.
const handleDelete = async (id: string) => {
  // Display a confirmation dialog to the user.
  const confirmDelete = window.confirm("Are you sure you want to delete this item?");
  
  // If the user confirms the deletion:
  if (confirmDelete) {
    // Call the deleteInventoryItem function, passing the item's ID to delete it from Firestore.
    await deleteInventoryItem(id);
  }
};


  const handleEdit = (item: InventoryItem) => {
    setEditItemId(item.id);
    setUpdatedItem(item);
  };

  const handleUpdate = async (id: string) => {
    await updateInventoryItem(id, updatedItem);
    setEditItemId(null); // Exit edit mode
  };

  const handleChange = (key: keyof InventoryItem, value: string | number) => {
    setUpdatedItem((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="inventory-list">
      {items.map((item) => (
        <div key={item.id} className="inventory-item">
          {editItemId === item.id ? (
            <div className="edit-form">
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
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={updatedItem.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description"
                  rows={3}
                />
              </div>
              <div className="button-group">
                <button onClick={() => handleUpdate(item.id)} className="save-button">Save</button>
                <button onClick={() => setEditItemId(null)} className="cancel-button">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <h3>{item.name}</h3>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Quantity:</strong> {item.quantity}</p>
              <p><strong>Price:</strong> ${item.price.toFixed(2)}</p>
              <p><strong>Description:</strong> {item.description || "No description"}</p>
              <button onClick={() => handleEdit(item)}>Edit Item</button>
              <button onClick={() => handleDelete(item.id)} className="delete-button">Delete Item</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InventoryList;
