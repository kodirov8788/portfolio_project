// Conditional imports for production vs development
let Browser: any, Page: any, chromium: any;

// Only import Playwright in development or when explicitly needed
if (
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_PLAYWRIGHT === "true"
) {
  try {
    const playwright = require("playwright");
    Browser = playwright.Browser;
    Page = playwright.Page;
    chromium = playwright.chromium;
  } catch (error) {
    console.warn("Playwright not available in production environment");
  }
}

import * as dns from "dns";
import { promisify } from "util";

const dnsResolve = promisify(dns.resolve);

// Types
export interface ContactFinderOptions {
  maxPages?: number;
  maxDepth?: number;
  enableVerification?: boolean;
  userAgent?: string;
  rateLimit?: number; // requests per second
  timeout?: number; // milliseconds
}

export interface ContactSource {
  type: "mailto" | "jsonld" | "visible" | "form";
  url: string;
  snippet: string;
  confidence: number;
}

export interface Contact {
  email: string;
  confidence: number;
  status: "deliverable" | "risky" | "undeliverable" | "unknown";
  sources: ContactSource[];
  domain: string;
  isRoleEmail: boolean;
}

export interface ContactPage {
  url: string;
  reason: string;
  confidence: number;
  hasContactForm: boolean;
  formFields?: string[];
}

export interface ContactForm {
  url: string;
  fields: string[];
  action?: string;
  method?: string;
}

export interface ContactFinderResult {
  version: "1.0";
  domain: string;
  startedAt: string;
  pagesScanned: number;
  contacts: Contact[];
  contactPages: ContactPage[];
  forms: ContactForm[];
  robotsTxtRespected: boolean;
  errors: string[];
}

export class ContactFinder {
  private browser: Browser | null = null;
  private options: Required<ContactFinderOptions>;
  private visitedUrls = new Set<string>();
  private contactPages = new Map<string, ContactPage>();
  private forms = new Map<string, ContactForm>();
  private contacts = new Map<string, Contact>();
  private errors: string[] = [];

  // Contact-related keywords in multiple languages
  private readonly contactKeywords = [
    // English
    "contact",
    "support",
    "help",
    "about",
    "company",
    "team",
    "inquiry",
    "reach",
    // Japanese
    "お問い合わせ",
    "連絡先",
    "会社情報",
    "特商法表記",
    "サポート",
    "ヘルプ",
    // German
    "impressum",
    "kontakt",
    "unternehmen",
    // French
    "contact",
    "entreprise",
    "équipe",
  ];

  // Email obfuscation patterns
  private readonly obfuscationPatterns = [
    { pattern: /\[at\]/gi, replacement: "@" },
    { pattern: /\(dot\)/gi, replacement: "." },
    { pattern: /＠/g, replacement: "@" },
    { pattern: /．/g, replacement: "." },
    { pattern: /\[dot\]/gi, replacement: "." },
    { pattern: /\s+at\s+/gi, replacement: "@" },
    { pattern: /\s+dot\s+/gi, replacement: "." },
  ];

  // Strict email regex
  private readonly emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Role email patterns
  private readonly roleEmailPatterns = [
    /^info@/i,
    /^support@/i,
    /^contact@/i,
    /^hello@/i,
    /^sales@/i,
    /^marketing@/i,
    /^press@/i,
    /^admin@/i,
    /^webmaster@/i,
    /^noreply@/i,
    /^no-reply@/i,
  ];

  constructor(options: ContactFinderOptions = {}) {
    this.options = {
        maxPages: options.maxPages || 30,
        maxDepth: options.maxDepth || 3,
        enableVerification: options.enableVerification ?? true,
        userAgent:
          options.userAgent ||
          "AutoReachPro Contact Finder (contact@autoreachpro.com)",
        rateLimit: options.rateLimit || 2,
        timeout: options.timeout || 10000,
    };
  }

  async findContacts(url: string): Promise<ContactFinderResult> {
    const startTime = new Date().toISOString();
    const domain = new URL(url).hostname;
    let pagesScanned = 0;
    let robotsTxtRespected = true; // Default to true

    // Production fallback - return basic result without Playwright
    if (!chromium || process.env.NODE_ENV === "production") {
        console.warn(
          "ContactFinder: Playwright not available in production, returning basic result"
        );
        return {
          version: "1.0",
          contacts: [],
          contactPages: [],
          contactForms: [],
          metadata: {
            startTime,
            endTime: new Date().toISOString(),
            pagesScanned: 0,
            robotsTxtRespected: true,
            domain,
            userAgent: this.options.userAgent,
            parameters: {
              maxPages: this.options.maxPages,
              maxDepth: this.options.maxDepth,
              enableVerification: this.options.enableVerification,
            },
          },
        };
    }

    try {
        // Check robots.txt
        robotsTxtRespected = await this.checkRobotsTxt(url);

        // Initialize browser
        await this.initBrowser();

        // Start crawling
        const urlsToVisit = await this.getSeedUrls(url);
        const contactPageUrls = new Set<string>();

        // First pass: Find potential contact pages
        for (const seedUrl of Array.from(urlsToVisit)) {
          if (this.visitedUrls.size >= this.options.maxPages) break;

          try {
            const page = await this.browser!.newPage();
            await this.setupPage(page);

            const result = await this.analyzePageForContactPages(page, seedUrl);
            if (result.isContactPage) {
              contactPageUrls.add(seedUrl);
              this.contactPages.set(seedUrl, {
                url: seedUrl,
                reason: result.reason,
                confidence: result.confidence,
                hasContactForm: result.hasContactForm,
                formFields: result.formFields,
              });
            }

            await page.close();
            pagesScanned++;

            // Rate limiting
            await this.delay(1000 / this.options.rateLimit);
          } catch (error) {
            this.errors.push(`Failed to analyze ${seedUrl}: ${error}`);
          }
        }

        // Second pass: Extract contacts from contact pages
        for (const contactUrl of Array.from(contactPageUrls)) {
          if (this.visitedUrls.size >= this.options.maxPages) break;

          try {
            const page = await this.browser!.newPage();
            await this.setupPage(page);

            await this.extractContactsFromPage(page, contactUrl, domain);
            await page.close();

            // Rate limiting
            await this.delay(1000 / this.options.rateLimit);
          } catch (error) {
            this.errors.push(
              `Failed to extract contacts from ${contactUrl}: ${error}`
            );
          }
        }

        // Verify contacts if enabled
        if (this.options.enableVerification) {
          await this.verifyContacts();
        }
    } catch (error) {
        this.errors.push(`Contact finder error: ${error}`);
    } finally {
        await this.cleanup();
    }

    return {
        version: "1.0",
        domain,
        startedAt: startTime,
        pagesScanned,
        contacts: Array.from(this.contacts.values()),
        contactPages: Array.from(this.contactPages.values()),
        forms: Array.from(this.forms.values()),
        robotsTxtRespected: robotsTxtRespected,
        errors: this.errors,
    };
  }

  private async initBrowser(): Promise<void> {
    if (!chromium) {
        throw new Error("Playwright not available in production environment");
    }

    if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
          ],
        });
    }
  }

  private async setupPage(page: any): Promise<void> {
    await page.setUserAgent(this.options.userAgent);
    await page.setViewport({ width: 1280, height: 720 });
    page.setDefaultTimeout(this.options.timeout);
  }

  private async getSeedUrls(baseUrl: string): Promise<string[]> {
    const urls = new Set<string>();
    const base = new URL(baseUrl);

    // Add common contact page patterns
    const patterns = [
        "/",
        "/contact",
        "/about",
        "/company",
        "/support",
        "/help",
        "/inquiry",
        "/お問い合わせ",
        "/連絡先",
        "/会社情報",
        "/sitemap.xml",
    ];

    for (const pattern of patterns) {
        try {
          const url = new URL(pattern, base).href;
          urls.add(url);
        } catch {
          // Skip invalid URLs
        }
    }

    return Array.from(urls);
  }

  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
        const robotsUrl = new URL("/robots.txt", url).href;
        const response = await fetch(robotsUrl, {
          headers: { "User-Agent": this.options.userAgent },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const robotsTxt = await response.text();
          // Basic robots.txt parsing - in production, use a proper parser
          const userAgentMatch = robotsTxt.match(/User-agent:\s*\*/i);
          const disallowMatch = robotsTxt.match(/Disallow:\s*(.+)/i);

          if (userAgentMatch && disallowMatch) {
            const disallowPath = disallowMatch[1].trim();
            if (disallowPath === "/" || disallowPath.includes("contact")) {
              return false; // Robots.txt disallows crawling
            }
          }
        }
        return true; // Assume allowed if no robots.txt or no restrictions
    } catch {
        return true; // Assume allowed if robots.txt check fails
    }
  }

  private async analyzePageForContactPages(
    page: Page,
    url: string
  ): Promise<{
    isContactPage: boolean;
    reason: string;
    confidence: number;
    hasContactForm: boolean;
    formFields?: string[];
  }> {
    try {
        await page.goto(url, {
          waitUntil: "networkidle",
          timeout: this.options.timeout,
        });
        await this.delay(1000); // Wait for dynamic content

        const content = await page.content();
        const document = this.parseHTML(content);

        // Check URL patterns
        const urlLower = url.toLowerCase();
        let confidence = 0;
        let reason = "";

        if (urlLower.includes("contact") || urlLower.includes("お問い合わせ")) {
          confidence += 3;
          reason = "URL contains contact keywords";
        }

        // Check page title
        const title = document.title?.toLowerCase() || "";
        if (this.contactKeywords.some((keyword) => title.includes(keyword))) {
          confidence += 2;
          reason += reason ? "; " : "";
          reason += "Title contains contact keywords";
        }

        // Check headings
        const headings = this.extractHeadings(content);
        const headingText = headings
          .map((h: any) => h.textContent?.toLowerCase() || "")
          .join(" ");
        if (
          this.contactKeywords.some((keyword) => headingText.includes(keyword))
        ) {
          confidence += 2;
          reason += reason ? "; " : "";
          reason += "Headings contain contact keywords";
        }

        // Check for contact forms
        const forms = this.extractForms(content);
        let hasContactForm = false;
        let formFields: string[] = [];

        for (const form of forms) {
          const inputs = this.extractFormInputs(form);
          const fieldNames = inputs
            .map(
              (input: any) =>
                input.getAttribute("name") || input.getAttribute("id") || ""
            )
            .filter((name: string) => name.length > 0);

          // Check if form looks like a contact form
          const formText = form.textContent?.toLowerCase() || "";
          const hasContactKeywords = this.contactKeywords.some((keyword) =>
            formText.includes(keyword)
          );
          const hasEmailField = fieldNames.some(
            (name) =>
              name.toLowerCase().includes("email") ||
              name.toLowerCase().includes("mail")
          );
          const hasMessageField = fieldNames.some(
            (name) =>
              name.toLowerCase().includes("message") ||
              name.toLowerCase().includes("comment") ||
              name.toLowerCase().includes("inquiry")
          );

          if (hasContactKeywords || (hasEmailField && hasMessageField)) {
            hasContactForm = true;
            formFields = fieldNames;
            confidence += 3;
            reason += reason ? "; " : "";
            reason += "Contains contact form";
            break;
          }
        }

        // Check for contact information
        const bodyText = document.body?.textContent?.toLowerCase() || "";
        if (this.contactKeywords.some((keyword) => bodyText.includes(keyword))) {
          confidence += 1;
          reason += reason ? "; " : "";
          reason += "Page content contains contact keywords";
        }

        return {
          isContactPage: confidence >= 4,
          reason: reason || "General page analysis",
          confidence,
          hasContactForm,
          formFields: formFields.length > 0 ? formFields : undefined,
        };
    } catch (error) {
        this.errors.push(`Failed to analyze page ${url}: ${error}`);
        return {
          isContactPage: false,
          reason: "Analysis failed",
          confidence: 0,
          hasContactForm: false,
        };
    }
  }

  private async extractContactsFromPage(
    page: Page,
    url: string,
    domain: string
  ): Promise<void> {
    try {
        await page.goto(url, {
          waitUntil: "networkidle",
          timeout: this.options.timeout,
        });
        await this.delay(1000);

        const content = await page.content();
        const document = this.parseHTML(content);

        // Extract from mailto links
        const mailtoLinks = this.extractMailtoLinks(content);
        for (const link of mailtoLinks) {
          const href = link.getAttribute("href");
          if (href) {
            const email = href.replace("mailto:", "").split("?")[0].trim();
            if (this.isValidEmail(email)) {
              this.addContact(
                email,
                {
                  type: "mailto",
                  url,
                  snippet: link.textContent?.trim() || email,
                  confidence: 3,
                },
                domain
              );
            }
          }
        }

        // Extract from JSON-LD
        const jsonLdScripts = this.extractJsonLdScripts(content);
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse(script.textContent || "{}");
            const emails = this.extractEmailsFromJsonLd(data);
            for (const email of emails) {
              this.addContact(
                email,
                {
                  type: "jsonld",
                  url,
                  snippet: "JSON-LD structured data",
                  confidence: 2,
                },
                domain
              );
            }
          } catch {
            // Skip invalid JSON-LD
          }
        }

        // Extract from visible text
        const bodyText = document.body?.textContent || "";
        const emails = this.extractEmailsFromText(bodyText);
        for (const email of emails) {
          this.addContact(
            email,
            {
              type: "visible",
              url,
              snippet: this.getEmailSnippet(bodyText, email),
              confidence: 1,
            },
            domain
          );
        }

        // Extract contact forms
        const forms = this.extractForms(content);
        for (const form of forms) {
          const inputs = this.extractFormInputs(form);
          const fieldNames = inputs
            .map(
              (input: any) =>
                input.getAttribute("name") || input.getAttribute("id") || ""
            )
            .filter((name: string) => name.length > 0);

          if (fieldNames.length > 0) {
            this.forms.set(url, {
              url,
              fields: fieldNames,
              action: form.getAttribute("action") || undefined,
              method: form.getAttribute("method") || undefined,
            });
          }
        }
    } catch (error) {
        this.errors.push(`Failed to extract contacts from ${url}: ${error}`);
    }
  }

  private extractEmailsFromJsonLd(data: any): string[] {
    const emails: string[] = [];

    if (typeof data === "object" && data !== null) {
        // Check for Organization.contactPoint.email
        if (data["@type"] === "Organization" && data.contactPoint) {
          const contactPoints = Array.isArray(data.contactPoint)
            ? data.contactPoint
            : [data.contactPoint];
          for (const contactPoint of contactPoints) {
            if (contactPoint.email && this.isValidEmail(contactPoint.email)) {
              emails.push(contactPoint.email);
            }
          }
        }

        // Recursively search for email fields
        for (const value of Object.values(data)) {
          if (typeof value === "string" && this.isValidEmail(value)) {
            emails.push(value);
          } else if (typeof value === "object" && value !== null) {
            emails.push(...this.extractEmailsFromJsonLd(value));
          }
        }
    }

    return emails;
  }

  private extractEmailsFromText(text: string): string[] {
    const emails: string[] = [];

    // Normalize obfuscated emails
    let normalizedText = text;
    for (const { pattern, replacement } of this.obfuscationPatterns) {
        normalizedText = normalizedText.replace(pattern, replacement);
    }

    // Find email patterns
    const emailPattern =
        /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;
    const matches = normalizedText.match(emailPattern) || [];

    for (const match of matches) {
        if (this.isValidEmail(match)) {
          emails.push(match.toLowerCase());
        }
    }

    return [...new Set(emails)]; // Remove duplicates
  }

  private isValidEmail(email: string): boolean {
    return this.emailRegex.test(email) && email.length <= 254;
  }

  private getEmailSnippet(text: string, email: string): string {
    const index = text.toLowerCase().indexOf(email.toLowerCase());
    if (index === -1) return email;

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + email.length + 50);
    return text.substring(start, end).trim();
  }

  private addContact(
    email: string,
    source: ContactSource,
    domain: string
  ): void {
    const normalizedEmail = email.toLowerCase();

    if (this.contacts.has(normalizedEmail)) {
        const existing = this.contacts.get(normalizedEmail)!;
        existing.sources.push(source);
        existing.confidence = Math.max(existing.confidence, source.confidence);
    } else {
        const contact: Contact = {
          email: normalizedEmail,
          confidence: source.confidence,
          status: "unknown",
          sources: [source],
          domain: new URL(email.split("@")[1] || "").hostname,
          isRoleEmail: this.roleEmailPatterns.some((pattern) =>
            pattern.test(normalizedEmail)
          ),
        };

        // Boost confidence for role emails
        if (contact.isRoleEmail) {
          contact.confidence += 2;
        }

        // Boost confidence if domain matches
        if (contact.domain === domain) {
          contact.confidence += 2;
        }

        this.contacts.set(normalizedEmail, contact);
    }
  }

  private async verifyContacts(): Promise<void> {
    const contacts = Array.from(this.contacts.values());

    for (const contact of contacts) {
        try {
          // DNS MX lookup
          const domain = contact.email.split("@")[1];
          const mxRecords = await dnsResolve(domain, "MX");

          if (mxRecords && mxRecords.length > 0) {
            contact.status = "deliverable";
          } else {
            contact.status = "undeliverable";
          }
        } catch {
          contact.status = "unknown";
        }

        // Rate limiting for DNS lookups
        await this.delay(100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
        await this.browser.close();
        this.browser = null;
    }
  }

  getUserAgent(): string {
    return this.options.userAgent;
  }

  // Helper methods for HTML parsing (simplified versions without JSDOM)
  private parseHTML(html: string): any {
    // Simple HTML parser - in production, use JSDOM or similar
    return {
        title: this.extractTitle(html),
        body: { textContent: this.extractTextContent(html) },
        querySelectorAll: (selector: string) =>
          this.simpleQuerySelectorAll(html, selector),
    };
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return titleMatch ? titleMatch[1] : "";
  }

  private extractTextContent(html: string): string {
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
  }

  private simpleQuerySelectorAll(html: string, selector: string): any[] {
    // Simplified selector implementation
    if (selector === "h1, h2, h3, h4, h5, h6") {
        return this.extractHeadings(html);
    }
    if (selector === 'a[href^="mailto:"]') {
        return this.extractMailtoLinks(html);
    }
    if (selector === 'script[type="application/ld+json"]') {
        return this.extractJsonLdScripts(html);
    }
    if (selector === "form") {
        return this.extractForms(html);
    }
    return [];
  }

  private extractHeadings(html: string): any[] {
    const headingRegex = /<(h[1-6])[^>]*>([^<]*)<\/\1>/gi;
    const headings: any[] = [];
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
        headings.push({
          textContent: match[2],
          tagName: match[1].toUpperCase(),
        });
    }
    return headings;
  }

  private extractMailtoLinks(html: string): any[] {
    const mailtoRegex =
        /<a[^>]*href=["']mailto:([^"']*)["'][^>]*>([^<]*)<\/a>/gi;
    const links: any[] = [];
    let match;
    while ((match = mailtoRegex.exec(html)) !== null) {
        links.push({
          getAttribute: (attr: string) =>
            attr === "href" ? `mailto:${match[1]}` : null,
          textContent: match[2],
        });
    }
    return links;
  }

  private extractJsonLdScripts(html: string): any[] {
    const scriptRegex =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]*)<\/script>/gi;
    const scripts: any[] = [];
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        scripts.push({
          textContent: match[1],
        });
    }
    return scripts;
  }

  private extractForms(html: string): any[] {
    const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
    const forms: any[] = [];
    let match;
    while ((match = formRegex.exec(html)) !== null) {
        forms.push({
          textContent: this.extractTextContent(match[1]),
          getAttribute: (attr: string) => {
            const attrMatch = match[0].match(
              new RegExp(`${attr}=["']([^"']*)["']`, "i")
            );
            return attrMatch ? attrMatch[1] : null;
          },
        });
    }
    return forms;
  }

  private extractFormInputs(formHtml: string): any[] {
    const inputRegex = /<(input|textarea|select)[^>]*>/gi;
    const inputs: any[] = [];
    let match;
    while ((match = inputRegex.exec(formHtml)) !== null) {
        inputs.push({
          getAttribute: (attr: string) => {
            const attrMatch = match[0].match(
              new RegExp(`${attr}=["']([^"']*)["']`, "i")
            );
            return attrMatch ? attrMatch[1] : null;
          },
        });
    }
    return inputs;
  }
}
