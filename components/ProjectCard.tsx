import React from "react";
import type { Project } from "../types";
import SkillBadge from "./SkillBadge";
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from "./Card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card
      variant="interactive"
      className="flex flex-col h-full overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl"
    >
      <div className="relative">
        <img
          className="w-full h-48 object-cover"
          src={project.imageUrl}
          alt={project.title}
        />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{project.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <SkillBadge key={tag} skill={tag} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Button variant="outline" size="sm" asChild>
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Live Demo
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
            <Github className="h-4 w-4 mr-2" />
            Source
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
