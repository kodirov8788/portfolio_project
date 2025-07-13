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
import { ArrowLeft, Save, Plus, X, Zap, Tag } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface ProjectFormData {
  title: string;
  description: string;
  image_url: string;
  github_url: string;
  live_url: string;
  featured: boolean;
  technologies: string[];
  category_id: number | null;
}

interface Category {
  id: number;
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
    description:
      "A full-stack e-commerce solution built with modern technologies. Features include user authentication, product catalog, shopping cart, payment integration with Stripe, order management, and admin dashboard. The platform supports multiple payment methods, real-time inventory tracking, and responsive design for all devices.",
    image_url:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    github_url: "https://github.com/username/ecommerce-platform",
    live_url: "https://ecommerce-demo.vercel.app",
    featured: true,
    technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "Tailwind CSS"],
    category_id: null,
  });
  const [newTechnology, setNewTechnology] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
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
      [name]: name === "category_id" ? (value ? parseInt(value) : null) : value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      featured: checked,
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
        description:
          "A collaborative project management application with real-time updates, team collaboration, task assignments, progress tracking, and deadline management. Features include drag-and-drop task organization, file sharing, team chat, and comprehensive reporting dashboard.",
        image_url:
          "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop",
        github_url: "https://github.com/username/task-manager",
        live_url: "https://task-manager-demo.vercel.app",
        featured: true,
        technologies: [
          "Next.js",
          "TypeScript",
          "Supabase",
          "React Query",
          "Framer Motion",
        ],
        category_id: null,
      },
      {
        title: "Portfolio Website",
        description:
          "A modern, responsive portfolio website showcasing projects, skills, and professional experience. Built with performance and SEO in mind, featuring smooth animations, dark/light mode, contact form integration, and blog functionality.",
        image_url:
          "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop",
        github_url: "https://github.com/username/portfolio",
        live_url: "https://my-portfolio.vercel.app",
        featured: false,
        technologies: [
          "React",
          "Next.js",
          "Tailwind CSS",
          "Framer Motion",
          "Vercel",
        ],
        category_id: null,
      },
      {
        title: "Weather Dashboard",
        description:
          "A real-time weather application with location-based forecasts, interactive maps, weather alerts, and historical data visualization. Integrates with multiple weather APIs for accurate data and provides detailed meteorological information.",
        image_url:
          "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800&h=600&fit=crop",
        github_url: "https://github.com/username/weather-app",
        live_url: "https://weather-dashboard.vercel.app",
        featured: false,
        technologies: [
          "Vue.js",
          "Node.js",
          "MongoDB",
          "Chart.js",
          "OpenWeather API",
        ],
        category_id: null,
      },
    ];

    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setFormData(randomSample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url || null,
            github_url: formData.github_url || null,
            live_url: formData.live_url || null,
            featured: formData.featured,
            technologies: formData.technologies,
            category_id: formData.category_id,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating project:", error);
        alert("Failed to create project. Please try again.");
      } else {
        console.log("Project created successfully:", data);
        router.push("/admin/projects");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
            <p className="mt-2 text-gray-600">
              Add a new project to your portfolio
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/categories">
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
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
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your project..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category_id">Category</Label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={formData.category_id || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="github_url">GitHub URL</Label>
                    <Input
                      id="github_url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username/repo"
                      type="url"
                    />
                  </div>

                  <div>
                    <Label htmlFor="live_url">Live Demo URL</Label>
                    <Input
                      id="live_url"
                      name="live_url"
                      value={formData.live_url}
                      onChange={handleInputChange}
                      placeholder="https://your-project.com"
                      type="url"
                    />
                  </div>
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
                    placeholder="Add a technology (e.g., React, Node.js)"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTechnology();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addTechnology}
                    variant="outline"
                    disabled={!newTechnology.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTechnology(tech)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Project configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured">Featured Project</Label>
                    <p className="text-sm text-gray-500">
                      Show this project prominently on your portfolio
                    </p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading || !formData.title || !formData.description
                  }
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>

                <Link href="/admin/projects">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
