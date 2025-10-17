// import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import { geminiService } from "./gemini-service";

// Conditional import for Puppeteer
let puppeteer: any, Browser: any, Page: any;
if (
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_PUPPETEER === "true"
) {
  try {
    //     const puppeteerModule = require("puppeteer");
    puppeteer = puppeteerModule.default;
    Browser = puppeteerModule.Browser;
    Page = puppeteerModule.Page;
  } catch (error) {
    console.warn("Puppeteer not available in production environment");
  }
}

interface FastContactDetectionResult {
  url: string;
  title: string;
  confidence: number;
  detectionMethod:
    | "fast_pattern"
    | "ai_analysis"
    | "content_scan"
    | "deep_scan";
  hasContactForm: boolean;
  hasContactInfo: boolean;
  pageType: "contact" | "about" | "support" | "inquiry" | "other";
  contentSummary?: string;
  reasoning: string;
}

class FastContactDetector {
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
          timeout: parseInt(process.env.BROWSER_TIMEOUT || "15000"),
        });
    }
    return this.browser;
  }

  /**
   * Enhanced contact page detection with multiple strategies
   */
  async detectContactPagesFast(
    website: string,
    businessName: string
  ): Promise<FastContactDetectionResult[]> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
        // Set faster timeouts
        page.setDefaultTimeout(12000);
        page.setDefaultNavigationTimeout(12000);

        const results: FastContactDetectionResult[] = [];

        // Strategy 1: Quick URL pattern check (fastest)
        console.log("🔍 Strategy 1: Quick URL pattern check...");
        const quickPatterns = await this.quickUrlPatternCheck(website);
        results.push(...quickPatterns);

        // Strategy 2: Enhanced main page scan with deeper analysis
        console.log("🔍 Strategy 2: Enhanced main page scan...");
        const mainPageResults = await this.enhancedMainPageScan(
          page,
          website,
          businessName
        );
        results.push(...mainPageResults);

        // Strategy 3: Deep navigation scan with content verification
        console.log("🔍 Strategy 3: Deep navigation scan...");
        const navResults = await this.deepNavigationScan(page);
        results.push(...navResults);

        // Strategy 4: Sitemap and footer analysis
        console.log("🔍 Strategy 4: Sitemap and footer analysis...");
        const sitemapResults = await this.sitemapAndFooterScan(page);
        results.push(...sitemapResults);

        // Remove duplicates and sort by confidence
        const uniqueResults = this.removeDuplicates(results);
        const sortedResults = uniqueResults.sort(
          (a, b) => b.confidence - a.confidence
        );

        console.log(`✅ Found ${sortedResults.length} unique contact pages`);
        return sortedResults;
    } finally {
        await page.close();
    }
  }

  /**
   * Enhanced URL pattern check with more patterns
   */
  private async quickUrlPatternCheck(
    baseUrl: string
  ): Promise<FastContactDetectionResult[]> {
    const results: FastContactDetectionResult[] = [];

    // Enhanced contact page patterns including Japanese
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
        "/contacto",
        "/kontakt",
        "/contactez-nous",
        "/kontaktiere-uns",
        "/contact-form",
        "/contact-page",
        "/get-in-touch",
        "/reach-out",
        "/write-to-us",
        "/send-message",
        "/message-us",
        "/talk-to-us",
        "/form",
        "/contact/form",
        "/inquiry/form",
        "/enquiry/form",
        "/support",
        "/help",
        "/about",
        "/company",
        "/corporate",
        "/info",
        "/information",
        "/customer-service",
        "/customer-support",
        "/お客様サポート",
        "/サポート",
        "/ヘルプ",
        "/会社情報",
        "/企業情報",
        "/お客様相談室",
        "/お客様センター",
    ];

    // Test each pattern quickly
    for (const pattern of contactPatterns) {
        const testUrl = `${baseUrl}${pattern}`;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(testUrl, {
            method: "HEAD",
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (response.ok) {
            results.push({
              url: testUrl,
              title: `Contact Page - ${pattern}`,
              confidence: 85,
              detectionMethod: "fast_pattern",
              hasContactForm: true,
              hasContactInfo: true,
              pageType: "contact",
              reasoning: `Quick pattern match: ${pattern}`,
            });
          }
        } catch {
          // Continue to next pattern
        }
    }

    return results;
  }

  /**
   * Enhanced main page scan with deeper content analysis
   */
  private async enhancedMainPageScan(
    page: Page,
    website: string,
    businessName: string
  ): Promise<FastContactDetectionResult[]> {
    try {
        await page.goto(website, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });

        const html = await page.content();
        const $ = cheerio.load(html);
        const textContent = $("body").text().toLowerCase();
        const title = await page.title();

        // Enhanced content analysis
        const contactKeywords = [
          "contact",
          "inquiry",
          "enquiry",
          "reach us",
          "get in touch",
          "お問い合わせ",
          "連絡先",
          "コンタクト",
          "contacto",
          "kontakt",
          "form",
          "submit",
          "send message",
          "write to us",
          "customer service",
          "support",
          "help",
          "お客様サポート",
          "サポート",
          "ヘルプ",
          "フォーム",
          "送信",
          "メッセージ",
        ];

        const hasContactContent = contactKeywords.some((keyword) =>
          textContent.includes(keyword)
        );

        if (hasContactContent) {
          // Use AI for detailed analysis
          const aiAnalysis = await this.enhancedAIAnalysis(
            website,
            title,
            textContent.substring(0, 2000),
            businessName,
            html
          );

          return [
            {
              url: website,
              title: title,
              confidence: aiAnalysis.confidence,
              detectionMethod: "ai_analysis",
              hasContactForm: aiAnalysis.hasContactForm,
              hasContactInfo: aiAnalysis.hasContactInfo,
              pageType: aiAnalysis.pageType,
              contentSummary: aiAnalysis.contentSummary,
              reasoning: aiAnalysis.reasoning,
            },
          ];
        }

        return [];
    } catch (error) {
        console.warn("Enhanced main page scan failed:", error);
        return [];
    }
  }

  /**
   * Deep navigation scan with content verification
   */
  private async deepNavigationScan(
    page: Page
  ): Promise<FastContactDetectionResult[]> {
    try {
        const contactLinks = await page.evaluate(() => {
          const links: Array<{ href: string; text: string; isContact: boolean }> =
            [];
          const contactWords = [
            "contact",
            "inquiry",
            "enquiry",
            "reach",
            "get in touch",
            "お問い合わせ",
            "連絡先",
            "コンタクト",
            "form",
            "submit",
            "send",
            "message",
            "support",
            "help",
            "サポート",
            "ヘルプ",
            "フォーム",
            "送信",
            "メッセージ",
            "お客様",
            "customer",
            "service",
          ];

          const allLinks = document.querySelectorAll("a[href]");
          allLinks.forEach((link) => {
            const href = (link as HTMLAnchorElement).href.toLowerCase();
            const text = link.textContent?.toLowerCase().trim() || "";

            const hasContactText = contactWords.some((word) =>
              text.includes(word)
            );
            const hasContactUrl = contactWords.some((word) =>
              href.includes(word)
            );

            if (hasContactText || hasContactUrl) {
              links.push({
                href: (link as HTMLAnchorElement).href,
                text: text,
                isContact: true,
              });
            }
          });

          return links;
        });

        const results: FastContactDetectionResult[] = [];

        // Test found links with content verification
        for (const link of contactLinks.slice(0, 8)) {
          // Increased limit
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(link.href, {
              method: "GET",
              signal: controller.signal,
            });

            clearTimeout(timeout);

            if (response.ok) {
              const content = await response.text();
              const $ = cheerio.load(content);
              const pageTitle = $("title").text() || "Contact Page";
              const bodyText = $("body").text().toLowerCase();

              // Verify it's actually a contact page
              const hasContactForm =
                bodyText.includes("form") ||
                bodyText.includes("submit") ||
                bodyText.includes("送信") ||
                bodyText.includes("フォーム");

              const hasContactInfo =
                bodyText.includes("contact") ||
                bodyText.includes("phone") ||
                bodyText.includes("email") ||
                bodyText.includes("お問い合わせ") ||
                bodyText.includes("連絡先");

              if (hasContactForm || hasContactInfo) {
                results.push({
                  url: link.href,
                  title: pageTitle,
                  confidence: hasContactForm ? 90 : 75,
                  detectionMethod: "deep_scan",
                  hasContactForm: hasContactForm,
                  hasContactInfo: hasContactInfo,
                  pageType: "contact",
                  reasoning: `Found contact link: "${link.text}" with ${
                    hasContactForm ? "form" : "info"
                  }`,
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to verify link ${link.href}:`, error);
          }
        }

        return results;
    } catch (error) {
        console.warn("Deep navigation scan failed:", error);
        return [];
    }
  }

  /**
   * Sitemap and footer analysis
   */
  private async sitemapAndFooterScan(
    page: Page
  ): Promise<FastContactDetectionResult[]> {
    try {
        const footerLinks = await page.evaluate(() => {
          const links: string[] = [];
          const contactWords = [
            "contact",
            "inquiry",
            "enquiry",
            "お問い合わせ",
            "連絡先",
            "コンタクト",
            "support",
            "help",
            "サポート",
            "ヘルプ",
          ];

          // Look for footer links
          const footer = document.querySelector("footer");
          if (footer) {
            const footerLinks = footer.querySelectorAll("a[href]");
            footerLinks.forEach((link) => {
              const href = (link as HTMLAnchorElement).href.toLowerCase();
              const text = link.textContent?.toLowerCase() || "";

              const hasContactText = contactWords.some((word) =>
                text.includes(word)
              );
              const hasContactUrl = contactWords.some((word) =>
                href.includes(word)
              );

              if (hasContactText || hasContactUrl) {
                links.push((link as HTMLAnchorElement).href);
              }
            });
          }

          return [...new Set(links)];
        });

        const results: FastContactDetectionResult[] = [];

        // Test footer links
        for (const link of footerLinks.slice(0, 5)) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(link, {
              method: "GET",
              signal: controller.signal,
            });

            clearTimeout(timeout);

            if (response.ok) {
              const content = await response.text();
              const $ = cheerio.load(content);
              const pageTitle = $("title").text() || "Contact Page";
              const bodyText = $("body").text().toLowerCase();

              const hasContactForm =
                bodyText.includes("form") ||
                bodyText.includes("submit") ||
                bodyText.includes("送信");

              const hasContactInfo =
                bodyText.includes("contact") ||
                bodyText.includes("phone") ||
                bodyText.includes("email") ||
                bodyText.includes("お問い合わせ");

              if (hasContactForm || hasContactInfo) {
                results.push({
                  url: link,
                  title: pageTitle,
                  confidence: hasContactForm ? 85 : 70,
                  detectionMethod: "deep_scan",
                  hasContactForm: hasContactForm,
                  hasContactInfo: hasContactInfo,
                  pageType: "contact",
                  reasoning: "Found contact link in footer",
                });
              }
            }
          } catch {
            // Continue to next link
          }
        }

        return results;
    } catch (error) {
        console.warn("Sitemap and footer scan failed:", error);
        return [];
    }
  }

  /**
   * Enhanced AI analysis for content
   */
  private async enhancedAIAnalysis(
    url: string,
    title: string,
    content: string,
    businessName: string,
    html: string
  ): Promise<{
    confidence: number;
    hasContactForm: boolean;
    hasContactInfo: boolean;
    pageType: "contact" | "about" | "support" | "inquiry" | "other";
    contentSummary: string;
    reasoning: string;
  }> {
    try {
        // Check for forms in HTML
        const $ = cheerio.load(html);
        const forms = $("form");
        const hasForm = forms.length > 0;

        // Check for contact-related content
        const contactIndicators = [
          "contact",
          "inquiry",
          "enquiry",
          "form",
          "submit",
          "send",
          "お問い合わせ",
          "連絡先",
          "コンタクト",
          "フォーム",
          "送信",
        ];

        const hasContactContent = contactIndicators.some((indicator) =>
          content.toLowerCase().includes(indicator)
        );

        if (!geminiService.isAvailable()) {
          // Enhanced fallback analysis
          return {
            confidence: hasForm ? 80 : hasContactContent ? 65 : 50,
            hasContactForm: hasForm,
            hasContactInfo: hasContactContent,
            pageType: "contact",
            contentSummary: `Found ${forms.length} forms, contact content: ${hasContactContent}`,
            reasoning: "Enhanced pattern-based analysis (AI unavailable)",
          };
        }

        const analysis = await geminiService.analyzeContactPage(
          url,
          title,
          content,
          businessName
        );
        return {
          confidence: analysis.confidence,
          hasContactForm: analysis.hasContactForm,
          hasContactInfo: analysis.hasContactInfo,
          pageType: analysis.pageType,
          contentSummary: analysis.contentSummary,
          reasoning: analysis.reasoning,
        };
    } catch (error) {
        console.warn("Enhanced AI analysis failed:", error);
        return {
          confidence: 50,
          hasContactForm: false,
          hasContactInfo: false,
          pageType: "other",
          contentSummary: "Analysis failed",
          reasoning: "AI analysis unavailable",
        };
    }
  }

  /**
   * Remove duplicate results
   */
  private removeDuplicates(
    results: FastContactDetectionResult[]
  ): FastContactDetectionResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
        const key = result.url.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
    });
  }

  /**
   * Cleanup browser
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
        await this.browser.close();
        this.browser = null;
    }
  }
}

export const fastContactDetector = new FastContactDetector();
