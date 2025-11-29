"""
Product repository implementation.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional, List, Tuple
from uuid import UUID
from decimal import Decimal

from src.domain.models.product import Product, Category, ProductImage


class ProductRepository:
    """Repository for product data operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Category Operations
    
    async def create_category(
        self,
        name: str,
        slug: str,
        description: Optional[str] = None,
        parent_id: Optional[UUID] = None
    ) -> Category:
        """Create a new category"""
        category = Category(
            name=name,
            slug=slug,
            description=description,
            parent_id=parent_id
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    async def get_category_by_id(self, category_id: UUID) -> Optional[Category]:
        """Get category by ID"""
        return self.db.query(Category).filter(Category.id == category_id).first()
    
    async def get_category_by_slug(self, slug: str) -> Optional[Category]:
        """Get category by slug"""
        return self.db.query(Category).filter(Category.slug == slug).first()
    
    async def get_all_categories(self) -> List[Category]:
        """Get all categories"""
        return self.db.query(Category).all()
    
    async def update_category(self, category_id: UUID, **kwargs) -> Optional[Category]:
        """Update category"""
        category = await self.get_category_by_id(category_id)
        if not category:
            return None
        
        for key, value in kwargs.items():
            if value is not None and hasattr(category, key):
                setattr(category, key, value)
        
        self.db.commit()
        self.db.refresh(category)
        return category
    
    async def delete_category(self, category_id: UUID) -> bool:
        """Delete category"""
        category = await self.get_category_by_id(category_id)
        if not category:
            return False
        
        self.db.delete(category)
        self.db.commit()
        return True
    
    # Product Operations
    
    async def create_product(
        self,
        title: str,
        price: Decimal,
        description: Optional[str] = None,
        stock: int = 0,
        category_id: Optional[UUID] = None,
        product_metadata: dict = None,
        is_active: bool = True
    ) -> Product:
        """Create a new product"""
        product = Product(
            title=title,
            description=description,
            price=price,
            stock=stock,
            category_id=category_id,
            product_metadata=product_metadata or {},
            is_active=is_active
        )
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product
    
    async def get_product_by_id(self, product_id: UUID, include_images: bool = True) -> Optional[Product]:
        """Get product by ID"""
        query = self.db.query(Product)
        
        if include_images:
            query = query.options(joinedload(Product.images), joinedload(Product.category))
        
        return query.filter(Product.id == product_id).first()
    
    async def get_all_products(
        self,
        skip: int = 0,
        limit: int = 20,
        query: Optional[str] = None,
        category_id: Optional[UUID] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        in_stock_only: bool = False,
        is_active: bool = True
    ) -> Tuple[List[Product], int]:
        """
        Get all products with filtering and pagination.
        
        Returns:
            Tuple of (products list, total count)
        """
        db_query = self.db.query(Product).options(
            joinedload(Product.images),
            joinedload(Product.category)
        )
        
        # Apply filters
        filters = []
        
        if is_active is not None:
            filters.append(Product.is_active == is_active)
        
        if query:
            search_filter = or_(
                Product.title.ilike(f"%{query}%"),
                Product.description.ilike(f"%{query}%")
            )
            filters.append(search_filter)
        
        if category_id:
            filters.append(Product.category_id == category_id)
        
        if min_price is not None:
            filters.append(Product.price >= min_price)
        
        if max_price is not None:
            filters.append(Product.price <= max_price)
        
        if in_stock_only:
            filters.append(Product.stock > 0)
        
        if filters:
            db_query = db_query.filter(and_(*filters))
        
        # Get total count
        total = db_query.count()
        
        # Apply pagination and ordering
        products = db_query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
        
        return products, total
    
    async def update_product(self, product_id: UUID, **kwargs) -> Optional[Product]:
        """Update product"""
        product = await self.get_product_by_id(product_id, include_images=False)
        if not product:
            return None
        
        for key, value in kwargs.items():
            if value is not None and hasattr(product, key):
                setattr(product, key, value)
        
        self.db.commit()
        self.db.refresh(product)
        return product
    
    async def delete_product(self, product_id: UUID) -> bool:
        """Delete product"""
        product = await self.get_product_by_id(product_id, include_images=False)
        if not product:
            return False
        
        self.db.delete(product)
        self.db.commit()
        return True
    
    async def update_stock(self, product_id: UUID, quantity: int, operation: str = "set") -> Optional[Product]:
        """
        Update product stock.
        
        Args:
            product_id: Product ID
            quantity: Quantity to set/add/subtract
            operation: 'set', 'increment', or 'decrement'
            
        Returns:
            Updated product or None
        """
        product = await self.get_product_by_id(product_id, include_images=False)
        if not product:
            return None
        
        if operation == "set":
            product.stock = quantity
        elif operation == "increment":
            product.stock += quantity
        elif operation == "decrement":
            product.stock = max(0, product.stock - quantity)
        
        self.db.commit()
        self.db.refresh(product)
        return product
    
    # Product Image Operations
    
    async def add_product_image(
        self,
        product_id: UUID,
        url: str,
        is_primary: bool = False,
        display_order: int = 0
    ) -> Optional[ProductImage]:
        """Add an image to a product"""
        # Check if product exists
        product = await self.get_product_by_id(product_id, include_images=False)
        if not product:
            return None
        
        # If setting as primary, unset other primary images
        if is_primary:
            self.db.query(ProductImage).filter(
                ProductImage.product_id == product_id,
                ProductImage.is_primary == True
            ).update({"is_primary": False})
        
        image = ProductImage(
            product_id=product_id,
            url=url,
            is_primary=is_primary,
            display_order=display_order
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image
    
    async def delete_product_image(self, image_id: UUID) -> bool:
        """Delete a product image"""
        image = self.db.query(ProductImage).filter(ProductImage.id == image_id).first()
        if not image:
            return False
        
        self.db.delete(image)
        self.db.commit()
        return True
    
    async def get_product_images(self, product_id: UUID) -> List[ProductImage]:
        """Get all images for a product"""
        return self.db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).order_by(ProductImage.display_order).all()
