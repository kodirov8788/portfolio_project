"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { siteConfig } from "@/config/site";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("home");
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const navItems = [
    { id: "home", name: "Home", icon: Home, type: "internal" },
    { id: "about", name: "About", icon: User, type: "internal" },
    { id: "projects", name: "Projects", icon: FolderOpen, type: "internal", href: "" },
    { id: "blog", name: "Blog", icon: Code, type: "internal", href: "" },
    { id: "contact", name: "Contact", icon: Mail, type: "internal", href: "" },
  ];

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isInternal = item.type === "internal";
    const isActive = activeSection === item.id;

    const content = (
      <div className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
        isActive 
          ? "bg-primary-500/15 border-primary-500/30 text-primary-600 dark:text-primary-300" 
          : "text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"
      }`}>
        <item.icon className="h-5 w-5" />
        <span className="font-medium">{item.name}</span>
      </div>
    );

    if (isInternal) {
      return (
        <button onClick={() => scrollToSection(item.id)} className="w-full">
          {content}
        </button>
      );
    }

    return (
      <Link 
        href={item.href || "/"} 
        className="w-full"
        onClick={() => {
          setIsOpen(false);
          setActiveSection(item.id);
        }}
      >
        {content}
      </Link>
    );
  };

  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      // Store the target section to smooth scroll after navigation completes
      sessionStorage.setItem("pendingScroll", sectionId);
      router.push("/");
      setIsOpen(false);
      return;
    }

    // Update URL hash without forcing a page jump
    window.history.pushState(null, "", `/#${sectionId}`);

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    
    // Optimistic update for immediate feedback
    setActiveSection(sectionId);
    setIsOpen(false);
  };

  // Track active section based on scroll position or route
  useEffect(() => {
    if (pathname.startsWith("/blog")) {
      setActiveSection("blog");
      return;
    }

    // Handle cross-page smooth scroll instructions
    if (pathname === "/") {
      const pendingScroll = sessionStorage.getItem("pendingScroll");
      if (pendingScroll) {
        sessionStorage.removeItem("pendingScroll");
        setTimeout(() => {
          const element = document.getElementById(pendingScroll);
          if (element) {
            window.history.pushState(null, "", `/#${pendingScroll}`);
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            setActiveSection(pendingScroll);
          }
        }, 100);
      }
    }

    const handleScroll = () => {
      // Only run scroll tracking on the home page
      if (pathname !== "/") return;

      const itemsToTrack = navItems.filter(item => item.type === "internal");
      const sections = itemsToTrack.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      // Check if user has scrolled to the absolute bottom
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      
      if (isBottom && itemsToTrack.length > 0) {
        setActiveSection(itemsToTrack[itemsToTrack.length - 1].id);
        return;
      }

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(itemsToTrack[i].id);
          break;
        }
      }
    };

    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-3 rounded-lg md:hidden text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border border-black/10 dark:border-white/20 shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:top-0 md:left-0 md:flex flex-col w-80 h-screen z-30 bg-white dark:bg-[#0a0a0f] backdrop-blur-2xl border-r border-black/5 dark:border-white/5 transition-colors duration-300">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-12">
            <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/30 dark:bg-primary-500/15 dark:border-primary-500/40">
              <img src="/logo.png" alt={`${siteConfig.name} Logo`} className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text font-mono">{siteConfig.name}</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          </nav>

          {/* Theme toggle + social */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest">Theme</span>
                <button onClick={toggleTheme} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-white/10 transition-all border border-transparent hover:border-black/5 dark:hover:border-white/10"
                   aria-label="Toggle theme">
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-primary-500" />}
                </button>
              </div>
              <div className="flex gap-1">
                {(['light','dark','system'] as const).map((t) => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={`flex-1 px-2 py-1.5 text-[10px] rounded-md transition-all duration-200 font-mono border ${
                      theme === t
                        ? "bg-primary-500/20 text-primary-600 dark:text-primary-300 border-primary-500/30"
                        : "text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}>
                    {t === 'system' ? <Monitor className="h-3 w-3 mx-auto" /> : t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {[
                { onClick: () => scrollToSection("contact"), icon: Mail, label: "Contact" },
                { href: siteConfig.links.github,   icon: Github,   label: "GitHub" },
                { href: siteConfig.links.linkedin, icon: Linkedin, label: "LinkedIn" },
              ].map((item) => {
                const cls = "flex-1 flex items-center justify-center p-2.5 rounded-xl text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-all duration-200 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary-500/30";
                return 'href' in item ? (
                  <a key={item.label} href={(item as any).href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={item.label}>
                    <item.icon className="h-4 w-4" />
                  </a>
                ) : (
                  <button key={item.label} onClick={(item as any).onClick} className={cls} aria-label={item.label}>
                    <item.icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-80 z-40 md:hidden overflow-y-auto pb-10 bg-white dark:bg-[#0a0a0f] border-r border-black/10 dark:border-white/20 shadow-2xl"
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <img src="/logo.png" alt={`${siteConfig.name} Logo`} className="h-8 w-8" />
            </div>
            <h1 className="text-lg font-bold gradient-text font-mono">{siteConfig.name}</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}><NavLink item={item} /></li>
              ))}
            </ul>
          </nav>

          {/* Theme + social */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest">Theme</span>
                <button onClick={toggleTheme} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 transition-colors bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10" aria-label="Toggle theme">
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-primary-500" />}
                </button>
              </div>
              <div className="flex gap-1">
                {(['light','dark','system'] as const).map((t) => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={`flex-1 px-2 py-1.5 text-[10px] rounded-md transition-all font-mono border ${
                      theme === t
                        ? "bg-primary-500/20 text-primary-600 dark:text-primary-300 border-primary-500/30"
                        : "text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}>
                    {t === 'system' ? <Monitor className="h-3 w-3 mx-auto" /> : t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { scrollToSection("contact"); setIsOpen(false); }}
                className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 transition-all bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10" aria-label="Contact">
                <Mail className="h-4 w-4" />
              </button>
              <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 transition-all bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href={siteConfig.links.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 transition-all bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
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
