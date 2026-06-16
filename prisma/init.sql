PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Participant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Test" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "version" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "TestModule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "testId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "icon" TEXT,
  "order" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TestModule_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TestItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduleId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "sourceText" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'activity',
  "order" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TestItem_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TestModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TestSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "participantId" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "currentModuleOrder" INTEGER NOT NULL DEFAULT 0,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TestSession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TestSession_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ItemResponse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "numericValue" INTEGER NOT NULL,
  "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItemResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ItemResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "TestItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TopPreference" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TopPreference_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TopPreference_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TestModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TopPreference_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "TestItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ModuleProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "answeredCount" INTEGER NOT NULL DEFAULT 0,
  "topCount" INTEGER NOT NULL DEFAULT 0,
  "completedAt" DATETIME,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModuleProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TestModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Participant_code_key" ON "Participant" ("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Test_slug_key" ON "Test" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "TestModule_testId_key_key" ON "TestModule" ("testId", "key");
CREATE UNIQUE INDEX IF NOT EXISTS "TestModule_testId_order_key" ON "TestModule" ("testId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "TestItem_moduleId_key_key" ON "TestItem" ("moduleId", "key");
CREATE UNIQUE INDEX IF NOT EXISTS "TestItem_moduleId_order_key" ON "TestItem" ("moduleId", "order");
CREATE INDEX IF NOT EXISTS "TestSession_participantId_testId_status_idx" ON "TestSession" ("participantId", "testId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "ItemResponse_sessionId_itemId_key" ON "ItemResponse" ("sessionId", "itemId");
CREATE UNIQUE INDEX IF NOT EXISTS "TopPreference_sessionId_moduleId_rank_key" ON "TopPreference" ("sessionId", "moduleId", "rank");
CREATE UNIQUE INDEX IF NOT EXISTS "TopPreference_sessionId_moduleId_itemId_key" ON "TopPreference" ("sessionId", "moduleId", "itemId");
CREATE UNIQUE INDEX IF NOT EXISTS "ModuleProgress_sessionId_moduleId_key" ON "ModuleProgress" ("sessionId", "moduleId");
