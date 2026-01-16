import type { TemplateVariables } from "@/types";

/**
 * Simple MJML-like template renderer.
 * In production, you would use the actual mjml library.
 * For now, this provides basic variable substitution and HTML conversion.
 */

/**
 * Replace template variables in the content.
 * Variables are in the format {{variableName}} or {{customer.attribute}}
 */
export function replaceVariables(
  content: string,
  variables: TemplateVariables
): string {
  return content.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, key) => {
    const keys = key.split(".");
    let value: unknown = variables;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return match; // Keep original if variable not found
      }
    }

    return String(value ?? match);
  });
}

/**
 * Convert basic MJML-like markup to HTML.
 * This is a simplified version - in production, use the mjml library.
 */
export function mjmlToHtml(mjmlContent: string): { html: string; errors: string[] } {
  const errors: string[] = [];

  try {
    // For simple templates, wrap in basic HTML structure
    // This is a simplified implementation
    let html = mjmlContent;

    // Replace MJML tags with HTML equivalents (simplified)
    const replacements: [RegExp, string][] = [
      [/<mj-body[^>]*>/gi, '<body style="background-color: #f4f4f4; padding: 20px;">'],
      [/<\/mj-body>/gi, "</body>"],
      [/<mj-section[^>]*>/gi, '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding: 20px; background-color: #ffffff;">'],
      [/<\/mj-section>/gi, "</td></tr></table>"],
      [/<mj-column[^>]*>/gi, '<div style="width: 100%;">'],
      [/<\/mj-column>/gi, "</div>"],
      [/<mj-text[^>]*>/gi, '<p style="margin: 0; padding: 10px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">'],
      [/<\/mj-text>/gi, "</p>"],
      [/<mj-button[^>]*href="([^"]*)"[^>]*>/gi, '<a href="$1" style="display: inline-block; padding: 12px 24px; background-color: #333; color: #fff; text-decoration: none; border-radius: 4px; font-family: Arial, sans-serif;">'],
      [/<\/mj-button>/gi, "</a>"],
      [/<mj-image[^>]*src="([^"]*)"[^>]*>/gi, '<img src="$1" style="max-width: 100%; height: auto;" />'],
      [/<mj-divider[^>]*>/gi, '<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />'],
      [/<\/mj-divider>/gi, ""],
      [/<mj-spacer[^>]*height="(\d+)px"[^>]*>/gi, '<div style="height: $1px;"></div>'],
      [/<\/mj-spacer>/gi, ""],
    ];

    for (const [pattern, replacement] of replacements) {
      html = html.replace(pattern, replacement);
    }

    // If the content doesn't start with MJML tags, treat it as plain HTML or text
    if (!mjmlContent.toLowerCase().includes("<mj-")) {
      // Wrap plain text in basic email structure
      html = `
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px;">
                  <tr>
                    <td>
                      ${html.replace(/\n/g, "<br>")}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else {
      // Wrap converted content in HTML document
      html = `
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        ${html}
        </html>
      `;
    }

    return { html, errors };
  } catch (error) {
    errors.push(
      `MJML conversion error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return { html: mjmlContent, errors };
  }
}

/**
 * Render a template with variables and convert to HTML.
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): { html: string; errors: string[] } {
  const contentWithVariables = replaceVariables(template, variables);
  return mjmlToHtml(contentWithVariables);
}

/**
 * Get sample variables for preview.
 */
export function getSampleVariables(): TemplateVariables {
  return {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    companyName: "Your Next Campus",
    unsubscribeUrl: "https://example.com/unsubscribe",
  };
}

