import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CreditCard, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCartStore } from '@/state/cart.store';
import { useAuthStore } from '@/state/auth.store';
import { paymentService } from '@/services/payment.service';
import { orderService } from '@/services/order.service';

interface CheckoutFormData {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  paymentMethod: 'card' | 'paypal';
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cart, isLoading, fetchCart, clearCart, error } = useCartStore();
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    defaultValues: {
      paymentMethod: 'card'
    }
  });

  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initCart = async () => {
      await fetchCart();
      setIsInitializing(false);
    };
    initCart();
  }, [fetchCart]);

  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Cart</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    if (step !== 'success') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="bg-gray-100 p-6 rounded-full mb-6">
            <Truck className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">Add some items to your cart to proceed to checkout.</p>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
      );
    }
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (step === 'shipping') {
      setStep('payment');
      return;
    }

    try {
      setProcessing(true);

      const subtotal = Number(cart?.subtotal) || 0;

      // 1. Create Payment Intent
      const intent = await paymentService.createPaymentIntent({
        amount: subtotal,
        currency: 'USD',
        cart_id: cart!.id,
        payment_method: data.paymentMethod,
        metadata: {
          shipping_address: `${data.address}, ${data.city}, ${data.zipCode}, ${data.country}`,
          customer_email: data.email
        }
      });

      // 2. Confirm Payment (Simulated)
      await paymentService.confirmPayment({
        payment_intent_id: intent.id,
        payment_method_id: 'pm_card_visa' // Mock payment method
      });

      // 3. Place Order
      if (user && cart) {
        await orderService.createOrder({
          user_id: user.id,
          items: cart.items.map(item => ({
            product_id: item.product_id,
            product_title: item.product_title || 'Unknown Product',
            product_image: item.product_image || undefined,
            quantity: item.quantity,
            price: Number(item.price)
          })),
          total_amount: subtotal,
          shipping_address: {
            fullName: data.fullName,
            email: data.email,
            address: data.address,
            city: data.city,
            zipCode: data.zipCode,
            country: data.country
          },
          payment_intent_id: intent.id
        });
      }

      // 4. Clear Cart & Show Success
      await clearCart();
      setStep('success');
      toast.success('Order placed successfully!');

    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-green-100 p-6 rounded-full mb-6">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Thank you for your purchase. Your order has been received and is being processed. You will receive an email confirmation shortly.
        </p>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Shipping Address */}
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${step === 'payment' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Truck className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.fullName?.message}
                  {...register('fullName', { required: 'Full name is required' })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    placeholder="123 Main St"
                    error={errors.address?.message}
                    {...register('address', { required: 'Address is required' })}
                  />
                </div>
                <Input
                  label="City"
                  placeholder="New York"
                  error={errors.city?.message}
                  {...register('city', { required: 'City is required' })}
                />
                <Input
                  label="ZIP Code"
                  placeholder="10001"
                  error={errors.zipCode?.message}
                  {...register('zipCode', { required: 'ZIP code is required' })}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Country"
                    placeholder="United States"
                    error={errors.country?.message}
                    {...register('country', { required: 'Country is required' })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            {step === 'payment' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <CreditCard className="w-6 h-6 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    <input
                      type="radio"
                      value="card"
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      {...register('paymentMethod')}
                    />
                    <span className="ml-3 font-medium text-gray-900">Credit / Debit Card</span>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    <input
                      type="radio"
                      value="paypal"
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      {...register('paymentMethod')}
                    />
                    <span className="ml-3 font-medium text-gray-900">PayPal</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              {step === 'payment' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('shipping')}
                  disabled={processing}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                isLoading={processing}
                className="w-full md:w-auto px-8"
              >
                {step === 'shipping' ? 'Continue to Payment' : `Pay $${(Number(cart?.subtotal) || 0).toFixed(2)}`}
              </Button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {cart?.items?.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product_image || 'https://via.placeholder.com/150'}
                      alt={item.product_title || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{item.product_title}</h4>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-gray-900">${(Number(item.total_price) || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${(Number(cart?.subtotal) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${(Number(cart?.subtotal) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
