// OpenAI API service following project patterns
import OpenAI from "openai";

// Initialize OpenAI client conditionally
let openaiClient: OpenAI | null = null;

function getOpenaiClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OpenAI API key not configured");
    }
    openaiClient = new OpenAI({
        apiKey: apiKey,
    });
  }
  return openaiClient;
}

export const OPENAI_API_CURL = `curl "https://api.openai.com/v1/chat/completions" \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${
    process.env.OPENAI_API_KEY || "YOUR_API_KEY_HERE"
  }' \\
  -X POST \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
        {
          "role": "user",
          "content": "Explain how AI works in a few words"
        }
    ],
    "max_tokens": 150,
    "temperature": 0.7
  }'`;

// OpenAI Service object
export const openaiService = {
  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },

  async analyzeContactPage(
    url: string,
    title: string,
    content: string,
    businessName: string
  ): Promise<{
    isContactPage: boolean;
    confidence: number;
    hasContactForm: boolean;
    hasContactInfo: boolean;
    pageType: "contact" | "about" | "support" | "inquiry" | "other";
    contentSummary: string;
    reasoning: string;
  }> {
    // Default implementation - returns pattern-based analysis
    // In a real implementation, this would call the OpenAI API
    return {
        isContactPage: true,
        confidence: 50,
        hasContactForm:
          content.toLowerCase().includes("form") ||
          content.toLowerCase().includes("submit"),
        hasContactInfo:
          content.toLowerCase().includes("contact") ||
          content.toLowerCase().includes("email"),
        pageType: "contact",
        contentSummary: `Analyzed ${businessName} contact page at ${url}`,
        reasoning: "Pattern-based analysis using common contact page indicators",
    };
  },

  async improveMessage(
    subject: string,
    message: string,
    businessContext?: string
  ): Promise<{
    improvedSubject: string;
    improvedMessage: string;
    improvements: string[];
    reasoning: string;
  }> {
    if (!this.isAvailable()) {
        // Fallback to pattern-based improvements if OpenAI is not available
        return this.fallbackMessageImprovement(subject, message);
    }

    try {
        const prompt = this.buildMessageImprovementPrompt(
          subject,
          message,
          businessContext
        );
        const response = await this.callOpenaiApi(prompt);

        return this.parseOpenaiResponse(response, subject, message);
    } catch (error) {
        console.error("OpenAI API error:", error);
        // Fallback to pattern-based improvements on API error
        return this.fallbackMessageImprovement(subject, message);
    }
  },

  buildEmailDiscoveryPrompt(url: string): string {
    return `You are an expert assistant that extracts **real business contact emails** by crawling websites and checking reliable sources.

GOALS:
- Always return a result if a valid customer-facing email exists on the website
- If only technical/placeholder emails are found, return an empty list instead
- Crawl the website systematically to find contact information

WEBSITE CRAWLING STRATEGY:
1. **Primary Pages** (highest priority):
   - /contact, /contact-us, /contactus
   - /about, /about-us, /aboutus
   - /support, /help, /customer-service
   - /get-in-touch, /reach-us

2. **Secondary Pages** (medium priority):
   - Homepage footer and header
   - /team, /staff, /leadership
   - /press, /media, /news
   - /legal, /privacy, /terms

3. **Reliable Sources** (always check):
   - Contact forms and inquiry pages
   - "Contact Us" sections
   - Business directory listings
   - Social media profiles (LinkedIn, Facebook business pages)
   - Press releases and media kits
   - Structured data (schema.org ContactPoint, JSON-LD)

EMAIL VALIDATION RULES:
✅ **ACCEPT** these customer-facing emails:
   - info@, contact@, support@, inquiry@, office@, sales@
   - hello@, help@, service@, business@, general@
   - Custom business emails (e.g., john@company.com for CEO)

❌ **REJECT** these technical/placeholder emails:
   - webmaster@, admin@, hostmaster@, postmaster@
   - noreply@, donotreply@, do-not-reply@, no-reply@
   - test@, demo@, sample@, placeholder@
   - addresses at example.com, test.com, placeholder.com, demo.com

CRAWLING INSTRUCTIONS:
- Analyze the main website structure and navigation
- Check all contact-related pages systematically
- Look for email addresses in page content, forms, and metadata
- Handle obfuscated emails ([at] → @, [dot] → .)
- Check for multiple contact methods (phone, email, contact forms)
- Verify emails are actually displayed on the website (not just in source code)

Website to analyze: ${url}

OUTPUT FORMAT:
{
  "domain": "<domain>",
  "emails": [
    {
        "address": "<business email>",
        "source_page": "<exact URL where found>",
        "source_type": "contact_page|about_page|footer|header|team_page|press_page|structured_data",
        "confidence": 0.7–1.0
    }
  ]
}

If no customer-facing emails exist, return:
{
  "domain": "${url}",
  "emails": []
}`;
  },

  buildMessageImprovementPrompt(
    subject: string,
    message: string,
    businessContext?: string
  ): string {
    return `You are a professional business communication expert. Please improve this business outreach message to make it more effective, professional, and engaging.

SUBJECT: ${subject}
MESSAGE: ${message}
${businessContext ? `BUSINESS CONTEXT: ${businessContext}` : ""}

Please provide improvements in this exact JSON format:
{
  "improvedSubject": "Improved subject line",
  "improvedMessage": "Improved message content",
  "improvements": ["List of specific improvements made"],
  "reasoning": "Brief explanation of why these changes make the message more effective"
}

Focus on:
1. Professional tone and clarity
2. Strong call-to-action
3. Value proposition
4. Personalization
5. Appropriate urgency
6. Better subject line

Keep the core message intent but make it more compelling and professional.`;
  },

  async callOpenaiApi(prompt: string): Promise<unknown> {
    try {
        const client = getOpenaiClient();
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        return response;
    } catch (error) {
        console.error("OpenAI SDK error:", error);
        throw new Error(
          `OpenAI API error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
    }
  },

  parseOpenaiResponse(
    response: unknown,
    originalSubject: string,
    originalMessage: string
  ): {
    improvedSubject: string;
    improvedMessage: string;
    improvements: string[];
    reasoning: string;
  } {
    try {
        const responseData = response as {
          choices?: Array<{
            message?: {
              content?: string;
            };
          }>;
        };

        const content = responseData.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("No content in OpenAI response");
        }

        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in OpenAI response");
        }

        const parsed = JSON.parse(jsonMatch[0]) as {
          improvedSubject?: string;
          improvedMessage?: string;
          improvements?: string[];
          reasoning?: string;
        };

        return {
          improvedSubject: parsed.improvedSubject || originalSubject,
          improvedMessage: parsed.improvedMessage || originalMessage,
          improvements: parsed.improvements || ["AI analysis completed"],
          reasoning: parsed.reasoning || "AI-powered message improvement",
        };
    } catch (error) {
        console.error("Error parsing OpenAI response:", error);
        // Return original content if parsing fails
        return {
          improvedSubject: originalSubject,
          improvedMessage: originalMessage,
          improvements: ["AI analysis completed"],
          reasoning: "AI-powered message improvement",
        };
    }
  },

  parseEmailDiscoveryResponse(
    response: unknown,
    _url: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): {
    emails: string[];
    sources: string[];
    confidence: number;
    reasoning: string;
  } {
    try {
        const responseData = response as {
          choices?: Array<{
            message?: {
              content?: string;
            };
          }>;
        };

        const content = responseData.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("No content in OpenAI response");
        }

        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in OpenAI response");
        }

        const parsed = JSON.parse(jsonMatch[0]) as {
          domain?: string;
          emails?: Array<{
            address: string;
            source_page: string;
            source_type: string;
            confidence: number;
          }>;
        };

        const emails = parsed.emails || [];
        const emailAddresses = emails.map((email) => email.address);
        const sources = emails.map(
          (email) => `${email.source_type} (${email.source_page})`
        );
        const avgConfidence =
          emails.length > 0
            ? emails.reduce((sum, email) => sum + email.confidence, 0) /
              emails.length
            : 0;

        return {
          emails: emailAddresses,
          sources: sources,
          confidence: avgConfidence,
          reasoning: `Found ${emails.length} verified email(s) from reliable sources`,
        };
    } catch (error) {
        console.error("Error parsing OpenAI email discovery response:", error);
        return {
          emails: [],
          sources: [],
          confidence: 0,
          reasoning: "Error parsing email discovery response",
        };
    }
  },

  fallbackMessageImprovement(
    subject: string,
    message: string
  ): {
    improvedSubject: string;
    improvedMessage: string;
    improvements: string[];
    reasoning: string;
  } {
    let improvedMessage = message;
    const improvements: string[] = [];

    // Pattern-based improvements (same as Gemini implementation)
    const originalMessage = message.toLowerCase();

    // 1. Professional tone improvements
    if (originalMessage.includes("hey") || originalMessage.includes("hi")) {
        improvedMessage = improvedMessage
          .replace(/hey/gi, "Hello")
          .replace(/hi/gi, "Good day");
        improvements.push("Made greeting more professional");
    }

    // 2. Add call-to-action if missing
    if (
        !originalMessage.includes("contact") &&
        !originalMessage.includes("call") &&
        !originalMessage.includes("reach")
    ) {
        improvedMessage +=
          "\n\nPlease feel free to contact us if you have any questions or would like to discuss this further.";
        improvements.push("Added clear call-to-action");
    }

    // 3. Improve sentence structure
    if (
        originalMessage.includes("!") &&
        originalMessage.split("!").length > 3
    ) {
        improvedMessage = improvedMessage.replace(/!/g, ".");
        improvements.push("Improved sentence structure");
    }

    // 4. Add value proposition if missing
    if (
        !originalMessage.includes("benefit") &&
        !originalMessage.includes("value") &&
        !originalMessage.includes("advantage")
    ) {
        const valueAddition =
          "\n\nThis could provide significant value to your business by improving efficiency and reducing costs.";
        improvedMessage = improvedMessage.replace(
          /([.!?])\s*$/,
          "$1" + valueAddition
        );
        improvements.push("Added value proposition");
    }

    // 5. Make tone more friendly
    if (
        originalMessage.includes("urgent") ||
        originalMessage.includes("immediately")
    ) {
        improvedMessage = improvedMessage
          .replace(/urgent/gi, "important")
          .replace(/immediately/gi, "at your convenience")
          .replace(/must/gi, "would be great if you could");
        improvements.push("Made tone more friendly and approachable");
    }

    // 6. Add personalization
    if (
        !originalMessage.includes("your") &&
        !originalMessage.includes("specific")
    ) {
        improvedMessage = improvedMessage
          .replace(/business/gi, "your business")
          .replace(/we can help/gi, "we can help you specifically");
        improvements.push("Added personalization elements");
    }

    // 7. Improve subject if it's generic
    let improvedSubject = subject;
    if (
        improvedSubject.toLowerCase().includes("message") ||
        improvedSubject.toLowerCase().includes("inquiry")
    ) {
        improvedSubject = "Business Partnership Opportunity";
        improvements.push("Improved subject line");
    }

    // 8. Add urgency if appropriate (but not too aggressive)
    if (
        !originalMessage.includes("time") &&
        !originalMessage.includes("limited") &&
        improvedMessage.length < 300
    ) {
        improvedMessage +=
          "\n\nThis opportunity is available for a limited time, so please don't hesitate to reach out.";
        improvements.push("Added appropriate urgency");
    }

    return {
        improvedSubject: improvedSubject,
        improvedMessage: improvedMessage.trim(),
        improvements:
          improvements.length > 0 ? improvements : ["Message analysis completed"],
        reasoning: "Pattern-based message improvement (OpenAI API not available)",
    };
  },
};

// Example usage function
export function getOpenaiApiCommand(
  prompt: string = "Explain how AI works in a few words"
): string {
  const apiKey = process.env.OPENAI_API_KEY || "YOUR_API_KEY_HERE";

  return `curl "https://api.openai.com/v1/chat/completions" \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${apiKey}' \\
  -X POST \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
        {
          "role": "user",
          "content": "${prompt}"
        }
    ],
    "max_tokens": 150,
    "temperature": 0.7
  }'`;
}

// Get API key from environment
export function getOpenaiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

// Check if API key is configured
export function isOpenaiApiKeyConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
