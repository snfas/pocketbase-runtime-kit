FROM alpine:3.20

ARG PB_VERSION=0.22.6
ARG KIT_VERSION=0.1.1

LABEL org.opencontainers.image.title="PocketBase Runtime Kit"
LABEL org.opencontainers.image.description="Reusable PocketBase runtime with shared production hooks"
LABEL org.opencontainers.image.source="https://github.com/snfas/pocketbase-runtime-kit"
LABEL org.opencontainers.image.version="${KIT_VERSION}"
LABEL org.opencontainers.image.base.name="pocketbase"
LABEL org.opencontainers.image.base.version="${PB_VERSION}"

RUN apk add --no-cache ca-certificates curl tzdata unzip \
  && case "$(apk --print-arch)" in \
    x86_64) arch="amd64" ;; \
    aarch64) arch="arm64" ;; \
    *) echo "Unsupported architecture: $(apk --print-arch)" >&2; exit 1 ;; \
  esac \
  && curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${arch}.zip" -o /tmp/pocketbase.zip \
  && unzip /tmp/pocketbase.zip -d /usr/local/bin \
  && chmod +x /usr/local/bin/pocketbase \
  && rm -f /tmp/pocketbase.zip \
  && addgroup -g 1000 pocketbase \
  && adduser -D -H -u 1000 -G pocketbase pocketbase \
  && mkdir -p /pb_data /pbapp/pb_hooks /pbapp/pb_migrations /usr/local/share/pocketbase/pb_hooks \
  && chown -R pocketbase:pocketbase /pb_data /pbapp /usr/local/share/pocketbase

COPY --chown=pocketbase:pocketbase pb_hooks/ /usr/local/share/pocketbase/pb_hooks/
COPY --chmod=0755 entrypoint.sh /usr/local/bin/pocketbase-entrypoint

ENV PB_APP_ENV=production
ENV PB_HTTP=0.0.0.0:8090

USER pocketbase
EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/pocketbase-entrypoint"]
