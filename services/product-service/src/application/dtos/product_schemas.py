"""
Pydantic schemas for Product Service DTOs.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal


# Category Schemas

class CategoryCreate(BaseModel):
    """Schema for creating a category"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


class CategoryResponse(BaseModel):
    """Schema for category response"""
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    parent_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Product Image Schemas

class ProductImageCreate(BaseModel):
    """Schema for creating a product image"""
    url: str
    is_primary: bool = False
    display_order: int = 0


class ProductImageResponse(BaseModel):
    """Schema for product image response"""
    id: UUID
    product_id: UUID
    url: str
    is_primary: bool
    display_order: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Product Schemas

class ProductCreate(BaseModel):
    """Schema for creating a product"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, decimal_places=2)
    stock: int = Field(default=0, ge=0)
    category_id: Optional[UUID] = None
    product_metadata: dict = Field(default_factory=dict)
    is_active: bool = True
    
    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)
    category_id: Optional[UUID] = None
    product_metadata: Optional[dict] = None
    is_active: Optional[bool] = None
    
    @validator('price')
    def validate_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Price must be greater than 0')
        return v


class ProductResponse(BaseModel):
    """Schema for product response"""
    id: UUID
    title: str
    description: Optional[str]
    price: Decimal
    stock: int
    category_id: Optional[UUID]
    product_metadata: dict
    is_active: bool
    in_stock: bool
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageResponse] = []
    category: Optional[CategoryResponse] = None
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for paginated product list"""
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProductSearchParams(BaseModel):
    """Schema for product search parameters"""
    query: Optional[str] = None
    category_id: Optional[UUID] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    in_stock_only: bool = False
    is_active: bool = True
    
    @validator('max_price')
    def validate_max_price(cls, v, values):
        if v is not None and 'min_price' in values and values['min_price'] is not None:
            if v < values['min_price']:
                raise ValueError('max_price must be greater than or equal to min_price')
        return v


# Stock Update Schema

class StockUpdateRequest(BaseModel):
    """Schema for updating product stock"""
    quantity: int
    operation: str = Field(..., pattern='^(set|increment|decrement)$')
    
    @validator('quantity')
    def validate_quantity(cls, v, values):
        operation = values.get('operation')
        if operation in ['set', 'increment'] and v < 0:
            raise ValueError('Quantity cannot be negative for set/increment operations')
        return v


# Message Response

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
