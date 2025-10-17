import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create user roles
  const adminRole = await prisma.userRole.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Full system access",
      permissions: { all: true },
    },
  });

  const editorRole = await prisma.userRole.upsert({
    where: { name: "editor" },
    update: {},
    create: {
      name: "editor",
      description: "Can create and edit content",
      permissions: {
        blog: { create: true, edit: true },
        projects: { create: true, edit: true },
      },
    },
  });

  const viewerRole = await prisma.userRole.upsert({
    where: { name: "viewer" },
    update: {},
    create: {
      name: "viewer",
      description: "Read-only access",
      permissions: {
        blog: { read: true },
        projects: { read: true },
      },
    },
  });

  console.log("✅ User roles created");

  // Create blog categories
  const blogCategories = [
    {
      name: "Technology",
      slug: "technology",
      description: "Posts about programming, frameworks, and tech trends",
      color: "#3b82f6",
    },
    {
      name: "Tutorial",
      slug: "tutorial",
      description: "Step-by-step guides and how-to articles",
      color: "#10b981",
    },
    {
      name: "Personal",
      slug: "personal",
      description: "Personal thoughts and experiences",
      color: "#f59e0b",
    },
    {
      name: "Industry",
      slug: "industry",
      description: "Industry insights and career advice",
      color: "#8b5cf6",
    },
  ];

  for (const category of blogCategories) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("✅ Blog categories created");

  // Create contact categories
  const contactCategories = [
    {
      name: "General Inquiry",
      description: "General questions and information requests",
      priority: "MEDIUM" as const,
    },
    {
      name: "Project Request",
      description: "Requests for new projects or collaborations",
      priority: "HIGH" as const,
    },
    {
      name: "Bug Report",
      description: "Reports of issues or bugs",
      priority: "HIGH" as const,
    },
    {
      name: "Support",
      description: "Technical support requests",
      priority: "MEDIUM" as const,
    },
    {
      name: "Partnership",
      description: "Business partnership opportunities",
      priority: "HIGH" as const,
    },
  ];

  for (const category of contactCategories) {
    await prisma.contactCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log("✅ Contact categories created");

  // Create project categories
  const projectCategories = [
    {
      name: "Web Development",
      slug: "web-development",
      description: "Full-stack web applications",
      color: "#3b82f6",
    },
    {
      name: "Mobile App",
      slug: "mobile-app",
      description: "iOS and Android applications",
      color: "#10b981",
    },
    {
      name: "AI/ML",
      slug: "ai-ml",
      description: "Artificial Intelligence and Machine Learning projects",
      color: "#f59e0b",
    },
    {
      name: "Open Source",
      slug: "open-source",
      description: "Open source contributions and libraries",
      color: "#8b5cf6",
    },
    {
      name: "Client Work",
      slug: "client-work",
      description: "Commercial client projects",
      color: "#ef4444",
    },
  ];

  for (const category of projectCategories) {
    await prisma.projectCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("✅ Project categories created");

  // Create skills
  const skills = [
    {
      name: "React",
      category: "FRONTEND" as const,
      proficiency: 5,
      yearsExperience: 4.5,
    },
    {
      name: "Next.js",
      category: "FRONTEND" as const,
      proficiency: 5,
      yearsExperience: 3.0,
    },
    {
      name: "TypeScript",
      category: "FRONTEND" as const,
      proficiency: 5,
      yearsExperience: 4.0,
    },
    {
      name: "Node.js",
      category: "BACKEND" as const,
      proficiency: 4,
      yearsExperience: 3.5,
    },
    {
      name: "PostgreSQL",
      category: "DATABASE" as const,
      proficiency: 4,
      yearsExperience: 3.0,
    },
    {
      name: "Prisma",
      category: "DATABASE" as const,
      proficiency: 4,
      yearsExperience: 2.0,
    },
    {
      name: "Supabase",
      category: "BACKEND" as const,
      proficiency: 4,
      yearsExperience: 2.5,
    },
    {
      name: "Docker",
      category: "DEVOPS" as const,
      proficiency: 3,
      yearsExperience: 2.0,
    },
    {
      name: "AWS",
      category: "DEVOPS" as const,
      proficiency: 3,
      yearsExperience: 1.5,
    },
    {
      name: "Figma",
      category: "DESIGN" as const,
      proficiency: 3,
      yearsExperience: 2.0,
    },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  console.log("✅ Skills created");

  // Create example admin user profile
  const hashedPassword = await bcrypt.hash("admin123!", 12);
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      email: "admin@muhammadali.pro", // Ensure email is updated
      password: hashedPassword, // Update hashed password
      roleId: adminRole.id,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001", // Fixed UUID for consistency
      email: "admin@muhammadali.pro", // Updated to match auth.ts
      username: "admin",
      password: hashedPassword, // Add hashed password
      fullName: "Muhammad Ali",
      firstName: "Muhammad",
      lastName: "Ali",
      bio: "Full-stack developer and portfolio owner",
      roleId: adminRole.id,
      isActive: true,
      emailVerified: true,
      preferences: {
        theme: "dark",
        notifications: true,
        language: "en",
      },
      metadata: {
        lastLogin: new Date().toISOString(),
        createdBy: "system",
      },
    },
  });

  console.log("✅ Admin user created:", adminUser.email);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
