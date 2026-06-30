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
# NOTE: this cluster's image mirror remaps EVERY node base reference — UBI
# nodejs AND gcr.io distroless — to the same Debian `node:22-bookworm` image.
# So a slimmer/UBI/distroless runtime is NOT achievable here; the OS layer is
# Debian bookworm regardless of what we put in FROM. We patch it as far as
# Debian stable allows; the remaining OS-package CVEs are a base-image matter
# for ITS (whose mirror forces this base). See the security notes in the repo.
FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS runner
WORKDIR /opt/app-root/src

# Patch OS packages (dual-mode: apt on the mirrored Debian base, dnf if it ever
# resolves to real UBI). Never fail the build on this step.
USER 0
RUN if command -v apt-get >/dev/null 2>&1; then \
      apt-get update && apt-get -y upgrade && apt-get -y autoremove --purge && rm -rf /var/lib/apt/lists/*; \
    elif command -v dnf >/dev/null 2>&1; then \
      dnf -y update && dnf clean all; \
    fi

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
