export { CaptchaDetector } from "./captcha-detector";
export { FormDetector } from "./form-detector";
export { WebScraper } from "./web-scraper";
export { ContactAutomationOrchestrator } from "./automation-orchestrator";

// Create instances
import { CaptchaDetector } from "./captcha-detector";
import { FormDetector } from "./form-detector";
import { WebScraper } from "./web-scraper";
import { ContactAutomationOrchestrator } from "./automation-orchestrator";

export const captchaDetector = new CaptchaDetector();
export const formDetector = new FormDetector();
export const webScraper = new WebScraper();
export const automationOrchestrator = new ContactAutomationOrchestrator();
