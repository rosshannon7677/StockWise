// src/components/InventoryList.tsx
import React, { useState } from "react";
import "./InventoryList.css";
import { addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../firestoreService';
import { auth } from '../../firebaseConfig';
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
  category: string;
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
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dimensions, setDimensions] = useState({
    length: 0,
    width: 0,
    height: 0
  });
  const [location, setLocation] = useState({
    aisle: "",
    shelf: "",
    section: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    // Set all the form values with the item's current values
    setUpdatedItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setPrice(item.price);
    setDescription(item.description || "");
    setCategory(item.category);
    setDimensions(item.dimensions);
    setLocation(item.location);
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateInventoryItem(id, {
        name,
        quantity,
        price,
        description,
        category,
        dimensions,
        location,
        metadata: updatedItem.metadata
      });
      setEditItemId(null); // Reset edit mode
      // Reset form values
      setName("");
      setQuantity(0);
      setPrice(0);
      setDescription("");
      setCategory("");
      setDimensions({ length: 0, width: 0, height: 0 });
      setLocation({ aisle: "", shelf: "", section: "" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    
    await addInventoryItem({
      name,
      quantity,
      price,
      description,
      category,
      dimensions: {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height
      },
      location: {
        aisle: location.aisle,
        shelf: location.shelf,
        section: location.section
      },
      metadata: {
        addedBy: currentUser?.uid || 'unknown',
        addedDate: new Date().toISOString()
      }
    });
  
    setName("");
    setQuantity(0);
    setPrice(0);
    setDescription("");
    setCategory("");
    setDimensions({
      length: 0,
      width: 0,
      height: 0
    });
    setLocation({
      aisle: "",
      shelf: "",
      section: ""
    });
    alert("Item added successfully!");
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 100,
      valueGetter: (item: InventoryItem) => `€${item.price.toFixed(2)}`,
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      valueGetter: (item: InventoryItem) => 
        `${item.location.aisle}-${item.location.shelf}-${item.location.section}`,
    },
    {
      field: 'dimensions',
      headerName: 'Dimensions',
      width: 150,
      valueGetter: (item: InventoryItem) => 
        `${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}`,
    },
    {
      field: 'addedBy',
      headerName: 'Added By',
      width: 150,
      valueGetter: (item: InventoryItem) => item.metadata.addedBy,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (item: InventoryItem) => (
        <div className="actions-cell" style={{ width: columns[7].width }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }} 
            className="edit-button"
          >
            Edit
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }} 
            className="delete-button"
          >
            Delete
          </button>
        </div>
      ),
    }
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  return (
    <div className="inventory-table">
      <div className="table-header">
        {columns.map((col) => (
          <div key={col.field} className="header-cell" style={{ width: col.width }}>
            {col.headerName}
          </div>
        ))}
      </div>
      <div className="table-body">
        {currentItems.map((item) => (
          <div key={item.id} className={`table-row ${editItemId === item.id ? 'editing' : ''}`}>
            {editItemId === item.id ? (
              <>
                <div className="table-cell">
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="table-cell">
                  <input 
                    type="text" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="table-cell">
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="table-cell">
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(Number(e.target.value))}
                    step="0.01"
                  />
                </div>
                <div className="table-cell">
                  <input 
                    type="text" 
                    value={location.aisle} 
                    onChange={(e) => setLocation({...location, aisle: e.target.value})}
                    placeholder="Aisle"
                  />
                  <input 
                    type="text" 
                    value={location.shelf} 
                    onChange={(e) => setLocation({...location, shelf: e.target.value})}
                    placeholder="Shelf"
                  />
                  <input 
                    type="text" 
                    value={location.section} 
                    onChange={(e) => setLocation({...location, section: e.target.value})}
                    placeholder="Section"
                  />
                </div>
                <div className="table-cell">
                  <input 
                    type="number" 
                    value={dimensions.length} 
                    onChange={(e) => setDimensions({...dimensions, length: Number(e.target.value)})}
                    placeholder="Length"
                  />
                  <input 
                    type="number" 
                    value={dimensions.width} 
                    onChange={(e) => setDimensions({...dimensions, width: Number(e.target.value)})}
                    placeholder="Width"
                  />
                  <input 
                    type="number" 
                    value={dimensions.height} 
                    onChange={(e) => setDimensions({...dimensions, height: Number(e.target.value)})}
                    placeholder="Height"
                  />
                </div>
                <div className="table-cell">{item.metadata.addedBy}</div>
                <div className="actions-cell">
                  <button onClick={() => handleUpdate(item.id)} className="save-button">Save</button>
                  <button onClick={() => setEditItemId(null)} className="cancel-button">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="table-cell" style={{ width: columns[0].width }}>{item.name}</div>
                <div className="table-cell" style={{ width: columns[1].width }}>{item.category}</div>
                <div className="table-cell" style={{ width: columns[2].width }}>{item.quantity}</div>
                <div className="table-cell" style={{ width: columns[3].width }}>
                  €{item.price.toFixed(2)}
                </div>
                <div className="table-cell" style={{ width: columns[4].width }}>
                  {`${item.location.aisle}-${item.location.shelf}-${item.location.section}`}
                </div>
                <div className="table-cell" style={{ width: columns[5].width }}>
                  {`${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}`}
                </div>
                <div className="table-cell" style={{ width: columns[6].width }}>
                  {item.metadata.addedBy}
                </div>
                <div className="actions-cell" style={{ width: columns[7].width }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }} 
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }} 
                    className="delete-button"
                  >
                    Delete
                  </button>
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

export default InventoryList;
