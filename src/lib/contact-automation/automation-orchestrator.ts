// import puppeteer, { Browser, Page } from "puppeteer";
import { CaptchaDetector } from "./captcha-detector";
import { FormDetector } from "./form-detector";
import { WebScraper } from "./web-scraper";
import type { CaptchaDetectionResult } from "./captcha-detector";
import type { FormAnalysisResult, ContactForm } from "./form-detector";
import { FreeCaptchaSolver } from "@/lib/free-captcha-solver";

export interface AutomationRequest {
  website: string;
  businessName: string;
  enableAutoSubmit?: boolean;
  customFormData?: Record<string, string>;
  timeout?: number;
}

export interface AutomationResult {
  success: boolean;
  contactPageUrl?: string;
  formsFound?: FormAnalysisResult;
  dataExtracted?: {
    emails: string[];
    phones: string[];
    contactLinks: string[];
    formsCount: number;
    contactFormsCount: number;
  };
  captchaDetected?: CaptchaDetectionResult;
  captchaStatus?: {
    detected: boolean;
    type?: string;
    solved: boolean;
    method?: string;
    error?: string;
  };
  antiBotProtection?: {
    hasProtection: boolean;
    protectionTypes: string[];
    confidence: number;
  };
  submissionResult?: {
    success: boolean;
    message: string;
    submittedForm?: ContactForm;
  };
  error?: string;
  timestamp: Date;
}

export interface PageAnalysisResult {
  captcha: CaptchaDetectionResult;
  forms: FormAnalysisResult;
  scrapedData: {
    emails: string[];
    phones: string[];
    contactLinks: string[];
    formsCount: number;
    contactFormsCount: number;
  };
  hasAntiBot: boolean;
  antiBotTypes: string[];
}

export class ContactAutomationOrchestrator {
  private browser: Browser | null = null;
  private isHeadless: boolean;
  private captchaDetector: CaptchaDetector;
  private formDetector: FormDetector;
  private webScraper: WebScraper;

  constructor() {
    this.isHeadless = process.env.HEADLESS_MODE === "true";
    this.captchaDetector = new CaptchaDetector();
    this.formDetector = new FormDetector();
    this.webScraper = new WebScraper();
  }

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<Browser> {
    try {
        // Ensure browser is healthy before proceeding
        await this.ensureHealthyBrowser();

        // Check if existing browser is still connected
        if (this.browser) {
          try {
            // Test if browser is still responsive
            const pages = await this.browser.pages();
            if (pages.length >= 0) {
              return this.browser;
            }
          } catch (error) {
            console.warn(
              "Existing browser connection lost, creating new instance:",
              error
            );
            this.browser = null;
          }
        }

        // Create new browser instance
        this.browser = await puppeteer.launch({
          headless: this.isHeadless,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-extensions",
            "--disable-plugins",
            "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ],
          timeout: parseInt(process.env.BROWSER_TIMEOUT || "30000"),
        });

        // Set up browser disconnect handler
        this.browser.on("disconnected", () => {
          console.warn("Browser disconnected unexpectedly");
          this.browser = null;
        });

        return this.browser;
    } catch (error) {
        console.error("Failed to initialize browser:", error);
        throw new Error(
          `Browser initialization failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
    }
  }

  /**
   * Safely create a new page with error handling
   */
  private async createPage(browser: Browser): Promise<Page> {
    try {
        const page = await browser.newPage();

        // Set up page error handlers
        page.on("error", (error) => {
          console.warn("Page error:", error);
        });

        page.on("pageerror", (error) => {
          console.warn("Page error:", error);
        });

        return page;
    } catch (error) {
        console.error("Failed to create page:", error);
        throw new Error(
          `Page creation failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
    }
  }

  /**
   * Main automation workflow
   */
  async automateContactDetection(
    request: AutomationRequest
  ): Promise<AutomationResult> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        browser = await this.initBrowser();
        page = await this.createPage(browser);

        console.log(
          `🚀 Starting automation for: ${request.businessName} (${request.website})`
        );

        // Set page options
        page.setDefaultTimeout(request.timeout || 30000);
        page.setDefaultNavigationTimeout(request.timeout || 30000);

        // Navigate to the website with better error handling
        try {
          await page.goto(request.website, {
            waitUntil: "networkidle2",
            timeout: request.timeout || 30000,
          });
        } catch (navigationError) {
          console.warn(
            `Navigation failed for ${request.website}:`,
            navigationError
          );

          // Try with a different wait strategy
          try {
            await page.goto(request.website, {
              waitUntil: "domcontentloaded",
              timeout: request.timeout || 30000,
            });
          } catch {
            throw new Error(
              `Failed to access website: ${request.website}. The site may be blocking automated access or temporarily unavailable.`
            );
          }
        }

        // Wait for page to load completely
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Step 1: Detect CAPTCHA and anti-bot protection
        console.log("🔍 Step 1: Detecting CAPTCHA and anti-bot protection...");
        const captchaResult = await this.captchaDetector.detectCaptcha(page);
        const antiBotResult = await this.captchaDetector.detectAntiBotProtection(
          page
        );

        // Track CAPTCHA solving status
        const captchaStatus = {
          detected: false,
          type: undefined as string | undefined,
          solved: false,
          method: undefined as string | undefined,
          error: undefined as string | undefined,
        };

        // If CAPTCHA is detected, try to solve it
        if (captchaResult.isCaptcha) {
          console.log(`🛡️ CAPTCHA detected: ${captchaResult.captchaType}`);
          captchaStatus.detected = true;
          captchaStatus.type = captchaResult.captchaType || undefined;

          const freeCaptchaSolver = new FreeCaptchaSolver(page);
          console.log(`🔓 Attempting FREE CAPTCHA solving...`);

          const captchaSolution = await freeCaptchaSolver.solve();

          if (captchaSolution.success) {
            console.log(`✅ CAPTCHA solved using ${captchaSolution.method}!`);
            captchaStatus.solved = true;
            captchaStatus.method = captchaSolution.method;
          } else {
            console.log(`❌ CAPTCHA solving failed: ${captchaSolution.error}`);
            captchaStatus.solved = false;
            captchaStatus.error = captchaSolution.error;
          }
        }

        // Step 2: Analyze forms
        console.log("🔍 Step 2: Analyzing forms...");
        const formsResult = await this.formDetector.analyzeForms(page);

        // Step 3: Scrape page data
        console.log("🔍 Step 3: Scraping page data...");
        const scrapingResult = await this.webScraper.scrapePage(page);

        // Step 4: Find contact page if not on one already
        console.log("🔍 Step 4: Finding contact page...");
        const contactPageUrl = await this.findContactPage(page, request.website);

        // Step 5: Handle form submission if enabled
        let submissionResult = undefined;
        if (request.enableAutoSubmit && formsResult.bestContactForm) {
          console.log("🔍 Step 5: Handling form submission...");
          submissionResult = await this.handleFormSubmission(
            page,
            formsResult.bestContactForm,
            request.businessName,
            request.customFormData
          );
        }

        // Compile results
        const result: AutomationResult = {
          success: true,
          contactPageUrl: contactPageUrl || undefined,
          formsFound: formsResult,
          dataExtracted: {
            emails: scrapingResult.data.emails,
            phones: scrapingResult.data.phones,
            contactLinks: scrapingResult.data.contactLinks,
            formsCount: formsResult.totalForms,
            contactFormsCount: formsResult.contactFormsCount,
          },
          captchaDetected: captchaResult,
          captchaStatus: captchaStatus,
          antiBotProtection: antiBotResult,
          submissionResult,
          timestamp: new Date(),
        };

        return result;
    } catch (error) {
        console.error("Error in contact automation:", error);

        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: new Date(),
        };
    } finally {
        // Clean up resources
        try {
          if (page) {
            await page.close();
          }
          // Don't close the browser here as it's reused across requests
          // Only close if there was a critical error
          if (browser && !browser.isConnected()) {
            await browser.close();
            this.browser = null;
          }
        } catch (cleanupError) {
          console.warn("Error during cleanup:", cleanupError);
        }
    }
  }

  /**
   * Analyze a single page comprehensively
   */
  async analyzePage(url: string): Promise<PageAnalysisResult> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Detect CAPTCHA
        const captcha = await this.captchaDetector.detectCaptcha(page);

        // If CAPTCHA is detected, try to solve it
        if (captcha.isCaptcha) {
          console.log(
            `🛡️ CAPTCHA detected during page analysis: ${captcha.captchaType}`
          );

          const freeCaptchaSolver = new FreeCaptchaSolver(page);
          console.log(`🔓 Attempting FREE CAPTCHA solving during analysis...`);

          const captchaSolution = await freeCaptchaSolver.solve();

          if (captchaSolution.success) {
            console.log(
              `✅ CAPTCHA solved during analysis using ${captchaSolution.method}!`
            );
          } else {
            console.log(
              `❌ CAPTCHA solving failed during analysis: ${captchaSolution.error}`
            );
          }
        }

        // Analyze forms
        const forms = await this.formDetector.analyzeForms(page);

        // Scrape data
        const scrapingResult = await this.webScraper.scrapePage(page);

        // Check anti-bot protection
        const antiBotResult = await this.captchaDetector.detectAntiBotProtection(
          page
        );

        return {
          captcha,
          forms,
          scrapedData: {
            emails: scrapingResult.data.emails,
            phones: scrapingResult.data.phones,
            contactLinks: scrapingResult.data.contactLinks,
            formsCount: forms.totalForms,
            contactFormsCount: forms.contactFormsCount,
          },
          hasAntiBot: antiBotResult.hasProtection,
          antiBotTypes: antiBotResult.protectionTypes,
        };
    } catch (error) {
        console.error("Error analyzing page:", error);
        throw error;
    } finally {
        await page.close();
    }
  }

  /**
   * Find contact page URL
   */
  private async findContactPage(
    page: Page,
    baseUrl: string
  ): Promise<string | null> {
    try {
        // Check if current page is already a contact page
        const currentUrl = page.url();
        const currentTitle = await page.title();

        if (this.isContactPage(currentUrl, currentTitle)) {
          return currentUrl;
        }

        // Look for contact links on the current page
        const contactLinks = await page.evaluate(() => {
          const contactKeywords = [
            "contact",
            "inquiry",
            "enquiry",
            "message",
            "feedback",
            "support",
            "help",
            "question",
            "comment",
            "suggestion",
            "complaint",
            "お問い合わせ",
            "連絡",
            "メッセージ",
            "サポート",
            "ヘルプ",
          ];

          const links = document.querySelectorAll("a[href]");
          const contactUrls: string[] = [];

          links.forEach((link) => {
            const href = (link as HTMLAnchorElement).href.toLowerCase();
            const text = link.textContent?.toLowerCase() || "";

            const isContactLink = contactKeywords.some(
              (keyword) => href.includes(keyword) || text.includes(keyword)
            );

            if (isContactLink) {
              contactUrls.push((link as HTMLAnchorElement).href);
            }
          });

          return [...new Set(contactUrls)];
        });

        console.log(
          `🔍 Found ${contactLinks.length} potential contact links:`,
          contactLinks
        );

        // Test contact links - prioritize external contact pages over the main site
        for (const link of contactLinks.slice(0, 5)) {
          // Limit to 5 links
          try {
            const response = await fetch(link, { method: "HEAD" });
            if (response.ok) {
              // Don't return the main website URL as a contact page
              if (link !== baseUrl && !link.startsWith(baseUrl + "/#")) {
                console.log(`✅ Found valid contact page: ${link}`);
                return link;
              }
            }
          } catch {
            // Continue to next link
          }
        }

        // Try common contact page patterns
        const commonPatterns = [
          "/contact",
          "/contact-us",
          "/contactus",
          "/inquiry",
          "/enquiry",
          "/お問い合わせ",
          "/連絡先",
          "/コンタクト",
          "/contacto",
          "/kontakt",
        ];

        for (const pattern of commonPatterns) {
          const testUrl = `${baseUrl}${pattern}`;
          try {
            const response = await fetch(testUrl, { method: "HEAD" });
            if (response.ok) {
              console.log(`✅ Found contact page via pattern: ${testUrl}`);
              return testUrl;
            }
          } catch {
            // Continue to next pattern
          }
        }

        console.log(`❌ No dedicated contact page found for: ${baseUrl}`);
        return null;
    } catch (error) {
        console.error("Error finding contact page:", error);
        return null;
    }
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmission(
    page: Page,
    form: ContactForm,
    businessName: string,
    customData?: Record<string, string>
  ): Promise<{
    success: boolean;
    message: string;
    submittedForm?: ContactForm;
  }> {
    try {
        console.log(`🚀 Starting form submission for: ${form.action}`);

        // Check for CAPTCHA before submission
        const captchaResult = await this.captchaDetector.detectCaptcha(page);
        if (captchaResult.isCaptcha) {
          console.log(`🛡️ CAPTCHA detected: ${captchaResult.captchaType}`);

          // Use FREE CAPTCHA solver instead of stopping
          const freeCaptchaSolver = new FreeCaptchaSolver(page);
          console.log(`🔓 Attempting FREE CAPTCHA solving...`);

          const captchaSolution = await freeCaptchaSolver.solve();

          if (captchaSolution.success) {
            console.log(`✅ CAPTCHA solved using ${captchaSolution.method}!`);
          } else {
            console.log(`❌ CAPTCHA solving failed: ${captchaSolution.error}`);
            return {
              success: false,
              message: `CAPTCHA solving failed: ${captchaSolution.error}`,
              submittedForm: form,
            };
          }
        }

        // Check for anti-bot protection
        const antiBotResult = await this.captchaDetector.detectAntiBotProtection(
          page
        );
        if (antiBotResult.hasProtection) {
          console.log(
            `❌ Anti-bot protection detected: ${antiBotResult.protectionTypes.join(
              ", "
            )}`
          );
          return {
            success: false,
            message: `Anti-bot protection detected (${antiBotResult.protectionTypes.join(
              ", "
            )}). Manual intervention required.`,
            submittedForm: form,
          };
        }

        // Prepare form data
        const formData =
          customData || this.formDetector.getDefaultContactData(businessName);

        console.log(`📝 Filling form with data:`, formData);

        // Fill the form
        const fillSuccess = await this.formDetector.fillForm(
          page,
          `#${form.id}`,
          formData
        );
        if (!fillSuccess) {
          console.log(`❌ Failed to fill form fields`);
          return {
            success: false,
            message:
              "Failed to fill form fields - form may be protected or have validation errors",
            submittedForm: form,
          };
        }

        console.log(`✅ Form filled successfully`);

        // Submit the form
        const submitSuccess = await this.formDetector.submitForm(
          page,
          `#${form.id}`
        );
        if (!submitSuccess) {
          console.log(`❌ Failed to submit form`);
          return {
            success: false,
            message:
              "Failed to submit form - submit button may be disabled or form may be protected",
            submittedForm: form,
          };
        }

        console.log(`✅ Form submitted, waiting for response...`);

        // Wait for submission response and page changes
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check if page URL changed (indicates successful submission)
        const currentUrl = page.url();
        const urlChanged = currentUrl !== form.action;

        // Check submission result with strict validation
        const submissionSuccess = await this.checkSubmissionSuccess(page);

        console.log(`🔍 Submission analysis:`, {
          urlChanged,
          submissionSuccess,
          currentUrl,
          formAction: form.action,
        });

        // Success conditions - must have BOTH URL change AND success indicators
        const isSuccess = submissionSuccess && urlChanged;

        if (isSuccess) {
          console.log(`✅ Form submission successful!`);
          return {
            success: true,
            message:
              "Form submitted successfully - message sent and confirmation received",
            submittedForm: form,
          };
        } else {
          console.log(`❌ Form submission failed or inconclusive`);
          let failureReason = "Form submission may have failed";

          if (!urlChanged) {
            failureReason += " - page did not redirect after submission";
          }
          if (!submissionSuccess) {
            failureReason += " - no success confirmation detected";
          }

          return {
            success: false,
            message: failureReason,
            submittedForm: form,
          };
        }
    } catch (error) {
        console.error("❌ Error handling form submission:", error);
        return {
          success: false,
          message: `Form submission error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          submittedForm: form,
        };
    }
  }

  /**
   * Check if current page is a contact page
   */
  private isContactPage(url: string, title: string): boolean {
    const contactKeywords = [
        "contact",
        "inquiry",
        "enquiry",
        "message",
        "feedback",
        "support",
        "help",
        "question",
        "comment",
        "suggestion",
        "complaint",
        "お問い合わせ",
        "連絡",
        "メッセージ",
        "サポート",
        "ヘルプ",
    ];

    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    return contactKeywords.some(
        (keyword) => urlLower.includes(keyword) || titleLower.includes(keyword)
    );
  }

  /**
   * Check if form submission was successful
   */
  private async checkSubmissionSuccess(page: Page): Promise<boolean> {
    try {
        const result = await page.evaluate(() => {
          // More strict success keywords - must be more specific
          const strictSuccessKeywords = [
            "thank you for your message",
            "message sent successfully",
            "form submitted successfully",
            "your message has been sent",
            "we have received your message",
            "submission successful",
            "message received",
            "form submitted",
            "送信完了",
            "メッセージを送信しました",
            "お問い合わせありがとうございます",
            "送信が完了しました",
          ];

          // More comprehensive error keywords
          const errorKeywords = [
            "error",
            "failed",
            "invalid",
            "required",
            "missing",
            "failed to send",
            "submission failed",
            "form error",
            "validation error",
            "please try again",
            "エラー",
            "失敗",
            "無効",
            "必須",
            "送信失敗",
            "エラーが発生しました",
            "送信に失敗しました",
          ];

          // Check for form validation errors
          const validationErrors = document.querySelectorAll(
            '.error, .invalid, [class*="error"], [class*="invalid"]'
          );
          const hasValidationErrors = validationErrors.length > 0;

          // Check for required field indicators
          const requiredFields = document.querySelectorAll(
            "input[required], textarea[required], select[required]"
          );
          const emptyRequiredFields = Array.from(requiredFields).filter(
            (field) => {
              const input = field as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement;
              return !input.value || input.value.trim() === "";
            }
          );
          const hasEmptyRequiredFields = emptyRequiredFields.length > 0;

          // Check page content
          const pageText = document.body.textContent?.toLowerCase() || "";
          const pageTitle = document.title?.toLowerCase() || "";

          // Check for success indicators
          const hasStrictSuccess = strictSuccessKeywords.some(
            (keyword) => pageText.includes(keyword) || pageTitle.includes(keyword)
          );

          // Check for error indicators
          const hasError = errorKeywords.some(
            (keyword) => pageText.includes(keyword) || pageTitle.includes(keyword)
          );

          // Check if we're still on the same form page (indicates submission didn't work)
          const currentUrl = window.location.href;
          const isStillOnFormPage =
            pageText.includes("contact") ||
            pageText.includes("form") ||
            currentUrl.includes("contact") ||
            currentUrl.includes("form");

          // Check for form elements still present (indicates submission didn't work)
          const formsStillPresent = document.querySelectorAll("form").length > 0;
          const submitButtonsStillPresent =
            document.querySelectorAll(
              'input[type="submit"], button[type="submit"]'
            ).length > 0;

          // Success conditions - ALL must be true
          const successConditions = [
            hasStrictSuccess, // Must have strict success message
            !hasError, // Must not have error messages
            !hasValidationErrors, // Must not have validation errors
            !hasEmptyRequiredFields, // Must not have empty required fields
            !isStillOnFormPage, // Must not still be on form page
            !formsStillPresent, // Must not have forms still present
            !submitButtonsStillPresent, // Must not have submit buttons still present
          ];

          // All conditions must be true for success
          const isSuccess = successConditions.every(
            (condition) => condition === true
          );

          console.log("Submission success check:", {
            hasStrictSuccess,
            hasError,
            hasValidationErrors,
            hasEmptyRequiredFields,
            isStillOnFormPage,
            formsStillPresent,
            submitButtonsStillPresent,
            isSuccess,
          });

          return isSuccess;
        });

        return result;
    } catch (error) {
        console.error("Error checking submission success:", error);
        return false;
    }
  }

  /**
   * Check if browser is healthy and reset if needed
   */
  private async ensureHealthyBrowser(): Promise<void> {
    if (!this.browser) {
        return;
    }

    try {
        // Test browser connectivity
        await this.browser.pages();
    } catch (error) {
        console.warn("Browser health check failed, resetting:", error);
        await this.cleanup();
    }
  }

  /**
   * Cleanup browser instance
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
        try {
          // Close all pages first
          const pages = await this.browser.pages();
          await Promise.all(pages.map((page) => page.close().catch(() => {})));

          // Then close browser
          await this.browser.close();
        } catch (error) {
          console.warn("Error during browser cleanup:", error);
        } finally {
          this.browser = null;
        }
    }
  }
}
