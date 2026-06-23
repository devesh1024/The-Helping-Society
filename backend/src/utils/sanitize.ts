import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a virtual window for DOMPurify
const window = new JSDOM('').window as unknown as Window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes a plain string by stripping any HTML tags or script content.
 * It preserves normal user text (emails, URLs, phone numbers, registration numbers, pagination values) because
 * those are plain strings without HTML. The function returns the cleaned string.
 */
export const sanitizeString = (value: string): string => {
  // No allowed tags or attributes – removes any HTML/script.
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) as string;
};
