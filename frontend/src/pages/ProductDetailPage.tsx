import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Share2, ChevronLeft, Minus, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import Button from '@/components/ui/Button';
import { productService, Product } from '@/services/product.service';
import { useCartStore } from '@/state/cart.store';
import { useAuthStore } from '@/state/auth.store';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProduct(productId);
      setProduct(data);
      // Reset selection
      setQuantity(1);
      setSelectedImageIndex(0);
    } catch (err: any) {
      console.error('Product load error:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to load product details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
    } catch (error) {
      // Error handled in store
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate('/products')}>Back to Products</Button>
      </div>
    );
  }

  const mainImage = product.images?.[selectedImageIndex]?.url || 'https://via.placeholder.com/600x600?text=No+Image';

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative group"
          >
            <img
              src={mainImage}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
            {!product.is_active && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Inactive
              </div>
            )}
          </motion.div>

          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-primary-600 ring-2 ring-primary-100' : 'border-transparent hover:border-gray-300'
                    }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {product.category && (
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {product.category.name}
                </span>
              )}
              <span>SKU: {product.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-primary-600">
              ${Number(product.price).toFixed(2)}
            </span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-orange-500 font-medium mb-1">
                Only {product.stock} left in stock!
              </span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed text-lg">
            {product.description || 'No description available for this product.'}
          </p>

          <div className="pt-6 border-t border-gray-200 space-y-6">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                isLoading={addingToCart}
                disabled={product.stock === 0 || !product.is_active}
                className="flex-1 py-4 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <button className="p-4 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
              <button className="p-4 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
