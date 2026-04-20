"use client";

import React from "react";

export const GridBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          color: "rgb(156, 163, 175)", // gray-400
        }}
      />
      
      {/* Global Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export default GridBackground;
