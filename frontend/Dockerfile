# ---------- Stage 1: Build ----------
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the app (إذا عندك build step زي Vite أو Next.js)
RUN npm run build

# ---------- Stage 2: Final ----------
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy built app and node_modules from build stage
COPY --from=build /app /app

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

