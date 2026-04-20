"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Code, Palette, Zap, Terminal, Cpu } from "lucide-react";

/* ─── Particles Canvas ─────────────────────────────────── */
const ParticlesBg = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 80;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    (Math.random() - 0.5) * 0.4,
      r:     Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const COLORS = isDark 
      ? ["#7c3aed", "#8b5cf6", "#06b6d4", "#22d3ee", "#a78bfa"]
      : ["#4f46e5", "#6366f1", "#0891b2", "#06b6d4", "#818cf8"];

    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = isDark 
              ? `rgba(124,58,237,${0.08 * (1 - dist / 120)})`
              : `rgba(79,70,229,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

/* ─── Aurora BG ────────────────────────────────────────── */
const AuroraBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
    <div
      className="absolute -top-60 -left-60 w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-20 animate-aurora mix-blend-multiply dark:mix-blend-normal"
      style={{
        background: "radial-gradient(circle, #7c3aed 0%, #4c1d95 50%, transparent 80%)",
        filter: "blur(60px)",
      }}
    />
    <div
      className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-15 animate-aurora mix-blend-multiply dark:mix-blend-normal"
      style={{
        background: "radial-gradient(circle, #06b6d4 0%, #0e7490 50%, transparent 80%)",
        filter: "blur(60px)",
        animationDelay: "3s",
      }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 dark:opacity-10 mix-blend-multiply dark:mix-blend-normal"
      style={{
        background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
        filter: "blur(80px)",
      }}
    />
    {/* Dot grid */}
    <div
      className="absolute inset-0 opacity-[0.05] dark:opacity-[0.025]"
      style={{
        backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    />
  </div>
);

/* ─── Rotating Text ─────────────────────────────────────── */
const TITLES = [
  "Full-Stack Developer",
  "Backend Engineer",
  "Tech Lead",
  "React Specialist",
  "NestJS Engineer",
];

const RotatingText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TITLES.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block overflow-hidden align-middle" style={{ minWidth: "280px" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0,  opacity: 1, filter: "blur(0px)" }}
          exit={{   y: -20, opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="gradient-text font-bold block leading-tight py-1"
        >
          {TITLES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/* ─── Blur-in Name ──────────────────────────────────────── */
const BlurText = ({ text, className }: { text: string; className?: string }) => (
  <motion.span
    className={className}
    initial={{ filter: "blur(20px)", opacity: 0 }}
    animate={{ filter: "blur(0px)",  opacity: 1 }}
    transition={{ duration: 1.2, ease: "easeOut" }}
  >
    {text}
  </motion.span>
);

/* ─── Hero ─────────────────────────────────────────────── */
const Hero = () => {
  const scrollToNext = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  const skills = [
    { icon: Code,     label: "Clean Code" },
    { icon: Terminal, label: "Backend Expert" },
    { icon: Cpu,      label: "Tech Lead" },
    { icon: Palette,  label: "Modern UI" },
    { icon: Zap,      label: "Fast & Reliable" },
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-[#0a0a0f] transition-colors duration-300"
    >
      <ParticlesBg />
      <AuroraBg />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">

          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 dark:border-primary-500/30 text-primary-600 dark:text-primary-300 text-sm font-mono"
          >
            <span className="w-2 h-2 bg-primary-600 dark:bg-cyan-400 rounded-full animate-pulse" />
            Available for new opportunities
          </motion.div>

          {/* Name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4"
          >
            <p className="text-gray-500 dark:text-gray-500 text-lg mb-2 font-mono tracking-widest uppercase text-sm">
              Hello, I&apos;m
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <BlurText text="Mukhammadali" className="text-gray-900 dark:text-white" />
            </h1>
          </motion.div>

          {/* Rotating title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl md:text-3xl font-semibold mb-6 flex items-center justify-center min-h-[3rem]"
          >
            <RotatingText />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Building scalable backends, intuitive UIs, and high-performance
            systems — fueled by{" "}
            <span className="text-primary-600 dark:text-primary-400 font-mono font-medium">Code &amp; Coffee</span>.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <a
              href="#projects"
              className="btn-primary text-base px-8 py-4 inline-flex items-center justify-center gap-2 rounded-xl"
            >
              <Code className="h-4 w-4" />
              View My Work
            </a>
            <a
              href="#contact"
              className="btn-secondary text-base px-8 py-4 inline-flex items-center justify-center rounded-xl"
            >
              Get In Touch
            </a>
          </motion.div>

          {/* Skill badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {skills.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.1 + i * 0.08 }}
                whileHover={{ scale: 1.08, y: -3 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 shadow-sm hover:shadow-md transition-all cursor-default"
              >
                <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                {label}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 hover:text-primary-400 transition-colors duration-200 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        aria-label="Scroll down"
      >
        <ChevronDown className="h-8 w-8" />
      </motion.button>
    </section>
  );
};

export default Hero;
