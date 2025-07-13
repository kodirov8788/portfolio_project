"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { ArrowLeft, Save, Plus, X, Zap, Tag } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UploadResult } from "@/lib/services/storage-service";

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  featured_image_alt: string;
  category_id: string | null;
  status: "draft" | "published" | "scheduled" | "archived";
  featured: boolean;
  allow_comments: boolean;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  published_at: string | null;
  scheduled_at: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<BlogFormData>({
    title: "Getting Started with Next.js and TypeScript",
    slug: "getting-started-nextjs-typescript",
    excerpt:
      "Learn how to build modern web applications with Next.js and TypeScript. This comprehensive guide covers everything from setup to deployment.",
    content: `# Getting Started with Next.js and TypeScript

Next.js is a powerful React framework that makes building full-stack web applications simple and efficient. When combined with TypeScript, you get type safety and better developer experience.

## Why Next.js?

Next.js provides:
- **Server-Side Rendering (SSR)**: Better SEO and performance
- **Static Site Generation (SSG)**: Fast loading times
- **API Routes**: Built-in backend functionality
- **File-based Routing**: Intuitive page structure
- **Hot Reloading**: Fast development experience

## Why TypeScript?

TypeScript adds:
- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Improved Maintainability**: Self-documenting code
- **Team Collaboration**: Clear interfaces and contracts

## Setting Up Your Project

1. Create a new Next.js project with TypeScript:
   \`\`\`bash
   npx create-next-app@latest my-app --typescript
   \`\`\`

2. Navigate to your project:
   \`\`\`bash
   cd my-app
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure

Your Next.js project will have the following structure:
\`\`\`
my-app/
├── pages/
│   ├── _app.tsx
│   ├── index.tsx
│   └── api/
├── public/
├── styles/
├── components/
├── types/
├── next.config.js
├── tsconfig.json
└── package.json
\`\`\`

## Creating Your First Component

Let's create a simple component with TypeScript:

\`\`\`typescript
// components/Header.tsx
import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-blue-600 text-white p-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-xl mt-2">{subtitle}</p>}
    </header>
  );
};

export default Header;
\`\`\`

## Using the Component

\`\`\`typescript
// pages/index.tsx
import type { NextPage } from 'next';
import Header from '../components/Header';

const Home: NextPage = () => {
  return (
    <div>
      <Header 
        title="Welcome to My App" 
        subtitle="Built with Next.js and TypeScript" 
      />
      <main className="container mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Getting Started
        </h2>
        <p className="text-gray-600">
          This is your first Next.js page with TypeScript!
        </p>
      </main>
    </div>
  );
};

export default Home;
\`\`\`

## API Routes with TypeScript

Create API routes in the \`pages/api\` directory:

\`\`\`typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface Data {
  message: string;
  timestamp: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({
    message: 'Hello from Next.js API!',
    timestamp: new Date().toISOString(),
  });
}
\`\`\`

## Deployment

Deploy your Next.js app to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on every push

## Conclusion

Next.js with TypeScript provides a powerful foundation for building modern web applications. The combination offers excellent developer experience, type safety, and production-ready features out of the box.

Start building your next project today!`,
    featured_image: "",
    featured_image_alt: "Next.js and TypeScript Development",
    category_id: null,
    status: "draft",
    featured: false,
    allow_comments: true,
    seo_title: "Getting Started with Next.js and TypeScript - Complete Guide",
    seo_description:
      "Learn how to build modern web applications with Next.js and TypeScript. This comprehensive guide covers setup, components, API routes, and deployment.",
    seo_keywords: [
      "Next.js",
      "TypeScript",
      "React",
      "Web Development",
      "Full Stack",
    ],
    published_at: null,
    scheduled_at: null,
  });
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "category_id" ? (value ? value : null) : value,
    }));
  };

  const handleSwitchChange =
    (field: keyof Pick<BlogFormData, "featured" | "allow_comments">) =>
    (checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: checked,
      }));
    };

  const handleImageUpload = (result: UploadResult) => {
    setFormData((prev) => ({
      ...prev,
      featured_image: result.url,
    }));
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      featured_image: "",
    }));
  };

  const addKeyword = () => {
    if (
      newKeyword.trim() &&
      !formData.seo_keywords.includes(newKeyword.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        seo_keywords: [...prev.seo_keywords, newKeyword.trim()],
      }));
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      seo_keywords: prev.seo_keywords.filter((k) => k !== keyword),
    }));
  };

  const loadSampleData = () => {
    const samples = [
      {
        title: "Building a Portfolio with React and Tailwind CSS",
        slug: "building-portfolio-react-tailwind",
        excerpt:
          "Create a stunning portfolio website using React and Tailwind CSS. Learn modern design patterns and responsive layouts.",
        content: `# Building a Portfolio with React and Tailwind CSS

A portfolio website is essential for showcasing your work and skills. In this guide, we'll build a modern portfolio using React and Tailwind CSS.

## Why React and Tailwind CSS?

React provides:
- Component-based architecture
- Reusable UI elements
- State management
- Rich ecosystem

Tailwind CSS offers:
- Utility-first approach
- Rapid development
- Consistent design system
- Responsive design utilities

## Project Setup

1. Create a new React project:
   \`\`\`bash
   npx create-react-app my-portfolio --template typescript
   \`\`\`

2. Install Tailwind CSS:
   \`\`\`bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   \`\`\`

3. Configure Tailwind CSS in \`tailwind.config.js\`:
   \`\`\`javascript
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   \`\`\`

## Building Components

Let's create the main components for our portfolio:

### Header Component
\`\`\`typescript
// components/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Your Name
            </h1>
          </div>
          <div className="flex items-center space-x-8">
            <a href="#about" className="text-gray-700 hover:text-gray-900">
              About
            </a>
            <a href="#projects" className="text-gray-700 hover:text-gray-900">
              Projects
            </a>
            <a href="#contact" className="text-gray-700 hover:text-gray-900">
              Contact
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
\`\`\`

### Hero Section
\`\`\`typescript
// components/Hero.tsx
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Hi, I'm [Your Name]
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          Full-Stack Developer & UI/UX Designer
        </p>
        <p className="text-lg mb-10 max-w-3xl mx-auto">
          I create beautiful, functional, and user-centered digital experiences.
          Let's work together to bring your ideas to life.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            View My Work
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Get In Touch
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
\`\`\`

## Responsive Design

Tailwind CSS makes responsive design easy with utility classes:

\`\`\`typescript
// components/ProjectCard.tsx
import React from 'react';

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  image,
  technologies,
  liveUrl,
  githubUrl,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <img 
        src={image} 
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {technologies.map((tech) => (
            <span 
              key={tech}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="flex gap-4">
          {liveUrl && (
            <a 
              href={liveUrl}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Live Demo
            </a>
          )}
          {githubUrl && (
            <a 
              href={githubUrl}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
\`\`\`

## Deployment

Deploy your portfolio to various platforms:

1. **Vercel**: Perfect for React apps
2. **Netlify**: Great for static sites
3. **GitHub Pages**: Free hosting for open source projects

## Conclusion

Building a portfolio with React and Tailwind CSS is a great way to showcase your skills while learning modern web development practices. The combination provides a powerful and flexible foundation for creating beautiful, responsive websites.

Start building your portfolio today!`,
        featured_image: "",
        featured_image_alt: "React and Tailwind CSS Portfolio",
        category_id: null,
        status: "draft" as const,
        featured: false,
        allow_comments: true,
        seo_title:
          "Building a Portfolio with React and Tailwind CSS - Complete Guide",
        seo_description:
          "Create a stunning portfolio website using React and Tailwind CSS. Learn modern design patterns and responsive layouts.",
        seo_keywords: [
          "React",
          "Tailwind CSS",
          "Portfolio",
          "Web Design",
          "Frontend",
        ],
        published_at: null,
        scheduled_at: null,
      },
      {
        title: "The Future of Web Development: AI and Automation",
        slug: "future-web-development-ai-automation",
        excerpt:
          "Explore how artificial intelligence and automation are transforming the web development landscape and what it means for developers.",
        content: `# The Future of Web Development: AI and Automation

The web development landscape is rapidly evolving with the integration of artificial intelligence and automation. Let's explore what the future holds for developers.

## AI-Powered Development Tools

### Code Generation
AI tools like GitHub Copilot and Amazon CodeWhisperer are revolutionizing how we write code:

- **Autocomplete**: Intelligent code suggestions
- **Function Generation**: Complete function implementations
- **Documentation**: Automatic code documentation
- **Testing**: AI-generated test cases

### Design Assistance
AI is transforming the design process:

- **Layout Generation**: Automatic responsive layouts
- **Color Schemes**: AI-suggested color palettes
- **Typography**: Intelligent font pairing
- **Accessibility**: Automated accessibility improvements

## Automation in Development

### CI/CD Pipelines
Modern development relies heavily on automation:

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
\`\`\`

### Testing Automation
Automated testing ensures code quality:

- **Unit Tests**: Automated function testing
- **Integration Tests**: API and component testing
- **E2E Tests**: Full application testing
- **Performance Tests**: Load and stress testing

## The Impact on Developers

### Skill Evolution
Developers need to adapt to new technologies:

1. **AI Literacy**: Understanding AI capabilities and limitations
2. **Prompt Engineering**: Writing effective AI prompts
3. **Automation Skills**: Setting up and maintaining CI/CD
4. **Problem Solving**: Focusing on complex business logic

### Productivity Gains
AI and automation boost developer productivity:

- **Faster Development**: Reduced boilerplate code
- **Better Quality**: Automated testing and linting
- **Reduced Errors**: AI-assisted debugging
- **Faster Deployment**: Automated deployment pipelines

## Ethical Considerations

### Job Displacement
While AI automates many tasks, it also creates new opportunities:

- **AI Tool Development**: Creating AI-powered tools
- **AI Integration**: Implementing AI in applications
- **AI Ethics**: Ensuring responsible AI use
- **Human-AI Collaboration**: Working alongside AI systems

### Data Privacy
AI systems require careful handling of data:

- **Data Protection**: Ensuring user privacy
- **Bias Prevention**: Avoiding algorithmic bias
- **Transparency**: Making AI decisions explainable
- **Consent**: Obtaining user consent for AI features

## Preparing for the Future

### Continuous Learning
Stay updated with emerging technologies:

1. **Follow Industry Leaders**: Read blogs and attend conferences
2. **Experiment with AI Tools**: Try new AI-powered development tools
3. **Learn Automation**: Master CI/CD and testing automation
4. **Develop Soft Skills**: Focus on creativity and problem-solving

### Building AI-Ready Applications
Design applications that can leverage AI:

- **Modular Architecture**: Easy to integrate AI components
- **API-First Design**: Ready for AI service integration
- **Data-Driven**: Collect and structure data for AI analysis
- **Scalable Infrastructure**: Handle AI processing demands

## Conclusion

The future of web development is exciting and challenging. AI and automation will continue to transform how we build applications, but human creativity and problem-solving skills will remain essential.

Embrace these changes, stay curious, and continue learning. The future belongs to developers who can work effectively with AI and automation tools.

What are your thoughts on the future of web development? Share your experiences with AI tools and automation in the comments below!`,
        featured_image: "",
        featured_image_alt: "AI and Automation in Web Development",
        category_id: null,
        status: "draft" as const,
        featured: true,
        allow_comments: true,
        seo_title:
          "The Future of Web Development: AI and Automation - 2024 Guide",
        seo_description:
          "Explore how artificial intelligence and automation are transforming the web development landscape and what it means for developers.",
        seo_keywords: [
          "AI",
          "Automation",
          "Web Development",
          "Future",
          "Technology",
        ],
        published_at: null,
        scheduled_at: null,
      },
    ];

    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setFormData(randomSample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("blog_posts").insert([
        {
          ...formData,
          author_id: "current-user-id", // Replace with actual user ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error creating blog post:", error);
        alert("Failed to create blog post: " + error.message);
      } else {
        alert("Blog post created successfully!");
        router.push("/admin/blogs");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/blogs"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Link>
          <Button onClick={loadSampleData} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Load Sample Data
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Post Details</CardTitle>
                <CardDescription>
                  Basic information about your blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Post Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter blog post title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="blog-post-slug"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the blog post"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Write your blog post content here..."
                    rows={20}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="featured_image_alt">Image Alt Text</Label>
                  <Input
                    id="featured_image_alt"
                    name="featured_image_alt"
                    value={formData.featured_image_alt}
                    onChange={handleInputChange}
                    placeholder="Description of the image for accessibility"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Search engine optimization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    name="seo_title"
                    value={formData.seo_title}
                    onChange={handleInputChange}
                    placeholder="SEO optimized title"
                  />
                </div>

                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    value={formData.seo_description}
                    onChange={handleInputChange}
                    placeholder="SEO meta description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="newKeyword">SEO Keywords</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add keyword"
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addKeyword())
                      }
                    />
                    <Button
                      type="button"
                      onClick={addKeyword}
                      size="sm"
                      disabled={!newKeyword.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.seo_keywords.map((keyword) => (
                      <div
                        key={keyword}
                        className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        <span>{keyword}</span>
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-green-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>
                  Upload a featured image for your blog post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  currentImage={formData.featured_image}
                  folder="blogs"
                  label="Upload Blog Image"
                  description="Drag and drop an image or click to select"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blog Settings</CardTitle>
                <CardDescription>
                  Configure blog post visibility and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="category_id">Category</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured">Featured Post</Label>
                    <p className="text-sm text-gray-500">
                      Display this post prominently
                    </p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={handleSwitchChange("featured")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow_comments">Allow Comments</Label>
                    <p className="text-sm text-gray-500">
                      Enable comments on this post
                    </p>
                  </div>
                  <Switch
                    checked={formData.allow_comments}
                    onCheckedChange={handleSwitchChange("allow_comments")}
                  />
                </div>

                {formData.status === "scheduled" && (
                  <div>
                    <Label htmlFor="scheduled_at">Scheduled Date</Label>
                    <Input
                      id="scheduled_at"
                      name="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Creating..." : "Create Blog Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
