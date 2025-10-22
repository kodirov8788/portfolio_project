import React, { useState, useMemo } from "react";
import ProjectCard from "../components/ProjectCard";
import { PROJECTS } from "../constants";
import { Stack } from "../components/ui/stack";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const Projects: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract unique categories from projects
  const categories = useMemo(() => {
    const allCategories = PROJECTS.flatMap((project) => project.tags);
    return ["All", ...Array.from(new Set(allCategories))];
  }, []);

  // Filter projects based on selected category
  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return PROJECTS;
    return PROJECTS.filter((project) =>
      project.tags.includes(selectedCategory)
    );
  }, [selectedCategory]);

  return (
    <div
      className="min-h-screen bg-[var(--color-bg-primary)]"
      data-section="projects"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 lg:py-8">
        <Stack direction="vertical" spacing="lg">
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
              My Work
            </h1>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              A collection of projects showcasing my skills and experience
              across different technologies and domains
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white"
                    : "border-[var(--color-primary-600)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)]"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--color-text-tertiary)] text-lg">
                No projects found in this category.
              </p>
            </div>
          )}
        </Stack>
      </div>
    </div>
  );
};

export default Projects;
