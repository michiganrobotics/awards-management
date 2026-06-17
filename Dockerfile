# Next.js (standalone) container for OpenShift / ROSA.
# Auth is handled upstream by robotics-auth-proxy; this image ships no auth code.

# ---- Build ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# React 19 / Next 16 peer ranges need legacy resolution (matches the old Netlify build).
RUN npm ci --legacy-peer-deps
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runtime ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone server + static assets (server.js lands at /app/server.js)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

# OpenShift runs the container as a random UID in group 0.
RUN chgrp -R 0 /app && chmod -R g=u /app
USER 1001
EXPOSE 3000
CMD ["node", "server.js"]
