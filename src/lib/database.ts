import { PrismaClient } from "../generated/prisma";

// Database service using DATABASE_URL for direct database operations
export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    console.log("DATABASE_URL:", databaseUrl);

    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required");
    }

    // Extract the Supabase URL from DATABASE_URL
    // Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    const urlMatch = databaseUrl.match(/@db\.([^.]+)\.supabase\.co/);
    console.log("urlMatch:", urlMatch);
    if (!urlMatch) {
        throw new Error(
          "Invalid DATABASE_URL format. Expected Supabase database URL."
        );
    }

    const projectRef = urlMatch[1];
    const supabaseUrl = `https://${projectRef}.supabase.co`;

    console.log(`🔌 Database service using DATABASE_URL (${supabaseUrl})`);

    // Initialize Prisma client
    this.prisma = new PrismaClient();
  }

  // Execute raw SQL queries using Prisma
  async executeSQL(sql: string) {
    try {
        // Use Prisma's $queryRaw for raw SQL execution
        const result = await this.prisma.$queryRaw`${sql}`;
        return result;
    } catch (error) {
        console.error("SQL execution error:", error);
        throw error;
    }
  }

  // Check if geographical search function exists
  async checkFunctionExists(functionName: string) {
    try {
        const result = await this.prisma.$queryRaw`
          SELECT proname 
          FROM pg_proc 
          WHERE proname = ${functionName}
          LIMIT 1
        `;
        return Array.isArray(result) && result.length > 0;
    } catch (error) {
        console.error("Function check failed:", error);
        return false;
    }
  }

  // Test geographical search function
  async testGeographicalSearch(
    lat: number,
    lng: number,
    radius: number = 5000
  ) {
    try {
        // Use Prisma to call the RPC function if it exists
        const result = await this.prisma.$queryRaw`
          SELECT * FROM search_businesses_within_radius(${lat}, ${lng}, ${radius})
        `;
        return result;
    } catch (error) {
        console.error("Geographical search test error:", error);
        throw error;
    }
  }

  // Get businesses count
  async getBusinessesCount() {
    try {
        const count = await this.prisma.business.count();
        return count;
    } catch (error) {
        console.error("Businesses count error:", error);
        throw error;
    }
  }

  // Get businesses with coordinates count
  async getBusinessesWithCoordinatesCount() {
    try {
        const count = await this.prisma.business.count({
          where: {
            coordinates: {
              not: null,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          },
        });
        return count;
    } catch (error) {
        console.error("Businesses with coordinates count error:", error);
        throw error;
    }
  }

  // Get database connection info
  getConnectionInfo() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        return {
          url: null,
          connectionType: "DATABASE_URL",
          status: "not configured",
        };
    }

    // Extract project reference from DATABASE_URL
    const urlMatch = databaseUrl.match(/@db\.([^.]+)\.supabase\.co/);
    const projectRef = urlMatch ? urlMatch[1] : "unknown";
    const supabaseUrl = urlMatch ? `https://${projectRef}.supabase.co` : null;

    return {
        url: supabaseUrl,
        connectionType: "DATABASE_URL",
        projectRef: projectRef,
        status: "configured",
    };
  }

  // Close the Prisma client
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Create singleton instance
let databaseService: DatabaseService | null = null;
let initializationError: Error | null = null;

export function getDatabaseService() {
  if (initializationError) {
    throw initializationError;
  }

  if (!databaseService) {
    try {
        databaseService = new DatabaseService();
    } catch (error) {
        initializationError = error as Error;
        throw error;
    }
  }
  return databaseService;
}

// Check if database service can be initialized
export function canInitializeDatabaseService(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  return !!databaseUrl;
}

// Get database service status
export function getDatabaseServiceStatus() {
  try {
    const service = getDatabaseService();
    const info = service.getConnectionInfo();
    return {
        status: "ready",
        connectionType: info.connectionType,
        message: `Database service ready using ${info.connectionType}`,
    };
  } catch (error) {
    return {
        status: "error",
        connectionType: null,
        message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export default instance
export default getDatabaseService();
