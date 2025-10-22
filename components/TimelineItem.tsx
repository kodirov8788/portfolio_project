import React from "react";
import { Calendar, MapPin, Award } from "lucide-react";

export interface TimelineItemData {
  id: string;
  title: string;
  organization: string;
  location?: string;
  period: string;
  description: string;
  type: "experience" | "education" | "certification";
  current?: boolean;
}

interface TimelineItemProps {
  item: TimelineItemData;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  isLast = false,
}) => {
  const getIcon = () => {
    switch (item.type) {
      case "experience":
        return <Award className="h-5 w-5" />;
      case "education":
        return <Calendar className="h-5 w-5" />;
      case "certification":
        return <Award className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case "experience":
        return "bg-[var(--color-primary-500)]";
      case "education":
        return "bg-[var(--color-accent-500)]";
      case "certification":
        return "bg-[var(--color-success)]";
      default:
        return "bg-[var(--color-primary-500)]";
    }
  };

  return (
    <div className="relative flex items-start space-x-4 animate-slide-up">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-full bg-[var(--color-border-primary)]" />
      )}

      {/* Icon */}
      <div
        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getTypeColor()} text-white shadow-lg`}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-8">
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {item.title}
          </h3>
          {item.current && (
            <span className="px-2 py-1 text-xs font-medium bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)] rounded-full">
              Current
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm text-[var(--color-text-secondary)] mb-2">
          <span className="font-medium">{item.organization}</span>
          {item.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>{item.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 text-sm text-[var(--color-text-tertiary)] mb-3">
          <Calendar className="h-3 w-3" />
          <span>{item.period}</span>
        </div>

        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
};

export default TimelineItem;
