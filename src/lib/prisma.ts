import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with connection pooling and retry logic
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
    datasources: {
      db: {
        url:
          process.env.POSTGRES_PRISMA_URL ||
          process.env.DATABASE_URL ||
          "postgresql://localhost:5432/portfolio",
      },
    },
    // Connection pooling configuration
    __internal: {
      engine: {
        connectTimeout: 10000, // 10 seconds
        queryTimeout: 30000, // 30 seconds
        poolTimeout: 10000, // 10 seconds
      },
    },
  });

// Add connection retry logic
prisma.$use(async (params, next) => {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await next(params);
    } catch (error: any) {
      retries++;

      // Check if it's a connection error that should be retried
      if (
        error.code === "P1001" || // Can't reach database server
        error.code === "P1002" || // Database server doesn't exist
        error.code === "P1008" || // Operations timed out
        error.code === "P1017" // Server has closed the connection
      ) {
        if (retries < maxRetries) {
          console.warn(
            `Database connection error (attempt ${retries}/${maxRetries}):`,
            error.message
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // Exponential backoff
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded for database operation");
});

// Connection health check
export async function checkPrismaConnection(): Promise<{
  success: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return { success: true, latency };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Graceful shutdown
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log("Prisma client disconnected successfully");
  } catch (error) {
    console.error("Error disconnecting Prisma client:", error);
  }
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
