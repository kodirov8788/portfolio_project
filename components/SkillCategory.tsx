import React from "react";
import { Code, Database, Palette, Wrench } from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "./Card";

export interface SkillCategoryData {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: string[];
  color: string;
}

interface SkillCategoryProps {
  category: SkillCategoryData;
}

const SkillCategory: React.FC<SkillCategoryProps> = ({ category }) => {
  const Icon = category.icon;

  return (
    <Card
      variant="elevated"
      className="animate-slide-up hover:scale-[1.02] transition-all duration-300"
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${category.color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span>{category.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {category.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 text-sm font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)] transition-colors duration-200"
            >
              {skill}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillCategory;
