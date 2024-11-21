# Stage 1: Build the Next.js app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build

# Stage 2: Serve the Next.js app
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

# Install only production dependencies
RUN npm install --production

# Set environment variable for CapRover
ENV PORT=3000

# Expose the app's port
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "run", "start"]
