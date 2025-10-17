// import puppeteer, { Browser, Page } from "puppeteer";
import {
  WebsiteRequirementAnalyzer,
  WebsiteRequirement,
  CaptchaInfo,
} from "./website-requirement-analyzer";

export interface ResearchBasedContactRequest {
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
}

export interface ResearchBasedContactResult {
  success: boolean;
  message: string;
  websiteRequirements: WebsiteRequirement;
  formSubmitted: boolean;
  captchaDetected: boolean;
  validationErrors: string[];
  fieldMapping: FieldMapping[];
  submissionResponse?: string;
  screenshots: {
    before: string;
    after: string;
  };
  networkTraffic: NetworkRequest[];
  formDataSent: FormSubmissionData[];
}

export interface FieldMapping {
  requestedField: string;
  actualFieldName: string;
  fieldType: string;
  isRequired: boolean;
  validationRules: string[];
  filled: boolean;
  value: string;
}

export interface FormSubmissionData {
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  selector: string;
  timestamp: string;
  validationPassed: boolean;
}

export interface NetworkRequest {
  type: "request" | "response";
  url: string;
  method?: string;
  status?: number;
  timestamp: string;
}

export class ResearchBasedContactAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private analyzer: WebsiteRequirementAnalyzer;
  private networkTraffic: NetworkRequest[] = [];
  private formDataSent: FormSubmissionData[] = [];

  constructor() {
    this.analyzer = new WebsiteRequirementAnalyzer();
  }

  async initBrowser(): Promise<void> {
    this.browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async createPage(): Promise<void> {
    if (!this.browser) throw new Error("Browser not initialized");

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    await this.page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set up network monitoring
    await this.page.setRequestInterception(true);
    this.page.on("request", (request) => {
        this.networkTraffic.push({
          type: "request",
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
        console.log(`📤 Request: ${request.method()} ${request.url()}`);
        request.continue();
    });

    this.page.on("response", (response) => {
        this.networkTraffic.push({
          type: "response",
          url: response.url(),
          status: response.status(),
          timestamp: new Date().toISOString(),
        });
        console.log(`📥 Response: ${response.status()} ${response.url()}`);
    });
  }

  async sendContactMessage(
    url: string,
    request: ResearchBasedContactRequest
  ): Promise<ResearchBasedContactResult> {
    if (!this.page) throw new Error("Page not initialized");

    console.log("🔬 RESEARCH-BASED CONTACT AUTOMATION");
    console.log("=".repeat(50));

    try {
        // Step 1: Research website requirements
        console.log("📋 Step 1: Researching website requirements...");
        const websiteRequirements = await this.researchWebsiteRequirements(url);

        // Step 2: Analyze and map fields
        console.log("🗺️ Step 2: Analyzing field mappings...");
        const fieldMapping = await this.analyzeFieldMapping(
          request,
          websiteRequirements
        );

        // Step 3: Validate data against requirements
        console.log("✅ Step 3: Validating data against requirements...");
        const validationErrors = await this.validateData(
          request,
          websiteRequirements
        );

        if (validationErrors.length > 0) {
          console.log("❌ Validation errors found:", validationErrors);
          return {
            success: false,
            message: `Validation failed: ${validationErrors.join(", ")}`,
            websiteRequirements,
            formSubmitted: false,
            captchaDetected: websiteRequirements.captchaInfo.hasCaptcha,
            validationErrors,
            fieldMapping,
            screenshots: { before: "", after: "" },
            networkTraffic: this.networkTraffic,
            formDataSent: this.formDataSent,
          };
        }

        // Step 4: Fill form based on research
        console.log("📝 Step 4: Filling form based on research...");
        await this.fillFormBasedOnResearch(
          request,
          websiteRequirements,
          fieldMapping
        );

        // Step 5: Handle CAPTCHA if present
        console.log("🤖 Step 5: Handling CAPTCHA...");
        await this.handleCaptcha(websiteRequirements.captchaInfo);

        // Step 6: Submit form
        console.log("📤 Step 6: Submitting form...");
        const submitResult = await this.submitForm();

        // Step 7: Capture results
        const screenshots = await this.captureScreenshots();
        const submissionResponse = await this.getSubmissionResponse();

        return {
          success: submitResult.success,
          message: submitResult.message,
          websiteRequirements,
          formSubmitted: submitResult.success,
          captchaDetected: websiteRequirements.captchaInfo.hasCaptcha,
          validationErrors: [],
          fieldMapping,
          submissionResponse,
          screenshots,
          networkTraffic: this.networkTraffic,
          formDataSent: this.formDataSent,
        };
    } catch (error) {
        console.error("❌ Research-based contact automation failed:", error);
        return {
          success: false,
          message: `Automation failed: ${error}`,
          websiteRequirements: {} as WebsiteRequirement,
          formSubmitted: false,
          captchaDetected: false,
          validationErrors: [
            error instanceof Error ? error.message : String(error),
          ],
          fieldMapping: [],
          screenshots: { before: "", after: "" },
          networkTraffic: this.networkTraffic,
          formDataSent: this.formDataSent,
        };
    }
  }

  private async researchWebsiteRequirements(
    url: string
  ): Promise<WebsiteRequirement> {
    // Initialize analyzer
    await this.analyzer.initBrowser();
    await this.analyzer.createPage();

    // Analyze website
    const requirements = await this.analyzer.analyzeWebsite(url);

    // Cleanup analyzer
    await this.analyzer.cleanup();

    return requirements;
  }

  private async analyzeFieldMapping(
    request: ResearchBasedContactRequest,
    requirements: WebsiteRequirement
  ): Promise<FieldMapping[]> {
    const fieldMapping: FieldMapping[] = [];

    // Map each requested field to actual form fields
    const fieldMappings = [
        {
          requested: "name",
          possibleNames: [
            "name",
            "full_name",
            "first_name",
            "last_name",
            "your-name",
          ],
        },
        {
          requested: "email",
          possibleNames: ["email", "e-mail", "mail", "your-email"],
        },
        {
          requested: "phone",
          possibleNames: ["phone", "tel", "telephone", "your-tel"],
        },
        {
          requested: "message",
          possibleNames: [
            "message",
            "content",
            "inquiry",
            "comments",
            "your-message",
          ],
        },
        {
          requested: "company",
          possibleNames: ["company", "business_name", "your-company"],
        },
        {
          requested: "position",
          possibleNames: ["position", "title", "job_title"],
        },
        { requested: "department", possibleNames: ["department", "dept"] },
        { requested: "industry", possibleNames: ["industry", "business_type"] },
        { requested: "address", possibleNames: ["address", "location"] },
        { requested: "website", possibleNames: ["website", "url", "site"] },
    ];

    for (const mapping of fieldMappings) {
        const value =
          request[mapping.requested as keyof ResearchBasedContactRequest];
        if (!value) continue;

        // Find matching field in requirements
        const matchingField = requirements.fieldRequirements.find((field) =>
          mapping.possibleNames.some((name) =>
            field.fieldName.toLowerCase().includes(name.toLowerCase())
          )
        );

        if (matchingField) {
          fieldMapping.push({
            requestedField: mapping.requested,
            actualFieldName: matchingField.fieldName,
            fieldType: matchingField.fieldType,
            isRequired: matchingField.isRequired,
            validationRules: matchingField.validationRules,
            filled: false,
            value: value as string,
          });
        }
    }

    return fieldMapping;
  }

  private async validateData(
    request: ResearchBasedContactRequest,
    requirements: WebsiteRequirement
  ): Promise<string[]> {
    const errors: string[] = [];

    // Check required fields
    for (const requirement of requirements.fieldRequirements) {
        if (requirement.isRequired) {
          const value = this.getFieldValue(request, requirement.fieldName);
          if (!value) {
            errors.push(`Required field '${requirement.fieldName}' is missing`);
          }
        }
    }

    // Validate email format
    if (request.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(request.email)) {
          errors.push("Invalid email format");
        }
    }

    // Validate phone format
    if (request.phone) {
        const phoneRegex = /^[\+]?[0-9][\d]{0,15}$/;
        const cleanPhone = request.phone.replace(/[\s\-\(\)]/g, "");
        if (!phoneRegex.test(cleanPhone)) {
          errors.push("Invalid phone number format");
        }
    }

    // Check field length requirements
    for (const requirement of requirements.fieldRequirements) {
        const value = this.getFieldValue(request, requirement.fieldName);
        if (value) {
          if (requirement.minLength && value.length < requirement.minLength) {
            errors.push(
              `Field '${requirement.fieldName}' is too short (minimum ${requirement.minLength} characters)`
            );
          }
          if (requirement.maxLength && value.length > requirement.maxLength) {
            errors.push(
              `Field '${requirement.fieldName}' is too long (maximum ${requirement.maxLength} characters)`
            );
          }
        }
    }

    return errors;
  }

  private getFieldValue(
    request: ResearchBasedContactRequest,
    fieldName: string
  ): string | undefined {
    const fieldMappings: { [key: string]: keyof ResearchBasedContactRequest } =
        {
          name: "name",
          email: "email",
          phone: "phone",
          message: "message",
          company: "company",
          position: "position",
          department: "department",
          industry: "industry",
          address: "address",
          website: "website",
        };

    for (const [pattern, key] of Object.entries(fieldMappings)) {
        if (fieldName.toLowerCase().includes(pattern.toLowerCase())) {
          return request[key];
        }
    }

    return undefined;
  }

  private async fillFormBasedOnResearch(
    request: ResearchBasedContactRequest,
    requirements: WebsiteRequirement,
    fieldMapping: FieldMapping[]
  ): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    console.log("📝 Filling form based on research...");

    for (const mapping of fieldMapping) {
        try {
          // Find the field element
          const selectors = [
            `input[name="${mapping.actualFieldName}"]`,
            `textarea[name="${mapping.actualFieldName}"]`,
            `select[name="${mapping.actualFieldName}"]`,
            `input[id="${mapping.actualFieldName}"]`,
            `textarea[id="${mapping.actualFieldName}"]`,
            `select[id="${mapping.actualFieldName}"]`,
          ];

          let element = null;
          for (const selector of selectors) {
            element = await this.page.$(selector);
            if (element) break;
          }

          if (element) {
            // Clear and fill the field
            await element.click();
            await element.type(mapping.value);

            // Mark as filled
            mapping.filled = true;

            // Log the form data
            this.formDataSent.push({
              fieldName: mapping.actualFieldName,
              fieldValue: mapping.value,
              fieldType: mapping.fieldType,
              selector: selectors.find(() => element) || "",
              timestamp: new Date().toISOString(),
              validationPassed: true,
            });

            console.log(
              `✅ Filled ${
                mapping.actualFieldName
              } with: ${mapping.value.substring(0, 50)}...`
            );
          } else {
            console.log(`⚠️ Could not find field: ${mapping.actualFieldName}`);
          }
        } catch (error) {
          console.error(
            `❌ Error filling field ${mapping.actualFieldName}:`,
            error
          );
        }
    }
  }

  private async handleCaptcha(captchaInfo: CaptchaInfo): Promise<boolean> {
    if (!captchaInfo.hasCaptcha) {
        console.log("✅ No CAPTCHA detected");
        return true;
    }

    console.log(`🤖 CAPTCHA detected: ${captchaInfo.captchaType}`);

    // For now, just log the CAPTCHA info
    // In a real implementation, you would integrate with a CAPTCHA solving service
    console.log(`📋 CAPTCHA Selector: ${captchaInfo.captchaSelector}`);
    console.log(`📋 CAPTCHA Version: ${captchaInfo.captchaVersion}`);

    return false; // CAPTCHA not solved
  }

  private async submitForm(): Promise<{ success: boolean; message: string }> {
    if (!this.page) throw new Error("Page not initialized");

    try {
        // Find submit button
        const submitSelectors = [
          'input[type="submit"]',
          'button[type="submit"]',
          "button:not([type])",
          '[class*="submit"]',
          '[class*="send"]',
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
          submitButton = await this.page.$(selector);
          if (submitButton) break;
        }

        if (submitButton) {
          console.log("🚀 Submitting form...");
          await submitButton.click();

          // Wait for submission to complete
          await new Promise((resolve) => setTimeout(resolve, 3000));

          return { success: true, message: "Form submitted successfully" };
        } else {
          console.log("⚠️ No submit button found");
          return { success: false, message: "No submit button found" };
        }
    } catch (error) {
        console.error("❌ Error submitting form:", error);
        return { success: false, message: `Submit error: ${error}` };
    }
  }

  private async captureScreenshots(): Promise<{
    before: string;
    after: string;
  }> {
    if (!this.page) throw new Error("Page not initialized");

    const before = await this.page.screenshot({ encoding: "base64" });
    const after = await this.page.screenshot({ encoding: "base64" });

    return { before, after };
  }

  private async getSubmissionResponse(): Promise<string> {
    if (!this.page) throw new Error("Page not initialized");

    try {
        const response = await this.page.evaluate(() => {
          // Look for success/error messages
          const successSelectors = [
            ".success",
            ".thank",
            ".sent",
            ".received",
            '[class*="success"]',
            '[class*="thank"]',
          ];

          const errorSelectors = [
            ".error",
            ".failed",
            ".invalid",
            '[class*="error"]',
            '[class*="failed"]',
          ];

          for (const selector of successSelectors) {
            const element = document.querySelector(selector);
            if (element) return element.textContent || "Success message found";
          }

          for (const selector of errorSelectors) {
            const element = document.querySelector(selector);
            if (element) return element.textContent || "Error message found";
          }

          return "No specific response message found";
        });

        return response;
    } catch (error) {
        return `Error getting response: ${error}`;
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}
