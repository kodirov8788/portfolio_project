// import puppeteer, { Browser, Page } from "puppeteer";

export interface WebsiteRequirement {
  url: string;
  formStructure: FormStructure;
  fieldRequirements: FieldRequirement[];
  validationRules: ValidationRule[];
  captchaInfo: CaptchaInfo;
  submissionRequirements: SubmissionRequirement;
  pageInfo: PageInfo;
}

export interface FormStructure {
  totalForms: number;
  forms: FormInfo[];
  primaryForm: FormInfo | null;
}

export interface FormInfo {
  id: string;
  action: string;
  method: string;
  fields: FormField[];
  submitButton: SubmitButton | null;
}

export interface FormField {
  name: string;
  type: string;
  id: string;
  placeholder: string;
  required: boolean;
  validation: string[];
  options?: string[]; // For select fields
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface SubmitButton {
  text: string;
  type: string;
  selector: string;
}

export interface FieldRequirement {
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  validationRules: string[];
  expectedFormat?: string;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
}

export interface ValidationRule {
  fieldName: string;
  ruleType: "required" | "email" | "phone" | "length" | "pattern" | "custom";
  message: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface CaptchaInfo {
  hasCaptcha: boolean;
  captchaType?: "reCAPTCHA" | "hCaptcha" | "custom";
  captchaSelector?: string;
  captchaVersion?: string;
}

export interface SubmissionRequirement {
  requiresCaptcha: boolean;
  requiresJavaScript: boolean;
  requiresAjax: boolean;
  expectedResponse: string[];
  successIndicators: string[];
  errorIndicators: string[];
}

export interface PageInfo {
  title: string;
  language: string;
  encoding: string;
  viewport: {
    width: number;
    height: number;
  };
}

export class WebsiteRequirementAnalyzer {
  private browser: Browser | null = null;
  private page: Page | null = null;

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
  }

  async analyzeWebsite(url: string): Promise<WebsiteRequirement> {
    if (!this.page) throw new Error("Page not initialized");

    console.log(`🔍 Analyzing website requirements for: ${url}`);

    // Navigate to the website
    await this.page.goto(url, { waitUntil: "networkidle2" });

    // Get page information
    const pageInfo = await this.getPageInfo();
    console.log(`📄 Page Title: ${pageInfo.title}`);
    console.log(`🌐 Language: ${pageInfo.language}`);

    // Analyze form structure
    const formStructure = await this.analyzeFormStructure();
    console.log(`📋 Found ${formStructure.totalForms} form(s)`);

    // Analyze field requirements
    const fieldRequirements = await this.analyzeFieldRequirements(
        formStructure
    );
    console.log(`📝 Analyzed ${fieldRequirements.length} field requirements`);

    // Analyze validation rules
    const validationRules = await this.analyzeValidationRules(formStructure);
    console.log(`✅ Found ${validationRules.length} validation rules`);

    // Analyze CAPTCHA
    const captchaInfo = await this.analyzeCaptcha();
    console.log(
        `🤖 CAPTCHA: ${captchaInfo.hasCaptcha ? captchaInfo.captchaType : "None"}`
    );

    // Analyze submission requirements
    const submissionRequirements = await this.analyzeSubmissionRequirements(
        formStructure
    );
    console.log(`📤 Submission analysis completed`);

    return {
        url,
        formStructure,
        fieldRequirements,
        validationRules,
        captchaInfo,
        submissionRequirements,
        pageInfo,
    };
  }

  private async getPageInfo(): Promise<PageInfo> {
    if (!this.page) throw new Error("Page not initialized");

    const pageInfo = await this.page.evaluate(() => {
        return {
          title: document.title,
          language: document.documentElement.lang || "en",
          encoding: document.characterSet || "UTF-8",
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        };
    });

    return pageInfo;
  }

  private async analyzeFormStructure(): Promise<FormStructure> {
    if (!this.page) throw new Error("Page not initialized");

    const formStructure = await this.page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll("form")).map(
          (form) => {
            const fields = Array.from(
              form.querySelectorAll("input, textarea, select")
            ).map((field) => {
              const element = field as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement;
              return {
                name: element.name || "",
                type: element.type || element.tagName.toLowerCase(),
                id: element.id || "",
                placeholder:
                  "placeholder" in element ? element.placeholder || "" : "",
                required: element.required || false,
                validation: [], // Will be populated later
                maxLength:
                  "maxLength" in element
                    ? element.maxLength || undefined
                    : undefined,
                minLength:
                  "minLength" in element
                    ? element.minLength || undefined
                    : undefined,
                pattern:
                  "pattern" in element ? element.pattern || undefined : undefined,
                options:
                  element.tagName === "SELECT"
                    ? Array.from((element as HTMLSelectElement).options).map(
                        (opt) => opt.value
                      )
                    : undefined,
              };
            });

            const submitButton = form.querySelector(
              'input[type="submit"], button[type="submit"], button:not([type])'
            ) as HTMLInputElement | HTMLButtonElement;
            const submitInfo = submitButton
              ? {
                  text: submitButton.value || submitButton.textContent || "",
                  type: submitButton.type || "submit",
                  selector: submitButton.id
                    ? `#${submitButton.id}`
                    : submitButton.className
                    ? `.${submitButton.className.split(" ").join(".")}`
                    : submitButton.tagName.toLowerCase(),
                }
              : null;

            return {
              id: form.id || "",
              action: form.action || "",
              method: form.method || "get",
              fields,
              submitButton: submitInfo,
            };
          }
        );

        // Find primary form (usually the contact form)
        const primaryForm =
          forms.find(
            (form) =>
              form.action.includes("contact") ||
              form.action.includes("inquiry") ||
              form.fields.some(
                (field) =>
                  field.name.toLowerCase().includes("contact") ||
                  field.name.toLowerCase().includes("inquiry") ||
                  field.name.toLowerCase().includes("message")
              )
          ) ||
          forms[0] ||
          null;

        return {
          totalForms: forms.length,
          forms,
          primaryForm,
        };
    });

    return formStructure;
  }

  private async analyzeFieldRequirements(
    formStructure: FormStructure
  ): Promise<FieldRequirement[]> {
    if (!this.page) throw new Error("Page not initialized");

    const fieldRequirements: FieldRequirement[] = [];

    for (const form of formStructure.forms) {
        for (const field of form.fields) {
          const requirements = await this.analyzeFieldRequirement(field);
          if (requirements) {
            fieldRequirements.push(requirements);
          }
        }
    }

    return fieldRequirements;
  }

  private async analyzeFieldRequirement(
    field: FormField
  ): Promise<FieldRequirement | null> {
    if (!this.page) throw new Error("Page not initialized");

    const requirements = await this.page.evaluate((fieldData) => {
        const field = document.querySelector(
          `[name="${fieldData.name}"], [id="${fieldData.id}"]`
        ) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (!field) return null;

        const validationRules: string[] = [];
        let expectedFormat: string | undefined;
        let minLength: number | undefined;
        let maxLength: number | undefined;
        let allowedValues: string[] | undefined;

        // Analyze validation attributes
        if (field.required) validationRules.push("required");
        if (field.type === "email") {
          validationRules.push("email");
          expectedFormat = "email@domain.com";
        }
        if (field.type === "tel") {
          validationRules.push("phone");
          expectedFormat = "phone number format";
        }
        if ("maxLength" in field && field.maxLength) {
          validationRules.push("maxLength");
          maxLength = field.maxLength;
        }
        if ("minLength" in field && field.minLength) {
          validationRules.push("minLength");
          minLength = field.minLength;
        }
        if ("pattern" in field && field.pattern) {
          validationRules.push("pattern");
        }

        // Analyze select options
        if (field.tagName === "SELECT") {
          const select = field as HTMLSelectElement;
          allowedValues = Array.from(select.options).map((opt) => opt.value);
        }

        return {
          fieldName: fieldData.name,
          fieldType: fieldData.type,
          isRequired: fieldData.required,
          validationRules,
          expectedFormat,
          minLength,
          maxLength,
          allowedValues,
        };
    }, field);

    return requirements;
  }

  private async analyzeValidationRules(
    formStructure: FormStructure
  ): Promise<ValidationRule[]> {
    if (!this.page) throw new Error("Page not initialized");

    const validationRules: ValidationRule[] = [];

    for (const form of formStructure.forms) {
        for (const field of form.fields) {
          const rules = await this.analyzeFieldValidationRules(field);
          validationRules.push(...rules);
        }
    }

    return validationRules;
  }

  private async analyzeFieldValidationRules(
    field: FormField
  ): Promise<ValidationRule[]> {
    if (!this.page) throw new Error("Page not initialized");

    const rules: ValidationRule[] = [];

    if (field.required) {
        rules.push({
          fieldName: field.name,
          ruleType: "required",
          message: `${field.name} is required`,
        });
    }

    if (field.type === "email") {
        rules.push({
          fieldName: field.name,
          ruleType: "email",
          message: "Please enter a valid email address",
        });
    }

    if (field.type === "tel") {
        rules.push({
          fieldName: field.name,
          ruleType: "phone",
          message: "Please enter a valid phone number",
        });
    }

    if (field.maxLength) {
        rules.push({
          fieldName: field.name,
          ruleType: "length",
          message: `Maximum length is ${field.maxLength} characters`,
          maxLength: field.maxLength,
        });
    }

    if (field.minLength) {
        rules.push({
          fieldName: field.name,
          ruleType: "length",
          message: `Minimum length is ${field.minLength} characters`,
          minLength: field.minLength,
        });
    }

    if (field.pattern) {
        rules.push({
          fieldName: field.name,
          ruleType: "pattern",
          message: "Please match the required format",
          pattern: field.pattern,
        });
    }

    return rules;
  }

  private async analyzeCaptcha(): Promise<CaptchaInfo> {
    if (!this.page) throw new Error("Page not initialized");

    const captchaInfo = await this.page.evaluate(() => {
        // Check for reCAPTCHA
        const recaptcha = document.querySelector(
          'iframe[src*="google.com/recaptcha"], .g-recaptcha, [data-sitekey]'
        );
        if (recaptcha) {
          return {
            hasCaptcha: true,
            captchaType: "reCAPTCHA" as const,
            captchaSelector: recaptcha.id
              ? `#${recaptcha.id}`
              : recaptcha.className
              ? `.${recaptcha.className.split(" ").join(".")}`
              : recaptcha.tagName.toLowerCase(),
            captchaVersion: "v2", // Could be enhanced to detect v3
          };
        }

        // Check for hCaptcha
        const hcaptcha = document.querySelector(
          'iframe[src*="hcaptcha"], .h-captcha'
        );
        if (hcaptcha) {
          return {
            hasCaptcha: true,
            captchaType: "hCaptcha" as const,
            captchaSelector: hcaptcha.id
              ? `#${hcaptcha.id}`
              : hcaptcha.className
              ? `.${hcaptcha.className.split(" ").join(".")}`
              : hcaptcha.tagName.toLowerCase(),
          };
        }

        // Check for custom CAPTCHA
        const customCaptcha = document.querySelector(
          'input[name*="captcha"], .captcha, [class*="captcha"]'
        );
        if (customCaptcha) {
          return {
            hasCaptcha: true,
            captchaType: "custom" as const,
            captchaSelector: customCaptcha.id
              ? `#${customCaptcha.id}`
              : customCaptcha.className
              ? `.${customCaptcha.className.split(" ").join(".")}`
              : customCaptcha.tagName.toLowerCase(),
          };
        }

        return {
          hasCaptcha: false,
        };
    });

    return captchaInfo;
  }

  private async analyzeSubmissionRequirements(
    formStructure: FormStructure
  ): Promise<SubmissionRequirement> {
    if (!this.page) throw new Error("Page not initialized");

    const submissionRequirements = await this.page.evaluate((forms) => {
        const primaryForm = forms.primaryForm;
        if (!primaryForm) {
          return {
            requiresCaptcha: false,
            requiresJavaScript: false,
            requiresAjax: false,
            expectedResponse: [],
            successIndicators: [],
            errorIndicators: [],
          };
        }

        // Analyze form submission method
        const requiresJavaScript =
          primaryForm.method === "post" ||
          primaryForm.action.includes("ajax") ||
          primaryForm.action.includes("api");

        const requiresAjax =
          primaryForm.action.includes("ajax") ||
          primaryForm.action.includes("api") ||
          primaryForm.action.includes("json");

        // Common success/error indicators
        const successIndicators = [
          "success",
          "thank",
          "sent",
          "received",
          "submitted",
          "complete",
        ];

        const errorIndicators = [
          "error",
          "failed",
          "invalid",
          "required",
          "missing",
        ];

        return {
          requiresCaptcha: false, // Will be updated by CAPTCHA analysis
          requiresJavaScript,
          requiresAjax,
          expectedResponse: [],
          successIndicators,
          errorIndicators,
        };
    }, formStructure);

    return submissionRequirements;
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}
