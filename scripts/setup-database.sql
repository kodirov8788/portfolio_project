-- Create project_categories table
CREATE TABLE IF NOT EXISTS project_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  github_url VARCHAR(500),
  live_url VARCHAR(500),
  featured BOOLEAN DEFAULT FALSE,
  technologies TEXT[],
  category_id INTEGER REFERENCES project_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample project categories
INSERT INTO project_categories (name, description, color) VALUES
('Web Development', 'Full-stack web applications and websites', '#3B82F6'),
('Mobile Development', 'iOS and Android mobile applications', '#10B981'),
('UI/UX Design', 'User interface and user experience design', '#F59E0B'),
('DevOps & Infrastructure', 'Deployment, CI/CD, and infrastructure management', '#8B5CF6'),
('Data Science', 'Machine learning, analytics, and data processing', '#EF4444'),
('Open Source', 'Contributions to open source projects', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- Insert some sample data
INSERT INTO projects (title, description, technologies, featured, category_id) VALUES
('E-Commerce Platform', 'Full-stack e-commerce solution with payment integration', ARRAY['React', 'Node.js', 'PostgreSQL'], true, (SELECT id FROM project_categories WHERE name = 'Web Development' LIMIT 1)),
('Task Management App', 'Collaborative project management with real-time updates', ARRAY['Next.js', 'TypeScript', 'Supabase'], true, (SELECT id FROM project_categories WHERE name = 'Web Development' LIMIT 1)),
('Mobile App', 'Cross-platform mobile application for fitness tracking', ARRAY['React Native', 'Firebase', 'Redux'], false, (SELECT id FROM project_categories WHERE name = 'Mobile Development' LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO blog_posts (title, slug, content, excerpt, status, published_at, featured) VALUES
('Getting Started with Next.js 15', 'getting-started-nextjs-15', 'Next.js 15 introduces exciting new features...', 'Learn about the latest features in Next.js 15', 'published', NOW(), true),
('Building Scalable APIs with Node.js', 'building-scalable-apis-nodejs', 'When building APIs at scale...', 'Best practices for building scalable APIs', 'published', NOW(), false)
ON CONFLICT DO NOTHING;

INSERT INTO contact_messages (name, email, subject, message) VALUES
('John Doe', 'john@example.com', 'Project Inquiry', 'I would like to discuss a potential project with you.'),
('Jane Smith', 'jane@example.com', 'Collaboration Opportunity', 'Looking for a developer to collaborate on an exciting project.')
ON CONFLICT DO NOTHING; 