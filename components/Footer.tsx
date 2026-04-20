import { Heart, Github, Linkedin, Mail, Terminal } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-12 overflow-hidden bg-transparent border-t border-black/5 dark:border-white/5 transition-colors duration-300">
      {/* Glow accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[100px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 70%)', filter: 'blur(20px)' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <Terminal className="h-5 w-5 text-primary-400" />
            </div>
            <span className="text-lg font-semibold gradient-text font-mono">Code &amp; Coffee</span>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {[
              { href: "https://github.com/kodirov8788", icon: Github,   label: "GitHub" },
              { href: "https://www.linkedin.com/in/mukhammadalikodirov/", icon: Linkedin, label: "LinkedIn" },
              { href: "mailto:kodirov8788@gmail.com", icon: Mail,    label: "Email" },
            ].map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2.5 rounded-lg text-gray-400 hover:text-primary-400 transition-all duration-200 hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-gray-500 text-sm mb-1">
              Made with <Heart className="inline h-3 w-3 text-red-500" /> using Next.js &amp; Tailwind
            </p>
            <p className="text-xs text-gray-600 font-mono">
              © {new Date().getFullYear()} Mukhammadali Kodirov
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
