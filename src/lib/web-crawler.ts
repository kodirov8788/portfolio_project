// import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { Business, ContactForm, FormField, CrawlResult } from "@/types";
import { rateLimiter } from "./rate-limiter";

class WebCrawler {
  private browser: Browser | null = null;
  private isHeadless: boolean;

  constructor() {
    this.isHeadless = process.env.HEADLESS_MODE === "true";
  }

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
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
            "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ],
          timeout: parseInt(process.env.BROWSER_TIMEOUT || "30000"),
        });
    }
    return this.browser;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return "unknown";
    }
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
    }
    return url;
  }

  /**
   * Check if URL is accessible
   */
  private async isUrlAccessible(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
        });
        return response.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
  }

  /**
   * Find contact form pages
   */
  private async findContactPages(
    page: Page,
    baseUrl: string
  ): Promise<string[]> {
    const contactUrls: string[] = [];

    try {
        // Common contact page patterns
        const contactPatterns = [
          "/contact",
          "/contact-us",
          "/contactus",
          "/get-in-touch",
          "/reach-us",
          "/inquiry",
          "/enquiry",
          "/about/contact",
          "/support/contact",
          "/help/contact",
        ];

        // Check for contact links in navigation
        const contactLinks = await page.evaluate((patterns) => {
          const links: string[] = [];
          const allLinks = document.querySelectorAll("a[href]");

          allLinks.forEach((link) => {
            const href = (link as HTMLAnchorElement).href.toLowerCase();
            const text = link.textContent?.toLowerCase() || "";

            // Check if link text contains contact-related words
            const contactWords = [
              "contact",
              "inquiry",
              "enquiry",
              "reach",
              "get in touch",
            ];
            const hasContactText = contactWords.some((word) =>
              text.includes(word)
            );

            // Check if URL matches contact patterns
            const matchesPattern = patterns.some((pattern) =>
              href.includes(pattern)
            );

            if (hasContactText || matchesPattern) {
              links.push((link as HTMLAnchorElement).href);
            }
          });

          return [...new Set(links)]; // Remove duplicates
        }, contactPatterns);

        // Add base contact URLs
        for (const pattern of contactPatterns) {
          contactUrls.push(`${baseUrl}${pattern}`);
        }

        // Add found contact links
        contactUrls.push(...contactLinks);

        // Remove duplicates and filter valid URLs
        const uniqueUrls = [...new Set(contactUrls)];
        const validUrls: string[] = [];

        for (const url of uniqueUrls) {
          if (await this.isUrlAccessible(url)) {
            validUrls.push(url);
          }
        }

        return validUrls.slice(0, 5); // Limit to 5 contact pages
    } catch (error) {
        console.warn("Error finding contact pages:", error);
        return [];
    }
  }

  /**
   * Detect forms on a page
   */
  private detectForms($: cheerio.CheerioAPI): ContactForm[] {
    const forms: ContactForm[] = [];

    $("form").each((index, formElement) => {
        const $form = $(formElement);
        const formId = $form.attr("id") || `form-${index}`;

        // Skip forms that are likely not contact forms
        if (this.isNonContactForm($form)) {
          return;
        }

        const fields: FormField[] = [];

        // Detect form fields
        $form.find("input, textarea, select").each((fieldIndex, fieldElement) => {
          const $field = $(fieldElement);
          const fieldName =
            $field.attr("name") || $field.attr("id") || `field-${fieldIndex}`;
          const fieldType = this.getFieldType($field);
          const required = this.isFieldRequired($field);
          const placeholder = $field.attr("placeholder") || "";

          // Skip hidden fields and submit buttons
          if (
            fieldType === "hidden" ||
            fieldType === "submit" ||
            fieldType === "button"
          ) {
            return;
          }

          // Only push allowed types
          if (
            ["text", "email", "textarea", "select", "checkbox", "radio"].includes(
              fieldType
            )
          ) {
            fields.push({
              name: fieldName,
              type: fieldType as FormField["type"],
              selector: this.generateSelector($field),
              required,
              placeholder,
            });
          }
        });

        if (fields.length > 0) {
          forms.push({
            id: formId,
            url: window.location.href,
            businessName: $("title").text() || "Unknown Business",
            fields,
            status: "pending",
          });
        }
    });

    return forms;
  }

  /**
   * Check if form is likely not a contact form
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isNonContactForm($form: cheerio.Cheerio<any>): boolean {
    const formText = $form.text().toLowerCase();
    const action = $form.attr("action")?.toLowerCase() || "";

    // Skip forms that are likely search, login, or other non-contact forms
    const nonContactPatterns = [
        "search",
        "login",
        "signin",
        "register",
        "signup",
        "newsletter",
        "subscribe",
        "comment",
        "review",
        "rating",
    ];

    return nonContactPatterns.some(
        (pattern) => formText.includes(pattern) || action.includes(pattern)
    );
  }

  /**
   * Determine the type of a form field
   */
  private getFieldType(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $field: cheerio.Cheerio<any>
  ): FormField["type"] | "hidden" | "submit" | "button" {
    const tagName = $field.prop("tagName")?.toLowerCase();
    const type = $field.attr("type")?.toLowerCase();

    if (tagName === "textarea") return "textarea";
    if (tagName === "select") return "select";
    if (type === "hidden") return "hidden";
    if (type === "submit") return "submit";
    if (type === "button") return "button";
    if (type === "email") return "email";
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    return "text";
  }

  /**
   * Check if field is required
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isFieldRequired($field: cheerio.Cheerio<any>): boolean {
    return (
        $field.attr("required") !== undefined ||
        $field.attr("aria-required") === "true" ||
        $field.hasClass("required")
    );
  }

  /**
   * Generate CSS selector for field
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateSelector($field: cheerio.Cheerio<any>): string {
    const id = $field.attr("id");
    const name = $field.attr("name");
    const tagName = $field.prop("tagName")?.toLowerCase();

    if (id) return `#${id}`;
    if (name) return `[name="${name}"]`;

    // Generate a more specific selector
    const classes = $field.attr("class");
    if (classes) {
        const classList = classes.split(" ").filter((c) => c.trim());
        if (classList.length > 0) {
          return `${tagName}.${classList[0]}`;
        }
    }

    return tagName || "input";
  }

  /**
   * Crawl a business website to find contact forms
   */
  async crawlBusinessWebsite(business: Business): Promise<CrawlResult> {
    const startTime = Date.now();
    const domain = this.extractDomain(business.website || "");

    if (!business.website) {
        return {
          url: "",
          businessName: business.name,
          formsFound: [],
          status: "error",
          error: "No website URL provided",
          crawlTime: Date.now() - startTime,
        };
    }

    // Check rate limit
    if (!(await rateLimiter.checkRateLimit(domain))) {
        return {
          url: business.website,
          businessName: business.name,
          formsFound: [],
          status: "error",
          error: "Rate limit exceeded for this domain",
          crawlTime: Date.now() - startTime,
        };
    }

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        const normalizedUrl = this.normalizeUrl(business.website);

        // Check if URL is accessible
        if (!(await this.isUrlAccessible(normalizedUrl))) {
          return {
            url: normalizedUrl,
            businessName: business.name,
            formsFound: [],
            status: "error",
            error: "Website not accessible",
            crawlTime: Date.now() - startTime,
          };
        }

        browser = await this.initBrowser();
        page = await browser.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        // Navigate to main page
        await page.goto(normalizedUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // Wait for page to load
        await new Promise((res) => setTimeout(res, 2000));

        // Get page content
        const html = await page.content();
        const $ = cheerio.load(html);

        // Detect forms on main page
        let formsFound = this.detectForms($);

        // If no forms found on main page, look for contact pages
        if (formsFound.length === 0) {
          const contactPages = await this.findContactPages(page, normalizedUrl);

          for (const contactUrl of contactPages) {
            try {
              await page.goto(contactUrl, {
                waitUntil: "networkidle2",
                timeout: 15000,
              });

              await new Promise((res) => setTimeout(res, 1000));

              const contactHtml = await page.content();
              const $contact = cheerio.load(contactHtml);

              const contactForms = this.detectForms($contact);
              formsFound.push(...contactForms);

              if (contactForms.length > 0) {
                break; // Found forms, no need to check more pages
              }
            } catch (error) {
              console.warn(`Error crawling contact page ${contactUrl}:`, error);
              continue;
            }
          }
        }

        // Update form URLs and business names
        formsFound = formsFound.map((form) => ({
          ...form,
          url: page?.url() || normalizedUrl,
          businessName: business.name,
        }));

        return {
          url: normalizedUrl,
          businessName: business.name,
          formsFound,
          status: formsFound.length > 0 ? "success" : "no-forms",
          crawlTime: Date.now() - startTime,
        };
    } catch (error) {
        console.error(`Error crawling ${business.website}:`, error);

        return {
          url: business.website,
          businessName: business.name,
          formsFound: [],
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          crawlTime: Date.now() - startTime,
        };
    } finally {
        if (page) await page.close();
        // Don't close browser here as it's reused
    }
  }

  /**
   * Crawl multiple business websites
   */
  async crawlBusinesses(businesses: Business[]): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];

    for (const business of businesses) {
        console.log(`Crawling website for: ${business.name}`);

        const result = await this.crawlBusinessWebsite(business);
        results.push(result);

        // Wait between requests to be respectful
        await rateLimiter.waitForDelay();
    }

    return results;
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
        await this.browser.close();
        this.browser = null;
    }
  }
}

// Export singleton instance
export const webCrawler = new WebCrawler();
