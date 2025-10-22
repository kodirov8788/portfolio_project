import React from "react";
import HeroSection from "../components/HeroSection";
import SkillCategory from "../components/SkillCategory";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Card from "../components/Card";
import { PERSONAL_INFO, SKILLS, SKILL_CATEGORIES, ICONS } from "../constants";
import SkillBadge from "../components/SkillBadge";
import { Separator } from "@/components/ui/separator";
import { Stack } from "../components/ui/stack";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ title, value, icon: Icon }) => (
  <Card variant="elevated" padding="lg" className="animate-fade-in">
    <div className="flex items-center justify-between mb-2">
      <Icon className="h-6 w-6 text-[var(--color-primary-600)]" />
      <p className="text-sm text-[var(--color-text-tertiary)]">{title}</p>
    </div>
    <p className="text-3xl font-bold text-[var(--color-text-primary)]">
      {value}
    </p>
  </Card>
);

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen" data-section="hero">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <section
        className="py-16 bg-[var(--color-bg-secondary)]"
        data-section="stats"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Stack direction="vertical" spacing="lg">
            <div className="text-center animate-fade-in">
              <h2 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                Professional Overview
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                Key metrics and achievements that showcase my expertise and
                experience
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Years of Experience"
                value="8+"
                icon={ICONS.Shield}
              />
              <StatCard
                title="Projects Completed"
                value="25+"
                icon={ICONS.Rocket}
              />
              <StatCard title="Primary Tech" value="React" icon={ICONS.Code} />
              <StatCard title="Happy Clients" value="15" icon={ICONS.Heart} />
            </div>
          </Stack>
        </div>
      </section>

      {/* Skills Section */}
      <section
        className="py-16 bg-[var(--color-bg-primary)]"
        data-section="skills"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Skills & Expertise
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              A comprehensive overview of my technical skills organized by
              category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {SKILL_CATEGORIES.map((category, index) => (
              <div
                key={category.id}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <SkillCategory category={category} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card
              title="Skills Proficiency"
              variant="elevated"
              className="animate-slide-up"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={SKILLS}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" stroke="currentColor" fontSize={12} />
                    <YAxis stroke="currentColor" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-bg-elevated)",
                        borderColor: "var(--color-border-primary)",
                        color: "var(--color-text-primary)",
                      }}
                      cursor={{
                        fill: "var(--color-interactive-primary) / 0.1",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="proficiency"
                      fill="var(--color-interactive-primary)"
                      name="Proficiency (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              title="Core Technologies"
              variant="elevated"
              className="animate-slide-up"
            >
              <div className="flex flex-wrap gap-3">
                {SKILLS.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center bg-[var(--color-bg-tertiary)] p-3 rounded-lg hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)] transition-colors duration-200"
                  >
                    <ICONS.Code className="h-4 w-4 text-[var(--color-primary-600)] mr-2" />
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                I am proficient in a wide range of modern web technologies, with
                a strong focus on the JavaScript ecosystem. My core strength
                lies in building complex applications with React and TypeScript,
                styled beautifully with Tailwind CSS. I'm also experienced with
                backend development using Node.js and have a keen eye for UI/UX
                principles to create engaging user experiences.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
