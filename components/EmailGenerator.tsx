import React, { useState, useEffect } from 'react';
import { EmailGeneratorProps, StreamResponse } from '../types';
import { useMjmlConverter } from '../hooks/useMjmlConverter';
import { convertFileToBase64 } from '../utils/imageUtils';
import { constructFullMjml, addIdsToMjmlElements } from '../utils/mjmlUtils';

import ImageUploader from './ImageUploader';
import MjmlEditor from './MjmlEditor';
import HtmlPreview from './HtmlPreview';
import SessionInfo from './SessionInfo';

const EmailGenerator: React.FC<EmailGeneratorProps> = ({ defaultMjmlCode }) => {
  // State
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [mjmlCode, setMjmlCode] = useState<string>(defaultMjmlCode);
  const [htmlOutput, setHtmlOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Use the MJML converter hook
  const { convertToHtml, isReady } = useMjmlConverter();

  // Initialize with default MJML code
  useEffect(() => {
    if (isReady) {
      const result = convertToHtml(defaultMjmlCode);
      setHtmlOutput(result.html);
    }
  }, [defaultMjmlCode, convertToHtml, isReady]);

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPrompt(e.target.value);
  };

  // File change handler
  const handleFileChange = async (file: File | null) => {
    if (!file) {
      handleRemoveImage();
      return;
    }

    // Set image preview URL
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    // Convert image to base64
    const base64 = await convertFileToBase64(file);
    setImageBase64(base64);
  };

  // Remove image handler
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageBase64(null);
  };

  // MJML code change handler
  const handleMjmlCodeChange = (newCode: string) => {
    setMjmlCode(newCode);

    if (isReady) {
      const result = convertToHtml(newCode);
      setHtmlOutput(result.html);
    }
  };

  // Reset session handler
  const handleResetSession = () => {
    setSessionId(null);
    console.log('Sohbet oturumu sıfırlandı, yeni bir oturum başlatılacak');
  };

  // Throttled function for updating the HTML preview
  const createThrottledPreviewUpdate = () => {
    let lastExecution = 0;
    let pendingUpdate: NodeJS.Timeout | null = null;

    return (mjml: string) => {
      const now = Date.now();
      const timeSinceLastExec = now - lastExecution;

      // Throttle to max one update every 100ms
      if (timeSinceLastExec < 100) {
        // Cancel any pending update
        if (pendingUpdate) {
          clearTimeout(pendingUpdate);
        }

        // Schedule update for later
        pendingUpdate = setTimeout(() => {
          if (isReady) {
            const result = convertToHtml(mjml);
            setHtmlOutput(result.html);
          }
          lastExecution = Date.now();
          pendingUpdate = null;
        }, 100 - timeSinceLastExec);

        return;
      }

      // Immediate update
      if (isReady) {
        const result = convertToHtml(mjml);
        setHtmlOutput(result.html);
      }
      lastExecution = now;
    };
  };

  // Generate MJML code using Claude API
  const generateMjmlWithStreamAPI = async () => {
    if (!inputPrompt.trim()) return;

    setIsLoading(true);
    setStreamProgress(0);

    // Create a throttled preview update function
    const throttledPreviewUpdate = createThrottledPreviewUpdate();

    let contentPart = '';

    // Function to update the textarea content during streaming
    const updateTextarea = (newContent: string) => {
      // Update accumulated content
      if (newContent) {
        contentPart += newContent;
      }

      // Display in textarea as simple MJML during streaming
      const fullMjml = constructFullMjml(contentPart);
      setMjmlCode(fullMjml);

      return fullMjml;
    };

    try {
      const response = await fetch('/api/generate-mjml-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputPrompt,
          currentMjml: mjmlCode,
          image: imageBase64,
          sessionId: sessionId // Send the current sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // For EventSource-style processing
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('Stream complete');
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep last partial line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);

            // Check for stream end
            if (data === '[DONE]') {
              console.log('Stream ended');
              continue;
            }

            try {
              const parsedData = JSON.parse(data) as StreamResponse;

              // Check for errors
              if (parsedData.error) {
                throw new Error(parsedData.error);
              }

              // Save session ID (comes in the first response)
              if (parsedData.sessionId && !sessionId) {
                setSessionId(parsedData.sessionId);
                console.log(`Session ID saved: ${parsedData.sessionId}`);
              }

              // Process content
              if (parsedData.content) {
                // Ignore structure parts from backend
                if (parsedData.type === 'structure_start' || parsedData.type === 'structure_end') {
                  continue;
                }

                // Update progress indicator
                setStreamProgress(prev => prev + 1);

                // Always update textarea (safe, shows progress)
                const fullMjml = updateTextarea(parsedData.content);

                // Throttled preview updates (prevents UI blocking)
                throttledPreviewUpdate(fullMjml);
              }
            } catch (error) {
              console.error('Error parsing stream data:', error);
            }
          }
        }
      }

      // Stream is complete - now process the entire content
      console.log('Stream complete, adding attributes to elements');

      // Add IDs to all MJML elements first
      const contentWithIds = addIdsToMjmlElements(contentPart);

      // Extract all element IDs
      const idRegex = /id="([^"]+)"/g;
      const elementIds: string[] = [];
      let match;
      const contentCopy = contentWithIds;

      while ((match = idRegex.exec(contentCopy)) !== null) {
        elementIds.push(match[1]);
      }

      console.log(`Found ${elementIds.length} elements to add attributes to`);

      // Construct the complete MJML with HTML attributes for each element
      let completeTemplate = `<mjml>
  <mj-head>
    <mj-title>E-posta Şablonu</mj-title>
    <mj-preview>E-posta önizlemesi</mj-preview>
    <mj-attributes>
      <mj-all padding="0px" />
      <mj-text font-family="Arial, sans-serif" />
      <mj-section padding="10px 0" />
      <mj-column padding="10px" />
    </mj-attributes>
    <mj-html-attributes>`;

      // Add selectors for each element
      elementIds.forEach(id => {
        completeTemplate += `
      <mj-selector path="#${id}">
        <mj-html-attribute name="data-element">${id}</mj-html-attribute>
        <mj-html-attribute name="data-session">${sessionId || 'new-session'}</mj-html-attribute>
        <mj-html-attribute name="data-timestamp">${new Date().toISOString()}</mj-html-attribute>
      </mj-selector>`;
      });

      completeTemplate += `
    </mj-html-attributes>
    <mj-style>
      .email-content { width: 100%; }
      .text-center { text-align: center; }
      .text-highlight { color: #1E88E5; }
    </mj-style>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
      ${contentWithIds}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

      // Update the MJML code with HTML attributes
      setMjmlCode(completeTemplate);

      // Update the preview with the final HTML
      if (isReady) {
        const result = convertToHtml(completeTemplate);
        setHtmlOutput(result.html);
      }

    } catch (error) {
      console.error('Stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setHtmlOutput(`<div style="color: red">Hata: ${errorMessage}</div>`);
      alert(`E-posta oluşturulurken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <h1 className="title">Claude AI ile E-posta Oluşturucu</h1>

      <SessionInfo
        sessionId={sessionId}
        isLoading={isLoading}
        onResetSession={handleResetSession}
      />

      <ImageUploader
        uploadedImage={uploadedImage}
        isLoading={isLoading}
        onFileChange={handleFileChange}
        onRemoveImage={handleRemoveImage}
      />

      <div className="input-container">
        <input
          type="text"
          value={inputPrompt}
          onChange={handleInputChange}
          placeholder="Ne tür bir e-posta oluşturmak istediğinizi açıklayın..."
          className="main-input"
          disabled={isLoading}
        />
        <button
          onClick={generateMjmlWithStreamAPI}
          className="generate-button"
          disabled={isLoading || !inputPrompt.trim()}
        >
          {isLoading ? 'Oluşturuluyor...' : 'E-posta Oluştur'}
        </button>

        {/* Stream Progress Indicator */}
        {isLoading && streamProgress > 0 && (
          <div className="stream-indicator">
            <div className="stream-pulse"></div>
            <span>Yanıt akışı devam ediyor... ({streamProgress} parça alındı)</span>
          </div>
        )}
      </div>

      <div className="editor-container">
        <MjmlEditor
          mjmlCode={mjmlCode}
          isLoading={isLoading}
          onMjmlCodeChange={handleMjmlCodeChange}
        />

        <HtmlPreview
          htmlOutput={htmlOutput}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
};

export default EmailGenerator;