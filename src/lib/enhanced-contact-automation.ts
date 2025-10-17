// import puppeteer, { Browser, Page } from "puppeteer";

export interface EnhancedContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  company?: string;
  position?: string;
  department?: string;
  industry?: string;
  address?: string;
  website?: string;
  // Additional fields for different website types
  destination?: string;
  travelDates?: string;
  budget?: string;
  numberOfTravelers?: string;
}

export interface FormSubmissionData {
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  selector: string;
  timestamp: Date;
}

export interface EnhancedContactResult {
  success: boolean;
  message: string;
  contactPageUrl?: string;
  formSubmitted?: boolean;
  captchaSolved?: boolean;
  error?: string;
  timestamp: Date;
  // Enhanced data capture
  formDataSent?: FormSubmissionData[];
  pageTitle?: string;
  pageUrl?: string;
  formElements?: {
    totalInputs: number;
    totalTextareas: number;
    totalSelects: number;
    totalCheckboxes: number;
    totalRadioButtons: number;
  };
  submissionResponse?: {
    statusCode?: number;
    responseText?: string;
    redirectUrl?: string;
    successIndicators?: string[];
  };
  screenshots?: {
    beforeSubmission?: string;
    afterSubmission?: string;
  };
}

export class EnhancedContactAutomation {
  private browser: Browser | null = null;
  private formDataSent: FormSubmissionData[] = [];

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

    // Enable request/response interception
    await page.setRequestInterception(true);
    page.on("request", (request) => {
        console.log(`📤 Request: ${request.method()} ${request.url()}`);
        request.continue();
    });

    page.on("response", (response) => {
        console.log(`📥 Response: ${response.status()} ${response.url()}`);
    });

    return page;
  }

  /**
   * Send a contact message with enhanced data capture
   */
  async sendContactMessage(
    websiteUrl: string,
    request: EnhancedContactRequest
  ): Promise<EnhancedContactResult> {
    const startTime = new Date();
    this.formDataSent = [];

    try {
        console.log(`🚀 Starting enhanced contact automation for: ${websiteUrl}`);

        // Step 1: Find contact page
        const contactPageUrl = await this.findContactPage(websiteUrl);
        if (!contactPageUrl) {
          return {
            success: false,
            message: "Contact page not found",
            timestamp: startTime,
          };
        }

        console.log("📍 Contact page found:", contactPageUrl);

        // Step 2: Prepare form data
        const formData = this.prepareFormData(request);

        // Step 3: Submit contact form with enhanced monitoring
        const submissionResult = await this.submitContactFormWithMonitoring(
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
          formDataSent: this.formDataSent,
          pageTitle: submissionResult.pageTitle,
          pageUrl: submissionResult.pageUrl,
          formElements: submissionResult.formElements,
          submissionResponse: submissionResult.submissionResponse,
          screenshots: submissionResult.screenshots,
        };
    } catch (error) {
        console.error("❌ Error in enhanced contact automation:", error);
        return {
          success: false,
          message: "Failed to send contact message",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: startTime,
          formDataSent: this.formDataSent,
        };
    } finally {
        await this.cleanup();
    }
  }

  /**
   * Find the contact page
   */
  private async findContactPage(websiteUrl: string): Promise<string | null> {
    try {
        const browser = await this.initBrowser();
        const page = await this.createPage(browser);

        await page.goto(websiteUrl, { waitUntil: "networkidle2" });

        // Look for contact links
        const contactSelectors = [
          'a[href*="contact"]',
          'a[href*="お問い合わせ"]',
          'a[href*="Contact"]',
          'a:contains("Contact")',
          'a:contains("お問い合わせ")',
          'a:contains("問い合わせ")',
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
                  : new URL(contactLink.href, websiteUrl).href;

                console.log("🔗 Found contact link:", fullUrl);
                return fullUrl;
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ Failed to find contact links with selector: ${selector}`,
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
          console.log("📋 Found forms on main page:", forms);
          return websiteUrl;
        }

        return null;
    } catch (error) {
        console.error("❌ Error finding contact page:", error);
        return null;
    }
  }

  /**
   * Prepare form data for submission
   */
  private prepareFormData(
    request: EnhancedContactRequest
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
        subject: "Inquiry",
        title: "Inquiry",

        // Business-specific fields
        company: request.company || "",
        business_name: request.company || "",
        position: request.position || "",
        department: request.department || "",
        industry: request.industry || "",
        address: request.address || "",
        website: request.website || "",
        url: request.website || "",

        // Japanese form fields
        会社名: request.company || "",
        企業名: request.company || "",
        法人名: request.company || "",
        部署: request.department || "",
        部門: request.department || "",
        役職: request.position || "",
        業種: request.industry || "",
        担当者名: request.name,
        氏名: request.name,
        名前: request.name,
        姓: request.name.split(" ")[0] || request.name,
        名: request.name.split(" ")[1] || "",
        メールアドレス: request.email,
        メール: request.email,
        電話番号: request.phone || "",
        TEL: request.phone || "",
        電話: request.phone || "",
        住所: request.address || "",
        URL: request.website || "",
        ホームページ: request.website || "",
        件名: "お問い合わせ",
        お問い合わせ内容: request.message,
        内容: request.message,
        お問い合わせ: request.message,

        // Travel-specific fields
        destination: request.destination || "",
        travel_dates: request.travelDates || "",
        dates: request.travelDates || "",
        budget: request.budget || "",
        number_of_travelers: request.numberOfTravelers || "",
        travelers: request.numberOfTravelers || "",
        guests: request.numberOfTravelers || "",
        adults: request.numberOfTravelers || "",
        beach_destination: request.destination || "",
        vacation_type: "Beach Vacation",
        accommodation_type: "Beachfront",
        preferred_location: request.destination || "",
        special_requests: request.message,
        inquiry_type: "Vacation Planning",
    };
  }

  /**
   * Submit contact form with enhanced monitoring
   */
  private async submitContactFormWithMonitoring(
    contactPageUrl: string,
    formData: Record<string, string>
  ): Promise<{
    success: boolean;
    message: string;
    captchaSolved?: boolean;
    pageTitle?: string;
    pageUrl?: string;
    formElements?: {
        totalInputs: number;
        totalTextareas: number;
        totalSelects: number;
        totalCheckboxes: number;
        totalRadioButtons: number;
    };
    submissionResponse?: {
        statusCode?: number;
        responseText?: string;
        redirectUrl?: string;
        successIndicators?: string[];
    };
    screenshots?: {
        beforeSubmission?: string;
        afterSubmission?: string;
    };
  }> {
    try {
        const browser = await this.initBrowser();
        const page = await this.createPage(browser);

        await page.goto(contactPageUrl, { waitUntil: "networkidle2" });

        // Capture page info
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`📄 Page Title: ${pageTitle}`);
        console.log(`🌐 Page URL: ${pageUrl}`);

        // Analyze form elements
        const formElements = await this.analyzeFormElements(page);

        // Take screenshot before submission
        const beforeScreenshot = await page.screenshot({
          path: `screenshots/before_submission_${Date.now()}.png`,
          fullPage: true,
        });

        // Check for CAPTCHA
        const captchaDetected = await this.checkForCaptcha(page);
        let captchaSolved = false;

        if (captchaDetected) {
          console.log("🤖 CAPTCHA detected, attempting to solve...");
          captchaSolved = await this.solveCaptcha(page);
        }

        // Fill form fields with detailed logging
        await this.fillFormFieldsWithLogging(page, formData);

        // Submit form with response monitoring
        const submitResult = await this.submitFormWithMonitoring(page);

        // Take screenshot after submission
        const afterScreenshot = await page.screenshot({
          path: `screenshots/after_submission_${Date.now()}.png`,
          fullPage: true,
        });

        return {
          success: submitResult.success,
          message: submitResult.message,
          captchaSolved,
          pageTitle,
          pageUrl,
          formElements,
          submissionResponse: submitResult.response,
          screenshots: {
            beforeSubmission: beforeScreenshot.toString(),
            afterSubmission: afterScreenshot.toString(),
          },
        };
    } catch (error) {
        console.error("❌ Error submitting contact form:", error);
        return {
          success: false,
          message: "Failed to submit contact form",
        };
    }
  }

  /**
   * Analyze form elements on the page
   */
  private async analyzeFormElements(page: Page): Promise<{
    totalInputs: number;
    totalTextareas: number;
    totalSelects: number;
    totalCheckboxes: number;
    totalRadioButtons: number;
  }> {
    try {
        const formAnalysis = await page.evaluate(() => {
          const inputs = document.querySelectorAll("input");
          const textareas = document.querySelectorAll("textarea");
          const selects = document.querySelectorAll("select");
          const checkboxes = document.querySelectorAll('input[type="checkbox"]');
          const radioButtons = document.querySelectorAll('input[type="radio"]');

          return {
            totalInputs: inputs.length,
            totalTextareas: textareas.length,
            totalSelects: selects.length,
            totalCheckboxes: checkboxes.length,
            totalRadioButtons: radioButtons.length,
            inputTypes: Array.from(inputs).map((input) => ({
              type: input.type,
              name: input.name,
              id: input.id,
              placeholder: input.placeholder,
            })),
            textareaInfo: Array.from(textareas).map((textarea) => ({
              name: textarea.name,
              id: textarea.id,
              placeholder: textarea.placeholder,
            })),
          };
        });

        console.log("📊 Form Analysis:", formAnalysis);
        return formAnalysis;
    } catch (error) {
        console.warn("⚠️ Error analyzing form elements:", error);
        return {
          totalInputs: 0,
          totalTextareas: 0,
          totalSelects: 0,
          totalCheckboxes: 0,
          totalRadioButtons: 0,
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
            console.log(`🤖 CAPTCHA detected with selector: ${selector}`);
            return true;
          }
        }

        return false;
    } catch (error) {
        console.warn("⚠️ Error checking for CAPTCHA:", error);
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
              console.log("✅ Clicked CAPTCHA checkbox");

              // Wait for CAPTCHA to be solved
              await new Promise((resolve) => setTimeout(resolve, 5000));
              return true;
            }
          }
        }

        return false;
    } catch (error) {
        console.error("❌ Error solving CAPTCHA:", error);
        return false;
    }
  }

  /**
   * Fill form fields with detailed logging
   */
  private async fillFormFieldsWithLogging(
    page: Page,
    formData: Record<string, string>
  ): Promise<void> {
    console.log("📝 Starting form field filling...");

    // Track filled fields to prevent duplicates
    const filledFields = new Set<string>();

    // Fill text inputs with better selector prioritization
    for (const [fieldName, value] of Object.entries(formData)) {
        if (!value) continue;

        // Skip if already filled
        if (filledFields.has(fieldName)) {
          console.log(`⏭️ Skipping ${fieldName} - already filled`);
          continue;
        }

        // Prioritized selectors for better matching
        const selectors = [
          // Exact name matches first
          `input[name="${fieldName}"]`,
          `textarea[name="${fieldName}"]`,
          `select[name="${fieldName}"]`,

          // Exact id matches
          `input[id="${fieldName}"]`,
          `textarea[id="${fieldName}"]`,
          `select[id="${fieldName}"]`,

          // Placeholder matches
          `input[placeholder*="${fieldName}"]`,
          `textarea[placeholder*="${fieldName}"]`,

          // Common field name variations
          `input[name*="${fieldName.toLowerCase()}"]`,
          `textarea[name*="${fieldName.toLowerCase()}"]`,
          `input[id*="${fieldName.toLowerCase()}"]`,
          `textarea[id*="${fieldName.toLowerCase()}"]`,

          // Special field mappings
          ...(fieldName === "email"
            ? [
                'input[type="email"]',
                'input[name="e-mail"]',
                'input[name="mail"]',
              ]
            : []),
          ...(fieldName === "phone"
            ? [
                'input[type="tel"]',
                'input[name="telephone"]',
                'input[name="tel"]',
              ]
            : []),
          ...(fieldName === "message"
            ? [
                'textarea[name="content"]',
                'textarea[name="inquiry"]',
                'textarea[name="comments"]',
                'textarea[name="description"]',
              ]
            : []),
          ...(fieldName === "name"
            ? [
                'input[name="full_name"]',
                'input[name="first_name"]',
                'input[name="last_name"]',
              ]
            : []),
        ];

        let fieldFilled = false;

        for (const selector of selectors) {
          try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
              // Check if element is visible and not already filled
              const element = elements[0];
              const isVisible = await element.isVisible();
              const currentValue = await element.evaluate(
                (el: Element) =>
                  (el as HTMLInputElement | HTMLTextAreaElement).value || ""
              );

              if (isVisible && currentValue !== value) {
                // Clear the field first
                await element.click();
                await element.type(value);

                // Log the form data being sent
                const formDataEntry: FormSubmissionData = {
                  fieldName,
                  fieldValue: value,
                  fieldType: await element.evaluate((el) =>
                    el.tagName.toLowerCase()
                  ),
                  selector,
                  timestamp: new Date(),
                };
                this.formDataSent.push(formDataEntry);

                console.log(`✅ Filled field ${fieldName} with value: ${value}`);
                filledFields.add(fieldName);
                fieldFilled = true;
                break;
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ Failed to fill field ${fieldName} with selector ${selector}:`,
              error
            );
          }
        }

        if (!fieldFilled) {
          console.log(`⚠️ Could not fill field: ${fieldName}`);
        }
    }

    // Handle select dropdowns
    const selectElements = await page.$$("select");
    for (const select of selectElements) {
        try {
          const selectName = await select.evaluate(
            (el) => el.name || el.id || ""
          );
          if (!selectName || filledFields.has(selectName)) continue;

          const options = await select.$$eval("option", (opts) =>
            opts.map((opt) => ({
              value: opt.getAttribute("value"),
              text: opt.textContent?.trim(),
            }))
          );

          // Try to find matching option
          for (const [fieldName, value] of Object.entries(formData)) {
            if (!value || filledFields.has(fieldName)) continue;

            const matchingOption = options.find(
              (opt) =>
                opt.text?.toLowerCase().includes(fieldName.toLowerCase()) ||
                opt.text?.toLowerCase().includes(value.toLowerCase())
            );

            if (matchingOption) {
              await select.select(
                matchingOption.value || matchingOption.text || ""
              );

              // Log the form data being sent
              const formDataEntry: FormSubmissionData = {
                fieldName,
                fieldValue: matchingOption.text || "",
                fieldType: "select",
                selector: "select",
                timestamp: new Date(),
              };
              this.formDataSent.push(formDataEntry);

              console.log(
                `✅ Selected option for ${fieldName}: ${matchingOption.text}`
              );
              filledFields.add(fieldName);
              break;
            }
          }
        } catch (error) {
          console.warn("⚠️ Error handling select element:", error);
        }
    }

    // Handle checkboxes and radio buttons
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
        try {
          const isChecked = await checkbox.evaluate((el) => el.checked);
          if (!isChecked) {
            await checkbox.click();
            console.log("✅ Checked checkbox");
          }
        } catch (error) {
          console.warn("⚠️ Error handling checkbox:", error);
        }
    }

    const radioButtons = await page.$$('input[type="radio"]');
    for (const radio of radioButtons) {
        try {
          await radio.click();
          console.log("✅ Clicked radio button");
        } catch (error) {
          console.warn("⚠️ Error handling radio button:", error);
        }
    }

    console.log(`📊 Total form fields filled: ${this.formDataSent.length}`);
  }

  /**
   * Submit the form with enhanced monitoring
   */
  private async submitFormWithMonitoring(page: Page): Promise<{
    success: boolean;
    message: string;
    response?: {
        statusCode?: number;
        responseText?: string;
        redirectUrl?: string;
    };
  }> {
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
          'button:contains("送信")',
          'button:contains("お問い合わせ")',
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
          } catch (error) {
            console.warn(
              `⚠️ Failed to find submit button with selector: ${selector}`,
              error
            );
          }
        }

        if (!submitButton) {
          return {
            success: false,
            message: "Submit button not found",
          };
        }

        // Capture the current URL before submission
        // Click submit button
        await submitButton.click();
        console.log("🚀 Form submitted");

        // Wait for response
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Capture the URL after submission
        const afterUrl = page.url();

        // Check for success indicators
        const successIndicators = [
          'text="Thank you"',
          'text="Success"',
          'text="Message sent"',
          'text="Form submitted"',
          'text="Contact form submitted"',
          'text="Thank you for your inquiry"',
          'text="We will contact you soon"',
          'text="送信完了"',
          'text="送信されました"',
          'text="お問い合わせありがとうございます"',
        ];

        const foundIndicators: string[] = [];
        for (const indicator of successIndicators) {
          try {
            const element = await page.$(indicator);
            if (element) {
              foundIndicators.push(indicator);
            }
          } catch {
            // Continue checking other indicators
          }
        }

        if (foundIndicators.length > 0) {
          return {
            success: true,
            message: "Contact form submitted successfully",
            response: {
              statusCode: 200,
              responseText: "Success indicators found",
              redirectUrl: afterUrl,
            },
          };
        }

        // Check if we're still on the same page (might indicate success)
        if (
          afterUrl.includes("thank") ||
          afterUrl.includes("complete") ||
          afterUrl.includes("success")
        ) {
          return {
            success: true,
            message:
              "Contact form submitted successfully (redirected to success page)",
            response: {
              statusCode: 200,
              responseText: "Redirected to success page",
              redirectUrl: afterUrl,
            },
          };
        }

        return {
          success: true,
          message: "Form submitted (success status uncertain)",
          response: {
            statusCode: 200,
            responseText: "Form submitted",
            redirectUrl: afterUrl,
          },
        };
    } catch {
        console.error("❌ Error submitting form");
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
          console.warn("⚠️ Error closing browser");
        }
        this.browser = null;
    }
  }
}
