migrate((db) => {
  const dao = new Dao(db);

  const notes = new Collection({
    id: "notes000000001",
    created: "2026-01-01 00:00:00.000Z",
    updated: "2026-01-01 00:00:00.000Z",
    name: "notes",
    type: "base",
    system: false,
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    options: {},
    schema: [
      {
        id: "text_title0001",
        name: "title",
        type: "text",
        system: false,
        required: true,
        unique: false,
        options: {
          min: 1,
          max: 255,
          pattern: "",
        },
      },
      {
        id: "text_body00001",
        name: "body",
        type: "editor",
        system: false,
        required: false,
        unique: false,
        options: {},
      },
    ],
    indexes: [],
  });

  dao.saveCollection(notes);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("notes");

  dao.deleteCollection(collection);
});

