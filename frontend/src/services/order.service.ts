import apiClient from './api';

export interface OrderItem {
    product_id: string;
    product_title: string;
    product_image?: string;
    quantity: number;
    price: number;
}

export interface CreateOrderRequest {
    user_id: string;
    items: OrderItem[];
    total_amount: number;
    shipping_address: any;
    payment_intent_id?: string;
}

export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    items: OrderItem[];
}

class OrderService {
    async createOrder(data: CreateOrderRequest): Promise<Order> {
        const response = await apiClient.post<Order>('/api/orders/', data);
        return response.data;
    }

    async getUserOrders(userId: string): Promise<Order[]> {
        const response = await apiClient.get<Order[]>(`/api/orders/user/${userId}`);
        return response.data;
    }

    async getOrder(orderId: string): Promise<Order> {
        const response = await apiClient.get<Order>(`/api/orders/${orderId}`);
        return response.data;
    }
}

export const orderService = new OrderService();
