from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from stock_predictor import StockPredictor
from typing import List
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="StockWise ML API", debug=True)

# Update CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8100",
        "http://localhost:8000",
        "https://stockwise-8351f.web.app",  # Add your Firebase hosting URL
        "https://ml-service-519269717450.europe-west1.run.app"  # Add this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

predictor = StockPredictor()

class PredictionResponse(BaseModel):
    product_id: str
    name: str
    current_quantity: int
    predicted_days_until_low: int
    confidence_score: float
    recommended_restock_date: str
    usage_history: list[dict] = []
    daily_consumption: float
    price: float  # Add price field
    category: str  # Add category field

@app.get("/")
async def root():
    return {"message": "Welcome to StockWise ML API"}  # Add this endpoint

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
    print(f"Received request for item: {item_name}")  # Debug log
    try:
        plot_data = predictor.generate_consumption_plot(item_name)
        return JSONResponse({
            "plot": plot_data,
            "item_name": item_name
        })
    except Exception as e:
        print(f"Error generating plot: {e}")  # Debug log
        raise HTTPException(status_code=400, detail=str(e))

# Make sure this appears at the end of the file
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)