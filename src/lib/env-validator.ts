/**
 * Environment Variable Validator
 * Validates all required environment variables at startup and provides typed configuration
 */

export interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };

  // PostgreSQL Configuration
  postgres: {
    url: string;
    user: string;
    host: string;
    password: string;
    database: string;
    urlNonPooling: string;
    prismaUrl: string;
    directUrl: string;
  };

  // NextAuth Configuration
  nextAuth: {
    secret: string;
    url?: string;
  };

  // Email Configuration
  email: {
    smtpHost?: string;
    smtpUser?: string;
    smtpPass?: string;
    adminEmail?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: EnvironmentConfig;
}

/**
 * Validates all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required Supabase variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
    /^["']|["']$/g,
    ""
  );
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(
    /^["']|["']$/g,
    ""
  );
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(
    /^["']|["']$/g,
    ""
  );
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET?.replace(
    /^["']|["']$/g,
    ""
  );

  if (!supabaseUrl) errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
  if (!supabaseAnonKey)
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
  if (!supabaseServiceRoleKey)
    errors.push("SUPABASE_SERVICE_ROLE_KEY is required");
  if (!supabaseJwtSecret) errors.push("SUPABASE_JWT_SECRET is required");

  // Required PostgreSQL variables
  const postgresUrl = process.env.POSTGRES_URL?.replace(/^["']|["']$/g, "");
  const postgresUser = process.env.POSTGRES_USER?.replace(/^["']|["']$/g, "");
  const postgresHost = process.env.POSTGRES_HOST?.replace(/^["']|["']$/g, "");
  const postgresPassword = process.env.POSTGRES_PASSWORD?.replace(
    /^["']|["']$/g,
    ""
  );
  const postgresDatabase = process.env.POSTGRES_DATABASE?.replace(
    /^["']|["']$/g,
    ""
  );
  const postgresUrlNonPooling = process.env.POSTGRES_URL_NON_POOLING?.replace(
    /^["']|["']$/g,
    ""
  );
  const postgresPrismaUrl = process.env.POSTGRES_PRISMA_URL?.replace(
    /^["']|["']$/g,
    ""
  );
  const directUrl = process.env.DIRECT_URL?.replace(/^["']|["']$/g, "");

  if (!postgresUrl) errors.push("POSTGRES_URL is required");
  if (!postgresUser) errors.push("POSTGRES_USER is required");
  if (!postgresHost) errors.push("POSTGRES_HOST is required");
  if (!postgresPassword) errors.push("POSTGRES_PASSWORD is required");
  if (!postgresDatabase) errors.push("POSTGRES_DATABASE is required");
  if (!postgresUrlNonPooling)
    errors.push("POSTGRES_URL_NON_POOLING is required");
  if (!postgresPrismaUrl) errors.push("POSTGRES_PRISMA_URL is required");
  if (!directUrl) errors.push("DIRECT_URL is required");

  // Required NextAuth variables
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.replace(
    /^["']|["']$/g,
    ""
  );
  const nextAuthUrl = process.env.NEXTAUTH_URL?.replace(/^["']|["']$/g, "");

  if (!nextAuthSecret) errors.push("NEXTAUTH_SECRET is required");
  if (!nextAuthUrl) warnings.push("NEXTAUTH_URL is recommended for production");

  // Optional Email variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!smtpHost)
    warnings.push("SMTP_HOST not set - email functionality will be limited");
  if (!adminEmail)
    warnings.push("ADMIN_EMAIL not set - admin notifications will be disabled");

  // Validate URL formats
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
  }

  if (nextAuthUrl && !isValidUrl(nextAuthUrl)) {
    errors.push("NEXTAUTH_URL must be a valid URL");
  }

  // Validate PostgreSQL connection strings
  if (postgresUrl && !isValidPostgresUrl(postgresUrl)) {
    errors.push("POSTGRES_URL must be a valid PostgreSQL connection string");
  }

  if (postgresPrismaUrl && !isValidPostgresUrl(postgresPrismaUrl)) {
    errors.push(
      "POSTGRES_PRISMA_URL must be a valid PostgreSQL connection string"
    );
  }

  if (directUrl && !isValidPostgresUrl(directUrl)) {
    errors.push("DIRECT_URL must be a valid PostgreSQL connection string");
  }

  const isValid = errors.length === 0;

  if (isValid) {
    const config: EnvironmentConfig = {
      supabase: {
        url: supabaseUrl!,
        anonKey: supabaseAnonKey!,
        serviceRoleKey: supabaseServiceRoleKey!,
        jwtSecret: supabaseJwtSecret!,
      },
      postgres: {
        url: postgresUrl!,
        user: postgresUser!,
        host: postgresHost!,
        password: postgresPassword!,
        database: postgresDatabase!,
        urlNonPooling: postgresUrlNonPooling!,
        prismaUrl: postgresPrismaUrl!,
        directUrl: directUrl!,
      },
      nextAuth: {
        secret: nextAuthSecret!,
        url: nextAuthUrl,
      },
      email: {
        smtpHost,
        smtpUser,
        smtpPass,
        adminEmail,
      },
    };

    return { isValid: true, errors: [], warnings, config };
  }

  return { isValid: false, errors, warnings };
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid PostgreSQL connection string
 */
function isValidPostgresUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "postgresql:" || urlObj.protocol === "postgres:";
  } catch {
    return false;
  }
}

/**
 * Gets validated environment configuration
 * Throws error if validation fails
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const result = validateEnvironment();

  if (!result.isValid) {
    const errorMessage = [
      "Environment validation failed:",
      ...result.errors.map((error) => `  - ${error}`),
      ...result.warnings.map((warning) => `  ⚠ ${warning}`),
    ].join("\n");

    throw new Error(errorMessage);
  }

  return result.config!;
}

/**
 * Logs environment validation results
 */
export function logEnvironmentValidation(): void {
  const result = validateEnvironment();

  if (result.isValid) {
    console.log("✅ Environment validation passed");
    if (result.warnings.length > 0) {
      console.log("⚠️ Warnings:");
      result.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }
  } else {
    console.error("❌ Environment validation failed:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
    if (result.warnings.length > 0) {
      console.log("⚠️ Warnings:");
      result.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }
  }
}

// Export singleton instance with graceful fallback
export const envConfig = (() => {
  try {
    const result = validateEnvironment();

    if (result.isValid) {
      return result.config!;
    } else {
      console.warn(
        "Environment validation failed, using fallback configuration:",
        result.errors.join(", ")
      );

      // Return a fallback configuration for development
      return {
        supabase: {
          url:
            process.env.NEXT_PUBLIC_SUPABASE_URL ||
            "https://placeholder.supabase.co",
          anonKey:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
          serviceRoleKey:
            process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key",
          jwtSecret:
            process.env.SUPABASE_JWT_SECRET || "placeholder-jwt-secret",
        },
        postgres: {
          url:
            process.env.POSTGRES_URL || "postgresql://localhost:5432/portfolio",
          user: process.env.POSTGRES_USER || "postgres",
          host: process.env.POSTGRES_HOST || "localhost",
          password: process.env.POSTGRES_PASSWORD || "password",
          database: process.env.POSTGRES_DATABASE || "portfolio",
          urlNonPooling:
            process.env.POSTGRES_URL_NON_POOLING ||
            "postgresql://localhost:5432/portfolio",
          prismaUrl:
            process.env.POSTGRES_PRISMA_URL ||
            "postgresql://localhost:5432/portfolio",
          directUrl:
            process.env.DIRECT_URL || "postgresql://localhost:5432/portfolio",
        },
        nextAuth: {
          secret:
            process.env.NEXTAUTH_SECRET ||
            "autoreach-pro-development-secret-please-set",
          url: process.env.NEXTAUTH_URL,
        },
        email: {
          smtpHost: process.env.SMTP_HOST,
          smtpUser: process.env.SMTP_USER,
          smtpPass: process.env.SMTP_PASS,
          adminEmail: process.env.ADMIN_EMAIL,
        },
      };
    }
  } catch (error) {
    console.warn(
      "Environment validation failed, using fallback configuration:",
      error.message
    );

    // Return a fallback configuration for development
    return {
      supabase: {
        url:
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          "https://placeholder.supabase.co",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
        serviceRoleKey:
          process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key",
        jwtSecret: process.env.SUPABASE_JWT_SECRET || "placeholder-jwt-secret",
      },
      postgres: {
        url:
          process.env.POSTGRES_URL || "postgresql://localhost:5432/portfolio",
        user: process.env.POSTGRES_USER || "postgres",
        host: process.env.POSTGRES_HOST || "localhost",
        password: process.env.POSTGRES_PASSWORD || "password",
        database: process.env.POSTGRES_DATABASE || "portfolio",
        urlNonPooling:
          process.env.POSTGRES_URL_NON_POOLING ||
          "postgresql://localhost:5432/portfolio",
        prismaUrl:
          process.env.POSTGRES_PRISMA_URL ||
          "postgresql://localhost:5432/portfolio",
        directUrl:
          process.env.DIRECT_URL || "postgresql://localhost:5432/portfolio",
      },
      nextAuth: {
        secret:
          process.env.NEXTAUTH_SECRET ||
          "autoreach-pro-development-secret-please-set",
        url: process.env.NEXTAUTH_URL,
      },
      email: {
        smtpHost: process.env.SMTP_HOST,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        adminEmail: process.env.ADMIN_EMAIL,
      },
    };
  }
})();
