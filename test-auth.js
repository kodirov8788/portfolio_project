import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testAuth() {
  console.log(
    "🔍 Testing authentication with admin@muhammadali.pro / admin123!"
  );

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: "admin@muhammadali.pro" },
      include: { role: true },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:", {
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role?.name,
      hasPassword: !!user.password,
    });

    // Test password
    if (user.password) {
      const isValid = await bcrypt.compare("admin123!", user.password);
      console.log(
        "🔐 Password validation:",
        isValid ? "✅ Valid" : "❌ Invalid"
      );

      if (isValid) {
        console.log("🎉 Authentication test successful!");
        console.log("User details:", {
          id: user.id,
          email: user.email,
          name: user.fullName || user.firstName || user.email,
          role: user.role?.name || "admin",
        });
      }
    } else {
      console.log("❌ No password set for user");
    }
  } catch (error) {
    console.error("❌ Error testing authentication:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
