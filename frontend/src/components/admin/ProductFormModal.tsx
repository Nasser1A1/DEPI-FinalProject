import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { productService, Product, Category } from '@/services/product.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/utils/helpers';

interface ProductFormModalProps {
    product: Product | null;
    onClose: () => void;
}

interface ProductFormData {
    title: string;
    description: string;
    price: number;
    stock: number;
    category_id: string;
    is_active: boolean;
}

export default function ProductFormModal({ product, onClose }: ProductFormModalProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
        defaultValues: product ? {
            title: product.title,
            description: product.description || '',
            price: product.price,
            stock: product.stock,
            category_id: product.category_id || '',
            is_active: product.is_active,
        } : {
            is_active: true,
        }
    });
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await productService.getCategories();
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load categories');
        }
    };

    const onSubmit = async (data: ProductFormData) => {
        try {
            setLoading(true);
            const payload = {
                ...data,
                category_id: data.category_id || undefined,
                product_metadata: {},
            };

            if (product) {
                await productService.updateProduct(product.id, payload);
                toast.success('Product updated successfully');
            } else {
                await productService.createProduct(payload);
                toast.success('Product created successfully');
            }
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {product ? 'Edit Product' : 'Create Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <Input
                        label="Product Title"
                        placeholder="Enter product title"
                        error={errors.title?.message}
                        {...register('title', { required: 'Title is required' })}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            rows={4}
                            placeholder="Enter product description"
                            {...register('description')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Price"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            error={errors.price?.message}
                            {...register('price', {
                                required: 'Price is required',
                                min: { value: 0.01, message: 'Price must be greater than 0' }
                            })}
                        />

                        <Input
                            label="Stock"
                            type="number"
                            placeholder="0"
                            error={errors.stock?.message}
                            {...register('stock', {
                                required: 'Stock is required',
                                min: { value: 0, message: 'Stock cannot be negative' }
                            })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            {...register('category_id')}
                        >
                            <option value="">No category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            {...register('is_active')}
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Active Product
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                        >
                            {product ? 'Update' : 'Create'} Product
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
