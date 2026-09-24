/**
 * Helper utilities for Visual & Component Audit Automation
 */

/**
 * Extract comprehensive component attributes for baseline capture & comparison.
 * Includes innerText, attributes, CSS computed styles, and element width/height.
 */
async function extractComponentAttributes(element, rect) {
  const attributes = {};

  if (!element) return attributes;

  try {
    attributes.innerText = (await element.innerText().catch(() => '')).trim();
    attributes.classList = await element.evaluate(el => Array.from(el.classList).join(' ')).catch(() => '');

    const src = await element.getAttribute('src').catch(() => null);
    if (src !== null) attributes.src = src;

    const href = await element.getAttribute('href').catch(() => null);
    if (href !== null) attributes.href = href;

    const alt = await element.getAttribute('alt').catch(() => null);
    if (alt !== null) attributes.alt = alt;

    const placeholder = await element.getAttribute('placeholder').catch(() => null);
    if (placeholder !== null) attributes.placeholder = placeholder;

    const computedStyles = await element.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        padding: style.padding,
        margin: style.margin
      };
    }).catch(() => ({}));

    attributes['style.color'] = computedStyles.color || '';
    attributes['style.backgroundColor'] = computedStyles.backgroundColor || '';
    attributes['style.fontSize'] = computedStyles.fontSize || '';
    attributes['style.fontWeight'] = computedStyles.fontWeight || '';
    attributes['style.lineHeight'] = computedStyles.lineHeight || '';
    attributes['style.display'] = computedStyles.display || '';
    attributes['style.visibility'] = computedStyles.visibility || '';
    attributes['style.opacity'] = computedStyles.opacity || '';
    attributes['style.borderColor'] = computedStyles.borderColor || '';
    attributes['style.borderRadius'] = computedStyles.borderRadius || '';
    attributes['style.padding'] = computedStyles.padding || '';
    attributes['style.margin'] = computedStyles.margin || '';

    if (rect) {
      attributes['rect.width'] = `${Math.round(rect.width)}px`;
      attributes['rect.height'] = `${Math.round(rect.height)}px`;
    }
  } catch (err) {
    console.error('Error extracting component attributes:', err);
  }

  return attributes;
}

module.exports = {
  extractComponentAttributes
};
