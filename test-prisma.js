import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPrismaConnection() {
  try {
    console.log("🔍 Testing Prisma connection...");

    const user = await prisma.userProfile.findUnique({
      where: { email: "admin@muhammadali.pro" },
      include: { role: true },
    });

    if (user) {
      console.log("✅ User found:", {
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role?.name,
      });
    } else {
      console.log("❌ User not found");
    }
  } catch (error) {
    console.error("❌ Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
