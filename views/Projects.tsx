import React from "react";
import ProjectCard from "../components/ProjectCard";
import { PROJECTS } from "../constants";
import { Stack } from "../components/ui/stack";

const Projects: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-neutral-50)] to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 lg:py-8">
        <Stack direction="vertical" spacing="lg">
          <div className="animate-fade-in">
            <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
              My Work
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              A collection of projects showcasing my skills and experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PROJECTS.map((project, index) => (
              <div
                key={project.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        </Stack>
      </div>
    </div>
  );
};

export default Projects;
