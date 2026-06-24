ARG NODE_VERSION=24.15.0-alpine

FROM node:${NODE_VERSION} AS development

WORKDIR /usr/src/app

CMD ["npm", "run", "start:dev"]

FROM node:${NODE_VERSION} AS builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    corepack enable pnpm && pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN npm run build

FROM node:${NODE_VERSION} AS production

RUN apk add --no-cache tzdata
ENV TZ=America/Campo_Grande

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    corepack enable pnpm && pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /usr/src/app/dist ./dist

USER node

CMD ["node", "dist/src/main"]