"""
Product service containing business logic.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from decimal import Decimal

from src.infrastructure.database.product_repository import ProductRepository
from src.infrastructure.storage.s3_client import s3_client
from src.application.dtos.product_schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    ProductImageResponse,
    ProductSearchParams,
    StockUpdateRequest
)
from src.domain.models.product import Product, Category


class ProductService:
    """Service class for product business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = ProductRepository(db)
    
    # Category Operations
    
    async def create_category(self, request: CategoryCreate) -> CategoryResponse:
        """Create a new category"""
        # Check if slug already exists
        existing = await self.repository.get_category_by_slug(request.slug)
        if existing:
            raise ValueError(f"Category with slug '{request.slug}' already exists")
        
        category = await self.repository.create_category(
            name=request.name,
            slug=request.slug,
            description=request.description,
            parent_id=request.parent_id
        )
        
        return CategoryResponse.model_validate(category)
    
    async def get_category(self, category_id: UUID) -> CategoryResponse:
        """Get category by ID"""
        category = await self.repository.get_category_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
        
        return CategoryResponse.model_validate(category)
    
    async def get_all_categories(self) -> List[CategoryResponse]:
        """Get all categories"""
        categories = await self.repository.get_all_categories()
        return [CategoryResponse.model_validate(cat) for cat in categories]
    
    async def update_category(self, category_id: UUID, request: CategoryUpdate) -> CategoryResponse:
        """Update category"""
        # Check if new slug conflicts with existing
        if request.slug:
            existing = await self.repository.get_category_by_slug(request.slug)
            if existing and existing.id != category_id:
                raise ValueError(f"Category with slug '{request.slug}' already exists")
        
        category = await self.repository.update_category(
            category_id,
            **request.model_dump(exclude_unset=True)
        )
        
        if not category:
            raise ValueError("Category not found")
        
        return CategoryResponse.model_validate(category)
    
    async def delete_category(self, category_id: UUID) -> bool:
        """Delete category"""
        success = await self.repository.delete_category(category_id)
        if not success:
            raise ValueError("Category not found")
        return success
    
    # Product Operations
    
    async def create_product(self, request: ProductCreate) -> ProductResponse:
        """Create a new product"""
        # Validate category exists if provided
        if request.category_id:
            category = await self.repository.get_category_by_id(request.category_id)
            if not category:
                raise ValueError(f"Category with ID {request.category_id} not found")
        
        product = await self.repository.create_product(
            title=request.title,
            description=request.description,
            price=request.price,
            stock=request.stock,
            category_id=request.category_id,
            product_metadata=request.product_metadata,
            is_active=request.is_active
        )
        
        return ProductResponse.model_validate(product)
    
    async def get_product(self, product_id: UUID) -> ProductResponse:
        """Get product by ID"""
        product = await self.repository.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        return ProductResponse.model_validate(product)
    
    async def list_products(
        self,
        page: int = 1,
        page_size: int = 20,
        search_params: Optional[ProductSearchParams] = None
    ) -> Tuple[List[ProductResponse], int]:
        """List products with filtering and pagination"""
        skip = (page - 1) * page_size
        
        params = search_params.model_dump() if search_params else {}
        
        products, total = await self.repository.get_all_products(
            skip=skip,
            limit=page_size,
            **params
        )
        
        product_responses = [ProductResponse.model_validate(p) for p in products]
        return product_responses, total
    
    async def update_product(self, product_id: UUID, request: ProductUpdate) -> ProductResponse:
        """Update product"""
        # Validate category if being updated
        if request.category_id:
            category = await self.repository.get_category_by_id(request.category_id)
            if not category:
                raise ValueError(f"Category with ID {request.category_id} not found")
        
        product = await self.repository.update_product(
            product_id,
            **request.model_dump(exclude_unset=True)
        )
        
        if not product:
            raise ValueError("Product not found")
        
        return ProductResponse.model_validate(product)
    
    async def delete_product(self, product_id: UUID) -> bool:
        """Delete product and its images"""
        # Get product with images
        product = await self.repository.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        # Delete images from S3
        for image in product.images:
            s3_client.delete_image(image.url)
        
        # Delete product from database (cascade will delete images)
        success = await self.repository.delete_product(product_id)
        return success
    
    async def update_stock(self, product_id: UUID, request: StockUpdateRequest) -> ProductResponse:
        """Update product stock"""
        product = await self.repository.update_stock(
            product_id,
            request.quantity,
            request.operation
        )
        
        if not product:
            raise ValueError("Product not found")
        
        return ProductResponse.model_validate(product)
    
    # Image Operations
    
    async def upload_product_image(
        self,
        product_id: UUID,
        file,
        filename: str,
        content_type: str,
        is_primary: bool = False
    ) -> ProductImageResponse:
        """Upload a product image"""
        # Check product exists
        product = await self.repository.get_product_by_id(product_id, include_images=False)
        if not product:
            raise ValueError("Product not found")
        
        # Upload to S3
        url = s3_client.upload_image(file, filename, content_type)
        if not url:
            raise ValueError("Failed to upload image to S3")
        
        # Save to database
        images = await self.repository.get_product_images(product_id)
        display_order = len(images)
        
        image = await self.repository.add_product_image(
            product_id=product_id,
            url=url,
            is_primary=is_primary,
            display_order=display_order
        )
        
        return ProductImageResponse.model_validate(image)
    
    async def delete_product_image(self, image_id: UUID) -> bool:
        """Delete a product image"""
        # Get image first to get URL
        images = self.db.query(Product).join(Product.images).filter(
            Product.images.any(id=image_id)
        ).first()
        
        if not images:
            raise ValueError("Image not found")
        
        # Find the specific image
        image = next((img for img in images.images if str(img.id) == str(image_id)), None)
        if image:
            # Delete from S3
            s3_client.delete_image(image.url)
        
        # Delete from database
        success = await self.repository.delete_product_image(image_id)
        return success
