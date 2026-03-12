FROM node:22-slim
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# Railway injects PORT dynamically — our server reads process.env.PORT
EXPOSE 3001

CMD ["node", "interaction-server.cjs"]
