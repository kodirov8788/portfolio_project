// import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { geminiService } from "./gemini-service";
import { rateLimiter } from "./rate-limiter";
import {
  ContactPageDetection,
  DetectedContactPage,
  ContactPageDetectionRequest,
} from "@/types";

class ContactPageDetector {
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
    if (!url.startsWith("http")) {
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
   * Find potential contact page URLs using pattern matching
   */
  private async findContactPageUrls(
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
          "/お問い合わせ",
          "/連絡先",
          "/コンタクト",
          "/inquiry",
          "/enquiry",
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
              "お問い合わせ",
              "連絡先",
              "コンタクト",
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

        return validUrls.slice(0, 10); // Limit to 10 contact pages
    } catch (error) {
        console.warn("Error finding contact page URLs:", error);
        return [];
    }
  }

  /**
   * Analyze a single page for contact information
   */
  private async analyzePage(
    page: Page,
    url: string,
    businessName: string
  ): Promise<DetectedContactPage | null> {
    try {
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 15000,
        });

        await new Promise((res) => setTimeout(res, 1000));

        const title = await page.title();
        const html = await page.content();
        const $ = cheerio.load(html);

        // Extract text content
        const textContent = $("body").text().replace(/\s+/g, " ").trim();

        // Check for forms
        const forms = $("form");
        const hasContactForm = forms.length > 0;

        // Pattern-based detection
        const patternConfidence = this.calculatePatternConfidence(
          url,
          title,
          textContent
        );

        // AI-based analysis (if available)
        let aiAnalysis = null;
        if (geminiService.isAvailable()) {
          try {
            aiAnalysis = await geminiService.analyzeContactPage(
              url,
              title,
              textContent,
              businessName
            );
          } catch (error) {
            console.warn("AI analysis failed, using pattern matching:", error);
          }
        }

        // Combine pattern and AI analysis
        const finalAnalysis = this.combineAnalysis(patternConfidence, aiAnalysis);

        if (finalAnalysis.confidence < 30) {
          return null; // Skip low-confidence pages
        }

        return {
          url,
          title,
          confidence: finalAnalysis.confidence,
          detectionMethod: aiAnalysis ? "ai" : "pattern",
          hasContactForm,
          hasContactInfo: finalAnalysis.hasContactInfo,
          pageType: finalAnalysis.pageType,
          contentSummary: finalAnalysis.contentSummary,
          verified: false,
        };
    } catch (error) {
        console.warn(`Error analyzing page ${url}:`, error);
        return null;
    }
  }

  /**
   * Calculate confidence based on pattern matching
   */
  private calculatePatternConfidence(
    url: string,
    title: string,
    content: string
  ): {
    confidence: number;
    hasContactInfo: boolean;
    pageType: "contact" | "about" | "support" | "inquiry" | "other";
  } {
    let confidence = 0;
    let hasContactInfo = false;

    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // URL patterns
    const urlPatterns = [
        { pattern: "contact", weight: 80 },
        { pattern: "inquiry", weight: 70 },
        { pattern: "enquiry", weight: 70 },
        { pattern: "reach", weight: 60 },
        { pattern: "お問い合わせ", weight: 85 },
        { pattern: "連絡先", weight: 80 },
        { pattern: "コンタクト", weight: 75 },
    ];

    for (const { pattern, weight } of urlPatterns) {
        if (urlLower.includes(pattern)) {
          confidence += weight;
          break;
        }
    }

    // Title patterns
    const titlePatterns = [
        { pattern: "contact", weight: 60 },
        { pattern: "inquiry", weight: 50 },
        { pattern: "お問い合わせ", weight: 70 },
        { pattern: "連絡先", weight: 65 },
    ];

    for (const { pattern, weight } of titlePatterns) {
        if (titleLower.includes(pattern)) {
          confidence += weight;
          break;
        }
    }

    // Content patterns
    const contactInfoPatterns = [
        "phone",
        "email",
        "address",
        "tel:",
        "mailto:",
        "電話",
        "メール",
        "住所",
    ];

    hasContactInfo = contactInfoPatterns.some((pattern) =>
        contentLower.includes(pattern)
    );

    if (hasContactInfo) {
        confidence += 30;
    }

    // Determine page type
    let pageType: "contact" | "about" | "support" | "inquiry" | "other" =
        "other";

    if (confidence >= 70) {
        pageType = "contact";
    } else if (urlLower.includes("about") || titleLower.includes("about")) {
        pageType = "about";
    } else if (urlLower.includes("support") || titleLower.includes("support")) {
        pageType = "support";
    } else if (urlLower.includes("inquiry") || urlLower.includes("enquiry")) {
        pageType = "inquiry";
    }

    return {
        confidence: Math.min(100, confidence),
        hasContactInfo,
        pageType,
    };
  }

  /**
   * Combine pattern and AI analysis
   */
  private combineAnalysis(
    patternAnalysis: {
        confidence: number;
        hasContactInfo: boolean;
        pageType: "contact" | "about" | "support" | "inquiry" | "other";
    },
    aiAnalysis: {
        isContactPage: boolean;
        confidence: number;
        pageType: "contact" | "about" | "support" | "inquiry" | "other";
        hasContactForm: boolean;
        hasContactInfo: boolean;
        contentSummary: string;
        reasoning: string;
    } | null
  ): {
    confidence: number;
    hasContactInfo: boolean;
    pageType: "contact" | "about" | "support" | "inquiry" | "other";
    contentSummary: string;
  } {
    if (!aiAnalysis) {
        return {
          confidence: patternAnalysis.confidence,
          hasContactInfo: patternAnalysis.hasContactInfo,
          pageType: patternAnalysis.pageType,
          contentSummary: "Pattern-based detection",
        };
    }

    // Weight AI analysis more heavily
    const aiWeight = 0.7;
    const patternWeight = 0.3;

    const combinedConfidence =
        aiAnalysis.confidence * aiWeight +
        patternAnalysis.confidence * patternWeight;

    return {
        confidence: Math.min(100, Math.round(combinedConfidence)),
        hasContactInfo:
          aiAnalysis.hasContactInfo || patternAnalysis.hasContactInfo,
        pageType:
          aiAnalysis.pageType !== "other"
            ? aiAnalysis.pageType
            : patternAnalysis.pageType,
        contentSummary: aiAnalysis.contentSummary || "Combined analysis",
    };
  }

  /**
   * Detect contact pages for a business
   */
  async detectContactPages(
    request: ContactPageDetectionRequest
  ): Promise<ContactPageDetection> {
    const startTime = Date.now();
    const domain = this.extractDomain(request.website);

    // Check rate limit
    if (!(await rateLimiter.checkRateLimit(domain))) {
        throw new Error("Rate limit exceeded for this domain");
    }

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        const normalizedUrl = this.normalizeUrl(request.website);

        // Check if URL is accessible
        if (!(await this.isUrlAccessible(normalizedUrl))) {
          throw new Error("Website not accessible");
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

        // Find potential contact page URLs
        const contactPageUrls = await this.findContactPageUrls(
          page,
          normalizedUrl
        );

        // Analyze each potential contact page
        const detectedPages: DetectedContactPage[] = [];
        let totalPagesChecked = 0;

        for (const url of contactPageUrls) {
          totalPagesChecked++;
          const analysis = await this.analyzePage(
            page,
            url,
            request.businessName
          );

          if (analysis) {
            detectedPages.push(analysis);
          }

          // Rate limiting between requests
          await rateLimiter.waitForDelay();
        }

        // Calculate overall confidence
        const overallConfidence =
          detectedPages.length > 0
            ? detectedPages.reduce((sum, page) => sum + page.confidence, 0) /
              detectedPages.length
            : 0;

        return {
          id: `detection_${Date.now()}`,
          businessContactId: request.businessContactId,
          website: normalizedUrl,
          detectedPages,
          status: "completed",
          confidence: Math.round(overallConfidence),
          totalPagesChecked,
          detectionTime: Date.now() - startTime,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
    } catch (error) {
        return {
          id: `detection_${Date.now()}`,
          businessContactId: request.businessContactId,
          website: request.website,
          detectedPages: [],
          status: "failed",
          confidence: 0,
          totalPagesChecked: 0,
          detectionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : "Unknown error",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
    } finally {
        if (page) await page.close();
        // Don't close browser here as it's reused
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
        await this.browser.close();
        this.browser = null;
    }
  }
}

// Export singleton instance
export const contactPageDetector = new ContactPageDetector();
