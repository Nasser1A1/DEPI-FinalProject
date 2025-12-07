import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Determine if we're running in Docker via environment variable
  const isDocker = process.env.VITE_DOCKER === 'true';

  // Use Docker service names when in Docker, localhost otherwise
  const getServiceUrl = (service: string, port: number) => {
    return isDocker ? `http://${service}:8000` : `http://localhost:${port}`;
  };

  console.log('=== Vite Config ===');
  console.log('VITE_DOCKER:', process.env.VITE_DOCKER);
  console.log('isDocker:', isDocker);
  console.log('Auth Service URL:', getServiceUrl('auth-service', 8001));
  console.log('Product Service URL:', getServiceUrl('product-service', 8002));
  console.log('===================');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api/auth': {
          target: getServiceUrl('auth-service', 8001),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/auth/, '/auth'),
        },
        '/api/products': {
          target: getServiceUrl('product-service', 8002),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/products/, '/products'),
        },
        '/api/cart': {
          target: getServiceUrl('cart-service', 8003),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cart/, '/cart'),
        },
        '/api/payments': {
          target: getServiceUrl('payment-service', 8004),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/payments/, '/payments'),
        },
        '/api/analytics': {
          target: getServiceUrl('analytics-service', 8005),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/analytics/, '/analytics'),
        },
        '/api/orders': {
          target: getServiceUrl('order-service', 8006),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/orders/, '/orders'),
        },
      },
    },
  };
});
