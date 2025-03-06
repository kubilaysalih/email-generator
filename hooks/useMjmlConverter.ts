import { useState, useEffect, useCallback } from 'react';
import { MjmlResult } from '../types';
import { mjmlConversionOptions } from '../utils/mjmlUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MjmlConverterModule = (mjml: string, options?: any) => MjmlResult;

/**
 * Custom hook for handling MJML to HTML conversion
 * @returns Object containing the converter function and loading state
 */
export function useMjmlConverter() {
  const [mjml2html, setMjml2html] = useState<MjmlConverterModule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load the MJML converter module
  useEffect(() => {
    const loadMjml = async () => {
      try {
        setIsLoading(true);
        // Dynamically import the mjml-browser package
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const mjmlModule = await import('mjml-browser');
        // Save the converter function to state
        setMjml2html(() => mjmlModule.default || mjmlModule);
        setIsLoading(false);
        console.log('MJML successfully loaded');
      } catch (err) {
        console.error('Error loading MJML:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading MJML'));
        setIsLoading(false);
      }
    };

    loadMjml();
  }, []);

  // Convert MJML to HTML
  const convertToHtml = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mjmlCode: string): { html: string; errors: any[] } => {
      if (!mjml2html) {
        return { html: '', errors: [{ message: 'MJML converter not loaded yet' }] };
      }

      try {
        const result = mjml2html(mjmlCode, mjmlConversionOptions);
        return result;
      } catch (err) {
        console.error('MJML conversion error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return {
          html: `<div style="color: red">Error: ${errorMessage}</div>`,
          errors: [{ message: errorMessage }]
        };
      }
    },
    [mjml2html]
  );

  return {
    convertToHtml,
    isLoading,
    error,
    isReady: !!mjml2html
  };
}