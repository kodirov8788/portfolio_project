import React from "react";
import Card from "../components/Card";
import ContactForm from "../components/ContactForm";
import { PERSONAL_INFO, ICONS } from "../constants";
import { Button } from "@/components/ui/button";
import { Stack } from "../components/ui/stack";

const ContactInfo: React.FC<{
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  href?: string;
}> = ({ Icon, title, value, href }) => {
  const content = (
    <div className="flex items-center space-x-4">
      <div className="bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)] p-3 rounded-full">
        <Icon className="h-6 w-6 text-[var(--color-primary-600)]" />
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-tertiary)]">{title}</p>
        <p className="font-semibold text-[var(--color-text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Button
      variant="ghost"
      className="h-auto p-4 justify-start hover:bg-[var(--color-primary-50)] dark:hover:bg-[var(--color-primary-900)] transition-colors duration-200"
      asChild
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </Button>
  ) : (
    <div className="p-4">{content}</div>
  );
};

const Contact: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-[var(--color-bg-primary)]"
      data-section="contact"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-6 lg:py-8">
        <Stack direction="vertical" spacing="lg">
          <div className="text-center animate-fade-in">
            <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
              Get In Touch
            </h1>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              I'm always open to discussing new projects, creative ideas, or
              opportunities to be part of an ambitious vision. Feel free to
              reach out to me through any of the platforms below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <ContactForm />

            {/* Contact Information */}
            <Card
              title="Contact Information"
              variant="elevated"
              className="animate-slide-up"
            >
              <div className="space-y-4">
                <ContactInfo
                  Icon={ICONS.Contact}
                  title="Email"
                  value={PERSONAL_INFO.email}
                  href={`mailto:${PERSONAL_INFO.email}`}
                />
                <ContactInfo
                  Icon={ICONS.GitHub}
                  title="GitHub"
                  value="View Profile"
                  href={PERSONAL_INFO.github}
                />
                <ContactInfo
                  Icon={ICONS.LinkedIn}
                  title="LinkedIn"
                  value="View Profile"
                  href={PERSONAL_INFO.linkedin}
                />
              </div>

              <div className="mt-8 p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                  Response Time
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  I typically respond to messages within 24 hours. For urgent
                  inquiries, please mention it in your message and I'll
                  prioritize your request.
                </p>
              </div>
            </Card>
          </div>
        </Stack>
      </div>
    </div>
  );
};

export default Contact;
