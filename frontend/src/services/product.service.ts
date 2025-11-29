import apiClient from './api';

export interface Product {
    id: string;
    title: string;
    description: string | null;
    price: string | number;  // API returns as string, needs conversion
    stock: number;
    category_id: string | null;
    product_metadata: Record<string, any>;
    is_active: boolean;
    in_stock: boolean;
    created_at: string;
    updated_at: string;
    images: ProductImage[];
    category: Category | null;
}

export interface ProductImage {
    id: string;
    product_id: string;
    url: string;
    is_primary: boolean;
    display_order: number;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProductListResponse {
    items: Product[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface ProductSearchParams {
    page?: number;
    page_size?: number;
    query?: string;
    category_id?: string;
    min_price?: number;
    max_price?: number;
    in_stock_only?: boolean;
    is_active?: boolean;
}

class ProductService {
    async getProducts(params?: ProductSearchParams): Promise<ProductListResponse> {
        const response = await apiClient.get<ProductListResponse>('/api/products', { params });
        return response.data;
    }

    async getProduct(id: string): Promise<Product> {
        const response = await apiClient.get<Product>(`/api/products/${id}`);
        return response.data;
    }

    async getCategories(): Promise<Category[]> {
        const response = await apiClient.get<Category[]>('/api/products/categories');
        return response.data;
    }

    async searchProducts(query: string, page = 1): Promise<ProductListResponse> {
        return this.getProducts({ query, page, page_size: 20 });
    }

    async getProductsByCategory(categoryId: string, page = 1): Promise<ProductListResponse> {
        return this.getProducts({ category_id: categoryId, page, page_size: 20 });
    }

    async getFeaturedProducts(limit = 8): Promise<Product[]> {
        const response = await this.getProducts({ page: 1, page_size: limit, is_active: true });
        return response.items;
    }

    // Admin CRUD operations
    async createProduct(data: {
        title: string;
        description?: string;
        price: number;
        stock: number;
        category_id?: string;
        product_metadata?: Record<string, any>;
        is_active?: boolean;
    }): Promise<Product> {
        const response = await apiClient.post<Product>('/api/products', data);
        return response.data;
    }

    async updateProduct(id: string, data: {
        title?: string;
        description?: string;
        price?: number;
        stock?: number;
        category_id?: string;
        product_metadata?: Record<string, any>;
        is_active?: boolean;
    }): Promise<Product> {
        const response = await apiClient.put<Product>(`/api/products/${id}`, data);
        return response.data;
    }

    async deleteProduct(id: string): Promise<void> {
        await apiClient.delete(`/api/products/${id}`);
    }

    async uploadImage(productId: string, file: File, isPrimary: boolean = false): Promise<ProductImage> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('is_primary', String(isPrimary));

        const response = await apiClient.post<ProductImage>(
            `/api/products/${productId}/images`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }
}

export const productService = new ProductService();
