import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { productService, Product } from '@/services/product.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage, formatPrice } from '@/utils/helpers';
import ProductFormModal from '@/components/admin/ProductFormModal';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await productService.getProducts({ page: 1, page_size: 100 });
            setProducts(response.items);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query) {
            loadProducts();
            return;
        }
        try {
            const response = await productService.searchProducts(query);
            setProducts(response.items);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await productService.deleteProduct(id);
            toast.success('Product deleted successfully');
            loadProducts();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleCreateEdit = (product?: Product) => {
        setEditingProduct(product || null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        loadProducts();
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
                        <p className="text-gray-600">Manage your product catalog</p>
                    </div>
                    <Button
                        onClick={() => handleCreateEdit()}
                        leftIcon={<Plus className="w-5 h-5" />}
                        size="lg"
                    >
                        Add Product
                    </Button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        leftIcon={<Search className="w-5 h-5" />}
                    />
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No products found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {products.map((product, index) => (
                                        <motion.tr
                                            key={product.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={product.images[0].url}
                                                            alt={product.title}
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                            <Plus className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.title}</p>
                                                        {product.category && (
                                                            <p className="text-sm text-gray-500">{product.category.name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-900">
                                                    {formatPrice(product.price)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.stock > 10
                                                        ? 'bg-green-100 text-green-700'
                                                        : product.stock > 0
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {product.stock} units
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCreateEdit(product)}
                                                        leftIcon={<Edit className="w-4 h-4" />}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(product.id)}
                                                        leftIcon={<Trash2 className="w-4 h-4" />}
                                                        className="text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Form Modal */}
            {isModalOpen && (
                <ProductFormModal
                    product={editingProduct}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
}
