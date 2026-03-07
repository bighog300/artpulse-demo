import { RegistrationStatus } from "@prisma/client";

type RegistrationRecord = {
  id: string;
  eventId: string;
  guestEmail: string;
  confirmationCode: string;
  status: RegistrationStatus;
};

type CancelTransactionArgs = {
  registrationId: string;
};

type CancelTransactionTx = {
  registration: {
    findUnique: (args: {
      where: { id: string };
      select: { id: true; eventId: true; guestEmail: true; confirmationCode: true; status: true };
    }) => Promise<RegistrationRecord | null>;
    update: (args: {
      where: { id: string };
      data: { status: "CANCELLED"; cancelledAt: Date };
      select: { id: true; eventId: true; guestEmail: true; confirmationCode: true; status: true };
    }) => Promise<RegistrationRecord>;
  };
};

export async function cancelRegistrationTransaction(tx: CancelTransactionTx, args: CancelTransactionArgs) {
  const existing = await tx.registration.findUnique({
    where: { id: args.registrationId },
    select: { id: true, eventId: true, guestEmail: true, confirmationCode: true, status: true },
  });

  if (!existing) throw new Error("registration_not_found");
  if (existing.status === "CANCELLED") return existing;

  return tx.registration.update({
    where: { id: existing.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
    select: { id: true, eventId: true, guestEmail: true, confirmationCode: true, status: true },
  });
}
