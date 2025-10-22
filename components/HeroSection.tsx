import React, { useState, useEffect } from "react";
import { ArrowDown, Download, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { PERSONAL_INFO } from "../constants";

const HeroSection: React.FC = () => {
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  const texts = [
    "Frontend Engineer",
    "React Developer",
    "UI/UX Enthusiast",
    "Problem Solver",
  ];

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        const current = texts[textIndex];

        if (isDeleting) {
          setCurrentText(current.substring(0, currentText.length - 1));
          if (currentText === "") {
            setIsDeleting(false);
            setTextIndex((prev) => (prev + 1) % texts.length);
          }
        } else {
          setCurrentText(current.substring(0, currentText.length + 1));
          if (currentText === current) {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, textIndex, texts]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-50)] via-[var(--color-bg-primary)] to-[var(--color-accent-50)] dark:from-[var(--color-primary-900)] dark:via-[var(--color-bg-primary)] dark:to-[var(--color-accent-900)]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          {/* Avatar */}
          <div className="mb-8">
            <div className="relative inline-block">
              <img
                src={PERSONAL_INFO.avatar}
                alt={PERSONAL_INFO.name}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-2xl border-4 border-[var(--color-primary-200)] dark:border-[var(--color-primary-700)]"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--color-accent-500)] rounded-full flex items-center justify-center animate-bounce-gentle">
                <span className="text-white text-sm">👋</span>
              </div>
            </div>
          </div>

          {/* Name and Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-4">
            <span className="bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-accent-500)] bg-clip-text text-transparent">
              {PERSONAL_INFO.name}
            </span>
          </h1>

          <div className="text-xl sm:text-2xl lg:text-3xl text-[var(--color-text-secondary)] mb-8 h-12 flex items-center justify-center">
            <span className="border-r-2 border-[var(--color-primary-500)] pr-2">
              {currentText}
            </span>
          </div>

          {/* Description */}
          <p className="text-lg sm:text-xl text-[var(--color-text-tertiary)] max-w-2xl mx-auto mb-12 leading-relaxed">
            {PERSONAL_INFO.about}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => {
                const projectsSection = document.querySelector(
                  '[data-section="projects"]'
                );
                projectsSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              View My Work
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-[var(--color-primary-600)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)] px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              <Download className="mr-2 h-5 w-5" />
              Download CV
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="animate-bounce-gentle">
            <ArrowDown className="h-6 w-6 text-[var(--color-text-tertiary)] mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
