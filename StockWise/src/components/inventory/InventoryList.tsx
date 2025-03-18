// src/components/InventoryList.tsx
import React, { useState } from "react";
import "./InventoryList.css";
import { addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../firestoreService';
import { auth } from '../../../firebaseConfig';
import { IonIcon, IonModal, IonInput, IonButton, IonAlert } from '@ionic/react';
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
    lastUpdated?: string;
  };
  used_stock?: Array<{
    date: string;
    quantity: number;
  }>;
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

  const [showUseStockModal, setShowUseStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [unitsUsed, setUnitsUsed] = useState(1);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Add state for delete alert
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return <div className="no-items">No inventory items found</div>;
  }

  // Update handleDelete
  const handleDelete = async (id: string) => {
    setItemToDelete(id);
    setShowDeleteAlert(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity);
    setPrice(item.price);
    setDescription(item.description || "");
    setCategory(item.category);
    setDimensions(item.dimensions);
    setLocation(item.location);
    setShowEditModal(true);
  };

  const handleUpdate = async (id: string) => {
    try {
      if (!editingItem) return;

      const updatedData: Partial<InventoryItem> = {
        name,
        quantity,
        price,
        description,
        category,
        dimensions,
        location,
        metadata: {
          addedBy: editingItem.metadata.addedBy, // Ensure required field
          addedDate: editingItem.metadata.addedDate, // Ensure required field
          lastUpdated: new Date().toISOString()
        }
      };

      await updateInventoryItem(id, updatedData);
      setShowEditModal(false);
      setEditingItem(null);
      
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

  const handleUseStock = async () => {
    if (selectedItem && unitsUsed > 0) {
      const newQuantity = selectedItem.quantity - unitsUsed;
      
      const updatedItem: Partial<InventoryItem> = {
        quantity: Math.max(0, newQuantity),
        metadata: {
          addedBy: selectedItem.metadata.addedBy,
          addedDate: selectedItem.metadata.addedDate,
          lastUpdated: new Date().toISOString()
        },
        used_stock: [
          ...(selectedItem.used_stock || []),
          {
            date: new Date().toISOString(),
            quantity: unitsUsed
          }
        ]
      };

      await updateInventoryItem(selectedItem.id, updatedItem);
      
      setShowUseStockModal(false);
      setSelectedItem(null);
      setUnitsUsed(1);
    }
  };

  // Update the columns array
const columns = [
  {
    field: 'name',
    headerName: 'Name',
    width: '20%'
  },
  {
    field: 'category',
    headerName: 'Category', 
    width: '15%'
  },
  {
    field: 'quantity',
    headerName: 'Quantity',
    width: '10%'
  },
  {
    field: 'price',
    headerName: 'Price',
    width: '10%'
  },
  {
    field: 'location',
    headerName: 'Location',
    width: '15%'
  },
  {
    field: 'dimensions',
    headerName: 'Dimensions',
    width: '15%'
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: '15%'
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
          <div key={col.field} className="table-cell" style={{ width: col.width }}>
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
                <div className="actions-cell" style={{ width: columns[6].width }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                      setUnitsUsed(1);
                      setShowUseStockModal(true);
                    }} 
                    className="use-button"
                  >
                    Use Stock
                  </button>
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
      <IonModal isOpen={showUseStockModal} onDidDismiss={() => setShowUseStockModal(false)}>
        <div className="modal-content">
          <h2>Use Stock</h2>
          <div className="form-section">
            <h3>{selectedItem?.name}</h3>
            <p>Current Stock: {selectedItem?.quantity}</p>
            <div className="form-group">
              <label>Units Used:</label>
              <input
                type="number"
                value={unitsUsed}
                onChange={(e) => setUnitsUsed(Math.min(Number(e.target.value), selectedItem?.quantity || 0))}
                min={1}
                max={selectedItem?.quantity}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="cancel-button" onClick={() => setShowUseStockModal(false)}>
              Cancel
            </button>
            <button 
              className="save-button"
              onClick={handleUseStock}
              disabled={!selectedItem || unitsUsed <= 0 || unitsUsed > selectedItem.quantity}
            >
              Confirm
            </button>
          </div>
        </div>
      </IonModal>
      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
        <div className="modal-content">
          <h2>Edit Item</h2>
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="item-basic-info">
              <div className="input-group">
                <label>Name</label>
                <IonInput
                  value={name}
                  onIonChange={e => setName(e.detail.value!)}
                  placeholder="Item Name"
                />
              </div>
              
              <div className="input-group">
                <label>Category</label>
                <IonInput
                  value={category}
                  onIonChange={e => setCategory(e.detail.value!)}
                  placeholder="Category"
                />
              </div>
              
              <div className="quantity-price-group">
                <div className="input-group">
                  <label>Quantity</label>
                  <IonInput
                    type="number"
                    value={quantity}
                    onIonChange={e => setQuantity(parseInt(e.detail.value!))}
                    placeholder="Quantity"
                  />
                </div>
                <div className="input-group">
                  <label>Price (€)</label>
                  <IonInput
                    type="number"
                    value={price}
                    onIonChange={e => setPrice(parseFloat(e.detail.value!))}
                    placeholder="Price"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Location</h3>
            <div className="location-inputs">
              <div className="input-group">
                <label>Aisle</label>
                <IonInput
                  value={location.aisle}
                  onIonChange={e => setLocation({...location, aisle: e.detail.value!})}
                  placeholder="Aisle"
                />
              </div>
              <div className="input-group">
                <label>Shelf</label>
                <IonInput
                  value={location.shelf}
                  onIonChange={e => setLocation({...location, shelf: e.detail.value!})}
                  placeholder="Shelf"
                />
              </div>
              <div className="input-group">
                <label>Section</label>
                <IonInput
                  value={location.section}
                  onIonChange={e => setLocation({...location, section: e.detail.value!})}
                  placeholder="Section"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Dimensions</h3>
            <div className="dimensions-inputs">
              <div className="input-group">
                <label>Length</label>
                <IonInput
                  type="number"
                  value={dimensions.length}
                  onIonChange={e => setDimensions({...dimensions, length: parseFloat(e.detail.value!)})}
                  placeholder="Length"
                />
              </div>
              <div className="input-group">
                <label>Width</label>
                <IonInput
                  type="number"
                  value={dimensions.width}
                  onIonChange={e => setDimensions({...dimensions, width: parseFloat(e.detail.value!)})}
                  placeholder="Width"
                />
              </div>
              <div className="input-group">
                <label>Height</label>
                <IonInput
                  type="number"
                  value={dimensions.height}
                  onIonChange={e => setDimensions({...dimensions, height: parseFloat(e.detail.value!)})}
                  placeholder="Height"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <IonButton fill="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </IonButton>
            <IonButton onClick={() => handleUpdate(editingItem!.id)}>
              Save Changes
            </IonButton>
          </div>
        </div>
      </IonModal>
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message="Are you sure you want to delete this item?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            role: 'confirm',
            handler: async () => {
              if (itemToDelete) {
                await deleteInventoryItem(itemToDelete);
              }
            }
          }
        ]}
      />
    </div>
  );
};

export default InventoryList;