FROM node:22-slim

WORKDIR /app

# install packages first (this layer is reused if package.json doesn't change)
COPY package*.json ./
RUN npm install --omit=dev

# download the embedding model once, at build time, so it lives inside the image
RUN node -e "import('@huggingface/transformers').then(m => m.pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2')).then(() => console.log('model cached'))"

# now copy your code
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]