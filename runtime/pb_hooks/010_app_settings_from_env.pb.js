$app.onBeforeServe().add((e) => {
  if ($os.getenv("PB_APP_ENV") !== "production") {
    return;
  }

  try {
    const env = (name) => $os.getenv(name);
    const hasEnv = (name) => env(name) !== "";
    const envBool = (name) => ["1", "true", "yes", "on"].includes(env(name).toLowerCase());
    const envInt = (name) => {
      const value = parseInt(env(name), 10);
      return Number.isNaN(value) ? null : value;
    };
    const applyString = (target, key, envName) => {
      if (hasEnv(envName)) target[key] = env(envName);
    };
    const applyBool = (target, key, envName) => {
      if (hasEnv(envName)) target[key] = envBool(envName);
    };
    const applyInt = (target, key, envName) => {
      if (!hasEnv(envName)) return;

      const value = envInt(envName);
      if (value !== null) target[key] = value;
    };
    const applyS3Config = (target, prefix) => {
      applyBool(target, "enabled", `${prefix}_ENABLED`);
      applyString(target, "bucket", `${prefix}_BUCKET`);
      applyString(target, "region", `${prefix}_REGION`);
      applyString(target, "endpoint", `${prefix}_ENDPOINT`);
      applyString(target, "accessKey", `${prefix}_ACCESS_KEY`);
      applyString(target, "secret", `${prefix}_SECRET`);
      applyBool(target, "forcePathStyle", `${prefix}_FORCE_PATH_STYLE`);
    };

    const settings = $app.settings();

    applyString(settings.meta, "appName", "PB_META_APP_NAME");
    applyString(settings.meta, "appUrl", "PB_META_APP_URL");
    applyString(settings.meta, "senderName", "PB_META_SENDER_NAME");
    applyString(settings.meta, "senderAddress", "PB_META_SENDER_ADDRESS");
    applyBool(settings.meta, "hideControls", "PB_META_HIDE_CONTROLS");

    applyBool(settings.smtp, "enabled", "PB_SMTP_ENABLED");
    applyString(settings.smtp, "host", "PB_SMTP_HOST");
    applyInt(settings.smtp, "port", "PB_SMTP_PORT");
    applyString(settings.smtp, "username", "PB_SMTP_USERNAME");
    applyString(settings.smtp, "password", "PB_SMTP_PASSWORD");
    applyString(settings.smtp, "authMethod", "PB_SMTP_AUTH_METHOD");
    applyBool(settings.smtp, "tls", "PB_SMTP_TLS");
    applyString(settings.smtp, "localName", "PB_SMTP_LOCAL_NAME");

    applyS3Config(settings.s3, "PB_STORAGE_S3");

    applyString(settings.backups, "cron", "PB_BACKUPS_CRON");
    applyInt(settings.backups, "cronMaxKeep", "PB_BACKUPS_CRON_MAX_KEEP");
    applyS3Config(settings.backups.s3, "PB_BACKUPS_S3");

    $app.dao().saveSettings(settings);
    $app.refreshSettings();
  } catch (err) {
    console.warn("[settings-from-env] Failed to apply PocketBase settings from env:", err);
  }
});

