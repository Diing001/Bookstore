FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "5173","run", "dev"]