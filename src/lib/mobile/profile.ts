import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailSchema, nameSchema } from "@/lib/auth/validation";
import { toUserDto, type MobileUserDto } from "./session";

/** What a customer may change about their own account from the app: the name and the email. (The mobile number is their sign-in, so it is changed with the Kendra's help.) */
export const profileInputSchema = z.object({
  name: nameSchema,
  email: z.union([emailSchema, z.literal("")]).optional(),
});

export class ProfileError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ProfileError";
    this.status = status;
  }
}

export async function updateProfile(userId: string, input: z.infer<typeof profileInputSchema>): Promise<MobileUserDto> {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, phone: true, email: true } });
  if (!me) throw new ProfileError("Account not found.", 404);
  // Administrators sign in with their email, so it is never changed from the app
  if (me.role === Role.ADMIN) throw new ProfileError("This account cannot be changed from the app.", 403);

  const email = input.email === undefined ? me.email : input.email === "" ? null : input.email;
  if (!email && !me.phone) throw new ProfileError("Please keep an email address, so you can still sign in.");

  try {
    await prisma.user.update({ where: { id: userId }, data: { name: input.name, email, ...(email !== me.email ? { emailVerified: null } : {}) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ProfileError("This email is already used by another account.", 409);
    }
    throw e;
  }
  const dto = await toUserDto(userId);
  if (!dto) throw new ProfileError("Account not found.", 404);
  return dto;
}
