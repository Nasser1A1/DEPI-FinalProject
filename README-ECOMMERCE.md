# 🛒 Microservices E-Commerce Platform

A production-ready, scalable e-commerce platform built with microservices architecture using FastAPI, PostgreSQL, Redis, and React.

![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-teal)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

---

### 1. **Authentication Service** (`auth-service`) ✅
**Port:** 8001  
**Database:** PostgreSQL (auth_db)

**Purpose:** JWT-based authentication and user management

**Features:**
- User registration with email validation
- Login with JWT tokens (access + refresh)
- Password hashing with bcrypt
- Token refresh mechanism
- User profile management

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (revoke tokens)
- `GET /auth/me` - Get current user info

**Tech Stack:** FastAPI, PostgreSQL, JWT, bcrypt, Redis

---

### 2. **Product Service** (`product-service`) ⏳
**Port:** 8002  
**Database:** PostgreSQL (product_db)

**Purpose:** Product catalog management with image storage

**Features:**
- CRUD operations for products
- AWS S3 integration for images
- Category management
- Advanced search and filtering
- Pagination
- Stock tracking
- Price validation

**Endpoints:**
- `POST /products` - Create product (Admin)
- `GET /products` - List products with filters
- `GET /products/{id}` - Get product details
- `PUT /products/{id}` - Update product (Admin)
- `DELETE /products/{id}` - Delete product (Admin)
- `POST /products/{id}/images` - Upload images (Admin)
- `GET /products/search` - Search products

**Tech Stack:** FastAPI, PostgreSQL, AWS S3 (boto3), Redis

---

### 3. **Cart Service** (`cart-service`) ⏳
**Port:** 8003  
**Database:** PostgreSQL (cart_db)

**Purpose:** Shopping cart management

**Features:**
- User-specific cart management
- Add/remove/update cart items
- Stock validation (calls Product Service)
- Price snapshot preservation
- Checkout preparation

**Endpoints:**
- `POST /cart/add` - Add item to cart
- `DELETE /cart/remove/{item_id}` - Remove item
- `GET /cart` - Get user's cart
- `PUT /cart/items/{item_id}` - Update quantity
- `POST /cart/checkout` - Initiate checkout
- `DELETE /cart/clear` - Clear cart

**Tech Stack:** FastAPI, PostgreSQL, httpx (for Product Service calls), Redis

---

### 4. **Payment Service** (`payment-service`) ⏳
**Port:** 8004  
**Database:** PostgreSQL (payment_db)

**Purpose:** Payment processing and transaction management

**Features:**
- Payment intent creation
- Stripe integration (or mock provider)
- Payment verification
- Webhook handling
- Transaction history
- Refund support

**Endpoints:**
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment
- `GET /payments/{id}` - Get payment status
- `POST /payments/webhook` - Handle payment webhooks
- `POST /payments/refund` - Process refund

**Tech Stack:** FastAPI, PostgreSQL, Stripe SDK, Redis

---

### 5. **Analytics Service** (`analytics-service`) ⏳
**Port:** 8005  
**Database:** PostgreSQL (analytics_db)

**Purpose:** Event tracking and business intelligence

**Features:**
- Event collection (views, searches, purchases)
- Aggregation and reporting
- Popular products tracking
- Trending searches
- User behavior analysis
- Real-time dashboards

**Endpoints:**
- `POST /analytics/events` - Track event
- `GET /analytics/dashboard` - Get aggregate data
- `GET /analytics/products/popular` - Most viewed/purchased
- `GET /analytics/search/trending` - Trending searches
- `GET /analytics/revenue` - Revenue statistics

**Tech Stack:** FastAPI, PostgreSQL, Redis (buffering), TimescaleDB (optional)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend)
- AWS Account (for S3, or use LocalStack locally)

### Running with Docker Compose

```bash
# Clone the repository
git clone https://github.com/yourusername/ecommerce-platform.git
cd ecommerce-platform

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Service URLs:**
- Auth Service: http://localhost:8001/docs
- Product Service: http://localhost:8002/docs
- Cart Service: http://localhost:8003/docs
- Payment Service: http://localhost:8004/docs
- Analytics Service: http://localhost:8005/docs
- Order Service: http://localhost:8006/docs
- Frontend: http://localhost:3000

---

## 📊 Database Architecture

Each service has its own PostgreSQL database:

- **auth_db** (Port 5432) - Users, refresh tokens
- **product_db** (Port 5433) - Products, categories, images
- **cart_db** (Port 5434) - Carts, cart items
- **payment_db** (Port 5435) - Payments, transactions
- **analytics_db** (Port 5436) - Events, aggregations
- **ai_search_db** (Port 5437) - Product embeddings, price comparisons

**Shared Infrastructure:**
- **Redis** (Port 6379) - Caching & message queue
- **LocalStack** (Port 4566) - Local AWS S3 simulation

---

## 🏛️ Clean Architecture

Each service follows clean architecture with clear separation:

```
/service-name/
  /src/
    /domain/          # Business entities & interfaces
      /models/
      /interfaces/
    /application/     # Business logic & use cases
      /services/
      /dtos/
    /infrastructure/  # External dependencies
      /database/
      /external_apis/
    /presentation/    # API layer (FastAPI routes)
      /routes/
      /middlewares/
    /config/
  /tests/
  Dockerfile
  requirements.txt
  README.md
```

**Key Principles:**
- ✅ Dependency Inversion
- ✅ Single Responsibility
- ✅ Interface Segregation
- ✅ Repository Pattern
- ✅ DTO Pattern
- ✅ Service Layer Pattern

---

## 🔐 Security Features

- **Authentication:** JWT with short-lived access tokens (15min) and long-lived refresh tokens (7 days)
- **Password Hashing:** bcrypt with cost factor 12
- **CORS:** Configurable origins
- **Rate Limiting:** Protect against abuse
- **Input Validation:** Pydantic schemas
- **SQL Injection Prevention:** Parameterized queries
- **HTTPS:** Enforced in production
- **Non-root containers:** Security by default

---

## 🧪 Testing

Each service includes:
- Unit tests
- Integration tests
- API tests

```bash
# Run tests for a specific service
cd services/auth-service
pytest -v --cov=src

# Run all tests
./scripts/run-all-tests.sh
```

---

## 📈 Monitoring & Observability

- **Health Checks:** `/health` endpoint on each service
- **Structured Logging:** JSON logs for easy parsing
- **Metrics:** Request count, latency, errors
- **Distributed Tracing:** (Coming soon)

---

## 🌐 Frontend Application

**Tech Stack:**
- React 18
- Tailwind CSS
- React Query (data fetching)
- Zustand (state management)
- React Router v6
- Axios (HTTP client)

**Pages:**
- Authentication (Login/Register)
- Product Browsing & Search
- Product Details
- Shopping Cart
- Checkout
- Order History
- Admin Dashboard
- Analytics Dashboard

---

## 📝 API Documentation

Each service provides interactive API documentation:
- **Swagger UI:** `http://localhost:800X/docs`
- **ReDoc:** `http://localhost:800X/redoc`

---

## 🚢 Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### AWS ECS (Production)
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Infrastructure:**
- AWS ECS Fargate for services
- AWS RDS for PostgreSQL
- AWS ElastiCache for Redis
- AWS S3 for product images
- AWS ALB for load balancing
- AWS Route53 for DNS
- AWS CloudFront for CDN

---

## 📁 Project Structure

```
ecommerce-platform/
├── services/
│   ├── auth-service/          ✅ COMPLETE
│   ├── product-service/       ⏳ IN PROGRESS
│   ├── cart-service/          📝 PLANNED
│   ├── payment-service/       📝 PLANNED
│   ├── analytics-service/     📝 PLANNED
│   └── order-service/         📝 PLANNED
├── frontend/                  📝 PLANNED
├── shared/                    ✅ COMPLETE
│   ├── auth_utils.py
│   ├── database.py
│   ├── error_handlers.py
│   └── logging_config.py
├── scripts/
│   ├── setup.sh
│   └── run-all-tests.sh
├── docker-compose.yml         ✅ COMPLETE
├── .env.example
└── README.md                  ✅ COMPLETE
```

---

## 🎯 Implementation Status

### Completed ✅
- [x] Project architecture design
- [x] Shared utilities (auth, database, logging, errors)
- [x] Docker Compose configuration
- [x] **Authentication Service** (100%)
  - [x] JWT-based auth
  - [x] User registration
  - [x] Login/logout
  - [x] Token refresh
  - [x] User management

### In Progress ⏳
- [ ] **Product Service** (30%)
  - [x] README & structure
  - [ ] Models & database
  - [ ] S3 integration
  - [ ] CRUD operations
  - [ ] Search & filtering

### Planned 📝
- [ ] Cart Service
- [ ] Payment Service
- [ ] Analytics Service
- [ ] Order Service
- [ ] Frontend Application
- [ ] E2E Tests
- [ ] Deployment Documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License © 2025

---

## 👥 Team

**Lead Developer:** Mahmoud Mady  
**Project Type:** DevOps Graduation Project  
**Institution:** Digital Egypt Pioneers Initiative (DEPI)

---

## 📞 Support

For questions or support:
- Create an issue on GitHub
- Email: mahmoud@example.com

---

**Built with ❤️ using FastAPI, PostgreSQL, React, and AWS**
