// import { Page } from "puppeteer";

export interface FormField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  value?: string;
  selector: string;
  options?: string[];
}

export interface ContactForm {
  id: string;
  action: string;
  method: string;
  fields: FormField[];
  submitButton?: {
    text: string;
    selector: string;
  };
  isContactForm: boolean;
  confidence: number;
}

export interface FormAnalysisResult {
  totalForms: number;
  contactFormsCount: number;
  forms: ContactForm[];
  bestContactForm?: ContactForm;
}

export class FormDetector {
  /**
   * Analyze all forms on a page
   */
  async analyzeForms(page: Page): Promise<FormAnalysisResult> {
    try {
        const result = await page.evaluate(() => {
          // Generate selector inline since we're in browser context
          const generateSelector = (element: Element): string => {
            if (element.id) {
              return `#${element.id}`;
            }
            if (element.className) {
              const classes = element.className
                .split(" ")
                .filter((c: string) => c.trim())
                .join(".");
              return `${element.tagName.toLowerCase()}.${classes}`;
            }
            return element.tagName.toLowerCase();
          };

          // Check if a form is a contact form
          const isContactForm = (
            form: HTMLFormElement,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fields: any[]
          ): boolean => {
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

            // Check form action URL
            const action = form.action.toLowerCase();
            const hasContactAction = contactKeywords.some((keyword) =>
              action.includes(keyword)
            );

            // Check form fields
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fieldNames = fields.map((field: any) =>
              field.name.toLowerCase()
            );
            const hasContactFields = contactKeywords.some((keyword) =>
              fieldNames.some((fieldName: string) => fieldName.includes(keyword))
            );

            // Check for common contact field types
            const hasNameField = fieldNames.some(
              (name: string) =>
                name.includes("name") ||
                name.includes("姓名") ||
                name.includes("名前")
            );
            const hasEmailField = fieldNames.some(
              (name: string) =>
                name.includes("email") ||
                name.includes("mail") ||
                name.includes("メール")
            );
            const hasMessageField = fieldNames.some(
              (name: string) =>
                name.includes("message") ||
                name.includes("comment") ||
                name.includes("content") ||
                name.includes("メッセージ") ||
                name.includes("コメント")
            );

            return (
              hasContactAction ||
              hasContactFields ||
              (hasNameField && hasEmailField) ||
              hasMessageField
            );
          };

          // Calculate form confidence
          const calculateFormConfidence = (
            form: HTMLFormElement,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fields: any[],
            isContact: boolean
          ): number => {
            if (!isContact) return 0;

            let confidence = 0.3; // Base confidence for contact forms

            // Check form action
            const action = form.action.toLowerCase();
            const contactKeywords = [
              "contact",
              "inquiry",
              "enquiry",
              "message",
              "feedback",
              "support",
              "help",
              "お問い合わせ",
              "連絡",
            ];
            if (contactKeywords.some((keyword) => action.includes(keyword))) {
              confidence += 0.3;
            }

            // Check field names
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fieldNames = fields.map((field: any) =>
              field.name.toLowerCase()
            );
            const hasNameField = fieldNames.some(
              (name: string) =>
                name.includes("name") ||
                name.includes("姓名") ||
                name.includes("名前")
            );
            const hasEmailField = fieldNames.some(
              (name: string) =>
                name.includes("email") ||
                name.includes("mail") ||
                name.includes("メール")
            );
            const hasMessageField = fieldNames.some(
              (name: string) =>
                name.includes("message") ||
                name.includes("comment") ||
                name.includes("content") ||
                name.includes("メッセージ") ||
                name.includes("コメント")
            );

            if (hasNameField) confidence += 0.2;
            if (hasEmailField) confidence += 0.2;
            if (hasMessageField) confidence += 0.2;

            // Check for required fields
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const requiredFields = fields.filter((field: any) => field.required);
            if (requiredFields.length > 0) confidence += 0.1;

            return Math.min(confidence, 1.0);
          };

          const forms = document.querySelectorAll("form");
          const contactForms: ContactForm[] = [];
          let contactFormsCount = 0;

          forms.forEach((form, index) => {
            const formElement = form as HTMLFormElement;
            const formId = formElement.id || `form-${index}`;
            const action = formElement.action || "";
            const method = formElement.method || "get";

            // Extract form fields
            const fields: FormField[] = [];
            const inputs = formElement.querySelectorAll(
              "input, textarea, select"
            );

            inputs.forEach((input) => {
              const inputElement = input as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement;

              const field: FormField = {
                name: inputElement.name || "",
                type: inputElement.type || inputElement.tagName.toLowerCase(),
                required: inputElement.required || false,
                placeholder:
                  "placeholder" in inputElement
                    ? inputElement.placeholder || ""
                    : "",
                selector: generateSelector(inputElement),
              };

              // Handle select options
              if (inputElement.tagName.toLowerCase() === "select") {
                const selectElement = inputElement as HTMLSelectElement;
                field.options = Array.from(selectElement.options).map(
                  (option) => option.value
                );
              }

              fields.push(field);
            });

            // Find submit button
            const submitButton = formElement.querySelector(
              'input[type="submit"], button[type="submit"], button:not([type])'
            );
            const submitButtonInfo = submitButton
              ? {
                  text: submitButton.textContent?.trim() || "",
                  selector: generateSelector(submitButton),
                }
              : undefined;

            // Determine if this is a contact form
            const isContactFormResult = isContactForm(formElement, fields);
            const confidence = calculateFormConfidence(
              formElement,
              fields,
              isContactFormResult
            );

            const formInfo = {
              id: formId,
              action,
              method,
              fields,
              submitButton: submitButtonInfo,
              isContactForm: isContactFormResult,
              confidence,
            };

            if (isContactFormResult) {
              contactFormsCount++;
              contactForms.push(formInfo);
            }
          });

          // Find the best contact form
          const bestContactForm =
            contactForms.length > 0
              ? contactForms.reduce((best, current) =>
                  current.confidence > best.confidence ? current : best
                )
              : undefined;

          return {
            totalForms: forms.length,
            contactFormsCount,
            forms: contactForms,
            bestContactForm,
          };
        });

        return result;
    } catch (error) {
        console.error("Error analyzing forms:", error);
        return {
          totalForms: 0,
          contactFormsCount: 0,
          forms: [],
          bestContactForm: undefined,
        };
    }
  }

  /**
   * Fill a form with provided data
   */
  async fillForm(
    page: Page,
    formSelector: string,
    data: Record<string, string>
  ): Promise<boolean> {
    try {
        const success = await page.evaluate(
          (selector, formData) => {
            const form = document.querySelector(selector) as HTMLFormElement;
            if (!form) return false;

            // Fill each field
            for (const [fieldName, value] of Object.entries(formData)) {
              const field = form.querySelector(`[name="${fieldName}"]`) as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement;
              if (field) {
                if (field.type === "checkbox" || field.type === "radio") {
                  (field as HTMLInputElement).checked =
                    value === "true" || value === "on";
                } else {
                  field.value = value;
                }
              }
            }

            return true;
          },
          formSelector,
          data
        );

        return success;
    } catch (error) {
        console.error("Error filling form:", error);
        return false;
    }
  }

  /**
   * Submit a form
   */
  async submitForm(page: Page, formSelector: string): Promise<boolean> {
    try {
        const success = await page.evaluate((selector) => {
          const form = document.querySelector(selector) as HTMLFormElement;
          if (!form) return false;

          // Try to find and click submit button
          const submitButton = form.querySelector(
            'input[type="submit"], button[type="submit"], button:not([type])'
          ) as HTMLInputElement | HTMLButtonElement;
          if (submitButton) {
            submitButton.click();
            return true;
          }

          // If no submit button, try to submit the form directly
          try {
            form.submit();
            return true;
          } catch {
            return false;
          }
        }, formSelector);

        return success;
    } catch (error) {
        console.error("Error submitting form:", error);
        return false;
    }
  }

  /**
   * Check if a form is a contact form
   */
  private isContactForm(form: HTMLFormElement, fields: FormField[]): boolean {
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

    // Check form action URL
    const action = form.action.toLowerCase();
    const hasContactAction = contactKeywords.some((keyword) =>
        action.includes(keyword)
    );

    // Check form fields
    const fieldNames = fields.map((field) => field.name.toLowerCase());
    const hasContactFields = contactKeywords.some((keyword) =>
        fieldNames.some((fieldName) => fieldName.includes(keyword))
    );

    // Check for common contact field types
    const hasNameField = fieldNames.some(
        (name) =>
          name.includes("name") || name.includes("姓名") || name.includes("名前")
    );
    const hasEmailField = fieldNames.some(
        (name) =>
          name.includes("email") ||
          name.includes("mail") ||
          name.includes("メール")
    );
    const hasMessageField = fieldNames.some(
        (name) =>
          name.includes("message") ||
          name.includes("comment") ||
          name.includes("content") ||
          name.includes("メッセージ") ||
          name.includes("内容")
    );

    return (
        hasContactAction ||
        hasContactFields ||
        (hasNameField && hasEmailField && hasMessageField)
    );
  }

  /**
   * Calculate confidence score for a form
   */
  private calculateFormConfidence(
    form: HTMLFormElement,
    fields: FormField[],
    isContactForm: boolean
  ): number {
    if (!isContactForm) return 0;

    let confidence = 30; // Base confidence for contact forms

    // Add points for contact-related fields
    const fieldNames = fields.map((field) => field.name.toLowerCase());

    if (fieldNames.some((name) => name.includes("name"))) confidence += 15;
    if (fieldNames.some((name) => name.includes("email"))) confidence += 20;
    if (
        fieldNames.some(
          (name) => name.includes("message") || name.includes("comment")
        )
    )
        confidence += 20;
    if (fieldNames.some((name) => name.includes("phone"))) confidence += 10;
    if (fieldNames.some((name) => name.includes("subject"))) confidence += 10;

    // Add points for Japanese contact fields
    if (
        fieldNames.some((name) => name.includes("姓名") || name.includes("名前"))
    )
        confidence += 15;
    if (fieldNames.some((name) => name.includes("メール"))) confidence += 20;
    if (
        fieldNames.some(
          (name) => name.includes("メッセージ") || name.includes("内容")
        )
    )
        confidence += 20;
    if (fieldNames.some((name) => name.includes("電話"))) confidence += 10;

    // Add points for form action
    const action = form.action.toLowerCase();
    const contactKeywords = [
        "contact",
        "inquiry",
        "enquiry",
        "message",
        "feedback",
    ];
    if (contactKeywords.some((keyword) => action.includes(keyword)))
        confidence += 15;

    return Math.min(100, confidence);
  }

  /**
   * Generate a unique selector for an element
   */
  private generateSelector(element: Element): string {
    if (element.id) {
        return `#${element.id}`;
    }

    if (element.className) {
        const classes = element.className
          .split(" ")
          .filter((c) => c.trim())
          .join(".");
        return `${element.tagName.toLowerCase()}.${classes}`;
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Get default contact form data
   */
  getDefaultContactData(businessName: string): Record<string, string> {
    return {
        name: `Test User from ${businessName}`,
        email: "test@example.com",
        phone: "+81-3-1234-5678",
        subject: `Inquiry from ${businessName}`,
        message: `Hello, I'm interested in your services. Please contact me for more information.`,
        company: businessName,
        お名前: `Test User from ${businessName}`,
        メールアドレス: "test@example.com",
        電話番号: "+81-3-1234-5678",
        件名: `Inquiry from ${businessName}`,
        メッセージ: `Hello, I'm interested in your services. Please contact me for more information.`,
        会社名: businessName,
    };
  }
}

export const formDetector = new FormDetector();
