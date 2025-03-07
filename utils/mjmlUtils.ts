import { mjmlStructure } from './mjmlConstants';

/**
 * Options for MJML to HTML conversion
 */
export const mjmlConversionOptions = {
  keepComments: false,
  minify: true
};

/**
 * Adds unique ID attributes to MJML elements that don't already have them
 * @param mjmlContent - The MJML content to process
 * @returns MJML content with added IDs
 */
export const addIdsToMjmlElements = (mjmlContent: string): string => {
  // Regular expression to match MJML tags without IDs
  const mjmlTagRegex = /<(mj-[a-zA-Z-]+)([^>]*?)(\/?>)/g;
  let idCounter = 1;

  // Replace MJML tags with versions that have IDs
  return mjmlContent.replace(mjmlTagRegex, (match, tagName, attributes, closing) => {
    // Skip structural tags and tags that already have IDs
    if (['mj-body', 'mj-head', 'mj-attributes', 'mj-style', 'mj-all',
         'mj-html-attributes', 'mj-selector', 'mj-html-attribute', 'mj-title',
         'mj-preview'].includes(tagName) ||
        (attributes && attributes.includes('id='))) {
      return match;
    }

    // Create a unique ID
    const uniqueId = `${tagName.replace('mj-', '')}-${idCounter++}`;

    // Add the ID attribute
    return `<${tagName}${attributes} id="${uniqueId}"${closing}`;
  });
};

/**
 * Adds CSS classes to MJML elements based on their IDs
 * @param mjmlContent - The MJML content to process
 * @returns MJML content with added classes
 */
export const addClassesToMjmlElements = (mjmlContent: string): string => {
  // Regular expression to match MJML tags with IDs
  const mjmlTagWithIdRegex = /<(mj-[a-zA-Z-]+)([^>]*?)id="([^"]+)"([^>]*?)(\/?>)/g;

  // Replace MJML tags to add CSS classes based on their IDs
  return mjmlContent.replace(mjmlTagWithIdRegex, (match, tagName, beforeId, id, afterId, closing) => {
    // Skip structural tags
    if (['mj-body', 'mj-head', 'mj-attributes', 'mj-style', 'mj-html-attributes',
         'mj-selector', 'mj-html-attribute', 'mj-title', 'mj-preview'].includes(tagName)) {
      return match;
    }

    // Check if css-class already exists
    const hasClass = beforeId.includes('css-class="') || afterId.includes('css-class="');

    if (hasClass) {
      // Append to existing class
      return match.replace(/css-class="([^"]*)"/, (classMatch, classValue) => {
        return `css-class="${classValue} element-${id}"`;
      });
    } else {
      // Add new css-class attribute
      return `<${tagName}${beforeId}id="${id}"${afterId} css-class="element-${id}"${closing}`;
    }
  });
};

/**
 * Constructs a complete MJML template with the provided content
 * @param content - The MJML content to wrap with structure
 * @returns Complete MJML template string
 */
export const constructFullMjml = (content: string): string => {
  return mjmlStructure.start + content + mjmlStructure.end;
};

/**
 * Creates a complete MJML template with HTML attributes using mj-html-attributes
 * This uses the correct MJML approach with mj-selector and css-class
 * @param content - MJML content with IDs already added
 * @returns Complete MJML template with HTML attributes
 */
export const createMjmlWithDataAttributes = (
  content: string
): string => {
  // First, add IDs to elements that don't have them
  const contentWithIds = addIdsToMjmlElements(content);

  // Then, add CSS classes to the elements based on their IDs
  const contentWithClasses = addClassesToMjmlElements(contentWithIds);

  // Extract all element IDs
  const idRegex = /id="([^"]+)"/g;
  const elementIds: string[] = [];
  let match;

  while ((match = idRegex.exec(contentWithIds)) !== null) {
    elementIds.push(match[1]);
  }

  console.log(`Found ${elementIds.length} elements to add data-id to`);

  // Construct the HTML attributes section
  let htmlAttributes = `<mj-html-attributes>`;

  // Add selector for each element ID
  elementIds.forEach(id => {
    htmlAttributes += `
      <mj-selector path=".element-${id}">
        <mj-html-attribute name="data-id">${id}</mj-html-attribute>
      </mj-selector>`;
  });

  htmlAttributes += `
    </mj-html-attributes>`;

  // Construct the complete MJML
  const completeTemplate = `<mjml>
  <mj-head>
    <mj-title>E-posta Şablonu</mj-title>
    <mj-preview>E-posta önizlemesi</mj-preview>
    <mj-attributes>
      <mj-all padding="0px" />
      <mj-text font-family="Arial, sans-serif" />
      <mj-section padding="10px 0" />
      <mj-column padding="10px" />
    </mj-attributes>
    ${htmlAttributes}
    <mj-style>
      .email-content { width: 100%; }
      .text-center { text-align: center; }
      .text-highlight { color: #1E88E5; }
    </mj-style>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
      ${contentWithClasses}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

  return completeTemplate;
};