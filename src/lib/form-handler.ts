// import { Page } from "puppeteer";
import {
  ContactForm,
  FormField,
  AdvertisementContent,
  CaptchaChallenge,
} from "@/types";
import { FreeCaptchaSolver } from "./free-captcha-solver";

class FormHandler {
  /**
   * Fill a form with advertisement content
   */
  async fillForm(
    page: Page,
    form: ContactForm,
    content: AdvertisementContent
  ): Promise<boolean> {
    try {
        console.log(`Filling form: ${form.id} on ${form.url}`);

        // Navigate to the form page
        await page.goto(form.url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // Wait for page to load
        await new Promise((res) => setTimeout(res, 2000));

        // Fill each form field
        for (const field of form.fields) {
          await this.fillField(page, field, content);
        }

        // Check for CAPTCHA and solve if enabled
        const captcha = await this.detectCaptcha(page);
        if (captcha) {
          console.log(`CAPTCHA detected: ${captcha.type}`);

          console.log("Attempting to solve CAPTCHA...");

          // Use FREE CAPTCHA solver
          const freeCaptchaSolver = new FreeCaptchaSolver(page);
          const solution = await freeCaptchaSolver.solve();

          if (solution.success) {
            console.log(`✅ CAPTCHA solved using ${solution.method}!`);
            return true;
          } else {
            console.log(`❌ CAPTCHA solving failed: ${solution.error}`);
            return false;
          }
        }

        return true;
    } catch (error) {
        console.error(`Error filling form ${form.id}:`, error);
        return false;
    }
  }

  /**
   * Fill a single form field
   */
  private async fillField(
    page: Page,
    field: FormField,
    content: AdvertisementContent
  ): Promise<void> {
    try {
        const value = this.getFieldValue(field, content);

        if (!value) {
          console.log(`No value for field: ${field.name}`);
          return;
        }

        // Wait for field to be available
        await page.waitForSelector(field.selector, { timeout: 5000 });

        // Clear existing value
        await page.evaluate((selector) => {
          const element = document.querySelector(selector) as
            | HTMLInputElement
            | HTMLTextAreaElement;
          if (element) {
            element.value = "";
          }
        }, field.selector);

        // Fill the field based on its type
        switch (field.type) {
          case "text":
          case "email":
            await page.type(field.selector, value, { delay: 100 });
            break;

          case "textarea":
            await page.type(field.selector, value, { delay: 50 });
            break;

          case "select":
            await page.select(field.selector, value);
            break;

          case "checkbox":
            if (value === "true" || value === "1") {
              await page.evaluate((selector) => {
                const el = document.querySelector(selector) as HTMLInputElement;
                if (el && !el.checked) el.checked = true;
              }, field.selector);
            }
            break;

          case "radio":
            await page.click(field.selector);
            break;
        }

        console.log(`Filled field ${field.name} with: ${value}`);
    } catch (error) {
        console.warn(`Error filling field ${field.name}:`, error);
    }
  }

  /**
   * Get appropriate value for a field based on advertisement content
   */
  private getFieldValue(
    field: FormField,
    content: AdvertisementContent
  ): string {
    const fieldName = field.name.toLowerCase();
    const placeholder = field.placeholder?.toLowerCase() || "";

    // Name fields
    if (
        fieldName.includes("name") ||
        fieldName.includes("fullname") ||
        placeholder.includes("name") ||
        placeholder.includes("full name")
    ) {
        return content.name;
    }

    // Email fields
    if (
        fieldName.includes("email") ||
        fieldName.includes("e-mail") ||
        placeholder.includes("email") ||
        placeholder.includes("e-mail")
    ) {
        return content.email;
    }

    // Phone fields
    if (
        fieldName.includes("phone") ||
        fieldName.includes("tel") ||
        placeholder.includes("phone") ||
        placeholder.includes("telephone")
    ) {
        return content.phone || "";
    }

    // Company fields
    if (
        fieldName.includes("company") ||
        fieldName.includes("organization") ||
        placeholder.includes("company") ||
        placeholder.includes("organization")
    ) {
        return content.company || "";
    }

    // Subject fields
    if (
        fieldName.includes("subject") ||
        fieldName.includes("topic") ||
        placeholder.includes("subject") ||
        placeholder.includes("topic")
    ) {
        return content.subject;
    }

    // Message fields
    if (
        fieldName.includes("message") ||
        fieldName.includes("comment") ||
        fieldName.includes("description") ||
        fieldName.includes("content") ||
        placeholder.includes("message") ||
        placeholder.includes("comment") ||
        placeholder.includes("description") ||
        placeholder.includes("content")
    ) {
        return content.message;
    }

    // Website fields
    if (
        fieldName.includes("website") ||
        fieldName.includes("url") ||
        placeholder.includes("website") ||
        placeholder.includes("url")
    ) {
        return content.website || "";
    }

    // Default values for common fields
    const defaultValues: { [key: string]: string } = {
        firstname: content.name.split(" ")[0] || content.name,
        lastname: content.name.split(" ").slice(1).join(" ") || "",
        fname: content.name.split(" ")[0] || content.name,
        lname: content.name.split(" ").slice(1).join(" ") || "",
        first_name: content.name.split(" ")[0] || content.name,
        last_name: content.name.split(" ").slice(1).join(" ") || "",
    };

    return defaultValues[fieldName] || "";
  }

  /**
   * Detect CAPTCHA on the page
   */
  private async detectCaptcha(page: Page): Promise<CaptchaChallenge | null> {
    try {
        // Check for reCAPTCHA
        const recaptcha = await page.evaluate(() => {
          // Look for reCAPTCHA elements
          const recaptchaElements = document.querySelectorAll(
            '.g-recaptcha, [data-sitekey], iframe[src*="recaptcha"]'
          );
          if (recaptchaElements.length > 0) {
            console.log("reCAPTCHA elements found:", recaptchaElements.length);
            return true;
          }

          // Look for reCAPTCHA scripts
          const recaptchaScripts = document.querySelectorAll(
            'script[src*="recaptcha"]'
          );
          if (recaptchaScripts.length > 0) {
            console.log("reCAPTCHA scripts found:", recaptchaScripts.length);
            return true;
          }

          // Look for reCAPTCHA in page content
          const pageText = document.body.textContent || "";
          if (
            pageText.includes("recaptcha") ||
            pageText.includes("g-recaptcha")
          ) {
            console.log("reCAPTCHA found in page content");
            return true;
          }

          return false;
        });

        if (recaptcha) {
          const siteKey = await this.extractRecaptchaSiteKey(page);
          console.log("reCAPTCHA detected with site key:", siteKey);
          return {
            type: "recaptcha",
            selector: 'iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey]',
            siteKey,
          };
        }

        // Check for hCaptcha
        const hcaptcha = await page.evaluate(() => {
          const hcaptchaElements = document.querySelectorAll(
            '.h-captcha, iframe[src*="hcaptcha"]'
          );
          if (hcaptchaElements.length > 0) {
            console.log("hCaptcha elements found:", hcaptchaElements.length);
            return true;
          }

          const hcaptchaScripts = document.querySelectorAll(
            'script[src*="hcaptcha"]'
          );
          if (hcaptchaScripts.length > 0) {
            console.log("hCaptcha scripts found:", hcaptchaScripts.length);
            return true;
          }

          return false;
        });

        if (hcaptcha) {
          const siteKey = await this.extractHcaptchaSiteKey(page);
          console.log("hCaptcha detected with site key:", siteKey);
          return {
            type: "hcaptcha",
            selector: 'iframe[src*="hcaptcha"], .h-captcha',
            siteKey,
          };
        }

        // Check for simple image CAPTCHA
        const imageCaptcha = await page.evaluate(() => {
          const imageCaptchaElements = document.querySelectorAll(
            'img[src*="captcha"], img[alt*="captcha"]'
          );
          if (imageCaptchaElements.length > 0) {
            console.log(
              "Image CAPTCHA elements found:",
              imageCaptchaElements.length
            );
            return true;
          }
          return false;
        });

        if (imageCaptcha) {
          console.log("Image CAPTCHA detected");
          return {
            type: "image",
            selector: 'img[src*="captcha"], img[alt*="captcha"]',
          };
        }

        // Check for simple text CAPTCHA
        const textCaptcha = await page.evaluate(() => {
          const textCaptchaElements = document.querySelectorAll(
            'input[name*="captcha"], input[id*="captcha"]'
          );
          if (textCaptchaElements.length > 0) {
            console.log(
              "Text CAPTCHA elements found:",
              textCaptchaElements.length
            );
            return true;
          }
          return false;
        });

        if (textCaptcha) {
          console.log("Text CAPTCHA detected");
          return {
            type: "simple",
            selector: 'input[name*="captcha"], input[id*="captcha"]',
          };
        }

        console.log("No CAPTCHA detected");
        return null;
    } catch (error) {
        console.warn("Error detecting CAPTCHA:", error);
        return null;
    }
  }

  /**
   * Extract reCAPTCHA site key
   */
  private async extractRecaptchaSiteKey(
    page: Page
  ): Promise<string | undefined> {
    try {
        const siteKey = await page.evaluate(() => {
          // Method 1: Look for data-sitekey attribute on reCAPTCHA elements
          const recaptchaElement = document.querySelector(
            ".g-recaptcha, [data-sitekey]"
          );
          if (recaptchaElement) {
            const dataSiteKey = recaptchaElement.getAttribute("data-sitekey");
            if (dataSiteKey) {
              console.log(
                "Found reCAPTCHA site key in data-sitekey:",
                dataSiteKey
              );
              return dataSiteKey;
            }
          }

          // Method 2: Look for reCAPTCHA iframe and extract site key from URL
          const recaptchaIframes = document.querySelectorAll(
            'iframe[src*="recaptcha"]'
          );
          for (const iframe of recaptchaIframes) {
            const src = iframe.getAttribute("src");
            if (src) {
              // Extract site key from iframe URL
              const patterns = [
                /k=([^&]+)/, // k=SITE_KEY
                /sitekey=([^&]+)/, // sitekey=SITE_KEY
                /render=([^&]+)/, // render=SITE_KEY
              ];

              for (const pattern of patterns) {
                const match = src.match(pattern);
                if (match && match[1]) {
                  console.log(
                    "Found reCAPTCHA site key in iframe URL:",
                    match[1]
                  );
                  return match[1];
                }
              }
            }
          }

          // Method 3: Look for reCAPTCHA script with site key in URL
          const scripts = document.querySelectorAll('script[src*="recaptcha"]');
          for (const script of scripts) {
            const src = script.getAttribute("src");
            if (src) {
              // Try different patterns for site key in URL
              const patterns = [
                /k=([^&]+)/, // google.com/recaptcha/api.js?k=SITE_KEY
                /sitekey=([^&]+)/, // Alternative pattern
                /render=([^&]+)/, // Another pattern
              ];

              for (const pattern of patterns) {
                const match = src.match(pattern);
                if (match && match[1]) {
                  console.log(
                    "Found reCAPTCHA site key in script URL:",
                    match[1]
                  );
                  return match[1];
                }
              }
            }
          }

          // Method 4: Look for inline reCAPTCHA configuration
          const inlineScripts = document.querySelectorAll("script:not([src])");
          for (const script of inlineScripts) {
            const content = script.textContent || "";
            const patterns = [
              /grecaptcha\.render\([^,]+,\s*{\s*sitekey\s*:\s*['"]([^'"]+)['"]/,
              /sitekey\s*:\s*['"]([^'"]+)['"]/,
              /data-sitekey\s*=\s*['"]([^'"]+)['"]/,
            ];

            for (const pattern of patterns) {
              const match = content.match(pattern);
              if (match && match[1]) {
                console.log(
                  "Found reCAPTCHA site key in inline script:",
                  match[1]
                );
                return match[1];
              }
            }
          }

          // Method 5: Look for any element with reCAPTCHA site key
          const allElements = document.querySelectorAll("*");
          for (const element of allElements) {
            const attributes = [
              "data-sitekey",
              "sitekey",
              "data-recaptcha-sitekey",
            ];
            for (const attr of attributes) {
              const value = element.getAttribute(attr);
              if (value && value.length > 20) {
                // reCAPTCHA site keys are typically long
                console.log("Found reCAPTCHA site key in attribute:", value);
                return value;
              }
            }
          }

          console.log("No reCAPTCHA site key found");
          return undefined;
        });

        console.log("Extracted reCAPTCHA site key:", siteKey);
        return siteKey;
    } catch (error) {
        console.error("Error extracting reCAPTCHA site key:", error);
        return undefined;
    }
  }

  /**
   * Extract hCaptcha site key
   */
  private async extractHcaptchaSiteKey(
    page: Page
  ): Promise<string | undefined> {
    try {
        const siteKey = await page.evaluate(() => {
          const script = document.querySelector('script[src*="hcaptcha"]');
          if (script) {
            const src = script.getAttribute("src");
            const match = src?.match(/sitekey=([^&]+)/);
            return match?.[1];
          }
          return undefined;
        });
        return siteKey;
    } catch {
        return undefined;
    }
  }

  /**
   * Apply CAPTCHA solution to the page
   */
  private async applyCaptchaSolution(
    page: Page,
    captcha: CaptchaChallenge,
    solution: string
  ): Promise<void> {
    try {
        switch (captcha.type) {
          case "recaptcha":
            await this.applyRecaptchaSolution(page, solution);
            break;
          case "hcaptcha":
            await this.applyHcaptchaSolution(page, solution);
            break;
          case "image":
          case "simple":
            await this.applyTextCaptchaSolution(page, captcha.selector, solution);
            break;
        }
    } catch (error) {
        console.error("Error applying CAPTCHA solution:", error);
        throw error;
    }
  }

  /**
   * Apply reCAPTCHA solution
   */
  private async applyRecaptchaSolution(
    page: Page,
    solution: string
  ): Promise<void> {
    await page.evaluate((solution) => {
        // Set the reCAPTCHA response in various possible field names
        const possibleFieldNames = [
          "g-recaptcha-response",
          "smf-recaptcha-response",
          "recaptcha-response",
          "captcha-response",
        ];

        for (const fieldName of possibleFieldNames) {
          const textarea = document.querySelector(
            `textarea[name="${fieldName}"], input[name="${fieldName}"]`
          ) as HTMLTextAreaElement | HTMLInputElement;

          if (textarea) {
            textarea.value = solution;
            textarea.style.display = "block";
            console.log(`Set reCAPTCHA response in field: ${fieldName}`);
          }
        }

        // Also try to set it in any hidden input that might contain 'recaptcha' in the name
        const allInputs = document.querySelectorAll('input[type="hidden"]');
        for (const input of allInputs) {
          const name = input.getAttribute("name") || "";
          if (
            name.toLowerCase().includes("recaptcha") ||
            name.toLowerCase().includes("captcha")
          ) {
            (input as HTMLInputElement).value = solution;
            console.log(`Set reCAPTCHA response in hidden field: ${name}`);
          }
        }

        // Trigger reCAPTCHA callback if it exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).grecaptcha) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).grecaptcha.getResponse = () => solution;

          // Try to trigger the callback
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).grecaptcha.ready) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).grecaptcha.ready(() => {
                console.log("reCAPTCHA ready callback triggered");
              });
            }
          } catch (error) {
            console.log("Could not trigger reCAPTCHA ready callback:", error);
          }
        }

        // Dispatch change events to trigger any listeners
        const event = new Event("change", { bubbles: true });
        document
          .querySelectorAll(
            'input[name*="recaptcha"], textarea[name*="recaptcha"]'
          )
          .forEach((el) => {
            el.dispatchEvent(event);
          });
    }, solution);
  }

  /**
   * Apply hCaptcha solution
   */
  private async applyHcaptchaSolution(
    page: Page,
    solution: string
  ): Promise<void> {
    await page.evaluate((solution) => {
        // Set the hCaptcha response
        const textarea = document.querySelector(
          'textarea[name="h-captcha-response"]'
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = solution;
          textarea.style.display = "block";
        }
    }, solution);
  }

  /**
   * Apply text CAPTCHA solution
   */
  private async applyTextCaptchaSolution(
    page: Page,
    selector: string,
    solution: string
  ): Promise<void> {
    await page.type(selector, solution);
  }

  /**
   * Submit a form
   */
  async submitForm(page: Page, form: ContactForm): Promise<boolean> {
    try {
        console.log(`Submitting form: ${form.id}`);

        // Find submit button
        const submitSelectors = [
          'input[type="submit"]',
          'button[type="submit"]',
          'button:contains("Submit")',
          'button:contains("Send")',
          'button:contains("Contact")',
          'input[value*="Submit"]',
          'input[value*="Send"]',
          'input[value*="Contact"]',
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
          submitButton = await page.$(selector);
          if (submitButton) break;
        }

        if (!submitButton) {
          // Try to find any button that might be a submit button
          const buttons = await page.$$('button, input[type="button"]');
          for (const button of buttons) {
            const text = await button.evaluate(
              (el) => el.textContent?.toLowerCase() || ""
            );
            if (
              text.includes("submit") ||
              text.includes("send") ||
              text.includes("contact")
            ) {
              submitButton = button;
              break;
            }
          }
        }

        if (submitButton) {
          // Click submit button
          await submitButton.click();

          // Wait for submission to complete
          await new Promise((res) => setTimeout(res, 3000));

          // Check if submission was successful
          const success = await this.checkSubmissionSuccess(page);

          if (success) {
            console.log(`Form submitted successfully: ${form.id}`);
            return true;
          } else {
            console.log(`Form submission may have failed: ${form.id}`);
            return false;
          }
        } else {
          console.log(`No submit button found for form: ${form.id}`);
          return false;
        }
    } catch (error) {
        console.error(`Error submitting form ${form.id}:`, error);
        return false;
    }
  }

  /**
   * Check if form submission was successful
   */
  private async checkSubmissionSuccess(page: Page): Promise<boolean> {
    try {
        // Check for success indicators
        const successIndicators = [
          "thank you",
          "success",
          "submitted",
          "sent",
          "received",
          "confirmation",
        ];

        const pageText = await page.evaluate(
          () => document.body.textContent?.toLowerCase() || ""
        );

        // Check if any success indicator is present
        const hasSuccessIndicator = successIndicators.some((indicator) =>
          pageText.includes(indicator)
        );

        // Check for error indicators
        const errorIndicators = [
          "error",
          "failed",
          "invalid",
          "required",
          "missing",
        ];

        const hasErrorIndicator = errorIndicators.some((indicator) =>
          pageText.includes(indicator)
        );

        // Check URL changes (some forms redirect on success)
        const currentUrl = page.url();
        const hasUrlChanged =
          !currentUrl.includes("contact") && !currentUrl.includes("form");

        return hasSuccessIndicator || hasUrlChanged || !hasErrorIndicator;
    } catch (error) {
        console.warn("Error checking submission success:", error);
        return true; // Assume success if we can't determine
    }
  }

  /**
   * Process a form (fill and submit)
   */
  async processForm(
    page: Page,
    form: ContactForm,
    content: AdvertisementContent
  ): Promise<{
    success: boolean;
    error?: string;
    captchaDetected: boolean;
  }> {
    try {
        // Fill the form
        const filled = await this.fillForm(page, form, content);

        if (!filled) {
          return {
            success: false,
            error: "Failed to fill form",
            captchaDetected: true,
          };
        }

        // Submit the form
        const submitted = await this.submitForm(page, form);

        return {
          success: submitted,
          captchaDetected: false,
        };
    } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          captchaDetected: false,
        };
    }
  }
}

// Export singleton instance
export const formHandler = new FormHandler();
