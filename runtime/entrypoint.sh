#!/bin/sh
set -eu

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

: "${PB_HTTP:=0.0.0.0:8090}"
: "${PB_DATA_DIR:=/pb_data}"
: "${PB_SHARED_HOOKS_DIR:=/usr/local/share/pocketbase/pb_hooks}"
: "${PB_APP_HOOKS_DIR:=/pbapp/pb_hooks}"
: "${PB_HOOKS_DIR:=/tmp/pb_hooks}"
: "${PB_MIGRATIONS_DIR:=/pbapp/pb_migrations}"
: "${PB_ENCRYPTION_ENV:=PB_ENCRYPTION_KEY}"
: "${PB_AUTOMIGRATE:=true}"
: "${PB_DEV:=false}"
: "${PB_ORIGINS:=}"
: "${PB_EXTRA_ARGS:=}"

mkdir -p "${PB_HOOKS_DIR}"

copy_hooks() {
  source_dir="$1"

  if [ ! -d "${source_dir}" ]; then
    return
  fi

  find "${source_dir}" -maxdepth 1 -type f -name "*.pb.js" -exec cp {} "${PB_HOOKS_DIR}/" \;
}

copy_hooks "${PB_SHARED_HOOKS_DIR}"
copy_hooks "${PB_APP_HOOKS_DIR}"

if [ ! -d "${PB_MIGRATIONS_DIR}" ]; then
  PB_MIGRATIONS_DIR="/tmp/pb_migrations"
  mkdir -p "${PB_MIGRATIONS_DIR}"
fi

set -- /usr/local/bin/pocketbase serve \
  --http "${PB_HTTP}" \
  --dir "${PB_DATA_DIR}" \
  --hooksDir "${PB_HOOKS_DIR}" \
  --migrationsDir "${PB_MIGRATIONS_DIR}" \
  --encryptionEnv "${PB_ENCRYPTION_ENV}" \
  "--automigrate=${PB_AUTOMIGRATE}"

if [ "${PB_DEV}" = "true" ]; then
  set -- "$@" --dev
fi

if [ -n "${PB_ORIGINS}" ]; then
  set -- "$@" --origins "${PB_ORIGINS}"
fi

# shellcheck disable=SC2086
exec "$@" ${PB_EXTRA_ARGS}

