// import puppeteer, { Browser, Page } from "puppeteer";

// Conditional import for Puppeteer
let puppeteer: any, Browser: any, Page: any;
if (
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_PUPPETEER === "true"
) {
  try {
    //     const puppeteerModule = require("puppeteer");
    puppeteer = puppeteerModule.default;
    Browser = puppeteerModule.Browser;
    Page = puppeteerModule.Page;
  } catch (error) {
    console.warn("Puppeteer not available in production environment");
  }
}

export interface OceanDreamsContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  company?: string;
  destination?: string;
  travelDates?: string;
  budget?: string;
  numberOfTravelers?: string;
}

export interface OceanDreamsContactResult {
  success: boolean;
  message: string;
  contactPageUrl?: string;
  formSubmitted?: boolean;
  captchaSolved?: boolean;
  error?: string;
  timestamp: Date;
}

export class OceanDreamsContactAutomation {
  private oceanDreamsUrl = "https://test-form-three-rho.vercel.app/";
  private browser: Browser | null = null;

  constructor() {
    // Initialize browser options
  }

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
        try {
          const pages = await this.browser.pages();
          if (pages.length >= 0) {
            return this.browser;
          }
        } catch {
          console.warn("Existing browser connection lost, creating new instance");
          this.browser = null;
        }
    }

    const isHeadless = process.env.HEADLESS_MODE === "true";

    this.browser = await puppeteer.launch({
        headless: isHeadless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-features=TranslateUI",
          "--disable-ipc-flooding-protection",
        ],
    });

    return this.browser;
  }

  /**
   * Create a new page
   */
  private async createPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);

    return page;
  }

  /**
   * Send a contact message to Ocean Dreams website
   */
  async sendContactMessage(
    request: OceanDreamsContactRequest
  ): Promise<OceanDreamsContactResult> {
    const startTime = new Date();

    try {
        console.log("Starting Ocean Dreams contact automation...");

        // Step 1: Find contact page
        const contactPageUrl = await this.findContactPage();
        if (!contactPageUrl) {
          return {
            success: false,
            message: "Contact page not found on Ocean Dreams website",
            timestamp: startTime,
          };
        }

        console.log("Contact page found:", contactPageUrl);

        // Step 2: Prepare form data
        const formData = this.prepareFormData(request);

        // Step 3: Submit contact form
        const submissionResult = await this.submitContactForm(
          contactPageUrl,
          formData
        );

        return {
          success: submissionResult.success,
          message: submissionResult.message,
          contactPageUrl,
          formSubmitted: submissionResult.success,
          captchaSolved: submissionResult.captchaSolved,
          timestamp: startTime,
        };
    } catch {
        console.error("Error in Ocean Dreams contact automation");
        return {
          success: false,
          message: "Failed to send contact message",
          error: "Unknown error",
          timestamp: startTime,
        };
    } finally {
        await this.cleanup();
    }
  }

  /**
   * Find the contact page on Ocean Dreams website
   */
  private async findContactPage(): Promise<string | null> {
    try {
        const browser = await this.initBrowser();
        const page = await this.createPage(browser);

        await page.goto(this.oceanDreamsUrl, { waitUntil: "networkidle2" });

        // Look for contact links
        const contactSelectors = [
          'a[href*="contact"]',
          'a[href*="Contact"]',
          'a:contains("Contact")',
          'a:contains("Contact Us")',
          'a:contains("Get Started")',
          'a:contains("Start Your Journey")',
        ];

        for (const selector of contactSelectors) {
          try {
            const links = await page.$$eval(selector, (elements) =>
              elements.map((el) => ({
                href: el.getAttribute("href"),
                text: el.textContent?.trim(),
              }))
            );

            if (links.length > 0) {
              const contactLink = links[0];
              if (contactLink.href) {
                const fullUrl = contactLink.href.startsWith("http")
                  ? contactLink.href
                  : new URL(contactLink.href, this.oceanDreamsUrl).href;

                console.log("Found contact link:", fullUrl);
                return fullUrl;
              }
            }
          } catch (error) {
            console.warn(
              `Failed to find contact links with selector: ${selector}`,
              error
            );
          }
        }

        // If no specific contact link found, check if there's a contact form on main page
        const forms = await page.$$eval("form", (forms) =>
          forms.map((form) => ({
            action: form.getAttribute("action"),
            method: form.getAttribute("method"),
            id: form.getAttribute("id"),
            class: form.getAttribute("class"),
          }))
        );

        if (forms.length > 0) {
          console.log("Found forms on main page:", forms);
          return this.oceanDreamsUrl;
        }

        // Check for contact section or contact us button
        const contactButtons = await page.$$eval("button, a", (elements) =>
          elements
            .filter((el) => {
              const text = el.textContent?.toLowerCase() || "";
              return (
                text.includes("contact") ||
                text.includes("get started") ||
                text.includes("start your journey")
              );
            })
            .map((el) => ({
              tagName: el.tagName.toLowerCase(),
              text: el.textContent?.trim(),
              href: el.getAttribute("href"),
              type: el.getAttribute("type"),
            }))
        );

        if (contactButtons.length > 0) {
          console.log("Found contact buttons:", contactButtons);
          return this.oceanDreamsUrl;
        }

        return null;
    } catch (error) {
        console.error("Error finding contact page:", error);
        return null;
    }
  }

  /**
   * Prepare form data for submission
   */
  private prepareFormData(
    request: OceanDreamsContactRequest
  ): Record<string, string> {
    return {
        // Standard form fields
        name: request.name,
        full_name: request.name,
        first_name: request.name.split(" ")[0] || request.name,
        last_name: request.name.split(" ")[1] || "",
        email: request.email,
        "e-mail": request.email,
        mail: request.email,
        phone: request.phone || "",
        telephone: request.phone || "",
        tel: request.phone || "",
        message: request.message,
        content: request.message,
        inquiry: request.message,
        comments: request.message,
        description: request.message,
        subject: "Beach Vacation Inquiry",
        title: "Beach Vacation Inquiry",

        // Travel-specific fields
        company: request.company || "",
        destination: request.destination || "",
        travel_dates: request.travelDates || "",
        dates: request.travelDates || "",
        budget: request.budget || "",
        number_of_travelers: request.numberOfTravelers || "",
        travelers: request.numberOfTravelers || "",
        guests: request.numberOfTravelers || "",
        adults: request.numberOfTravelers || "",
        children: "",
        infants: "",

        // Ocean Dreams specific fields
        beach_destination: request.destination || "",
        vacation_type: "Beach Vacation",
        accommodation_type: "Beachfront",
        preferred_location: request.destination || "",
        special_requests: request.message,
        inquiry_type: "Vacation Planning",
    };
  }

  /**
   * Submit contact form with CAPTCHA handling
   */
  private async submitContactForm(
    contactPageUrl: string,
    formData: Record<string, string>
  ): Promise<{ success: boolean; message: string; captchaSolved?: boolean }> {
    try {
        const browser = await this.initBrowser();
        const page = await this.createPage(browser);

        await page.goto(contactPageUrl, { waitUntil: "networkidle2" });

        // Check for CAPTCHA
        const captchaDetected = await this.checkForCaptcha(page);
        let captchaSolved = false;

        if (captchaDetected) {
          console.log("CAPTCHA detected, attempting to solve...");
          captchaSolved = await this.solveCaptcha(page);
        }

        // Fill form fields
        await this.fillFormFields(page, formData);

        // Submit form
        const submitResult = await this.submitForm(page);

        return {
          success: submitResult.success,
          message: submitResult.message,
          captchaSolved,
        };
    } catch (error) {
        console.error("Error submitting contact form:", error);
        return {
          success: false,
          message: "Failed to submit contact form",
        };
    }
  }

  /**
   * Check for CAPTCHA on the page
   */
  private async checkForCaptcha(page: Page): Promise<boolean> {
    try {
        const captchaSelectors = [
          ".g-recaptcha",
          'iframe[src*="google.com/recaptcha"]',
          'iframe[src*="recaptcha"]',
          'iframe[src*="hcaptcha"]',
          ".h-captcha",
          "[data-sitekey]",
        ];

        for (const selector of captchaSelectors) {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            console.log(`CAPTCHA detected with selector: ${selector}`);
            return true;
          }
        }

        return false;
    } catch (error) {
        console.warn("Error checking for CAPTCHA:", error);
        return false;
    }
  }

  /**
   * Attempt to solve CAPTCHA
   */
  private async solveCaptcha(page: Page): Promise<boolean> {
    try {
        // Wait a bit for CAPTCHA to load
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Try to find and click the CAPTCHA checkbox
        const captchaCheckboxes = await page.$$('iframe[src*="recaptcha"]');

        if (captchaCheckboxes.length > 0) {
          // Switch to CAPTCHA iframe
          const captchaFrame = captchaCheckboxes[0];
          const frame = await captchaFrame.contentFrame();

          if (frame) {
            const checkbox = await frame.$(".recaptcha-checkbox-border");
            if (checkbox) {
              await checkbox.click();
              console.log("Clicked CAPTCHA checkbox");

              // Wait for CAPTCHA to be solved
              await new Promise((resolve) => setTimeout(resolve, 5000));
              return true;
            }
          }
        }

        return false;
    } catch {
        console.error("Error solving CAPTCHA");
        return false;
    }
  }

  /**
   * Fill form fields with provided data
   */
  private async fillFormFields(
    page: Page,
    formData: Record<string, string>
  ): Promise<void> {
    // Fill text inputs
    for (const [fieldName, value] of Object.entries(formData)) {
        if (!value) continue;

        const selectors = [
          `input[name="${fieldName}"]`,
          `input[id="${fieldName}"]`,
          `input[placeholder*="${fieldName}"]`,
          `textarea[name="${fieldName}"]`,
          `textarea[id="${fieldName}"]`,
          `textarea[placeholder*="${fieldName}"]`,
          `input[name*="${fieldName.toLowerCase()}"]`,
          `input[id*="${fieldName.toLowerCase()}"]`,
          `textarea[name*="${fieldName.toLowerCase()}"]`,
          `textarea[id*="${fieldName.toLowerCase()}"]`,
        ];

        for (const selector of selectors) {
          try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
              await elements[0].type(value);
              console.log(`Filled field ${fieldName} with value: ${value}`);
              break;
            }
          } catch (error) {
            console.warn(
              `Failed to fill field ${fieldName} with selector ${selector}:`,
              error
            );
          }
        }
    }

    // Handle select dropdowns
    const selectElements = await page.$$("select");
    for (const select of selectElements) {
        try {
          const options = await select.$$eval("option", (opts) =>
            opts.map((opt) => ({
              value: opt.getAttribute("value"),
              text: opt.textContent?.trim(),
            }))
          );

          // Try to find matching option
          for (const [fieldName, value] of Object.entries(formData)) {
            if (!value) continue;

            const matchingOption = options.find(
              (opt) =>
                opt.text?.toLowerCase().includes(fieldName.toLowerCase()) ||
                opt.text?.toLowerCase().includes(value.toLowerCase())
            );

            if (matchingOption) {
              await select.select(
                matchingOption.value || matchingOption.text || ""
              );
              console.log(
                `Selected option for ${fieldName}: ${matchingOption.text}`
              );
              break;
            }
          }
        } catch (error) {
          console.warn("Error handling select element:", error);
        }
    }

    // Handle checkboxes and radio buttons
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
        try {
          const isChecked = await checkbox.evaluate((el) => el.checked);
          if (!isChecked) {
            await checkbox.click();
          }
        } catch (error) {
          console.warn("Error handling checkbox:", error);
        }
    }

    const radioButtons = await page.$$('input[type="radio"]');
    for (const radio of radioButtons) {
        try {
          await radio.click();
        } catch (error) {
          console.warn("Error handling radio button:", error);
        }
    }
  }

  /**
   * Submit the form
   */
  private async submitForm(
    page: Page
  ): Promise<{ success: boolean; message: string }> {
    try {
        // Look for submit buttons
        const submitSelectors = [
          'input[type="submit"]',
          'button[type="submit"]',
          'button:contains("Submit")',
          'button:contains("Send")',
          'button:contains("Contact")',
          'button:contains("Get Started")',
          'button:contains("Start Your Journey")',
          'input[value*="Submit"]',
          'input[value*="Send"]',
          'input[value*="Contact"]',
          'button:contains("Send Message")',
          'button:contains("Submit Form")',
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
          try {
            const buttons = await page.$$(selector);
            if (buttons.length > 0) {
              submitButton = buttons[0];
              break;
            }
          } catch {
            console.warn(
              `Failed to find submit button with selector: ${selector}`
            );
          }
        }

        if (!submitButton) {
          return {
            success: false,
            message: "Submit button not found",
          };
        }

        // Click submit button
        await submitButton.click();
        console.log("Form submitted");

        // Wait for response
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check for success indicators
        const successIndicators = [
          'text="Thank you"',
          'text="Success"',
          'text="Message sent"',
          'text="Form submitted"',
          'text="Contact form submitted"',
          'text="Thank you for your inquiry"',
          'text="We will contact you soon"',
        ];

        for (const indicator of successIndicators) {
          try {
            const element = await page.$(indicator);
            if (element) {
              return {
                success: true,
                message: "Contact form submitted successfully",
              };
            }
          } catch {
            // Continue checking other indicators
          }
        }

        // Check if we're still on the same page (might indicate success)
        const currentUrl = page.url();
        if (
          currentUrl.includes("thank") ||
          currentUrl.includes("complete") ||
          currentUrl.includes("success")
        ) {
          return {
            success: true,
            message:
              "Contact form submitted successfully (redirected to success page)",
          };
        }

        return {
          success: true,
          message: "Form submitted (success status uncertain)",
        };
    } catch {
        console.error("Error submitting form");
        return {
          success: false,
          message: "Failed to submit form",
        };
    }
  }

  /**
   * Cleanup browser resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
        try {
          await this.browser.close();
        } catch {
          console.warn("Error closing browser");
        }
        this.browser = null;
    }
  }
}
