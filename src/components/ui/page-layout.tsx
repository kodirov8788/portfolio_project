"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Container } from "./container";
import { Section } from "./section";
import { Heading, Text } from "./typography";

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-gray-50 to-white",
        className
      )}
    >
      {/* Page Header */}
      <Section spacing="md">
        <Container size="xl" centered>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Heading variant="h1" className="mb-2">
                {title}
              </Heading>
              {description && (
                <Text variant="body" muted>
                  {description}
                </Text>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        </Container>
      </Section>

      {/* Page Content */}
      <Section spacing="md">
        <Container size="xl" centered>
          {children}
        </Container>
      </Section>
    </div>
  );
};
