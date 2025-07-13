"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  github_url?: string;
  live_url?: string;
  featured: boolean;
  technologies: string[];
  category_id?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            category:project_categories(id, name, description, color)
          `
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching projects:", error);
        } else {
          setProjects(data || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project. Please try again.");
      } else {
        setProjects(projects.filter((project) => project.id !== projectId));
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-gray-600">Manage your portfolio projects</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">Manage your portfolio projects</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/categories">
            <Button variant="outline">Manage Categories</Button>
          </Link>
          <Link href="/admin/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>{projects.length} projects total</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">
                        {project.title}
                      </h3>
                      {project.featured && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Featured
                        </span>
                      )}
                      {project.category && (
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: project.category.color }}
                        >
                          {project.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies?.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies?.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          +{project.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {project.live_url && (
                      <Link
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/admin/projects/${project.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first project.
              </p>
              <Link href="/admin/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
