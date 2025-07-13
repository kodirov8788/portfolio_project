import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Code,
  Database,
  Globe,
  Smartphone,
  Palette,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About - Portfolio",
  description:
    "Learn more about my background, skills, and experience in full stack development.",
};

const skills = [
  {
    category: "Frontend",
    icon: Code,
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Redux",
      "React Query",
    ],
  },
  {
    category: "Backend",
    icon: Database,
    items: [
      "Node.js",
      "Express",
      "PostgreSQL",
      "MongoDB",
      "GraphQL",
      "REST APIs",
    ],
  },
  {
    category: "DevOps",
    icon: Globe,
    items: ["Docker", "AWS", "Vercel", "Git", "CI/CD", "Linux"],
  },
  {
    category: "Mobile",
    icon: Smartphone,
    items: ["React Native", "Expo", "iOS", "Android", "Mobile UI/UX"],
  },
  {
    category: "Design",
    icon: Palette,
    items: [
      "Figma",
      "Adobe XD",
      "UI/UX Design",
      "Responsive Design",
      "Prototyping",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              About Me
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Full stack developer with a passion for creating innovative web
              solutions and exceptional user experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                My Story
              </h2>
              <p className="text-gray-600 mb-6">
                I&apos;m a passionate full stack developer with over 5 years of
                experience building modern web applications. My journey in
                software development began with a curiosity about how things
                work on the internet, which quickly evolved into a deep passion
                for creating digital solutions that make a difference.
              </p>
              <p className="text-gray-600 mb-6">
                I specialize in JavaScript/TypeScript ecosystems, with expertise
                in React, Next.js, Node.js, and PostgreSQL. I believe in writing
                clean, maintainable code and creating user experiences that are
                both beautiful and functional.
              </p>
              <p className="text-gray-600 mb-8">
                When I&apos;m not coding, you can find me exploring new
                technologies, contributing to open source projects, or sharing
                knowledge with the developer community. I&apos;m always eager to
                learn new skills and take on challenging projects.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/contact">
                  <Button>Get in Touch</Button>
                </Link>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">5+</div>
                    <div className="text-sm text-gray-600">
                      Years of Experience
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">50+</div>
                    <div className="text-sm text-gray-600">
                      Projects Completed
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">20+</div>
                    <div className="text-sm text-gray-600">Happy Clients</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Bachelor of Computer Science
                    </div>
                    <div className="text-sm text-gray-600">
                      University of Technology
                    </div>
                    <div className="text-sm text-gray-500">2018 - 2022</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Skills & Technologies
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I work with a wide range of technologies to deliver comprehensive
              solutions from frontend to backend and everything in between.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <Card key={skill.category}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <skill.icon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{skill.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skill.items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Work Philosophy */}
        <div className="mt-24 bg-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              My Work Philosophy
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Quality First
                </h3>
                <p className="text-gray-600">
                  I believe in writing clean, maintainable code that stands the
                  test of time. Every line of code should serve a purpose and be
                  well-documented.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  User-Centered
                </h3>
                <p className="text-gray-600">
                  The user experience is at the heart of everything I build. I
                  focus on creating intuitive interfaces that solve real
                  problems.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Continuous Learning
                </h3>
                <p className="text-gray-600">
                  Technology evolves rapidly, and I stay current with the latest
                  trends and best practices to deliver cutting-edge solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
