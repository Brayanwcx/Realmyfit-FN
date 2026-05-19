INSERT INTO "user" (name, "lastName", "docType", "docNumber", email, password, "isActive")
VALUES ('Admin', 'Prueba', 'CC', '1234567890', 'admin@realmyfit.com', '$2b$10$ORM10b4dAC61WKZrauzu6OKd585gYw9aFBg7GVwhylbiT4pkcG8xi', true);

INSERT INTO "user_roles" ("userId", "roleId") VALUES ((SELECT id FROM "user" WHERE email = 'admin@realmyfit.com'), 1);
