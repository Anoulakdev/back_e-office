# Use the latest official Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client (optional, if using Prisma)
RUN npx prisma generate

# Expose the application port (e.g., 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
