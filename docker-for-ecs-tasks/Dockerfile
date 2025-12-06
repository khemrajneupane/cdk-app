# Use Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy rest of the app
COPY server.js ./

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
