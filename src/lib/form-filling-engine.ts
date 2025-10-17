// import { Page } from "puppeteer";

export interface FormField {
  selector: string;
  value: string;
  type?: "input" | "textarea" | "select" | "checkbox" | "radio";
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export interface DetectedField {
  selector: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options?: string[]; // For select fields
  attributes: Record<string, string>;
}

export interface FormDetectionResult {
  success: boolean;
  forms: DetectedForm[];
  totalFields: number;
  error?: string;
}

export interface DetectedForm {
  selector: string;
  action: string;
  method: string;
  fields: DetectedField[];
  submitButton?: DetectedField;
}

export interface FormFillResult {
  success: boolean;
  filledFields: number;
  totalFields: number;
  fieldResults: Array<{
    selector: string;
    value: string;
    success: boolean;
    error?: string;
  }>;
  error?: string;
}

export interface FormSubmissionResult {
  success: boolean;
  submitted: boolean;
  responseStatus?: number;
  responseUrl?: string;
  error?: string;
}

export class FormFillingEngine {
  private page: Page | null = null;
  private fillDelay: number = 100; // ms between keystrokes
  private submitDelay: number = 2000; // ms before submission
  private maxRetries: number = 3;

  constructor(fillDelay: number = 100, submitDelay: number = 2000) {
    this.fillDelay = fillDelay;
    this.submitDelay = submitDelay;
    console.log("📝 Form Filling Engine initialized");
  }

  // Set the page to work with
  setPage(page: Page): void {
    this.page = page;
  }

  // Detect all forms on the page
  async detectForms(): Promise<FormDetectionResult> {
    try {
        if (!this.page) {
          throw new Error("No page set. Call setPage() first.");
        }

        console.log("🔍 Detecting forms on page...");

        const forms = await this.page.evaluate(() => {
          const detectedForms: DetectedForm[] = [];
          const formElements = document.querySelectorAll("form");

          formElements.forEach((form, formIndex) => {
            const formSelector = `form:nth-of-type(${formIndex + 1})`;
            const fields: DetectedField[] = [];

            // Get form attributes
            const action = form.getAttribute("action") || "";
            const method = form.getAttribute("method") || "GET";

            // Detect input fields
            const inputs = form.querySelectorAll(
              'input, textarea, select, button[type="submit"]'
            );

            inputs.forEach((element, fieldIndex) => {
              const tagName = element.tagName.toLowerCase();
              const type = element.getAttribute("type") || tagName;
              const selector = `${formSelector} ${tagName}:nth-of-type(${
                fieldIndex + 1
              })`;

              // Get field attributes
              const label = this.getFieldLabel(element);
              const placeholder = element.getAttribute("placeholder") || "";
              const required = element.hasAttribute("required");
              const name = element.getAttribute("name") || "";
              const id = element.getAttribute("id") || "";
              const className = element.getAttribute("class") || "";

              // Get options for select fields
              let options: string[] = [];
              if (tagName === "select") {
                const selectElement = element as HTMLSelectElement;
                options = Array.from(selectElement.options).map(
                  (option) => option.value || option.text
                );
              }

              const field: DetectedField = {
                selector,
                type,
                label,
                placeholder,
                required,
                options: options.length > 0 ? options : undefined,
                attributes: {
                  name,
                  id,
                  class: className,
                  type,
                },
              };

              fields.push(field);
            });

            // Find submit button
            const submitButton = form.querySelector(
              'button[type="submit"], input[type="submit"]'
            );
            let submitButtonField: DetectedField | undefined;

            if (submitButton) {
              const tagName = submitButton.tagName.toLowerCase();
              const submitSelector = `${formSelector} ${tagName}[type="submit"]`;

              submitButtonField = {
                selector: submitSelector,
                type: "submit",
                label: submitButton.getAttribute("value") || "Submit",
                placeholder: "",
                required: false,
                attributes: {
                  name: submitButton.getAttribute("name") || "",
                  id: submitButton.getAttribute("id") || "",
                  class: submitButton.getAttribute("class") || "",
                  type: "submit",
                },
              };
            }

            const detectedForm: DetectedForm = {
              selector: formSelector,
              action,
              method,
              fields,
              submitButton: submitButtonField,
            };

            detectedForms.push(detectedForm);
          });

          return detectedForms;
        });

        const totalFields = forms.reduce(
          (sum, form) => sum + form.fields.length,
          0
        );

        console.log(
          `✅ Detected ${forms.length} forms with ${totalFields} fields`
        );

        return {
          success: true,
          forms,
          totalFields,
        };
    } catch (error) {
        console.error("Failed to detect forms:", error);
        return {
          success: false,
          forms: [],
          totalFields: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Fill a specific form with provided data
  async fillForm(
    formSelector: string,
    fields: FormField[]
  ): Promise<FormFillResult> {
    try {
        if (!this.page) {
          throw new Error("No page set. Call setPage() first.");
        }

        console.log(
          `📝 Filling form: ${formSelector} with ${fields.length} fields`
        );

        const fieldResults: FormFillResult["fieldResults"] = [];
        let successCount = 0;

        for (const field of fields) {
          try {
            console.log(`Filling field: ${field.selector} = ${field.value}`);

            // Wait for element to be available
            await this.page.waitForSelector(field.selector, { timeout: 5000 });

            // Check if element exists and is visible
            const isVisible = await this.page.evaluate((selector) => {
              const element = document.querySelector(selector) as HTMLElement;
              if (!element) return false;

              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);

              return (
                rect.width > 0 &&
                rect.height > 0 &&
                style.visibility !== "hidden" &&
                style.display !== "none"
              );
            }, field.selector);

            if (!isVisible) {
              throw new Error("Element is not visible");
            }

            // Fill the field based on its type
            await this.fillFieldByType(field);

            fieldResults.push({
              selector: field.selector,
              value: field.value,
              success: true,
            });

            successCount++;
            console.log(`✅ Field filled: ${field.selector}`);

            // Small delay between fields
            await new Promise((resolve) => setTimeout(resolve, this.fillDelay));
          } catch (fieldError) {
            console.error(`Failed to fill field ${field.selector}:`, fieldError);
            fieldResults.push({
              selector: field.selector,
              value: field.value,
              success: false,
              error:
                fieldError instanceof Error
                  ? fieldError.message
                  : "Unknown error",
            });
          }
        }

        console.log(
          `✅ Form filling completed: ${successCount}/${fields.length} fields filled`
        );

        return {
          success: successCount > 0,
          filledFields: successCount,
          totalFields: fields.length,
          fieldResults,
        };
    } catch (error) {
        console.error("Failed to fill form:", error);
        return {
          success: false,
          filledFields: 0,
          totalFields: fields.length,
          fieldResults: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Submit a form
  async submitForm(formSelector: string): Promise<FormSubmissionResult> {
    try {
        if (!this.page) {
          throw new Error("No page set. Call setPage() first.");
        }

        console.log(`🚀 Submitting form: ${formSelector}`);

        // Wait before submission
        await new Promise((resolve) => setTimeout(resolve, this.submitDelay));

        // Try to find and click submit button
        const submitButton = await this.page.$(
          `${formSelector} button[type="submit"], ${formSelector} input[type="submit"]`
        );

        if (!submitButton) {
          throw new Error("No submit button found");
        }

        // Get current URL for comparison
        const currentUrl = this.page.url();

        // Click submit button
        await submitButton.click();

        // Wait for navigation or response
        try {
          await this.page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 10000,
          });
        } catch (navigationError) {
          console.warn(
            "No navigation detected, form might have been submitted via AJAX"
          );
        }

        // Check if URL changed
        const newUrl = this.page.url();
        const urlChanged = currentUrl !== newUrl;

        // Get response status (this might not work for AJAX submissions)
        const response = await this.page.evaluate(() => {
          // Check for common success indicators
          const successIndicators = [
            ".success",
            ".alert-success",
            ".message-success",
            '[class*="success"]',
            '[id*="success"]',
          ];

          const errorIndicators = [
            ".error",
            ".alert-error",
            ".alert-danger",
            ".message-error",
            '[class*="error"]',
            '[class*="danger"]',
            '[id*="error"]',
          ];

          const hasSuccess = successIndicators.some((selector) =>
            document.querySelector(selector)
          );

          const hasError = errorIndicators.some((selector) =>
            document.querySelector(selector)
          );

          return {
            hasSuccess,
            hasError,
            title: document.title,
            url: window.location.href,
          };
        });

        const success = urlChanged || response.hasSuccess;

        console.log(`✅ Form submission ${success ? "successful" : "completed"}`);

        return {
          success: true,
          submitted: true,
          responseUrl: newUrl,
          error: response.hasError ? "Error indicators found on page" : undefined,
        };
    } catch (error) {
        console.error("Failed to submit form:", error);
        return {
          success: false,
          submitted: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Fill field based on its type
  private async fillFieldByType(field: FormField): Promise<void> {
    if (!this.page) {
        throw new Error("No page set");
    }

    switch (field.type) {
        case "select":
          await this.page.select(field.selector, field.value);
          break;

        case "checkbox":
          const isChecked = await this.page.evaluate((selector) => {
            const element = document.querySelector(selector) as HTMLInputElement;
            return element?.checked || false;
          }, field.selector);

          const shouldCheck =
            field.value === "true" || field.value === "1" || field.value === "on";

          if (isChecked !== shouldCheck) {
            await this.page.click(field.selector);
          }
          break;

        case "radio":
          await this.page.click(field.selector);
          break;

        case "textarea":
        case "input":
        default:
          // Clear existing value
          await this.page.evaluate((selector) => {
            const element = document.querySelector(selector) as
              | HTMLInputElement
              | HTMLTextAreaElement;
            if (element) {
              element.value = "";
            }
          }, field.selector);

          // Type new value
          await this.page.type(field.selector, field.value, {
            delay: this.fillDelay,
          });
          break;
    }
  }

  // Helper method to get field label
  private getFieldLabel(element: Element): string {
    // Try to find label by for attribute
    const id = element.getAttribute("id");
    if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) {
          return label.textContent?.trim() || "";
        }
    }

    // Try to find parent label
    const parentLabel = element.closest("label");
    if (parentLabel) {
        return parentLabel.textContent?.trim() || "";
    }

    // Try to find sibling label
    const previousSibling = element.previousElementSibling;
    if (previousSibling && previousSibling.tagName.toLowerCase() === "label") {
        return previousSibling.textContent?.trim() || "";
    }

    // Use name or placeholder as fallback
    return (
        element.getAttribute("name") || element.getAttribute("placeholder") || ""
    );
  }

  // Auto-detect and fill form
  async autoFillForm(
    fields: FormField[],
    formIndex: number = 0
  ): Promise<{
    detectionResult: FormDetectionResult;
    fillResult?: FormFillResult;
  }> {
    try {
        // First detect forms
        const detectionResult = await this.detectForms();

        if (!detectionResult.success || detectionResult.forms.length === 0) {
          return { detectionResult };
        }

        if (formIndex >= detectionResult.forms.length) {
          throw new Error(
            `Form index ${formIndex} not found. Found ${detectionResult.forms.length} forms.`
          );
        }

        const targetForm = detectionResult.forms[formIndex];

        // Map provided fields to detected fields
        const mappedFields = this.mapFieldsToForm(fields, targetForm);

        // Fill the form
        const fillResult = await this.fillForm(targetForm.selector, mappedFields);

        return {
          detectionResult,
          fillResult,
        };
    } catch (error) {
        console.error("Auto-fill form failed:", error);
        return {
          detectionResult: {
            success: false,
            forms: [],
            totalFields: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        };
    }
  }

  // Map provided fields to form fields
  private mapFieldsToForm(
    providedFields: FormField[],
    detectedForm: DetectedForm
  ): FormField[] {
    const mappedFields: FormField[] = [];

    for (const providedField of providedFields) {
        // Try to find matching field in detected form
        let matchedField: DetectedField | undefined;

        // First try exact selector match
        matchedField = detectedForm.fields.find(
          (f) => f.selector === providedField.selector
        );

        // Then try name attribute match
        if (!matchedField && providedField.label) {
          matchedField = detectedForm.fields.find(
            (f) =>
              f.attributes.name?.toLowerCase() ===
              providedField.label.toLowerCase()
          );
        }

        // Then try label match
        if (!matchedField && providedField.label) {
          matchedField = detectedForm.fields.find((f) =>
            f.label.toLowerCase().includes(providedField.label!.toLowerCase())
          );
        }

        // Then try placeholder match
        if (!matchedField && providedField.placeholder) {
          matchedField = detectedForm.fields.find((f) =>
            f.placeholder
              .toLowerCase()
              .includes(providedField.placeholder!.toLowerCase())
          );
        }

        if (matchedField) {
          mappedFields.push({
            selector: matchedField.selector,
            value: providedField.value,
            type: matchedField.type as FormField["type"],
            label: matchedField.label,
            placeholder: matchedField.placeholder,
            required: matchedField.required,
          });
        } else {
          console.warn(
            `Could not map field: ${
              providedField.selector || providedField.label || "unknown"
            }`
          );
          // Still add the field as-is, it might work with the provided selector
          mappedFields.push(providedField);
        }
    }

    return mappedFields;
  }

  // Get configuration
  getConfiguration(): {
    fillDelay: number;
    submitDelay: number;
    maxRetries: number;
  } {
    return {
        fillDelay: this.fillDelay,
        submitDelay: this.submitDelay,
        maxRetries: this.maxRetries,
    };
  }

  // Update configuration
  updateConfiguration(config: {
    fillDelay?: number;
    submitDelay?: number;
    maxRetries?: number;
  }): void {
    if (config.fillDelay !== undefined) {
        this.fillDelay = config.fillDelay;
    }
    if (config.submitDelay !== undefined) {
        this.submitDelay = config.submitDelay;
    }
    if (config.maxRetries !== undefined) {
        this.maxRetries = config.maxRetries;
    }

    console.log(
        "📝 Form filling configuration updated:",
        this.getConfiguration()
    );
  }
}
