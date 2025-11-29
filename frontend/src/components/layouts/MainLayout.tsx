import { Outlet } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/state/auth.store';
import { useCartStore } from '@/state/cart.store';
import Button from '@/components/ui/Button';

export default function MainLayout() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const { cart } = useCartStore();
    const totalItems = cart?.total_items || 0;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-md">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">E</span>
                            </div>
                            <span className="font-display font-bold text-xl gradient-text">
                                E-Commerce
                            </span>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Home
                            </Link>
                            <Link to="/products" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Products
                            </Link>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {/* Cart */}
                            <Link to="/cart">
                                <Button variant="ghost" className="relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                            {totalItems}
                                        </span>
                                    )}
                                </Button>
                            </Link>

                            {/* User Menu */}
                            {isAuthenticated ? (
                                <div className="flex items-center gap-2">
                                    <Link to="/profile">
                                        <Button variant="ghost">
                                            <User className="w-5 h-5" />
                                            <span className="hidden md:inline ml-2">{user?.full_name}</span>
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" onClick={() => logout()}>
                                        <LogOut className="w-5 h-5" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link to="/login">
                                        <Button variant="outline" size="sm">Login</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button variant="primary" size="sm">Sign Up</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-auto">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <p className="text-gray-400">
                            © 2025 E-Commerce Platform. Built with ❤️ using React & TypeScript
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
