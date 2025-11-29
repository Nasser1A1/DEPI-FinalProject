import apiClient from './api';

export interface CartItem {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    price: number;
    total_price: number;
    created_at: string;
    updated_at: string;
    product_title: string | null;
    product_image: string | null;
    product_in_stock: boolean | null;
}

export interface Cart {
    id: string;
    user_id: string;
    items: CartItem[];
    total_items: number;
    subtotal: number;
    created_at: string;
    updated_at: string;
}

export interface AddToCartRequest {
    product_id: string;
    quantity: number;
}

export interface UpdateCartItemRequest {
    quantity: number;
}

export interface CheckoutRequest {
    shipping_address: string;
    billing_address?: string;
    notes?: string;
}

export interface CheckoutResponse {
    cart_id: string;
    total_items: number;
    subtotal: number;
    shipping_address: string;
    billing_address: string;
    items: CartItem[];
    available_for_checkout: boolean;
    unavailable_items: string[];
}

class CartService {
    async getCart(): Promise<Cart> {
        const response = await apiClient.get<Cart>('/api/cart');
        return response.data;
    }

    async addItem(data: AddToCartRequest): Promise<Cart> {
        const response = await apiClient.post<Cart>('/api/cart/items', data);
        return response.data;
    }

    async updateItem(productId: string, data: UpdateCartItemRequest): Promise<Cart> {
        const response = await apiClient.put<Cart>(`/api/cart/items/${productId}`, data);
        return response.data;
    }

    async removeItem(productId: string): Promise<Cart> {
        const response = await apiClient.delete<Cart>(`/api/cart/items/${productId}`);
        return response.data;
    }

    async clearCart(): Promise<void> {
        await apiClient.delete('/api/cart');
    }

    async prepareCheckout(data: CheckoutRequest): Promise<CheckoutResponse> {
        const response = await apiClient.post<CheckoutResponse>('/api/cart/checkout/prepare', data);
        return response.data;
    }

    async syncPrices(): Promise<Cart> {
        const response = await apiClient.post<Cart>('/api/cart/sync-prices');
        return response.data;
    }

    // Local helper to check if product is in cart
    isProductInCart(cart: Cart | null, productId: string): boolean {
        return cart?.items.some(item => item.product_id === productId) || false;
    }

    // Local helper to get cart item quantity
    getCartItemQuantity(cart: Cart | null, productId: string): number {
        const item = cart?.items.find(item => item.product_id === productId);
        return item?.quantity || 0;
    }
}

export const cartService = new CartService();
