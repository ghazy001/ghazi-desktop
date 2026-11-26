# Build the existing Vue portfolio without embedding server-only credentials.
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# One HTTP process serves the XP desktop and the private Resend endpoint.
FROM node:24-alpine AS production
ENV NODE_ENV=production
ENV PORT=35000
WORKDIR /app
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/src/data/profile-data.json ./src/data/profile-data.json
USER node
EXPOSE 35000
CMD ["node", "server/index.mjs"]
