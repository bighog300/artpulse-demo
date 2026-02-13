-- CreateTable
CREATE TABLE "OnboardingState" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "hasFollowedSomething" BOOLEAN NOT NULL DEFAULT false,
    "hasVisitedFollowing" BOOLEAN NOT NULL DEFAULT false,
    "hasAcceptedInvite" BOOLEAN NOT NULL DEFAULT false,
    "hasCreatedVenue" BOOLEAN NOT NULL DEFAULT false,
    "hasSubmittedEvent" BOOLEAN NOT NULL DEFAULT false,
    "hasViewedNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingState_userId_key" ON "OnboardingState"("userId");

-- AddForeignKey
ALTER TABLE "OnboardingState" ADD CONSTRAINT "OnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
