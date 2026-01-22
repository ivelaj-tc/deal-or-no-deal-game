# Base image with Node.js
FROM node:18-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build Next.js for production
RUN npm run build

EXPOSE 3000

# Default command: start Next.js in production mode
CMD ["npm", "run", "start"]