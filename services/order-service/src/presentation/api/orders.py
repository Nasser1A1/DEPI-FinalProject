"""
API endpoints for Order Service.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from src.infrastructure.database.connection import get_db
from src.domain.models.order import Order, OrderItem, OrderStatus

router = APIRouter()

# Schemas
class OrderItemSchema(BaseModel):
    product_id: str
    product_title: str
    product_image: Optional[str] = None
    quantity: float
    price: float

class CreateOrderRequest(BaseModel):
    user_id: UUID
    items: List[OrderItemSchema]
    total_amount: float
    shipping_address: dict
    payment_intent_id: Optional[str] = None

class OrderResponse(BaseModel):
    id: UUID
    user_id: UUID
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemSchema]
    
    class Config:
        from_attributes = True

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(request: CreateOrderRequest, db: Session = Depends(get_db)):
    """Create a new order"""
    try:
        # Create Order
        new_order = Order(
            user_id=request.user_id,
            total_amount=request.total_amount,
            shipping_address=request.shipping_address,
            payment_intent_id=request.payment_intent_id,
            status=OrderStatus.PAID # Assuming created after successful payment
        )
        db.add(new_order)
        db.flush() # Get ID

        # Create Order Items
        for item in request.items:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                product_title=item.product_title,
                product_image=item.product_image,
                quantity=item.quantity,
                price=item.price
            )
            db.add(order_item)
        
        db.commit()
        db.refresh(new_order)
        return new_order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}", response_model=List[OrderResponse])
async def get_user_orders(user_id: UUID, db: Session = Depends(get_db)):
    """Get all orders for a user"""
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: UUID, db: Session = Depends(get_db)):
    """Get a specific order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
