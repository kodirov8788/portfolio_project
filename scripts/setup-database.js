const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Read environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log("Setting up database schema...");

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, "..", "database-schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc("exec_sql", { sql: statement });

        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        }
      }
    }

    console.log("Database schema setup completed!");

    // Now insert example data
    console.log("Inserting example data...");

    const exampleData = `
      -- Insert example projects
      INSERT INTO projects (id, title, slug, short_description, full_description, featured, status, created_by, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'Portfolio Website', 'portfolio-website', 'A modern portfolio site.', 'A full-featured portfolio built with Next.js, Supabase, and Tailwind CSS.', true, 'published', '00000000-0000-0000-0000-000000000000', now(), now()),
        (gen_random_uuid(), 'Blog Platform', 'blog-platform', 'A simple blog platform.', 'A blog platform with markdown support and comments.', false, 'published', '00000000-0000-0000-0000-000000000000', now(), now());
      
      -- Insert example blog posts
      INSERT INTO blog_posts (id, title, slug, content, status, author_id, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'Welcome to My Blog', 'welcome-to-my-blog', 'This is the first post on my new blog!', 'published', '00000000-0000-0000-0000-000000000000', now(), now()),
        (gen_random_uuid(), 'Building with Supabase', 'building-with-supabase', 'How to use Supabase in your Next.js projects.', 'published', '00000000-0000-0000-0000-000000000000', now(), now());
      
      -- Insert example contact messages
      INSERT INTO contact_messages (id, name, email, subject, message, status, priority, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'John Doe', 'john@example.com', 'Project Inquiry', 'I would like to discuss a potential project.', 'new', 'medium', now(), now()),
        (gen_random_uuid(), 'Jane Smith', 'jane@example.com', 'General Question', 'I have a question about your services.', 'read', 'low', now(), now());
    `;

    const { error: dataError } = await supabase.rpc("exec_sql", {
      sql: exampleData,
    });

    if (dataError) {
      console.error("Error inserting example data:", dataError);
    } else {
      console.log("Example data inserted successfully!");
    }
  } catch (error) {
    console.error("Setup failed:", error);
  }
}

setupDatabase()
  .then(() => {
    console.log("Database setup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
