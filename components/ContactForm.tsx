import React, { useState } from "react";
import { Button } from "./ui/button";
import Card, { CardContent, CardHeader, CardTitle } from "./Card";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real application, you would send the data to your backend
      console.log("Form submitted:", formData);

      setSubmitStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5 text-[var(--color-primary-600)]" />
          <span>Send me a message</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
            >
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-colors duration-200 ${
                errors.name
                  ? "border-[var(--color-status-error)] bg-[var(--color-status-error)]/5"
                  : "border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]"
              }`}
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-[var(--color-status-error)] flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-colors duration-200 ${
                errors.email
                  ? "border-[var(--color-status-error)] bg-[var(--color-status-error)]/5"
                  : "border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]"
              }`}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-[var(--color-status-error)] flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Message Field */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
            >
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={5}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] transition-colors duration-200 resize-none ${
                errors.message
                  ? "border-[var(--color-status-error)] bg-[var(--color-status-error)]/5"
                  : "border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]"
              }`}
              placeholder="Tell me about your project or just say hello..."
            />
            {errors.message && (
              <p className="mt-1 text-sm text-[var(--color-status-error)] flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.message}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white py-3 text-lg font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Send Message</span>
              </div>
            )}
          </Button>

          {/* Status Messages */}
          {submitStatus === "success" && (
            <div className="p-4 bg-[var(--color-status-success)]/10 border border-[var(--color-status-success)] rounded-lg">
              <div className="flex items-center space-x-2 text-[var(--color-status-success)]">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Message sent successfully!</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                I'll get back to you as soon as possible.
              </p>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="p-4 bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] rounded-lg">
              <div className="flex items-center space-x-2 text-[var(--color-status-error)]">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Failed to send message</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Please try again or contact me directly via email.
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
