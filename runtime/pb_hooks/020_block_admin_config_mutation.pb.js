routerUse((next) => {
  return (c) => {
    const isProduction = $os.getenv("PB_APP_ENV") === "production";
    const allowImport = $os.getenv("PB_ALLOW_COLLECTION_IMPORT") === "true";
    const allowAdminConfigMutation = $os.getenv("PB_ALLOW_ADMIN_CONFIG_MUTATION") === "true";
    const request = c.request();
    const method = request.method;
    const path = c.path();
    const isMutationMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (!isProduction) {
      return next(c);
    }

    if (!allowImport && method === "PUT" && path === "/api/collections/import") {
      return c.json(403, {
        code: 403,
        message: "Collection import is disabled. Use committed PocketBase migrations instead.",
        data: {},
      });
    }

    const isCollectionSchemaMutation =
      (path === "/api/collections" && method === "POST") ||
      (/^\/api\/collections\/[^/]+$/.test(path) && ["PATCH", "DELETE"].includes(method));

    if (!allowImport && isCollectionSchemaMutation) {
      return c.json(403, {
        code: 403,
        message: "Collection schema changes are disabled in production. Modify collections locally and commit PocketBase migrations instead.",
        data: {},
      });
    }

    if (!allowAdminConfigMutation && isMutationMethod && path.startsWith("/api/settings")) {
      return c.json(403, {
        code: 403,
        message: "Settings changes are disabled in production. Configure PocketBase settings through environment variables.",
        data: {},
      });
    }

    if (!allowAdminConfigMutation && isMutationMethod && path.startsWith("/api/backups")) {
      return c.json(403, {
        code: 403,
        message: "Backup mutations are disabled in production. Configure backups through environment variables.",
        data: {},
      });
    }

    return next(c);
  };
});

