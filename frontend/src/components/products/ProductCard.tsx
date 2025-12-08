import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Product } from '@/services/product.service';
import { formatPrice, getPrimaryImage } from '@/utils/helpers';
import { useCartStore } from '@/state/cart.store';
import { useAuthStore } from '@/state/auth.store';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
    product: Product;
    delay?: number;
}

export default function ProductCard({ product, delay = 0 }: ProductCardProps) {
    const { addToCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const primaryImage = getPrimaryImage(product.images);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            return;
        }

        try {
            await addToCart(product.id, 1);
        } catch (error) {
            // Error already handled in store
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -8 }}
            className="group relative"
        >
            <Link to={`/products/${product.id}`}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                            src={primaryImage}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />

                        {/* Stock Badge */}
                        {!product.in_stock && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                Out of Stock
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                aria-label="Add to wishlist"
                            >
                                <Heart className="w-5 h-5 text-gray-700" />
                            </motion.button>
                        </div>

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        {/* Category */}
                        {product.category && (
                            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                                {product.category.name}
                            </span>
                        )}

                        {/* Title */}
                        <h3 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {product.title}
                        </h3>

                        {/* Description */}
                        {product.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {product.description}
                            </p>
                        )}

                        {/* Price & Action */}
                        <div className="mt-4 flex items-center justify-between">
                            <div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {formatPrice(Number(product.price))}
                                </span>
                                {product.stock <= 5 && product.in_stock && (
                                    <p className="text-xs text-orange-600 font-medium mt-1">
                                        Only {product.stock} left!
                                    </p>
                                )}
                            </div>

                            <Button
                                size="sm"
                                onClick={handleAddToCart}
                                disabled={!product.in_stock}
                                leftIcon={<ShoppingCart className="w-4 h-4" />}
                                className="shadow-lg"
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
