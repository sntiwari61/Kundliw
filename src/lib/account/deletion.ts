import { AssociateStatus, CommissionStatus, OrderStatus, PaymentStatus, PayoutStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

/**
 * Deleting an account (a Google Play and privacy-law requirement, for the website and the app).
 *
 * What is removed: the sign-in details (name, e-mail, mobile number, password, picture, linked Google or
 * Facebook sign-in), the files in the Vault, the contact details on support tickets, an Associate's payout
 * details, and any pending OTP codes. The person can no longer sign in.
 * What is kept: orders, invoices and commission records, because tax and accounting law requires them. They no longer
 * point to a named person.
 * Nothing is removed while paid work or money is still open.
 */

export const DELETED_NAME = "Deleted account";

export type DeleteAccountResult = { ok: true; deletedFiles: number } | { ok: false; status: number; error: string };

export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, phone: true, name: true, associate: { select: { id: true } } },
  });
  if (!user) return { ok: false, status: 404, error: "Account not found." };
  if (user.role === Role.ADMIN) {
    return { ok: false, status: 403, error: "An administrator account cannot be deleted here. Please ask another administrator." };
  }
  if (user.name === DELETED_NAME) return { ok: false, status: 404, error: "Account not found." };

  // Work that is paid for but not finished
  const openOrders = await prisma.order.count({
    where: {
      userId,
      paymentStatus: PaymentStatus.PAID,
      status: { notIn: [OrderStatus.DELIVERED, OrderStatus.EXECUTION_COMPLETE] },
    },
  });
  if (openOrders > 0) {
    return {
      ok: false,
      status: 409,
      error: "You have a paid order that is still in progress. Please wait until it is delivered, or raise a Support ticket to cancel it, and then delete your account.",
    };
  }

  // Money owed to an Associate
  if (user.associate) {
    const [owed, requested] = await Promise.all([
      prisma.commission.count({ where: { associateId: user.associate.id, status: CommissionStatus.EARNED } }),
      prisma.payoutRequest.count({ where: { associateId: user.associate.id, status: PayoutStatus.REQUESTED } }),
    ]);
    if (owed > 0 || requested > 0) {
      return {
        ok: false,
        status: 409,
        error: "You have commission that has not been paid out yet. Please receive your payout first (or raise a Support ticket), and then delete your account.",
      };
    }
  }

  const files = await prisma.vaultFile.findMany({ where: { userId }, select: { storageKey: true } });

  await prisma.$transaction(
    async (tx) => {
      await tx.vaultFile.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.supportTicket.updateMany({
        where: { userId },
        data: { contactName: null, contactEmail: null, contactPhone: null, contactAddress: null },
      });
      if (user.associate) {
        await tx.commission.updateMany({
          where: { associateId: user.associate.id, status: CommissionStatus.PENDING },
          data: { status: CommissionStatus.CANCELLED },
        });
        await tx.associateProfile.update({
          where: { id: user.associate.id },
          data: {
            status: AssociateStatus.SUSPENDED,
            payoutUpi: null,
            payoutAccountHolder: null,
            payoutAccountNumber: null,
            payoutIfsc: null,
          },
        });
      }
      if (user.phone) await tx.otpVerification.deleteMany({ where: { phone: user.phone } });
      await tx.user.update({
        where: { id: userId },
        data: { name: DELETED_NAME, email: null, phone: null, passwordHash: null, image: null, emailVerified: null },
      });
    },
    { maxWait: 10000, timeout: 30000 },
  );

  // The stored files go last: if one cannot be removed the account is still closed and the others are cleaned up
  let deletedFiles = 0;
  const storage = getStorageProvider();
  for (const f of files) {
    try {
      await storage.deleteFile?.(f.storageKey);
      deletedFiles += 1;
    } catch (e) {
      console.error("Could not remove a stored file while deleting an account:", e instanceof Error ? e.message : e);
    }
  }
  return { ok: true, deletedFiles };
}
