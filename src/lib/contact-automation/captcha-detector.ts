// import { Page } from "puppeteer";

export interface CaptchaDetectionResult {
  isCaptcha: boolean;
  captchaType: "recaptcha" | "hcaptcha" | "cloudflare" | "other" | null;
  confidence: number;
  selectors: string[];
  iframeUrls: string[];
  challengeElements: string[];
}

export class CaptchaDetector {
  /**
   * Detect CAPTCHA on a webpage
   */
  async detectCaptcha(page: Page): Promise<CaptchaDetectionResult> {
    try {
        const result = await page.evaluate(() => {
          const captchaTypes = {
            recaptcha: {
              selectors: [
                ".g-recaptcha",
                "#recaptcha",
                "[data-sitekey]",
                'iframe[src*="recaptcha"]',
                'iframe[src*="google.com/recaptcha"]',
                'iframe[src*="recaptcha.net"]',
              ],
              iframePatterns: [
                "google.com/recaptcha",
                "recaptcha.net/recaptcha",
                "recaptcha/api2",
              ],
            },
            hcaptcha: {
              selectors: [
                ".h-captcha",
                "#hcaptcha",
                'iframe[src*="hcaptcha.com"]',
                "[data-sitekey][data-hcaptcha]",
              ],
              iframePatterns: ["hcaptcha.com/captcha", "hcaptcha.com/1"],
            },
            cloudflare: {
              selectors: [
                "#cf-challenge-running",
                "#challenge-stage",
                "#cf-please-wait",
                ".cf-browser-verification",
                'iframe[src*="cloudflare.com"]',
              ],
              iframePatterns: [
                "cloudflare.com/cdn-cgi",
                "cloudflare.com/challenge",
              ],
            },
          };

          const foundCaptchas: Record<
            string,
            { selectors: string[]; iframes: string[]; confidence: number }
          > = {};
          const allSelectors: string[] = [];
          const allIframeUrls: string[] = [];
          const allChallengeElements: string[] = [];

          // Check for each CAPTCHA type
          for (const [type, config] of Object.entries(captchaTypes)) {
            const foundSelectors: string[] = [];
            const foundIframes: string[] = [];

            // Check selectors
            for (const selector of config.selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                foundSelectors.push(selector);
                allSelectors.push(selector);

                // Add element details
                elements.forEach((el, index) => {
                  allChallengeElements.push(`${selector}[${index}]`);
                });
              }
            }

            // Check iframes
            const iframes = document.querySelectorAll("iframe");
            iframes.forEach((iframe) => {
              const src = iframe.src || "";
              const matchesPattern = config.iframePatterns.some((pattern) =>
                src.includes(pattern)
              );

              if (matchesPattern) {
                foundIframes.push(src);
                allIframeUrls.push(src);
                allChallengeElements.push(`iframe[src="${src}"]`);
              }
            });

            if (foundSelectors.length > 0 || foundIframes.length > 0) {
              foundCaptchas[type] = {
                selectors: foundSelectors,
                iframes: foundIframes,
                confidence: Math.min(
                  100,
                  (foundSelectors.length + foundIframes.length) * 25
                ),
              };
            }
          }

          // Check for generic CAPTCHA indicators
          const genericCaptchaIndicators = [
            "captcha",
            "challenge",
            "verification",
            "robot",
            "human",
            "security",
          ];

          const pageText = document.body.textContent?.toLowerCase() || "";
          const hasGenericCaptcha = genericCaptchaIndicators.some((indicator) =>
            pageText.includes(indicator)
          );

          // Determine the most likely CAPTCHA type
          let primaryType: string | null = null;
          let maxConfidence = 0;

          for (const [type, data] of Object.entries(foundCaptchas)) {
            if (data.confidence > maxConfidence) {
              maxConfidence = data.confidence;
              primaryType = type;
            }
          }

          // If no specific CAPTCHA found but generic indicators exist
          if (!primaryType && hasGenericCaptcha) {
            primaryType = "other";
            maxConfidence = 30;
          }

          return {
            isCaptcha: !!primaryType,
            captchaType: primaryType as
              | "recaptcha"
              | "hcaptcha"
              | "cloudflare"
              | "other"
              | null,
            confidence: maxConfidence,
            selectors: allSelectors,
            iframeUrls: allIframeUrls,
            challengeElements: allChallengeElements,
          };
        });

        return result;
    } catch (error) {
        console.error("Error detecting CAPTCHA:", error);
        return {
          isCaptcha: false,
          captchaType: null,
          confidence: 0,
          selectors: [],
          iframeUrls: [],
          challengeElements: [],
        };
    }
  }

  /**
   * Check if page has anti-bot protection
   */
  async detectAntiBotProtection(page: Page): Promise<{
    hasProtection: boolean;
    protectionTypes: string[];
    confidence: number;
  }> {
    try {
        const result = await page.evaluate(() => {
          const protectionIndicators = {
            cloudflare: [
              "#cf-challenge-running",
              "#challenge-stage",
              ".cf-browser-verification",
              'iframe[src*="cloudflare.com"]',
            ],
            akamai: ['iframe[src*="akamai.com"]', ".akamai-challenge"],
            imperva: ['iframe[src*="incapsula.com"]', ".incapsula-challenge"],
            captcha: [".g-recaptcha", ".h-captcha", "#recaptcha", "#hcaptcha"],
            rateLimit: [
              "rate limit",
              "too many requests",
              "429",
              "quota exceeded",
            ],
            botDetection: [
              "bot detected",
              "automated access",
              "suspicious activity",
              "security check",
            ],
          };

          const foundProtections: string[] = [];
          let totalConfidence = 0;

          for (const [type, indicators] of Object.entries(protectionIndicators)) {
            let found = false;

            if (type === "rateLimit" || type === "botDetection") {
              // Check text content
              const pageText = document.body.textContent?.toLowerCase() || "";
              found = indicators.some((indicator) =>
                pageText.includes(indicator)
              );
            } else {
              // Check DOM elements
              found = indicators.some(
                (selector) => document.querySelector(selector) !== null
              );
            }

            if (found) {
              foundProtections.push(type);
              totalConfidence += 25;
            }
          }

          return {
            hasProtection: foundProtections.length > 0,
            protectionTypes: foundProtections,
            confidence: Math.min(100, totalConfidence),
          };
        });

        return result;
    } catch (error) {
        console.error("Error detecting anti-bot protection:", error);
        return {
          hasProtection: false,
          protectionTypes: [],
          confidence: 0,
        };
    }
  }

  /**
   * Wait for CAPTCHA to be solved (placeholder for future implementation)
   */
  async waitForCaptchaSolution(
    page: Page,
    timeout: number = 30000
  ): Promise<boolean> {
    try {
        // This is a placeholder for future CAPTCHA solving integration
        // For now, we just wait and check if CAPTCHA is still present
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          const captchaResult = await this.detectCaptcha(page);

          if (!captchaResult.isCaptcha) {
            return true; // CAPTCHA is no longer present
          }

          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before checking again
        }

        return false; // Timeout reached
    } catch (error) {
        console.error("Error waiting for CAPTCHA solution:", error);
        return false;
    }
  }
}

export const captchaDetector = new CaptchaDetector();
