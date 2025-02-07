from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from stock_predictor import StockPredictor
from typing import List
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8100"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = StockPredictor()

class PredictionResponse(BaseModel):
    product_id: str
    name: str
    current_quantity: int
    predicted_days_until_low: int
    confidence_score: float
    recommended_restock_date: str

@app.get("/predictions", response_model=List[PredictionResponse])
async def get_predictions():
    predictions = predictor.predict_stock_levels()
    return predictions

@app.post("/train")
async def train_model():
    accuracy = predictor.train_model()
    return {"accuracy": accuracy}