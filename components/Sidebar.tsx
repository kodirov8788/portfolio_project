"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  User,
  FolderOpen,
  Mail,
  Code,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Linkedin,
  Github,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const navItems = [
    { id: "home", name: "Home", icon: Home },
    { id: "about", name: "About", icon: User },
    { id: "projects", name: "Projects", icon: FolderOpen },
    { id: "contact", name: "Contact", icon: Mail },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setIsOpen(false);
  };

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-dark-800 rounded-lg shadow-lg md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:top-0 md:left-0 md:flex flex-col w-80 h-screen bg-white dark:bg-dark-800 shadow-lg border-r border-gray-200 dark:border-dark-700 z-30">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-12">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <img
                src="/logo.png"
                alt="Code & Coffee Logo"
                className="h-8 w-8"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-900 dark:text-white">
                Code & Coffee
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-md"
                        : "text-dark-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-primary-600 dark:hover:text-primary-400"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Theme toggle and social links */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-dark-700 dark:text-gray-300">
                  Theme
                </span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white dark:bg-dark-600 shadow-sm hover:shadow-md transition-shadow duration-200"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              </div>

              {/* Theme options */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors duration-200 ${
                    theme === "light"
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors duration-200 ${
                    theme === "system"
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                  }`}
                >
                  <Monitor className="h-3 w-3 mx-auto" />
                </button>
              </div>
            </div>

            {/* Social links */}
            <div className="flex space-x-3">
              <button
                onClick={() => scrollToSection("contact")}
                className="p-3 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors duration-200"
                aria-label="Contact"
              >
                <Mail className="h-5 w-5 text-dark-600 dark:text-gray-300" />
              </button>
              <a
                href="https://github.com/kodirov8788"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-dark-600 dark:text-gray-300" />
              </a>
              <a
                href="https://www.linkedin.com/in/kodirov-dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-dark-600 dark:text-gray-300" />
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-dark-800 shadow-2xl z-40 md:hidden"
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-12">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <img
                src="/logo.png"
                alt="Code & Coffee Logo"
                className="h-8 w-8"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-900 dark:text-white">
                Code & Coffee
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 shadow-md"
                        : "text-dark-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-primary-600 dark:hover:text-primary-400"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Theme toggle and social links */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-dark-700 dark:text-gray-300">
                  Theme
                </span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white dark:bg-dark-600 shadow-sm hover:shadow-md transition-shadow duration-200"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              </div>

              {/* Theme options */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors duration-200 ${
                    theme === "light"
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors duration-200 ${
                    theme === "system"
                      ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                  }`}
                >
                  <Monitor className="h-3 w-3 mx-auto" />
                </button>
              </div>
            </div>

            {/* Social links */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  scrollToSection("contact");
                  setIsOpen(false);
                }}
                className="p-3 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors duration-200"
                aria-label="Contact"
              >
                <Mail className="h-5 w-5 text-dark-600 dark:text-gray-300" />
              </button>
              <a
                href="https://github.com/kodirov8788"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-dark-600 dark:text-gray-300" />
              </a>
              <a
                href="https://www.linkedin.com/in/kodirov-dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-dark-600 dark:text-gray-300" />
              </a>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
