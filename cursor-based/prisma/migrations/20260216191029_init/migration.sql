-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
