"use client";

import { motion } from "framer-motion";
import { ChevronDown, Code, Palette, Zap } from "lucide-react";

const Hero = () => {
  const scrollToNext = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 dark:bg-primary-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-slow" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300 dark:bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-slow"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-40 left-1/2 w-80 h-80 bg-primary-400 dark:bg-primary-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-slow"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="container mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Hello, I'm</span>
              <br />
              <span className="text-dark-900 dark:text-white">
                Mukhammadali Kodirov
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-dark-600 dark:text-gray-300 mb-8 leading-relaxed">
              Full-stack developer passionate about creating amazing digital
              experiences with Code & Coffee
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <a
              href="#projects"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
            >
              View My Work
            </a>
            <a
              href="#contact"
              className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
            >
              Get In Touch
            </a>
          </motion.div>

          {/* Skills showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center space-x-3 p-4 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm rounded-lg">
              <Code className="h-6 w-6 text-primary-600" />
              <span className="font-medium text-dark-700 dark:text-gray-300">
                Clean Code
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm rounded-lg">
              <Palette className="h-6 w-6 text-primary-600" />
              <span className="font-medium text-dark-700 dark:text-gray-300">
                Modern Design
              </span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm rounded-lg">
              <Zap className="h-6 w-6 text-primary-600" />
              <span className="font-medium text-dark-700 dark:text-gray-300">
                Fast & Reliable
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-dark-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="h-8 w-8" />
      </motion.button>
    </section>
  );
};

export default Hero;
