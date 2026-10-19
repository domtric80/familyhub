# CI only: preserve the exact upstream binaries already used by docker-compose.yml.
# Docker Hub/Quay no longer serve these images anonymously. The official GitHub
# release assets below have the same SHA-256 as the previously pinned images.
FROM alpine:3.22@sha256:5291449c3df73caf6ed85e649dec1b9e818b39a5d8c871e97afc13e9cd5e8fa8 AS base
LABEL org.opencontainers.image.licenses="AGPL-3.0-only"

FROM base AS minio
LABEL org.opencontainers.image.source="https://github.com/minio/minio" \
      org.opencontainers.image.version="RELEASE.2025-09-07T16-13-09Z"
ADD --checksum=sha256:7c5bd8512c6e966455b1d198209358b2d191c77a83ab377c4073281065fb855f https://github.com/minio/minio/releases/download/RELEASE.2025-09-07T16-13-09Z/minio.linux-amd64.RELEASE.2025-09-07T16-13-09Z /usr/bin/minio
RUN chmod 0555 /usr/bin/minio && minio --version
EXPOSE 9000 9001
ENTRYPOINT ["/usr/bin/minio"]

FROM base AS mc
LABEL org.opencontainers.image.source="https://github.com/minio/mc" \
      org.opencontainers.image.version="RELEASE.2025-08-13T08-35-41Z"
ADD --checksum=sha256:01f866e9c5f9b87c2b09116fa5d7c06695b106242d829a8bb32990c00312e891 https://github.com/minio/mc/releases/download/RELEASE.2025-08-13T08-35-41Z/mc.linux-amd64.RELEASE.2025-08-13T08-35-41Z /usr/bin/mc
RUN chmod 0555 /usr/bin/mc && mc --version
ENTRYPOINT ["/usr/bin/mc"]
