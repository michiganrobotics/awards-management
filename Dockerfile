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

# ---- Runtime (distroless: minimal OS surface, no shell/apt/dnf) ----
# Google's distroless node image ships ~20 packages vs ~90 on a full node base,
# which eliminates the bulk of OS-package CVEs. It's pulled from gcr.io (not
# Docker Hub, so no rate limit). Files are owned group 0 + world-readable so the
# app runs under OpenShift's arbitrary UID.
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone server + static assets (server.js lands at the WORKDIR root)
COPY --from=builder --chown=65532:0 /opt/app-root/src/.next/standalone ./
COPY --from=builder --chown=65532:0 /opt/app-root/src/.next/static     ./.next/static
COPY --from=builder --chown=65532:0 /opt/app-root/src/public           ./public

EXPOSE 3000
# The distroless nodejs image's ENTRYPOINT is the node binary, so pass the script.
CMD ["server.js"]
