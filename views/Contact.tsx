import React from "react";
import Card from "../components/Card";
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
      <div className="bg-[var(--color-primary-100)] p-3 rounded-full">
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
      className="h-auto p-4 justify-start hover:bg-[var(--color-primary-50)] transition-colors duration-200"
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
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-neutral-50)] to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto py-6 lg:py-8">
        <Stack direction="vertical" spacing="lg">
          <Card
            title="Get In Touch"
            variant="elevated"
            className="animate-fade-in"
          >
            <p className="mb-8 text-[var(--color-text-secondary)]">
              I'm always open to discussing new projects, creative ideas, or
              opportunities to be part of an ambitious vision. Feel free to
              reach out to me through any of the platforms below.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </Card>
        </Stack>
      </div>
    </div>
  );
};

export default Contact;
