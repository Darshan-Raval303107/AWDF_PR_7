# Use official Node.js runtime as the base image
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install dependencies using clean install from lockfile
RUN npm ci

# Copy backend application source files
COPY . .

# Set default environment variable for PORT
ENV PORT=5001

# Expose backend port
EXPOSE 5001

# Start the application using existing npm start script
CMD ["npm", "start"]
