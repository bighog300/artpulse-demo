-- CreateTable
CREATE TABLE "AdminInvite" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "intendedRole" "Role" NOT NULL DEFAULT 'EDITOR',
    "tokenHash" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AdminInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_normalizedEmail_key" ON "AdminInvite"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_tokenHash_key" ON "AdminInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminInvite_normalizedEmail_createdAt_idx" ON "AdminInvite"("normalizedEmail", "createdAt");

-- CreateIndex
CREATE INDEX "AdminInvite_expiresAt_idx" ON "AdminInvite"("expiresAt");

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
