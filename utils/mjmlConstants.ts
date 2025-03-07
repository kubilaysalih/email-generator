/**
 * Default MJML template code
 */
export const defaultMjmlCode = `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text id="text-1" css-class="element-text-1" font-size="20px" color="#F45E43" font-family="helvetica">Merhaba MJML!</mj-text>
        <mj-text id="text-2" css-class="element-text-2" font-size="16px" color="#333333" font-family="helvetica">Prompta göre e-posta içeriği oluşturmak için üstteki giriş alanına açıklama yazın. Ayrıca görsel yükleyerek görsel ile ilgili bir e-posta da oluşturabilirsiniz.</mj-text>
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