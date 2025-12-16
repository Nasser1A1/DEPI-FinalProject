import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number | string, currency = 'USD'): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(numPrice);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Generate placeholder image URL
 */
export function getPlaceholderImage(width = 400, height = 400): string {
    return `https://placehold.co/${width}x${height}/e0f2fe/0284c7?text=Product`;
}

/**
 * Get primary image from product
 */
export function getPrimaryImage(images: any[]): string {
    if (!images || images.length === 0) {
        return getPlaceholderImage();
    }

    const primary = images.find(img => img.is_primary);
    return primary?.url || images[0]?.url || getPlaceholderImage();
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, salePrice: number): number {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get error message from API error
 */
export function getErrorMessage(error: any): string {
    if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
            return error.response.data.detail;
        }
        if (Array.isArray(error.response.data.detail)) {
            return error.response.data.detail[0]?.msg || 'An error occurred';
        }
    }
    return error.message || 'An unexpected error occurred';
}
