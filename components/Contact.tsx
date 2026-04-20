"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Mail,
  MapPin,
  Github,
  Linkedin,
} from "lucide-react";

const Contact = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "kodirov8788@gmail.com",
      href: "mailto:kodirov8788@gmail.com",
    },
    {
      icon: MapPin,
      title: "Location",
      value: "Kobe, Hyogo, Japan",
      href: "#",
    },
  ];

  const socialLinks = [
    {
      icon: Github,
      name: "GitHub",
      href: "https://github.com/kodirov8788",
      color: "hover:text-gray-900 dark:hover:text-white",
    },
    {
      icon: Linkedin,
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/mukhammadalikodirov/",
      color: "hover:text-blue-600",
    },
  ];

  return (
    <section id="contact" className="py-24 bg-white dark:bg-[#0a0a0f] transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Get In Touch</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Have a project in mind or want to collaborate? I&apos;d love to hear from
            you!
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
              Let&apos;s Connect
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center leading-relaxed">
              I&apos;m always interested in new opportunities and exciting projects.
              Whether you have a question or just want to say hi, I&apos;ll try my
              best to get back to you!
            </p>

            {/* Contact details */}
            <div className="space-y-6 mb-8">
              {contactInfo.map((info, index) => (
                  <motion.a
                    key={info.title}
                    href={info.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="flex items-center space-x-4 p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 hover:border-primary-500/30 transition-all duration-300 group shadow-sm hover:shadow-xl"
                  >
                    <div className="p-3 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30 transition-colors duration-200">
                      <info.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {info.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {info.value}
                      </p>
                    </div>
                  </motion.a>
              ))}
            </div>

            {/* Social links */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
                Follow Me
              </h4>
              <div className="flex justify-center space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className={`p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-primary-500/30 transition-all duration-300 text-gray-400 ${social.color}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-6 w-6" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
