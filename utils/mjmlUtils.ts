/**
 * Default MJML template code
 */
export const defaultMjmlCode = `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="20px" color="#F45E43" font-family="helvetica">Merhaba MJML!</mj-text>
        <mj-text font-size="16px" color="#333333" font-family="helvetica">Prompta göre e-posta içeriği oluşturmak için üstteki giriş alanına açıklama yazın. Ayrıca görsel yükleyerek görsel ile ilgili bir e-posta da oluşturabilirsiniz.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

/**
 * MJML structure parts for constructing email templates
 */
export const mjmlStructure = {
  start: `<mjml>
  <mj-head>
    <mj-title>E-posta Şablonu</mj-title>
    <mj-preview>E-posta önizlemesi</mj-preview>
    <mj-attributes>
      <mj-all padding="0px" />
      <mj-text font-family="Arial, sans-serif" />
      <mj-section padding="10px 0" />
      <mj-column padding="10px" />
    </mj-attributes>
    <mj-style>
      .email-content { width: 100%; }
      .text-center { text-align: center; }
      .text-highlight { color: #1E88E5; }
    </mj-style>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
`,
  end: `      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
};

/**
 * Options for MJML to HTML conversion
 */
export const mjmlConversionOptions = {
  keepComments: false,
  minify: true
};

/**
 * Adds unique ID attributes to MJML elements
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
 * Constructs a complete MJML template with the provided content
 * and adds unique IDs to elements
 * @param content - The MJML content to wrap with structure
 * @returns Complete MJML template string with IDs
 */
export const constructFullMjml = (content: string): string => {
  const processedContent = addIdsToMjmlElements(content);
  return mjmlStructure.start + processedContent + mjmlStructure.end;
};