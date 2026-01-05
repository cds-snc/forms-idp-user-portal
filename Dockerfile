FROM node:22-alpine AS base

ENV NODE_ENV=production
ENV NEXT_OUTPUT_STANDALONE=true

COPY . /src
WORKDIR /src

RUN corepack enable
RUN pnpm install
RUN pnpm build

FROM node:22-alpine AS final
LABEL maintainer="-"

ENV PORT=3000
ENV NODE_ENV=production

WORKDIR /src

COPY --from=base /src/public ./public
COPY --from=base /src/package.json ./package.json
COPY --from=base /src/.next/standalone ./
COPY --from=base /src/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]