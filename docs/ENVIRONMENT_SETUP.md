# Environment Setup Guide

This guide will help you set up all the required environment variables for PostgreSQL and Supabase integration.

## Prerequisites

- A Supabase project created
- PostgreSQL database access
- Node.js and npm installed

## Supabase Configuration

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 2. Get Supabase Environment Variables

From your Supabase project dashboard:

- **NEXT_PUBLIC_SUPABASE_URL**: Your project URL (found in Settings > API)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Your anon/public key (found in Settings > API)
- **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (found in Settings > API)
- **SUPABASE_JWT_SECRET**: Your JWT secret (found in Settings > API)

## PostgreSQL Configuration

### 1. Database Connection Strings

You'll need these PostgreSQL connection strings:

- **POSTGRES_URL**: Direct connection string
- **POSTGRES_PRISMA_URL**: Connection string with connection pooling
- **POSTGRES_URL_NON_POOLING**: Non-pooled connection string
- **DIRECT_URL**: Direct connection string for migrations

### 2. Individual PostgreSQL Variables

- **POSTGRES_USER**: Database username
- **POSTGRES_HOST**: Database host
- **POSTGRES_PASSWORD**: Database password
- **POSTGRES_DATABASE**: Database name

## Environment File Setup

### 1. Copy Environment Template

```bash
cp env.example .env.local
```

### 2. Fill in Your Values

Edit `.env.local` with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# PostgreSQL Configuration
POSTGRES_URL=postgresql://username:password@host:port/database
POSTGRES_USER=your_postgres_username
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database?pgbouncer=true&connect_timeout=15
DIRECT_URL=postgresql://username:password@host:port/database

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
ADMIN_EMAIL=your_admin_email
```

## Connection String Formats

### PostgreSQL Connection Strings

All PostgreSQL connection strings follow this format:

```
postgresql://username:password@host:port/database?parameters
```

**Examples:**

- **Direct**: `postgresql://user:pass@localhost:5432/mydb`
- **With Pooling**: `postgresql://user:pass@localhost:5432/mydb?pgbouncer=true&connect_timeout=15`
- **Supabase**: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### Supabase Connection Strings

For Supabase projects, your connection strings will look like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Testing Your Setup

### 1. Test Environment Variables

```bash
npm run test:connections
```

### 2. Test Database Setup

```bash
npm run setup:database
```

### 3. Run Health Checks

```bash
# Quick health check
curl http://localhost:3000/api/health?quick=true

# Full health check
curl http://localhost:3000/api/health

# Database-specific health check
curl http://localhost:3000/api/health/database
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Problem**: Environment variables are undefined
**Solution**:

- Ensure `.env.local` is in the project root
- Restart your development server
- Check for typos in variable names

#### 2. Database Connection Failed

**Problem**: Cannot connect to database
**Solution**:

- Verify connection strings are correct
- Check if database is running
- Ensure firewall allows connections
- Verify credentials

#### 3. Supabase Authentication Issues

**Problem**: Supabase auth not working
**Solution**:

- Verify API keys are correct
- Check if RLS policies are properly configured
- Ensure JWT secret matches

#### 4. Prisma Connection Issues

**Problem**: Prisma cannot connect
**Solution**:

- Run `npx prisma generate`
- Check if `POSTGRES_PRISMA_URL` is correct
- Verify database exists

### Debug Commands

```bash
# Check environment validation
npm run test:env

# Test all connections
npm run test:connections

# Check Prisma connection
npx prisma db pull

# Check Supabase connection
npx supabase status
```

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different credentials** for development and production
3. **Rotate API keys** regularly
4. **Use connection pooling** in production
5. **Enable SSL** for production connections

## Production Considerations

### Environment Variables

- Use a secure secret management system
- Set `NODE_ENV=production`
- Use production-grade connection strings
- Enable SSL connections

### Database Configuration

- Use connection pooling
- Set appropriate timeouts
- Monitor connection usage
- Set up database backups

### Supabase Configuration

- Configure RLS policies
- Set up proper authentication
- Monitor API usage
- Configure rate limiting

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the health check endpoints
3. Review the connection test results
4. Check Supabase and PostgreSQL logs
5. Consult the official documentation:
   - [Supabase Docs](https://supabase.com/docs)
   - [Prisma Docs](https://www.prisma.io/docs)
   - [NextAuth.js Docs](https://next-auth.js.org)
