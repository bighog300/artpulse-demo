-- CreateTable
CREATE TABLE "ImportMappingPreset" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mappingJson" JSONB NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportMappingPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportMappingPreset_createdById_entityType_name_key" ON "ImportMappingPreset"("createdById", "entityType", "name");

-- CreateIndex
CREATE INDEX "ImportMappingPreset_createdById_entityType_updatedAt_idx" ON "ImportMappingPreset"("createdById", "entityType", "updatedAt");

-- AddForeignKey
ALTER TABLE "ImportMappingPreset" ADD CONSTRAINT "ImportMappingPreset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
