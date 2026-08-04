# pocketbase-runtime-kit

Reusable PocketBase runtime image, hooks, and Helm chart for GitOps-friendly
Kubernetes deployments.

This repository provides the shared deployment layer. Application repositories
should still own their PocketBase migrations and build a thin app-specific image
from the shared runtime image.

## What belongs here

- PocketBase runtime Docker image.
- Shared production hooks.
- Standard entrypoint for merging shared hooks with app hooks.
- Reusable Helm chart for deploying a single PocketBase instance.
- Public examples that do not contain application data, hostnames, or secrets.

## What belongs in each app repository

- `pb_migrations/`
- Optional app-specific `pb_hooks/`
- A small `Dockerfile` based on the runtime image.
- Environment-specific Helm values and secrets references.

Example app image:

```dockerfile
ARG RUNTIME_IMAGE=ghcr.io/snfas/pocketbase-runtime-kit:0.1.0

FROM ${RUNTIME_IMAGE}

COPY --chown=pocketbase:pocketbase pb_migrations/ /pbapp/pb_migrations/
# Optional:
# COPY --chown=pocketbase:pocketbase pb_hooks/ /pbapp/pb_hooks/
```

## Runtime image

The image published by this repository includes:

- PocketBase.
- Shared hooks in `/usr/local/share/pocketbase/pb_hooks`.
- A standard entrypoint that copies shared hooks and optional app hooks into one
  runtime hooks directory.
- `/pb_data` for PocketBase data.
- `/pbapp/pb_migrations` for app-owned migrations.

Default command:

```text
pocketbase serve --http 0.0.0.0:8090 --dir /pb_data --hooksDir /tmp/pb_hooks --migrationsDir /pbapp/pb_migrations --encryptionEnv PB_ENCRYPTION_KEY --automigrate=true
```

Run the generic runtime locally with Docker Compose:

```sh
cp .env.example .env
docker compose up --build
```

Then open:

```text
http://localhost:8090
```

Or run the published image directly:

```sh
docker run --rm \
  -p 8090:8090 \
  --env-file .env \
  -v pocketbase_data:/pb_data \
  ghcr.io/snfas/pocketbase-runtime-kit:0.1.0
```

Useful runtime variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PB_APP_ENV` | `production` | Enables production-only hooks. |
| `PB_HTTP` | `0.0.0.0:8090` | PocketBase listen address. |
| `PB_DATA_DIR` | `/pb_data` | Data directory. |
| `PB_APP_HOOKS_DIR` | `/pbapp/pb_hooks` | Optional app hooks directory. |
| `PB_MIGRATIONS_DIR` | `/pbapp/pb_migrations` | App migrations directory. |
| `PB_ENCRYPTION_ENV` | `PB_ENCRYPTION_KEY` | Name of the env var used by PocketBase for encrypted settings. |
| `PB_AUTOMIGRATE` | `true` | Passed to `--automigrate`. |
| `PB_DEV` | `false` | Adds PocketBase `--dev` when `true`. |
| `PB_ORIGINS` | empty | Passed to PocketBase `--origins` when set. |
| `PB_EXTRA_ARGS` | empty | Additional PocketBase CLI args. |

Image tags use the runtime kit version. The embedded PocketBase binary version
is controlled separately by the `PB_VERSION` Docker build argument. The initial
default is `0.22.6` because the existing app deployments this kit was extracted
from already use that PocketBase version.

Build a runtime kit image with a different PocketBase binary:

```sh
docker build runtime \
  --build-arg KIT_VERSION=0.1.0 \
  --build-arg PB_VERSION=0.22.51 \
  -t ghcr.io/snfas/pocketbase-runtime-kit:0.1.0
```

## Configuration from YAML

The chart keeps operational settings in Helm values, so Git-tracked YAML is the
source of truth. The chart renders those values into environment variables, and
the shared hook applies them to PocketBase settings on startup.

```yaml
settings:
  meta:
    appName: Example App
    appUrl: https://pocketbase.example.test
    senderName: Example App
    senderAddress: noreply@example.test
    hideControls: true
  storageS3:
    enabled: true
    bucket: example-app
    region: us-east-1
    endpoint: http://minio.minio.svc.cluster.local:9000
    forcePathStyle: true
  backups:
    cron: "0 3 * * *"
    cronMaxKeep: 5
    s3:
      enabled: true
      bucket: example-app
      region: us-east-1
      endpoint: http://minio.minio.svc.cluster.local:9000
      forcePathStyle: true
```

Secrets such as `PB_ENCRYPTION_KEY`, `PB_STORAGE_S3_ACCESS_KEY`,
`PB_STORAGE_S3_SECRET`, `PB_BACKUPS_S3_ACCESS_KEY`, and
`PB_BACKUPS_S3_SECRET` should come from `secret.existingSecret` or your GitOps
secret integration.

## Hook environment variables

The shared settings hook runs only when `PB_APP_ENV=production`. Empty variables
are ignored, so an unset variable leaves the current PocketBase setting as-is.

Boolean values accept `1`, `true`, `yes`, or `on`.

### App metadata

| Variable | Type | PocketBase setting |
| --- | --- | --- |
| `PB_META_APP_NAME` | string | `settings.meta.appName` |
| `PB_META_APP_URL` | string | `settings.meta.appUrl` |
| `PB_META_SENDER_NAME` | string | `settings.meta.senderName` |
| `PB_META_SENDER_ADDRESS` | string | `settings.meta.senderAddress` |
| `PB_META_HIDE_CONTROLS` | boolean | `settings.meta.hideControls` |

### SMTP

| Variable | Type | PocketBase setting |
| --- | --- | --- |
| `PB_SMTP_ENABLED` | boolean | `settings.smtp.enabled` |
| `PB_SMTP_HOST` | string | `settings.smtp.host` |
| `PB_SMTP_PORT` | integer | `settings.smtp.port` |
| `PB_SMTP_USERNAME` | string | `settings.smtp.username` |
| `PB_SMTP_PASSWORD` | string | `settings.smtp.password` |
| `PB_SMTP_AUTH_METHOD` | string | `settings.smtp.authMethod` |
| `PB_SMTP_TLS` | boolean | `settings.smtp.tls` |
| `PB_SMTP_LOCAL_NAME` | string | `settings.smtp.localName` |

### Uploaded file S3 storage

| Variable | Type | PocketBase setting |
| --- | --- | --- |
| `PB_STORAGE_S3_ENABLED` | boolean | `settings.s3.enabled` |
| `PB_STORAGE_S3_BUCKET` | string | `settings.s3.bucket` |
| `PB_STORAGE_S3_REGION` | string | `settings.s3.region` |
| `PB_STORAGE_S3_ENDPOINT` | string | `settings.s3.endpoint` |
| `PB_STORAGE_S3_ACCESS_KEY` | string | `settings.s3.accessKey` |
| `PB_STORAGE_S3_SECRET` | string | `settings.s3.secret` |
| `PB_STORAGE_S3_FORCE_PATH_STYLE` | boolean | `settings.s3.forcePathStyle` |

### Backups

| Variable | Type | PocketBase setting |
| --- | --- | --- |
| `PB_BACKUPS_CRON` | string | `settings.backups.cron` |
| `PB_BACKUPS_CRON_MAX_KEEP` | integer | `settings.backups.cronMaxKeep` |
| `PB_BACKUPS_S3_ENABLED` | boolean | `settings.backups.s3.enabled` |
| `PB_BACKUPS_S3_BUCKET` | string | `settings.backups.s3.bucket` |
| `PB_BACKUPS_S3_REGION` | string | `settings.backups.s3.region` |
| `PB_BACKUPS_S3_ENDPOINT` | string | `settings.backups.s3.endpoint` |
| `PB_BACKUPS_S3_ACCESS_KEY` | string | `settings.backups.s3.accessKey` |
| `PB_BACKUPS_S3_SECRET` | string | `settings.backups.s3.secret` |
| `PB_BACKUPS_S3_FORCE_PATH_STYLE` | boolean | `settings.backups.s3.forcePathStyle` |

### Production override switches

These variables are read by the production guard hook. Leave them unset during
normal production operation.

| Variable | Required value | Effect |
| --- | --- | --- |
| `PB_ALLOW_COLLECTION_IMPORT` | `true` | Allows collection import and collection schema mutations through the Admin API. |
| `PB_ALLOW_ADMIN_CONFIG_MUTATION` | `true` | Allows settings and backup mutations through the Admin API. |

`PB_ENCRYPTION_KEY` is not applied by the hook, but it should be set whenever
PocketBase is started with `--encryptionEnv PB_ENCRYPTION_KEY`. Keep it stable
for existing instances because PocketBase uses it to decrypt encrypted settings.

## Helm chart

Render the chart locally:

```sh
helm template example charts/pocketbase-app
```

Minimal values for an app-specific image:

```yaml
image:
  repository: ghcr.io/example-org/example-pocketbase
  tag: "1.0.0"

secret:
  existingSecret: example-pocketbase-secrets

settings:
  meta:
    appName: Example App
    appUrl: https://pocketbase.example.test
```

A fuller copyable example is available in `examples/basic-values.yaml`.

The chart intentionally defaults to a single replica. PocketBase uses SQLite and
should have one writable pod for a given data directory.

## Production guard hooks

When `PB_APP_ENV=production`, the shared hooks:

- apply supported settings from environment variables on startup;
- block collection import and collection schema mutations through the Admin API;
- block settings and backup mutations through the Admin API.

Set these only for controlled maintenance windows:

```sh
PB_ALLOW_COLLECTION_IMPORT=true
PB_ALLOW_ADMIN_CONFIG_MUTATION=true
```

## Publishing

The `Publish Runtime Image` workflow builds `runtime/` and publishes to:

```text
ghcr.io/snfas/pocketbase-runtime-kit
```

It runs on pushes to `main`, tags matching `v*.*.*`, and manual dispatch. The
published tag represents this runtime kit version, not the upstream PocketBase
binary version.
