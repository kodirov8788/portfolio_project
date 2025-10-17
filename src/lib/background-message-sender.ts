// Background Message Sender System
// Integrates with Listers form EX and CAPTCHA Solver extensions

import { debug } from "./debug";

export interface BackgroundMessageConfig {
  contactId: string;
  groupId: string;
  businessName: string;
  contactPage: string;
  website: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  retryCount?: number;
  maxRetries?: number;
  senderCompanyName?: string;
}

export interface BackgroundMessageResult {
  contactId: string;
  success: boolean;
  message: string;
  details?: string;
  timestamp: string;
  retryCount: number;
  browserKeptOpen?: boolean;
  instructions?: string[];
}

export interface FormFieldMapping {
  selector: string;
  value: string;
  type: "input" | "textarea" | "select" | "checkbox" | "radio";
}

export class BackgroundMessageSender {
  private messageQueue: BackgroundMessageConfig[] = [];
  private isProcessing = false;
  private results: BackgroundMessageResult[] = [];
  private userControlledWindows: Map<string, Window> = new Map();

  constructor() {
    debug.info("automation", "BackgroundMessageSender initialized");
    this.setupMessageListener();
  }

  // Add message to queue for background processing
  async queueMessage(config: BackgroundMessageConfig): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    debug.info("automation", "Message queued for background processing", {
      messageId,
      contactId: config.contactId,
      businessName: config.businessName,
      website: config.website,
    });

    this.messageQueue.push({
      ...config,
      retryCount: 0,
      maxRetries: config.maxRetries || 3,
    });

    // Create pending status in database if groupId is available
    if (config.groupId) {
      try {
        await fetch("/api/message-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            contactId: config.contactId,
            groupId: config.groupId,
            status: "PENDING",
            message: "Message queued for background processing",
            details: `Queued at ${new Date().toLocaleString()}`,
            retryCount: 0,
          }),
        });
      } catch (error) {
        console.warn("Failed to create pending status:", error);
      }
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return messageId;
  }

  // Process the message queue in background
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const config = this.messageQueue.shift();
      if (config) {
        try {
          const result = await this.sendMessage(config);
          this.results.push(result);

          // Update final status in database
          if (config.groupId) {
            try {
              await fetch("/api/message-status", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  contactId: config.contactId,
                  groupId: config.groupId,
                  status: result.success ? "SUCCESS" : "FAILED",
                  message: result.message,
                  details: result.details,
                  messageType: "BACKGROUND",
                  retryCount: config.retryCount || 0,
                }),
              });
            } catch (error) {
              console.warn("Failed to update final message status:", error);
            }
          }

          // If failed and retries available, add back to queue
          if (!result.success && config.retryCount! < config.maxRetries!) {
            this.messageQueue.push({
              ...config,
              retryCount: config.retryCount! + 1,
            });
          }

          // Add delay between messages to avoid rate limiting
          await this.delay(2000 + Math.random() * 3000);
        } catch (error) {
          console.error("Background message processing error:", error);
          this.results.push({
            contactId: config.contactId,
            success: false,
            message: "Processing error",
            details: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
            retryCount: config.retryCount || 0,
          });
        }
      }
    }

    this.isProcessing = false;
  }

  // Send message with user-controlled submission (new method)
  async sendMessageWithUserControl(
    config: BackgroundMessageConfig
  ): Promise<BackgroundMessageResult> {
    try {
      const rawTargetUrl =
        config.contactPage?.trim() || config.website?.trim() || "";

      if (!rawTargetUrl) {
        return {
          contactId: config.contactId,
          success: false,
          message:
            "No contact page or website URL configured for this business.",
          details:
            "Update the business with a valid contact page or website before trying again.",
          timestamp: new Date().toISOString(),
          retryCount: config.retryCount || 0,
        };
      }

      let targetUrl = rawTargetUrl;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }

      try {
        // Validate URL format. Will throw if invalid.
        new URL(targetUrl);
      } catch (urlError) {
        console.warn("Invalid contact URL provided:", rawTargetUrl, urlError);
        return {
          contactId: config.contactId,
          success: false,
          message: "Invalid contact URL",
          details: `Provided URL \"${rawTargetUrl}\" is not a valid web address.`,
          timestamp: new Date().toISOString(),
          retryCount: config.retryCount || 0,
        };
      }

      console.log(
        `🚀 Opening contact form for user-controlled submission: ${config.businessName} at ${targetUrl}`
      );

      // Enhanced popup opening with better error handling
      const openPopup = (): Window | null => {
        const newWindow = window.open(
          targetUrl,
          "_blank",
          "width=1200,height=800,scrollbars=yes,resizable=yes,location=yes,menubar=yes,toolbar=yes"
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
            `2. Or manually open: ${config.contactPage}\n\n` +
            `Click OK to try again, or Cancel to skip.`
        );

        if (userConfirmed) {
          newWindow = openPopup();
          if (!newWindow) {
            throw new Error(
              "Popup still blocked. Please check browser popup settings and try again."
            );
          }
        } else {
          throw new Error("User cancelled popup opening");
        }
      }

      // Store window reference for tracking
      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      this.userControlledWindows.set(messageId, newWindow);

      // Step 2: Wait for user to manually fill and submit
      return new Promise((resolve) => {
        let settled = false;

        const settle = (result: BackgroundMessageResult) => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearInterval(checkClosed);
          window.clearTimeout(timeoutId);
          this.userControlledWindows.delete(messageId);
          resolve(result);
        };

        const checkClosed = window.setInterval(() => {
          if (newWindow.closed) {
            this.updateMessageStatus(config, {
              success: true,
              message: "Form submitted manually by user",
              details: "User completed form submission manually",
            });

            settle({
              contactId: config.contactId,
              success: true,
              message: "Form submitted manually by user",
              details: "User completed form submission",
              timestamp: new Date().toISOString(),
              retryCount: config.retryCount || 0,
            });
          }
        }, 1000);

        const timeoutId = window.setTimeout(() => {
          if (!newWindow.closed) {
            newWindow.close();
          }

          this.updateMessageStatus(config, {
            success: false,
            message: "Form submission timed out",
            details: "User did not complete form within 10 minutes",
          });

          settle({
            contactId: config.contactId,
            success: false,
            message: "Form submission timed out",
            details: "User did not complete form within 10 minutes",
            timestamp: new Date().toISOString(),
            retryCount: config.retryCount || 0,
          });
        }, 600000); // 10 minutes
      });
    } catch (error) {
      // Enhanced error handling with better user feedback
      console.error("Popup opening failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to open popup";
      const normalizedMessage = errorMessage.toLowerCase();
      const isUserCancelled = normalizedMessage.includes("cancelled");
      const isPopupBlocked =
        !isUserCancelled && normalizedMessage.includes("blocked");

      return {
        contactId: config.contactId,
        success: false,
        message: isPopupBlocked
          ? "Popup blocked by browser. Please allow popups for this site and try again."
          : isUserCancelled
          ? "Popup opening cancelled by user."
          : errorMessage,
        details: isPopupBlocked
          ? `To fix: 1) Click the popup blocker icon in your browser's address bar, 2) Select "Always allow popups from this site", 3) Refresh the page and try again.`
          : isUserCancelled
          ? "You cancelled the popup confirmation dialog. Try again when ready."
          : `Technical error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        retryCount: config.retryCount || 0,
        instructions: isPopupBlocked
          ? [
              "Click the popup blocker icon in your browser's address bar",
              "Select 'Always allow popups from this site'",
              "Refresh the page and try again",
              "Or manually open the contact form URL",
            ]
          : undefined,
      };
    }
  }

  // Send individual message using Puppeteer API
  private async sendMessage(
    config: BackgroundMessageConfig
  ): Promise<BackgroundMessageResult> {
    try {
      console.log(
        `🚀 Background sending message to ${config.businessName} at ${config.contactPage}`
      );

      // Call the Puppeteer API to fill the form
      const response = await fetch("/api/background-fill-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          url: config.contactPage,
          businessName: config.businessName,
          email: config.email,
          phone: config.phone,
          subject: config.subject,
          message: config.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fill form");
      }

      // Update status in database
      if (config.groupId) {
        try {
          await fetch("/api/message-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              contactId: config.contactId,
              groupId: config.groupId,
              status: result.success ? "SUCCESS" : "FAILED",
              message: result.message,
              details: result.details,
              retryCount: config.retryCount || 0,
            }),
          });
        } catch (error) {
          console.warn("Failed to update message status:", error);
        }
      }

      return {
        contactId: config.contactId,
        success: result.success,
        message: result.message,
        details: result.details,
        timestamp: new Date().toISOString(),
        retryCount: config.retryCount || 0,
        browserKeptOpen: result.browserKeptOpen,
        instructions: result.instructions,
      };
    } catch (error) {
      return {
        contactId: config.contactId,
        success: false,
        message: "Failed to send message",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        retryCount: config.retryCount || 0,
      };
    }
  }

  // Wait for page to fully load
  private async waitForPageLoad(window: Window): Promise<void> {
    return new Promise((resolve) => {
      if (window.document.readyState === "complete") {
        setTimeout(resolve, 2000); // Extra time for dynamic content
      } else {
        window.addEventListener("load", () => {
          setTimeout(resolve, 2000); // Extra time for dynamic content
        });
      }
    });
  }

  // Auto-fill form using smart field detection
  private async autoFillForm(
    window: Window,
    config: BackgroundMessageConfig
  ): Promise<void> {
    const doc = window.document;

    // Smart form field mapping based on Listers form EX logic
    const fieldMappings: FormFieldMapping[] = [
      // Name fields - use actual company name, no AutoReach Pro fallback
      {
        selector: 'input[name*="name" i], input[name*="fullname" i]',
        value: config.senderCompanyName
          ? `${config.senderCompanyName} - ${config.businessName}`
          : config.businessName,
        type: "input",
      },
      {
        selector: 'input[name*="firstname" i]',
        value: config.senderCompanyName || "",
        type: "input",
      },
      {
        selector: 'input[name*="lastname" i]',
        value: config.businessName,
        type: "input",
      },

      // Email fields
      {
        selector:
          'input[name*="email" i], input[name*="mail" i], input[type="email"]',
        value: config.email,
        type: "input",
      },

      // Subject fields
      {
        selector: 'input[name*="subject" i], input[name*="title" i]',
        value: config.subject,
        type: "input",
      },

      // Message fields
      {
        selector:
          'textarea[name*="message" i], textarea[name*="content" i], textarea[name*="comment" i], textarea[name*="description" i]',
        value: config.message,
        type: "textarea",
      },

      // Phone fields
      {
        selector:
          'input[name*="phone" i], input[name*="tel" i], input[type="tel"]',
        value: config.phone || "",
        type: "input",
      },

      // Company fields - use actual company name, no AutoReach Pro fallback
      {
        selector: 'input[name*="company" i], input[name*="organization" i]',
        value: config.senderCompanyName || "",
        type: "input",
      },

      // Address fields (common in Japanese forms)
      {
        selector: 'input[name*="address" i], input[name*="住所" i]',
        value: "Tokyo, Japan",
        type: "input",
      },
      {
        selector: 'input[name*="zip" i], input[name*="郵便" i]',
        value: "100-0001",
        type: "input",
      },
    ];

    // Fill each field type
    for (const mapping of fieldMappings) {
      if (mapping.value) {
        const elements = doc.querySelectorAll(mapping.selector);
        elements.forEach((element) => {
          if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement
          ) {
            element.value = mapping.value;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      }
    }

    // Handle checkboxes and radio buttons
    await this.handleFormControls(doc);

    // Handle select dropdowns
    await this.handleSelectDropdowns(doc);

    console.log(`✅ Form auto-filled for ${config.businessName}`);
  }

  // Handle checkboxes and radio buttons
  private async handleFormControls(doc: Document): Promise<void> {
    // Check common checkboxes
    const checkboxSelectors = [
      'input[type="checkbox"][name*="newsletter" i]',
      'input[type="checkbox"][name*="subscribe" i]',
      'input[type="checkbox"][name*="agree" i]',
      'input[type="checkbox"][name*="terms" i]',
      'input[type="checkbox"][name*="privacy" i]',
      'input[type="checkbox"][name*="consent" i]',
      'input[type="checkbox"][name*="marketing" i]',
    ];

    checkboxSelectors.forEach((selector) => {
      const checkboxes = doc.querySelectorAll(selector);
      checkboxes.forEach((checkbox) => {
        if (checkbox instanceof HTMLInputElement) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });

    // Handle radio buttons (select first option)
    const radioGroups = doc.querySelectorAll('input[type="radio"]');
    const radioGroupsMap = new Map<string, HTMLInputElement[]>();

    radioGroups.forEach((radio) => {
      if (radio instanceof HTMLInputElement && radio.name) {
        if (!radioGroupsMap.has(radio.name)) {
          radioGroupsMap.set(radio.name, []);
        }
        radioGroupsMap.get(radio.name)!.push(radio);
      }
    });

    // Select first option in each radio group
    radioGroupsMap.forEach((radios) => {
      if (radios.length > 0) {
        radios[0].checked = true;
        radios[0].dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // Handle select dropdowns
  private async handleSelectDropdowns(doc: Document): Promise<void> {
    const selects = doc.querySelectorAll("select");

    selects.forEach((select) => {
      if (select instanceof HTMLSelectElement) {
        const options = Array.from(select.options);
        const selectText = select.previousElementSibling?.textContent || "";

        // Smart selection based on field context
        if (
          selectText.includes("都道府県") ||
          selectText.includes("prefecture")
        ) {
          // Select Tokyo or first option
          const tokyoOption = options.find(
            (opt) => opt.text.includes("東京") || opt.text.includes("Tokyo")
          );
          if (tokyoOption) {
            select.value = tokyoOption.value;
          } else if (options.length > 0) {
            select.selectedIndex = 0;
          }
        } else if (
          selectText.includes("業種") ||
          selectText.includes("industry")
        ) {
          // Select business type
          const businessOption = options.find(
            (opt) =>
              opt.text.includes("サービス") ||
              opt.text.includes("service") ||
              opt.text.includes("IT") ||
              opt.text.includes("technology")
          );
          if (businessOption) {
            select.value = businessOption.value;
          } else if (options.length > 0) {
            select.selectedIndex = 0;
          }
        } else if (options.length > 0) {
          // Default to first option
          select.selectedIndex = 0;
        }

        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // Handle CAPTCHA using extension integration
  private async handleCaptcha(window: Window): Promise<void> {
    const doc = window.document;

    // Check for various CAPTCHA types
    const captchaTypes = {
      recaptcha: doc.querySelector(
        '.g-recaptcha, iframe[src*="google.com/recaptcha"], script[src*="recaptcha/api.js"]'
      ),
      hcaptcha: doc.querySelector(
        'iframe[src*="hcaptcha.com"], script[src*="hcaptcha"]'
      ),
      simple: doc.querySelector(
        'img[src*="captcha"], input[name*="captcha" i]'
      ),
    };

    if (captchaTypes.recaptcha || captchaTypes.hcaptcha) {
      console.log("🔄 CAPTCHA detected, waiting for solver...");

      // Wait for CAPTCHA to be solved (up to 30 seconds)
      let solved = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!solved && attempts < maxAttempts) {
        await this.delay(1000);
        attempts++;

        // Check if CAPTCHA is solved
        const recaptchaResponse = doc.querySelector(
          'textarea[name="g-recaptcha-response"]'
        ) as HTMLTextAreaElement;
        const hcaptchaResponse = doc.querySelector(
          'input[name="h-captcha-response"]'
        ) as HTMLInputElement;

        if (recaptchaResponse?.value || hcaptchaResponse?.value) {
          solved = true;
          console.log("✅ CAPTCHA solved automatically");
        }
      }

      if (!solved) {
        console.log("⚠️ CAPTCHA not solved within timeout, continuing...");
      }
    }
  }

  // Submit the form
  private async submitForm(
    window: Window
  ): Promise<{ success: boolean; message: string; details?: string }> {
    const doc = window.document;

    // Find submit buttons
    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'button:contains("送信"), button:contains("Send"), button:contains("Submit")',
      'input[value*="送信"], input[value*="Send"], input[value*="Submit"]',
    ];

    let submitButton: Element | null = null;

    for (const selector of submitSelectors) {
      const elements = doc.querySelectorAll(selector);
      for (const element of elements) {
        let text = element.textContent || "";
        if (element instanceof HTMLInputElement) {
          text = element.value || text;
        }
        if (
          text.includes("送信") ||
          text.includes("Send") ||
          text.includes("Submit") ||
          text.includes("確認") ||
          text.includes("Confirm")
        ) {
          submitButton = element;
          break;
        }
      }
      if (submitButton) break;
    }

    if (!submitButton) {
      return {
        success: false,
        message: "Submit button not found",
        details: "No submit button detected on the form",
      };
    }

    try {
      // Click submit button
      (submitButton as HTMLElement).click();

      // Wait for submission to complete
      await this.delay(5000);

      // Check if form was submitted successfully
      const successIndicators = [
        "送信完了",
        "送信されました",
        "ありがとうございます",
        "Thank you",
        "Success",
        "Submitted",
        "Complete",
      ];

      const pageText = doc.body.textContent || "";
      const hasSuccessIndicator = successIndicators.some((indicator) =>
        pageText.includes(indicator)
      );

      if (hasSuccessIndicator) {
        return {
          success: true,
          message: "Form submitted successfully",
          details: "Success indicator found on page",
        };
      } else {
        // Check if form fields are cleared (another success indicator)
        const inputs = doc.querySelectorAll("input, textarea");
        const allCleared = Array.from(inputs).every(
          (input) => !(input instanceof HTMLInputElement) || input.value === ""
        );

        if (allCleared) {
          return {
            success: true,
            message: "Form submitted successfully",
            details: "Form fields cleared after submission",
          };
        }
      }

      return {
        success: true,
        message: "Form submitted (status unclear)",
        details: "Submit button clicked, but success status uncertain",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to submit form",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Setup message listener for extension communication
  private setupMessageListener(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("message", (event) => {
        if (event.source === window && event.data.type === "CAPTCHA_SOLVED") {
          console.log("✅ CAPTCHA solved via extension");
        }
      });
    }
  }

  // Get results
  getResults(): BackgroundMessageResult[] {
    return [...this.results];
  }

  // Clear results
  clearResults(): void {
    this.results = [];
  }

  // Get queue status
  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  // Helper method to update message status in database
  private async updateMessageStatus(
    config: BackgroundMessageConfig,
    result: { success: boolean; message: string; details: string }
  ): Promise<void> {
    if (config.groupId) {
      try {
        await fetch("/api/message-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            contactId: config.contactId,
            groupId: config.groupId,
            status: result.success ? "SUCCESS" : "FAILED",
            message: result.message,
            details: result.details,
            messageType: "USER_CONTROLLED",
            retryCount: config.retryCount || 0,
          }),
        });
      } catch (error) {
        console.warn("Failed to update message status:", error);
      }
    }
  }

  // Get active user-controlled windows
  getActiveWindows(): number {
    return this.userControlledWindows.size;
  }

  // Close all user-controlled windows
  closeAllWindows(): void {
    this.userControlledWindows.forEach((window) => {
      if (!window.closed) {
        window.close();
      }
    });
    this.userControlledWindows.clear();
  }
}

// Export singleton instance
export const backgroundMessageSender = new BackgroundMessageSender();
