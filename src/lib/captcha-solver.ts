// Enhanced CAPTCHA solver implementation supporting multiple services
// Supports 2captcha.com, Anti-Captcha, and manual solving fallback

export interface CaptchaChallenge {
  type: "recaptcha" | "hcaptcha" | "simple" | "image";
  selector: string;
  siteKey?: string;
  challenge?: string;
  pageUrl?: string;
}

export interface CaptchaSolution {
  success: boolean;
  solution?: string;
  error?: string;
  service?: string;
}

interface CaptchaServiceConfig {
  apiKey: string;
  serviceUrl: string;
  serviceName: string;
}

class CaptchaSolver {
  private configs: CaptchaServiceConfig[];
  private currentServiceIndex: number = 0;

  constructor() {
    this.configs = [
        // 2captcha.com (primary)
        {
          apiKey: process.env.CAPTCHA_API_KEY || "",
          serviceUrl:
            process.env.CAPTCHA_SERVICE_URL || "https://api.2captcha.com",
          serviceName: "2captcha",
        },
        // Anti-Captcha (fallback)
        {
          apiKey: process.env.ANTI_CAPTCHA_API_KEY || "",
          serviceUrl: "https://api.anti-captcha.com",
          serviceName: "anti-captcha",
        },
    ].filter((config) => config.apiKey); // Only include configured services
  }

  /**
   * Get current service configuration
   */
  private getCurrentConfig(): CaptchaServiceConfig | null {
    if (this.configs.length === 0) {
        return null;
    }
    return this.configs[this.currentServiceIndex % this.configs.length];
  }

  /**
   * Switch to next available service
   */
  private switchToNextService(): void {
    if (this.configs.length > 1) {
        this.currentServiceIndex =
          (this.currentServiceIndex + 1) % this.configs.length;
        console.log(
          `Switching to CAPTCHA service: ${this.getCurrentConfig()?.serviceName}`
        );
    }
  }

  /**
   * Check service balance
   */
  async checkBalance(): Promise<{
    service: string;
    balance: number;
    currency: string;
  } | null> {
    const config = this.getCurrentConfig();
    if (!config) {
        return null;
    }

    try {
        if (config.serviceName === "2captcha") {
          const result = await this.makeRequest(
            "res.php",
            {
              action: "getbalance",
              json: 1,
            },
            config
          );
          const response = JSON.parse(result);
          return {
            service: config.serviceName,
            balance: parseFloat(response.request),
            currency: "USD",
          };
        } else if (config.serviceName === "anti-captcha") {
          const result = await this.makeRequest(
            "getBalance",
            {
              clientKey: config.apiKey,
            },
            config
          );
          const response = JSON.parse(result);
          return {
            service: config.serviceName,
            balance: response.balance,
            currency: "USD",
          };
        }
    } catch (error) {
        console.warn(`Failed to check balance for ${config.serviceName}:`, error);
    }
    return null;
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, string | number>,
    config?: CaptchaServiceConfig
  ): Promise<string> {
    const currentConfig = config || this.getCurrentConfig();
    if (!currentConfig) {
        throw new Error("No CAPTCHA service configured");
    }

    const url = `${currentConfig.serviceUrl}/${endpoint}`;
    const formData = new URLSearchParams();

    // Add API key to all requests
    if (currentConfig.serviceName === "2captcha") {
        formData.append("key", currentConfig.apiKey);
    } else if (currentConfig.serviceName === "anti-captcha") {
        formData.append("clientKey", currentConfig.apiKey);
    }

    // Add other parameters
    for (const [key, value] of Object.entries(params)) {
        formData.append(key, value.toString());
    }

    try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const result = await response.text();
        return result;
    } catch (error) {
        throw new Error(
          `CAPTCHA service request failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
    }
  }

  private async waitForSolution(
    requestId: string,
    maxWaitTime: number = 120000,
    config?: CaptchaServiceConfig
  ): Promise<string> {
    const currentConfig = config || this.getCurrentConfig();
    if (!currentConfig) {
        throw new Error("No CAPTCHA service configured");
    }

    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
        try {
          let result: string;

          if (currentConfig.serviceName === "2captcha") {
            result = await this.makeRequest(
              "res.php",
              {
                action: "get",
                id: requestId,
                json: 1,
              },
              currentConfig
            );
          } else if (currentConfig.serviceName === "anti-captcha") {
            result = await this.makeRequest(
              "getTaskResult",
              {
                clientKey: currentConfig.apiKey,
                taskId: requestId,
              },
              currentConfig
            );
          } else {
            throw new Error(`Unsupported service: ${currentConfig.serviceName}`);
          }

          const response = JSON.parse(result);

          if (currentConfig.serviceName === "2captcha") {
            if (response.status === 1) {
              return response.request;
            } else if (response.request === "CAPCHA_NOT_READY") {
              await new Promise((resolve) => setTimeout(resolve, checkInterval));
              continue;
            } else {
              throw new Error(`CAPTCHA solving failed: ${response.request}`);
            }
          } else if (currentConfig.serviceName === "anti-captcha") {
            if (response.status === "ready") {
              return response.solution.gRecaptchaResponse;
            } else if (response.status === "processing") {
              await new Promise((resolve) => setTimeout(resolve, checkInterval));
              continue;
            } else {
              throw new Error(
                `CAPTCHA solving failed: ${
                  response.errorDescription || "Unknown error"
                }`
              );
            }
          }
        } catch (error) {
          console.error("Error checking CAPTCHA solution:", error);
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }
    }

    throw new Error(
        "CAPTCHA solving timeout - solution not received within expected time"
    );
  }

  async solve(challenge: CaptchaChallenge): Promise<CaptchaSolution> {
    console.log("CAPTCHA challenge received:", challenge);

    // Try each configured service
    for (let attempt = 0; attempt < this.configs.length; attempt++) {
        const config = this.getCurrentConfig();
        if (!config) {
          break;
        }

        try {
          console.log(`Attempting to solve with ${config.serviceName}...`);

          let result: CaptchaSolution;

          switch (challenge.type) {
            case "recaptcha":
              result = await this.solveRecaptcha(
                challenge.siteKey || "",
                challenge.pageUrl || "",
                config
              );
              break;
            case "hcaptcha":
              result = await this.solveHcaptcha(
                challenge.siteKey || "",
                challenge.pageUrl || "",
                config
              );
              break;
            case "image":
              result = await this.solveImageCaptcha(
                challenge.challenge || "",
                config
              );
              break;
            case "simple":
              result = await this.solveSimpleCaptcha(config);
              break;
            default:
              result = {
                success: false,
                error: `Unsupported CAPTCHA type: ${challenge.type}`,
                service: config.serviceName,
              };
          }

          if (result.success) {
            result.service = config.serviceName;
            return result;
          } else {
            // If it's a balance error, try next service
            if (
              result.error?.includes("ZERO_BALANCE") ||
              result.error?.includes("insufficient balance")
            ) {
              console.warn(
                `${config.serviceName} has insufficient balance, trying next service...`
              );
              this.switchToNextService();
              continue;
            }

            // For other errors, return the result
            result.service = config.serviceName;
            return result;
          }
        } catch (error) {
          console.error(`Error with ${config.serviceName}:`, error);
          this.switchToNextService();
        }
    }

    // If all services failed, return manual solving suggestion
    return {
        success: false,
        error:
          "All CAPTCHA services failed. Consider manual solving or adding funds to your CAPTCHA service accounts.",
        service: "manual",
    };
  }

  async solveRecaptcha(
    siteKey: string,
    pageUrl: string,
    config?: CaptchaServiceConfig
  ): Promise<CaptchaSolution> {
    const currentConfig = config || this.getCurrentConfig();
    if (!currentConfig) {
        return {
          success: false,
          error: "No CAPTCHA service configured",
          service: "none",
        };
    }

    try {
        console.log(
          `Solving reCAPTCHA with ${currentConfig.serviceName} for site key: ${siteKey}, URL: ${pageUrl}`
        );

        if (!siteKey || siteKey.trim() === "") {
          return {
            success: false,
            error: "reCAPTCHA site key is missing or empty",
            service: currentConfig.serviceName,
          };
        }

        let result: string;
        let requestId: string;

        if (currentConfig.serviceName === "2captcha") {
          result = await this.makeRequest(
            "in.php",
            {
              method: "userrecaptcha",
              googlekey: siteKey,
              pageurl: pageUrl,
              json: 1,
            },
            currentConfig
          );

          const response = JSON.parse(result);
          if (response.status === 1) {
            requestId = response.request;
          } else {
            const errorMessage = response.request || "Unknown error";
            return this.handleCaptchaError(
              errorMessage,
              currentConfig.serviceName
            );
          }
        } else if (currentConfig.serviceName === "anti-captcha") {
          result = await this.makeRequest(
            "createTask",
            {
              task: JSON.stringify({
                type: "RecaptchaV2TaskProxyless",
                websiteURL: pageUrl,
                websiteKey: siteKey,
              }),
            },
            currentConfig
          );

          const response = JSON.parse(result);
          if (response.errorId === 0) {
            requestId = response.taskId;
          } else {
            return {
              success: false,
              error: `Anti-Captcha error: ${response.errorDescription}`,
              service: currentConfig.serviceName,
            };
          }
        } else {
          return {
            success: false,
            error: `Unsupported service: ${currentConfig.serviceName}`,
            service: currentConfig.serviceName,
          };
        }

        // Wait for solution
        const solution = await this.waitForSolution(
          requestId,
          120000,
          currentConfig
        );

        console.log(
          `reCAPTCHA solved successfully with ${currentConfig.serviceName}`
        );
        return {
          success: true,
          solution,
          service: currentConfig.serviceName,
        };
    } catch (error) {
        console.error(
          `reCAPTCHA solving error with ${currentConfig.serviceName}:`,
          error
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          service: currentConfig.serviceName,
        };
    }
  }

  private handleCaptchaError(
    errorMessage: string,
    serviceName: string
  ): CaptchaSolution {
    if (errorMessage.includes("ERROR_WRONG_GOOGLEKEY")) {
        return {
          success: false,
          error:
            "Invalid reCAPTCHA site key. Please check if the site key is correct.",
          service: serviceName,
        };
    } else if (errorMessage.includes("ERROR_ZERO_BALANCE")) {
        return {
          success: false,
          error:
            "CAPTCHA solving service has insufficient balance. Please add funds to your account.",
          service: serviceName,
        };
    } else if (errorMessage.includes("ERROR_KEY_DOES_NOT_EXIST")) {
        return {
          success: false,
          error:
            "CAPTCHA solving API key is invalid. Please check your API key configuration.",
          service: serviceName,
        };
    } else {
        return {
          success: false,
          error: `reCAPTCHA solving failed: ${errorMessage}`,
          service: serviceName,
        };
    }
  }

  async solveHcaptcha(
    siteKey: string,
    pageUrl: string,
    config?: CaptchaServiceConfig
  ): Promise<CaptchaSolution> {
    const currentConfig = config || this.getCurrentConfig();
    if (!currentConfig) {
        return {
          success: false,
          error: "No CAPTCHA service configured",
          service: "none",
        };
    }

    try {
        console.log(
          `Solving hCaptcha with ${currentConfig.serviceName} for site key: ${siteKey}, URL: ${pageUrl}`
        );

        let result: string;
        let requestId: string;

        if (currentConfig.serviceName === "2captcha") {
          result = await this.makeRequest(
            "in.php",
            {
              method: "hcaptcha",
              sitekey: siteKey,
              pageurl: pageUrl,
              json: 1,
            },
            currentConfig
          );

          const response = JSON.parse(result);
          if (response.status === 1) {
            requestId = response.request;
          } else {
            throw new Error(
              `Failed to submit hCaptcha solving request: ${response.request}`
            );
          }
        } else if (currentConfig.serviceName === "anti-captcha") {
          result = await this.makeRequest(
            "createTask",
            {
              task: JSON.stringify({
                type: "HCaptchaTaskProxyless",
                websiteURL: pageUrl,
                websiteKey: siteKey,
              }),
            },
            currentConfig
          );

          const response = JSON.parse(result);
          if (response.errorId === 0) {
            requestId = response.taskId;
          } else {
            throw new Error(`Anti-Captcha error: ${response.errorDescription}`);
          }
        } else {
          return {
            success: false,
            error: `Unsupported service: ${currentConfig.serviceName}`,
            service: currentConfig.serviceName,
          };
        }

        // Wait for solution
        const solution = await this.waitForSolution(
          requestId,
          120000,
          currentConfig
        );

        console.log(
          `hCaptcha solved successfully with ${currentConfig.serviceName}`
        );
        return {
          success: true,
          solution,
          service: currentConfig.serviceName,
        };
    } catch (error) {
        console.error(
          `hCaptcha solving error with ${currentConfig.serviceName}:`,
          error
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          service: currentConfig.serviceName,
        };
    }
  }

  async solveImageCaptcha(
    imageBase64: string,
    config?: CaptchaServiceConfig
  ): Promise<CaptchaSolution> {
    const currentConfig = config || this.getCurrentConfig();
    if (!currentConfig) {
        return {
          success: false,
          error: "No CAPTCHA service configured",
          service: "none",
        };
    }

    try {
        console.log(`Solving image CAPTCHA with ${currentConfig.serviceName}`);

        let result: string;
        let requestId: string;

        if (currentConfig.serviceName === "2captcha") {
          result = await this.makeRequest(
            "in.php",
            {
              method: "base64",
              body: imageBase64,
              json: 1,
            },
            currentConfig
          );

          const response = JSON.parse(result);
          if (response.status === 1) {
            requestId = response.request;
          } else {
            throw new Error(
              `Failed to submit image CAPTCHA solving request: ${response.request}`
            );
          }
        } else {
          return {
            success: false,
            error: `Image CAPTCHA not supported by ${currentConfig.serviceName}`,
            service: currentConfig.serviceName,
          };
        }

        // Wait for solution
        const solution = await this.waitForSolution(
          requestId,
          120000,
          currentConfig
        );

        console.log(
          `Image CAPTCHA solved successfully with ${currentConfig.serviceName}`
        );
        return {
          success: true,
          solution,
          service: currentConfig.serviceName,
        };
    } catch (error) {
        console.error(
          `Image CAPTCHA solving error with ${currentConfig.serviceName}:`,
          error
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          service: currentConfig.serviceName,
        };
    }
  }

  async solveSimpleCaptcha(
    config?: CaptchaServiceConfig
  ): Promise<CaptchaSolution> {
    const currentConfig = config || this.getCurrentConfig();
    if (!currentConfig) {
        return {
          success: false,
          error: "No CAPTCHA service configured",
          service: "none",
        };
    }

    return {
        success: false,
        error:
          "Simple text CAPTCHA solving requires manual intervention or OCR implementation",
        service: currentConfig.serviceName,
    };
  }
}

// Export singleton instance
export const captchaSolver = new CaptchaSolver();
