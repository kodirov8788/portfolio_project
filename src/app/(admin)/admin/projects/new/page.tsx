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

interface ProjectFormData {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  featured_image: string;
  featured_image_alt: string;
  github_url: string;
  live_url: string;
  demo_url: string;
  featured: boolean;
  technologies: string[];
  category_id: string | null;
  status: "draft" | "published" | "archived";
  complexity: "beginner" | "intermediate" | "advanced" | "expert";
  start_date: string;
  end_date: string;
  team_size: number;
  client_name: string;
  budget_range: string;
  seo_title: string;
  seo_description: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "E-Commerce Platform",
    slug: "ecommerce-platform",
    short_description:
      "A full-stack e-commerce solution built with modern technologies.",
    full_description:
      "A full-stack e-commerce solution built with modern technologies. Features include user authentication, product catalog, shopping cart, payment integration with Stripe, order management, and admin dashboard. The platform supports multiple payment methods, real-time inventory tracking, and responsive design for all devices.",
    featured_image: "",
    featured_image_alt: "E-Commerce Platform Screenshot",
    github_url: "https://github.com/username/ecommerce-platform",
    live_url: "https://ecommerce-demo.vercel.app",
    demo_url: "https://demo.ecommerce-platform.com",
    featured: true,
    technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "Tailwind CSS"],
    category_id: null,
    status: "published",
    complexity: "intermediate",
    start_date: "2024-01-01",
    end_date: "2024-03-15",
    team_size: 3,
    client_name: "Tech Startup Inc.",
    budget_range: "$10,000 - $15,000",
    seo_title: "E-Commerce Platform - Modern Web Development",
    seo_description:
      "A comprehensive e-commerce solution built with React, Node.js, and PostgreSQL featuring Stripe payment integration and real-time inventory management.",
  });
  const [newTechnology, setNewTechnology] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("project_categories")
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

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      featured: checked,
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

  const addTechnology = () => {
    if (
      newTechnology.trim() &&
      !formData.technologies.includes(newTechnology.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()],
      }));
      setNewTechnology("");
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const loadSampleData = () => {
    const samples = [
      {
        title: "Task Management App",
        slug: "task-management-app",
        short_description:
          "A collaborative project management application with real-time updates.",
        full_description:
          "A collaborative project management application with real-time updates, team collaboration, task assignments, progress tracking, and deadline management. Features include drag-and-drop task organization, file sharing, team chat, and comprehensive reporting dashboard.",
        featured_image: "",
        featured_image_alt: "Task Management App Interface",
        github_url: "https://github.com/username/task-manager",
        live_url: "https://task-manager-demo.vercel.app",
        demo_url: "https://demo.task-manager.com",
        featured: true,
        technologies: [
          "Next.js",
          "TypeScript",
          "Supabase",
          "React Query",
          "Framer Motion",
        ],
        category_id: null,
        status: "published" as const,
        complexity: "intermediate" as const,
        start_date: "2024-02-01",
        end_date: "2024-04-30",
        team_size: 4,
        client_name: "Productivity Corp.",
        budget_range: "$15,000 - $25,000",
        seo_title: "Task Management App - Team Collaboration Platform",
        seo_description:
          "A modern task management application built with Next.js and TypeScript featuring real-time collaboration and comprehensive project tracking.",
      },
      {
        title: "Portfolio Website",
        slug: "portfolio-website",
        short_description:
          "A modern, responsive portfolio website showcasing projects and skills.",
        full_description:
          "A modern, responsive portfolio website showcasing projects, skills, and professional experience. Built with performance and SEO in mind, featuring smooth animations, dark/light mode, contact form integration, and blog functionality.",
        featured_image: "",
        featured_image_alt: "Portfolio Website Design",
        github_url: "https://github.com/username/portfolio",
        live_url: "https://my-portfolio.vercel.app",
        demo_url: "https://demo.portfolio.com",
        featured: false,
        technologies: [
          "React",
          "Next.js",
          "Tailwind CSS",
          "Framer Motion",
          "Vercel",
        ],
        category_id: null,
        status: "published" as const,
        complexity: "beginner" as const,
        start_date: "2024-01-15",
        end_date: "2024-02-15",
        team_size: 1,
        client_name: "Personal Project",
        budget_range: "$2,000 - $5,000",
        seo_title: "Portfolio Website - Professional Developer Showcase",
        seo_description:
          "A modern portfolio website built with React and Next.js featuring responsive design, smooth animations, and comprehensive project showcase.",
      },
      {
        title: "Weather Dashboard",
        slug: "weather-dashboard",
        short_description:
          "A real-time weather application with location-based forecasts.",
        full_description:
          "A real-time weather application with location-based forecasts, interactive maps, weather alerts, and historical data visualization. Integrates with multiple weather APIs for accurate data and provides detailed meteorological information.",
        featured_image: "",
        featured_image_alt: "Weather Dashboard Interface",
        github_url: "https://github.com/username/weather-app",
        live_url: "https://weather-dashboard.vercel.app",
        demo_url: "https://demo.weather-app.com",
        featured: false,
        technologies: [
          "Vue.js",
          "Node.js",
          "MongoDB",
          "Chart.js",
          "OpenWeather API",
        ],
        category_id: null,
        status: "published" as const,
        complexity: "advanced" as const,
        start_date: "2024-03-01",
        end_date: "2024-05-15",
        team_size: 2,
        client_name: "Weather Services Ltd.",
        budget_range: "$8,000 - $12,000",
        seo_title: "Weather Dashboard - Real-time Meteorological Data",
        seo_description:
          "A comprehensive weather application built with Vue.js and Node.js featuring real-time data, interactive maps, and detailed weather analytics.",
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
      const { error } = await supabase.from("projects").insert([
        {
          ...formData,
          created_by: "current-user-id", // Replace with actual user ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error creating project:", error);
        alert("Failed to create project: " + error.message);
      } else {
        alert("Project created successfully!");
        router.push("/admin/projects");
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
            href="/admin/projects"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
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
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Basic information about your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter project title"
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
                    placeholder="project-slug"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the project"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="full_description">Full Description</Label>
                  <Textarea
                    id="full_description"
                    name="full_description"
                    value={formData.full_description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of the project"
                    rows={6}
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
                <CardTitle>Project Links</CardTitle>
                <CardDescription>
                  URLs and external links for your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="github_url">GitHub Repository</Label>
                  <Input
                    id="github_url"
                    name="github_url"
                    type="url"
                    value={formData.github_url}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username/project"
                  />
                </div>

                <div>
                  <Label htmlFor="live_url">Live Demo</Label>
                  <Input
                    id="live_url"
                    name="live_url"
                    type="url"
                    value={formData.live_url}
                    onChange={handleInputChange}
                    placeholder="https://project-demo.vercel.app"
                  />
                </div>

                <div>
                  <Label htmlFor="demo_url">Demo URL</Label>
                  <Input
                    id="demo_url"
                    name="demo_url"
                    type="url"
                    value={formData.demo_url}
                    onChange={handleInputChange}
                    placeholder="https://demo.project.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Additional project information and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="complexity">Complexity</Label>
                    <select
                      id="complexity"
                      name="complexity"
                      value={formData.complexity}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team_size">Team Size</Label>
                    <Input
                      id="team_size"
                      name="team_size"
                      type="number"
                      min="1"
                      value={formData.team_size}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleInputChange}
                      placeholder="Client or company name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="budget_range">Budget Range</Label>
                  <Input
                    id="budget_range"
                    name="budget_range"
                    value={formData.budget_range}
                    onChange={handleInputChange}
                    placeholder="e.g., $5,000 - $10,000"
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>
                  Upload a featured image for your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  currentImage={formData.featured_image}
                  folder="projects"
                  label="Upload Project Image"
                  description="Drag and drop an image or click to select"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                  Configure project visibility and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured">Featured Project</Label>
                    <p className="text-sm text-gray-500">
                      Display this project prominently
                    </p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={handleSwitchChange}
                  />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technologies</CardTitle>
                <CardDescription>
                  Technologies used in this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    placeholder="Add technology"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTechnology())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addTechnology}
                    size="sm"
                    disabled={!newTechnology.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.technologies.map((tech) => (
                    <div
                      key={tech}
                      className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
