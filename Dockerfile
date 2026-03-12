FROM node:22-slim
WORKDIR /app

# Copy source files
COPY . .

# Install dependencies
RUN npm install

# Railway injects PORT env var dynamically
EXPOSE 3001

CMD ["node", "interaction-server.cjs"]
