import React from "react";
import Card from "../components/Card";
import { PERSONAL_INFO } from "../constants";
import { Separator } from "@/components/ui/separator";
import { Stack } from "../components/ui/stack";

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-neutral-50)] to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 lg:py-8">
        <Stack direction="vertical" spacing="lg">
          <Card variant="elevated" className="animate-fade-in">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <img
                src={PERSONAL_INFO.avatar}
                alt={PERSONAL_INFO.name}
                className="w-40 h-40 rounded-full object-cover shadow-lg border-4 border-[var(--color-primary-200)]"
              />
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {PERSONAL_INFO.name}
                </h1>
                <p className="text-[var(--color-primary-600)] font-semibold mt-1">
                  {PERSONAL_INFO.title}
                </p>
                <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
                  {PERSONAL_INFO.about}
                </p>
              </div>
            </div>
            <Separator className="my-8" />
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                My Philosophy
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                I believe that the best web applications are born from a blend
                of technical excellence and a deep understanding of user needs.
                My approach to development is centered around three core
                principles:
              </p>
              <ul className="mt-4 space-y-3 list-disc list-inside text-[var(--color-text-secondary)]">
                <li>
                  <strong className="text-[var(--color-text-primary)]">
                    Clean & Scalable Code:
                  </strong>{" "}
                  Writing maintainable, well-documented code that can grow with
                  the project is non-negotiable. I'm a firm believer in
                  TypeScript for type safety and writing modular, reusable
                  components.
                </li>
                <li>
                  <strong className="text-[var(--color-text-primary)]">
                    User-Centric Design:
                  </strong>{" "}
                  Functionality is only half the story. I strive to create
                  interfaces that are not only visually appealing but also
                  intuitive and accessible to all users.
                </li>
                <li>
                  <strong className="text-[var(--color-text-primary)]">
                    Continuous Learning:
                  </strong>{" "}
                  The web development landscape is ever-evolving, and I am
                  committed to staying at the forefront of new technologies and
                  best practices to deliver cutting-edge solutions.
                </li>
              </ul>
            </div>
          </Card>
        </Stack>
      </div>
    </div>
  );
};

export default About;
