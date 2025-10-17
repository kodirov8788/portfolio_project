import { useTranslation } from "react-i18next"; // eslint-disable-line @typescript-eslint/no-unused-vars

export const formatLastMessageDate = (
  lastMessageSent: string | undefined,
  t: any // eslint-disable-line @typescript-eslint/no-explicit-any
) => {
  if (!lastMessageSent) return t("time.never");

  const lastSent = new Date(lastMessageSent);
  const now = new Date();

  // Check if it's the same day (using local time)
  const isSameDay =
    lastSent.getFullYear() === now.getFullYear() &&
    lastSent.getMonth() === now.getMonth() &&
    lastSent.getDate() === now.getDate();

  if (isSameDay) {
    // Check if it's within the last hour
    const diffHours = Math.floor(
      (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
    );
    if (diffHours < 1) {
      const diffMinutes = Math.floor(
        (now.getTime() - lastSent.getTime()) / (1000 * 60)
      );
      if (diffMinutes < 1) return t("time.justNow");
      return `${diffMinutes} ${
        diffMinutes === 1 ? t("time.minuteAgo") : t("time.minutesAgo")
      }`;
    }
    return `${diffHours} ${
      diffHours === 1 ? t("time.hourAgo") : t("time.hoursAgo")
    }`;
  }

  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    lastSent.getFullYear() === yesterday.getFullYear() &&
    lastSent.getMonth() === yesterday.getMonth() &&
    lastSent.getDate() === yesterday.getDate();

  if (isYesterday) return t("time.yesterday");

  // Calculate days difference
  const diffTime = now.getTime() - lastSent.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `${diffDays} ${t("time.daysAgo")}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${t("time.weeksAgo")}`;
  return lastSent.toLocaleDateString();
};

export const formatLastMessageFailedDate = (
  lastMessageFailed: string | undefined,
  t: any // eslint-disable-line @typescript-eslint/no-explicit-any
) => {
  if (!lastMessageFailed) return "Never";
  return formatLastMessageDate(lastMessageFailed, t);
};

export const getMessageStatus = (
  item: any // eslint-disable-line @typescript-eslint/no-explicit-any
): "SUCCESS" | "FAILED" | "PENDING" | "SUCCESS_MANUAL" => {
  // Check if there's a MessageStatus record with MANUAL type
  if (item.messageStatuses && item.messageStatuses.length > 0) {
    const latestStatus = item.messageStatuses[0]; // Assuming sorted by timestamp desc
    if (
      latestStatus.status === "SUCCESS" &&
      latestStatus.messageType === "MANUAL"
    ) {
      return "SUCCESS_MANUAL";
    }
  }

  // If both sent and failed exist, check which is more recent
  if (item.lastMessageSent && item.lastMessageFailed) {
    const sentDate = new Date(item.lastMessageSent);
    const failedDate = new Date(item.lastMessageFailed);

    // Return the more recent status
    return failedDate > sentDate ? "FAILED" : "SUCCESS";
  }

  // If only one exists, return that status
  if (item.lastMessageSent) return "SUCCESS";
  if (item.lastMessageFailed) return "FAILED";

  return "PENDING";
};

export const autoOpenContactForm = (
  contact: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  subject: string,
  message: string,
  showNotification: (
    type: "success" | "error" | "info",
    message: string
  ) => void
) => {
  if (!contact.business?.contactPage && !contact.business?.website) {
    showNotification(
      "error",
      "No contact page or website available for this business"
    );
    return;
  }

  const contactUrl =
    contact.business.contactPage || `${contact.business.website}/contact`;

  // Enhanced popup opening with better error handling
  const openPopup = (): Window | null => {
    const newWindow = window.open(
      contactUrl,
      "_blank",
      "width=1200,height=800"
    );

    if (!newWindow) {
      console.warn("Popup blocked by browser");
      return null;
    }

    return newWindow;
  };

  // Try to open popup immediately (if called from user gesture)
  let newWindow = openPopup();

  // If blocked, show user-friendly instructions
  if (!newWindow) {
    // Show instructions to user
    const userConfirmed = confirm(
      `Popup blocked! Please:\n\n` +
        `1. Click "Allow" when browser asks about popups\n` +
        `2. Or manually open: ${contactUrl}\n\n` +
        `Click OK to try again, or Cancel to skip.`
    );

    if (userConfirmed) {
      newWindow = openPopup();
      if (!newWindow) {
        showNotification(
          "error",
          "Popup still blocked. Please check browser popup settings and try again."
        );
        return;
      }
    } else {
      showNotification("info", `Please manually open: ${contactUrl}`);
      return;
    }
  }

  // Wait for the page to load, then fill the form
  const checkAndFillForm = () => {
    try {
      // Try to fill common form fields
      const formFields = {
        // Name fields - use actual company name, no AutoReach Pro fallback
        'input[name*="name" i]': contact.senderCompanyName
          ? `${contact.senderCompanyName} - ${contact.business?.name}`
          : contact.business?.name || "",
        'input[name*="fullname" i]': contact.senderCompanyName
          ? `${contact.senderCompanyName} - ${contact.business?.name}`
          : contact.business?.name || "",
        'input[name*="firstname" i]': contact.senderCompanyName || "",
        'input[name*="lastname" i]': contact.business?.name || "",

        // Email fields
        'input[name*="email" i]':
          contact.business?.email || "info@autoreach.pro",
        'input[name*="mail" i]':
          contact.business?.email || "info@autoreach.pro",

        // Subject fields
        'input[name*="subject" i]': subject,
        'input[name*="title" i]': subject,

        // Message fields
        'textarea[name*="message" i]': message,
        'textarea[name*="content" i]': message,
        'textarea[name*="comment" i]': message,
        'textarea[name*="description" i]': message,

        // Phone fields (if available)
        'input[name*="phone" i]': contact.business?.phone || "",
        'input[name*="tel" i]': contact.business?.phone || "",

        // Company fields - use actual company name, no AutoReach Pro fallback
        'input[name*="company" i]': contact.senderCompanyName || "",
        'input[name*="organization" i]': contact.senderCompanyName || "",
      };

      // Fill each field type
      Object.entries(formFields).forEach(([selector, value]) => {
        if (value) {
          const elements = newWindow.document.querySelectorAll(selector);
          elements.forEach((element: Element) => {
            const input = element as HTMLInputElement | HTMLTextAreaElement;
            input.value = value;

            // Trigger change events
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
          });
        }
      });

      // Try to check common checkbox fields
      const checkboxSelectors = [
        'input[type="checkbox"][name*="newsletter" i]',
        'input[type="checkbox"][name*="subscribe" i]',
        'input[type="checkbox"][name*="agree" i]',
        'input[type="checkbox"][name*="terms" i]',
        'input[type="checkbox"][name*="privacy" i]',
      ];

      checkboxSelectors.forEach((selector) => {
        const checkboxes = newWindow.document.querySelectorAll(selector);
        checkboxes.forEach((checkbox: Element) => {
          const cb = checkbox as HTMLInputElement;
          cb.checked = true;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });

      showNotification(
        "success",
        `Form opened and filled for ${contact.business?.name}. Please review and submit manually.`
      );
    } catch (error) {
      console.error("Error filling form:", error);
      showNotification(
        "info",
        `Form opened for ${contact.business?.name}. Please fill it out manually.`
      );
    }
  };

  // Wait for page to load, then fill form
  if (newWindow.document.readyState === "complete") {
    setTimeout(checkAndFillForm, 1000); // Give extra time for dynamic content
  } else {
    newWindow.addEventListener("load", () => {
      setTimeout(checkAndFillForm, 1000); // Give extra time for dynamic content
    });
  }
};
