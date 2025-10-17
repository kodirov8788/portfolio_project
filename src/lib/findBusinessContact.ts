import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function findBusinessContact({
  id,
  email,
  phone,
}: {
  id?: string;
  email?: string;
  phone?: string;
}) {
  if (!id && !email && !phone) return null;
  return prisma.business.findFirst({
    where: {
        ...(id ? { id } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
    },
  });
}
