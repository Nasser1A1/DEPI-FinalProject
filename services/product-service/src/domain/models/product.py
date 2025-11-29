"""
Product domain models.
"""
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from src.infrastructure.database.connection import Base


class Category(Base):
    """Product category entity"""
    
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(UUID(as_uuid=True), ForeignKey('categories.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    products = relationship("Product", back_populates="category")
    parent = relationship("Category", remote_side=[id], backref="children")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class Product(Base):
    """Product entity"""
    
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False, index=True)
    stock = Column(Integer, default=0, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id'), nullable=True, index=True)
    product_metadata = Column(JSONB, default={})  # Brand, SKU, dimensions, etc.
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Product(id={self.id}, title={self.title}, price={self.price})>"
    
    @property
    def in_stock(self) -> bool:
        """Check if product is in stock"""
        return self.stock > 0
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "price": float(self.price),
            "stock": self.stock,
            "category_id": str(self.category_id) if self.category_id else None,
            "product_metadata": self.product_metadata,
            "is_active": self.is_active,
            "in_stock": self.in_stock,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "images": [img.to_dict() for img in self.images] if self.images else []
        }


class ProductImage(Base):
    """Product image entity"""
    
    __tablename__ = "product_images"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    url = Column(String(1000), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="images")
    
    def __repr__(self):
        return f"<ProductImage(id={self.id}, product_id={self.product_id})>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "product_id": str(self.product_id),
            "url": self.url,
            "is_primary": self.is_primary,
            "display_order": self.display_order,
            "created_at": self.created_at.isoformat()
        }
