FROM node:22-alpine

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci

COPY apps/client apps/client

EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace", "@crewensia/client"]
