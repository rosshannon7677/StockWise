from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from stock_predictor import StockPredictor
from typing import List
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import logging
import asyncio
from firebase_admin import firestore
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="StockWise ML API")

# Initialize predictor service
try:
    predictor = StockPredictor()
except Exception as e:
    logger.error(f"Service initialization error: {e}")
    predictor = None

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8100",
        "http://localhost:8000",
        "https://stockwise-8351f.web.app",
        "https://ml-service-151501605989.europe-west1.run.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class PredictionResponse(BaseModel):
    product_id: str
    name: str
    current_quantity: int
    predicted_days_until_low: int
    confidence_score: float
    recommended_restock_date: str
    usage_history: list[dict] = []
    daily_consumption: float
    price: float
    category: str

@app.get("/")
async def root():
    return {"message": "Welcome to StockWise ML API"}

@app.get("/predictions", response_model=List[PredictionResponse])
async def get_predictions():
    print("Received prediction request")
    try:
        predictions = predictor.predict_stock_levels()
        # Debug logging for prices
        for pred in predictions:
            print(f"Item: {pred['name']}, Price: €{pred.get('price', 0)}")
        print(f"Returning {len(predictions)} predictions")
        return predictions
    except Exception as e:
        print(f"Error in get_predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model():
    accuracy = predictor.train_model()
    return {"accuracy": accuracy}

@app.get("/consumption-plot/{item_name}", tags=["plots"])
async def get_consumption_plot(item_name: str):
    print(f"Received request for item: {item_name}")
    try:
        plot_data = predictor.generate_consumption_plot(item_name)
        return JSONResponse({
            "plot": plot_data,
            "item_name": item_name
        })
    except Exception as e:
        print(f"Error generating plot: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/send-low-stock-alert")
async def send_low_stock_alert():
    try:
        predictions = predictor.predict_stock_levels()
        logger.debug(f"Got predictions: {predictions}")
        
        # Filter for low stock items
        low_stock_items = [
            item for item in predictions 
            if item['current_quantity'] <= 10
        ]
        
        return {
            "message": "Low stock items found" if low_stock_items else "No low stock items",
            "success": True,
            "items": low_stock_items
        }
            
    except Exception as e:
        logger.error(f"Error in send_low_stock_alert: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Add health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "predictor": predictor is not None
        }
    }

@app.on_event("startup")
async def startup_event():
    logger.info("Starting application...")
    try:
        # Initialize predictor service
        global predictor
        predictor = StockPredictor()
        logger.info("Predictor service initialized successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise e

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run("api:app", host="0.0.0.0", port=port, log_level="info")