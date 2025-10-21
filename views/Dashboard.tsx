import React from "react";
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
import { PERSONAL_INFO, SKILLS, ICONS } from "../constants";
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
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-neutral-50)] to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 lg:py-8">
        <Stack direction="vertical" spacing="lg">
          {/* Header */}
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                  Welcome to my Dashboard, {PERSONAL_INFO.name.split(" ")[0]}!
                </h1>
                <p className="text-[var(--color-text-secondary)]">
                  {PERSONAL_INFO.title}
                </p>
              </div>
            </div>
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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    className="flex items-center bg-[var(--color-bg-tertiary)] p-3 rounded-lg hover:bg-[var(--color-primary-50)] transition-colors duration-200"
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
        </Stack>
      </div>
    </div>
  );
};

export default Dashboard;
