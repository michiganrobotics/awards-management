# Next.js (standalone) container for OpenShift / ROSA.
# Auth is handled upstream by robotics-auth-proxy; this image ships no auth code.
#
# Base on Red Hat UBI Node.js (registry.access.redhat.com) rather than Docker
# Hub's node image: the cluster pulls UBI without hitting Docker Hub's
# anonymous pull rate limit, and UBI runs as non-root UID 1001 by default,
# which suits OpenShift's arbitrary-UID model.

# ---- Build ----
FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS builder
WORKDIR /opt/app-root/src
COPY --chown=1001:0 package.json package-lock.json ./
# React 19 / Next 16 peer ranges need legacy resolution (matches the old Netlify build).
RUN npm ci --legacy-peer-deps
COPY --chown=1001:0 . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runtime ----
FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS runner
WORKDIR /opt/app-root/src
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone server + static assets (server.js lands at the WORKDIR root)
COPY --from=builder --chown=1001:0 /opt/app-root/src/.next/standalone ./
COPY --from=builder --chown=1001:0 /opt/app-root/src/.next/static     ./.next/static
COPY --from=builder --chown=1001:0 /opt/app-root/src/public           ./public

USER 1001
EXPOSE 3000
CMD ["node", "server.js"]
