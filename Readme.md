# StockWise – Intelligent Inventory Management System
StockWise is a smart inventory management application built to help small businesses efficiently manage stock levels, predict restocking needs, and coordinate supplier orders. The platform integrates real-time tracking, machine learning forecasting, and cloud deployment for maximum usability and scalability.

## Features
- **User Authentication:**
 Secure login and role-based access for Admin, Manager and Employee.
- **Real-time Inventory Management:**
 Add, edit, use, and track stock items instantly.
- **Smart Restocking Suggestions:**
 Machine learning predicts when and how much stock to reorder.
- **PDF Report Generation:** 
 Create downloadable inventory and usage reports.
- **Supplier and Order Management:**
 Track supplier details and order statuses.

## Technologies Used
- **Frontend:** React, Ionic, TypeScript

- **Backend:** FastAPI (Python)

- **Database:** Firebase Firestore

- **Machine Learning:** Scikit-learn, NumPy, Pandas

- **Other Libraries:** Chart.js for data visualization, jsPDF for PDF generation

- **Deployment:** Google Cloud Run and Firebase

## Setup and Installation
**Clone the repository:**
```bash
git clone https://github.com/rosshannon7677/StockWise
cd StockWise
```

**Install Dependencies:**
### Frontend (React/Ionic):

### Run the setup script:
- Open PowerShell as Administrator.
- Navigate to the StockWise directory:

```bash
cd StockWise
```
- Run the setup script:
```bash
.\setup.ps1
```
- Restart your computer after the setup completes.

Backend (ML Service - FastAPI):

```bash
cd ml_service
pip install fastapi uvicorn scikit-learn pandas numpy
```

## Running the Application:
**Start the Frontend:**

```bash
cd StockWise
npm run start
```
**Start the ML Service (Backend):**

```bash
cd ml_service
uvicorn api:app --reload --port 8000
```
**Access the Application:**
- Frontend: http://localhost:8100
- ML API Service: http://localhost:8000

**StockWise Frontend hosted:**
- https://stockwise-8351f.web.app/restock
**StockWise Machine Learning hosted:**
- https://ml-service-519269717450.europe-west1.run.app/predictions

## Project Structure
``` php
StockWise/
├── src/             # Frontend source code (React/Ionic)
├── ml_service/      # Backend ML service (FastAPI)
├── public/          # Static assets
├── setup.ps1        # Setup script (Windows)
└── package.json     # Node.js project configuration
```

## Troubleshooting
### If npm is not recognized:

Close and reopen your terminal as Administrator.
Ensure Node.js and npm are correctly installed.

Navigate to the project directory again and 
``` run npm install```.

If you encounter Python package errors:

Verify you're using the correct virtual environment.
``` bash
pip install -r requirements.txt.
```

## Usage
### After setting up StockWise, you can:

- **Manage Inventory:** Add, edit, delete, and use stock items.
- **View Smart Restocking:** Receive ML-driven restock predictions with confidence scores.
- **Generate Reports:** Export inventory data as PDF documents.
- **Manage Suppliers and Orders:** Create and manage supplier orders with status updates.
- **Real-Time Updates:** All changes reflect instantly through Firebase syncing.
- **Role-Based Access:** Admins, Managers, and Employees have different access permissions.

## Acknowledgments
- Special thanks to my supervisor for their continued guidance and support.
- Thanks to everyone who provided feedback and testing throughout development.

## Contact
For any inquiries or further information, you can reach me at:
rosshannonty@gmail.com