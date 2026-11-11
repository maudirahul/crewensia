FROM node:22-alpine

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci

COPY apps/client apps/client
COPY apps/server apps/server

RUN DATABASE_URL='postgresql://crewensia:crewensia@postgres:5432/crewensia?schema=public' \
  npm run db:generate --workspace @crewensia/server

EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy --workspace @crewensia/server && npm run start:container --workspace @crewensia/server"]
