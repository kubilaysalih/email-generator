/* eslint-disable @typescript-eslint/no-explicit-any */
// Type definitions for the MJML email generator

// MJML conversion result interface
export interface MjmlResult {
  html: string;
  errors: any[];
}

// Streaming API response interface
export interface StreamResponse {
  content?: string;
  type?: 'structure_start' | 'structure_end' | 'content';
  sessionId?: string;
  error?: string;
}

// Props for the main EmailGenerator component
export interface EmailGeneratorProps {
  defaultMjmlCode: string;
}

// Props for the ImageUploader component
export interface ImageUploaderProps {
  uploadedImage: string | null;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
}

// Props for the MjmlEditor component
export interface MjmlEditorProps {
  mjmlCode: string;
  isLoading: boolean;
  onMjmlCodeChange: (code: string) => void;
}

// Props for the HtmlPreview component
export interface HtmlPreviewProps {
  htmlOutput: string;
  isLoading: boolean;
}

// Props for the SessionInfo component
export interface SessionInfoProps {
  sessionId: string | null;
  isLoading: boolean;
  onResetSession: () => void;
}