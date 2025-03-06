import React, { useEffect, useRef } from 'react';
import { HtmlPreviewProps } from '../types';

const HtmlPreview: React.FC<HtmlPreviewProps> = ({
  htmlOutput,
  isLoading
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  // Update the preview div when htmlOutput changes
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = htmlOutput;
    }
  }, [htmlOutput]);

  // Show loading indicator when isLoading is true
  useEffect(() => {
    if (isLoading && previewRef.current) {
      previewRef.current.innerHTML = '<div style="color: blue">Yanıt oluşturuluyor <span class="dots"></span></div>';

      // Animate the dots
      const animateDots = () => {
        const dotsElem = previewRef.current?.querySelector('.dots');
        if (dotsElem && isLoading) {
          const dots = dotsElem.textContent || '';
          dotsElem.textContent = dots.length >= 3 ? '' : dots + '.';
          setTimeout(animateDots, 500);
        }
      };

      animateDots();
    }
  }, [isLoading]);

  return (
    <div className="preview-section">
      <h2>HTML Önizleme</h2>
      <div
        ref={previewRef}
        className="html-preview"
      ></div>
    </div>
  );
};

export default HtmlPreview;