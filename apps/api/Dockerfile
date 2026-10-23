FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and package manifests
COPY package.json package-lock.json* ./
COPY packages/ packages/
COPY apps/api/ apps/api/
COPY prisma/ prisma/

# Install dependencies and generate prisma client
RUN npm install
RUN npx prisma generate

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "src/index.js"]
