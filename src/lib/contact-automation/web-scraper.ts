// import { Page } from "puppeteer";
import * as cheerio from "cheerio";

export interface ScrapedData {
  emails: string[];
  phones: string[];
  contactLinks: string[];
  forms: {
    total: number;
    contactForms: number;
    formDetails: Array<{
        action: string;
        method: string;
        fields: string[];
    }>;
  };
  tables: Array<{
    selector: string;
    rows: number;
    columns: number;
    data: string[][];
  }>;
  links: Array<{
    text: string;
    url: string;
    isContact: boolean;
  }>;
  content: {
    title: string;
    description: string;
    keywords: string[];
    textContent: string;
  };
}

export interface ScrapingResult {
  success: boolean;
  data: ScrapedData;
  error?: string;
  timestamp: Date;
}

export class WebScraper {
  /**
   * Scrape comprehensive data from a webpage
   */
  async scrapePage(page: Page): Promise<ScrapingResult> {
    try {
        const result = await page.evaluate(() => {
          // Email regex pattern
          const emailRegex =
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

          // Phone regex patterns (international and Japanese)
          const phoneRegex =
            /(\+?[0-9]{1,4}[-.\s]?)?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g;
          const japanesePhoneRegex =
            /0[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{4}/g;
          const japanesePhoneWithAreaRegex =
            /0[3-9][0-9]{1,3}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{4}/g;

          // Contact keywords
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

          // Extract emails
          const pageText = document.body.textContent || "";
          const emails = [...new Set(pageText.match(emailRegex) || [])];

          // Extract phones
          const phones = [
            ...new Set(pageText.match(phoneRegex) || []),
            ...new Set(pageText.match(japanesePhoneRegex) || []),
            ...new Set(pageText.match(japanesePhoneWithAreaRegex) || []),
          ];

          // Extract contact links
          const contactLinks: string[] = [];
          const allLinks = document.querySelectorAll("a[href]");
          allLinks.forEach((link) => {
            const href = (link as HTMLAnchorElement).href.toLowerCase();
            const text = link.textContent?.toLowerCase() || "";

            const isContactLink = contactKeywords.some(
              (keyword) => href.includes(keyword) || text.includes(keyword)
            );

            if (isContactLink) {
              contactLinks.push((link as HTMLAnchorElement).href);
            }
          });

          // Analyze forms
          const forms = document.querySelectorAll("form");
          const formDetails = Array.from(forms).map((form) => {
            const formElement = form as HTMLFormElement;
            const fields = Array.from(
              formElement.querySelectorAll("input, textarea, select")
            )
              .map((field) => (field as HTMLInputElement).name || "")
              .filter((name) => name.length > 0);

            return {
              action: formElement.action || "",
              method: formElement.method || "get",
              fields,
            };
          });

          const contactForms = formDetails.filter((form) =>
            contactKeywords.some((keyword) =>
              form.action.toLowerCase().includes(keyword)
            )
          ).length;

          // Extract tables
          const tables = Array.from(document.querySelectorAll("table")).map(
            (table) => {
              const rows = table.querySelectorAll("tr");
              const tableData: string[][] = [];

              rows.forEach((row) => {
                const cells = row.querySelectorAll("td, th");
                const rowData = Array.from(cells).map(
                  (cell) => cell.textContent?.trim() || ""
                );
                if (rowData.length > 0) {
                  tableData.push(rowData);
                }
              });

              // Generate selector for DOM element
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

              return {
                selector: generateSelector(table),
                rows: tableData.length,
                columns:
                  tableData.length > 0
                    ? Math.max(...tableData.map((row) => row.length))
                    : 0,
                data: tableData,
              };
            }
          );

          // Extract all links
          const links = Array.from(allLinks).map((link) => {
            const href = (link as HTMLAnchorElement).href;
            const text = link.textContent?.trim() || "";
            const isContact = contactKeywords.some(
              (keyword) =>
                href.toLowerCase().includes(keyword) ||
                text.toLowerCase().includes(keyword)
            );

            return {
              text,
              url: href,
              isContact,
            };
          });

          // Extract content metadata
          const title = document.title || "";
          const description =
            document
              .querySelector('meta[name="description"]')
              ?.getAttribute("content") || "";
          const keywords =
            document
              .querySelector('meta[name="keywords"]')
              ?.getAttribute("content")
              ?.split(",")
              .map((k) => k.trim()) || [];
          const textContent =
            document.body.textContent?.replace(/\s+/g, " ").trim() || "";

          return {
            emails,
            phones,
            contactLinks: [...new Set(contactLinks)],
            forms: {
              total: forms.length,
              contactForms,
              formDetails,
            },
            tables,
            links,
            content: {
              title,
              description,
              keywords,
              textContent,
            },
          };
        });

        return {
          success: true,
          data: result,
          timestamp: new Date(),
        };
    } catch (error) {
        console.error("Error scraping page:", error);
        return {
          success: false,
          data: {
            emails: [],
            phones: [],
            contactLinks: [],
            forms: { total: 0, contactForms: 0, formDetails: [] },
            tables: [],
            links: [],
            content: {
              title: "",
              description: "",
              keywords: [],
              textContent: "",
            },
          },
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        };
    }
  }

  /**
   * Extract specific data from HTML content
   */
  extractFromHTML(html: string): ScrapedData {
    try {
        const $ = cheerio.load(html);

        // Email extraction
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const textContent = $("body").text();
        const emails = [...new Set(textContent.match(emailRegex) || [])];

        // Phone extraction
        const phoneRegex =
          /(\+?[0-9]{1,4}[-.\s]?)?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g;
        const japanesePhoneRegex = /0[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{4}/g;
        const japanesePhoneWithAreaRegex =
          /0[3-9][0-9]{1,3}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{4}/g;
        const phones = [
          ...new Set(textContent.match(phoneRegex) || []),
          ...new Set(textContent.match(japanesePhoneRegex) || []),
          ...new Set(textContent.match(japanesePhoneWithAreaRegex) || []),
        ];

        // Contact links extraction
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

        const contactLinks: string[] = [];
        $("a[href]").each((_, element) => {
          const href = $(element).attr("href")?.toLowerCase() || "";
          const text = $(element).text().toLowerCase();

          const isContactLink = contactKeywords.some(
            (keyword) => href.includes(keyword) || text.includes(keyword)
          );

          if (isContactLink) {
            contactLinks.push($(element).attr("href") || "");
          }
        });

        // Form analysis
        const forms = $("form");
        const formDetails = forms
          .map((_, form) => {
            const $form = $(form);
            const fields = $form
              .find("input, textarea, select")
              .map((_, field) => $(field).attr("name") || "")
              .get()
              .filter((name) => name.length > 0);

            return {
              action: $form.attr("action") || "",
              method: $form.attr("method") || "get",
              fields,
            };
          })
          .get();

        const contactForms = formDetails.filter((form) =>
          contactKeywords.some((keyword) =>
            form.action.toLowerCase().includes(keyword)
          )
        ).length;

        // Table extraction
        const tables = $("table")
          .map((_, table) => {
            const $table = $(table);
            const rows = $table.find("tr");
            const tableData: string[][] = [];

            rows.each((_, row) => {
              const cells = $(row).find("td, th");
              const rowData = cells.map((_, cell) => $(cell).text().trim()).get();
              if (rowData.length > 0) {
                tableData.push(rowData);
              }
            });

            return {
              selector: this.generateSelector($table),
              rows: tableData.length,
              columns:
                tableData.length > 0
                  ? Math.max(...tableData.map((row) => row.length))
                  : 0,
              data: tableData,
            };
          })
          .get();

        // Links extraction
        const links = $("a[href]")
          .map((_, link) => {
            const $link = $(link);
            const href = $link.attr("href") || "";
            const text = $link.text().trim();
            const isContact = contactKeywords.some(
              (keyword) =>
                href.toLowerCase().includes(keyword) ||
                text.toLowerCase().includes(keyword)
            );

            return {
              text,
              url: href,
              isContact,
            };
          })
          .get();

        // Content metadata
        const title = $("title").text() || "";
        const description = $('meta[name="description"]').attr("content") || "";
        const keywords =
          $('meta[name="keywords"]')
            .attr("content")
            ?.split(",")
            .map((k) => k.trim()) || [];
        const content = $("body").text().replace(/\s+/g, " ").trim();

        return {
          emails,
          phones,
          contactLinks: [...new Set(contactLinks)],
          forms: {
            total: forms.length,
            contactForms,
            formDetails,
          },
          tables,
          links,
          content: {
            title,
            description,
            keywords,
            textContent: content,
          },
        };
    } catch (error) {
        console.error("Error extracting from HTML:", error);
        return {
          emails: [],
          phones: [],
          contactLinks: [],
          forms: { total: 0, contactForms: 0, formDetails: [] },
          tables: [],
          links: [],
          content: { title: "", description: "", keywords: [], textContent: "" },
        };
    }
  }

  /**
   * Generate a unique selector for an element
   */
  private generateSelector(element: cheerio.Cheerio<unknown>): string {
    const el = element[0] as {
        attribs?: { id?: string; class?: string };
        tagName?: string;
    };
    if (!el) return "";

    if (el.attribs?.id) {
        return `#${el.attribs.id}`;
    }

    if (el.attribs?.class) {
        const classes = el.attribs.class
          .split(" ")
          .filter((c: string) => c.trim())
          .join(".");
        return `${el.tagName}.${classes}`;
    }

    return el.tagName || "";
  }

  /**
   * Check if a URL is accessible
   */
  async isUrlAccessible(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
  }

  /**
   * Extract structured data from a page
   */
  async extractStructuredData(page: Page): Promise<{
    jsonLd: Record<string, unknown>[];
    microdata: Array<{
        itemType: string | null;
        properties: Record<string, string>;
    }>;
    rdfa: Array<{ type: string | null; properties: Record<string, string> }>;
  }> {
    try {
        const result = await page.evaluate(() => {
          // JSON-LD
          const jsonLd = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]')
          )
            .map((script) => {
              try {
                return JSON.parse(script.textContent || "");
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          // Microdata
          const microdata = Array.from(
            document.querySelectorAll("[itemtype]")
          ).map((element) => {
            const itemType = element.getAttribute("itemtype");
            const properties: Record<string, string> = {};

            element.querySelectorAll("[itemprop]").forEach((prop) => {
              const name = prop.getAttribute("itemprop");
              const value =
                prop.getAttribute("content") || prop.textContent?.trim() || "";
              if (name) {
                properties[name] = value;
              }
            });

            return { itemType, properties };
          });

          // RDFa
          const rdfa = Array.from(document.querySelectorAll("[typeof]")).map(
            (element) => {
              const type = element.getAttribute("typeof");
              const properties: Record<string, string> = {};

              element.querySelectorAll("[property]").forEach((prop) => {
                const name = prop.getAttribute("property");
                const value =
                  prop.getAttribute("content") || prop.textContent?.trim() || "";
                if (name) {
                  properties[name] = value;
                }
              });

              return { type, properties };
            }
          );

          return { jsonLd, microdata, rdfa };
        });

        return result;
    } catch (error) {
        console.error("Error extracting structured data:", error);
        return { jsonLd: [], microdata: [], rdfa: [] };
    }
  }
}

export const webScraper = new WebScraper();
