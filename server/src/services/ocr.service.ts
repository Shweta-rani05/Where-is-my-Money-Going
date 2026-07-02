import fs from 'fs';
// @ts-ignore 
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

/**
 * Interface representing the extracted content from a file.
 * type: 'text' if we extracted raw string text (e.g. from a PDF)
 * type: 'image' if it's an image file that needs to be sent to Gemini natively
 */
export interface ExtractedContent {
  type: 'text' | 'image';
  data: string; // The raw text OR the base64 encoded image
  mimeType?: string; // e.g. 'image/jpeg', 'image/png'
}

/**
 * Service to handle file parsing (PDFs and Images)
 */
export const ocrService = {
  /**
   * Parses the uploaded file and returns its content ready for LLM processing
   * @param filePath Absolute path to the file
   * @param mimeType MIME type of the file
   * @returns ExtractedContent
   */
  extractContent: async (filePath: string, mimeType: string): Promise<ExtractedContent> => {
    try {
      if (mimeType === 'application/pdf') {
        const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: dataBuffer,
          useSystemFonts: true 
        });
        const pdfDocument = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }

        // Check if the extracted text is suspiciously short (scanned document)
        if (fullText.trim().length < 50) {
          throw new Error('PDF_SCANNED_OR_EMPTY');
        }

        return {
          type: 'text',
          data: fullText
        };
      } else if (mimeType.startsWith('image/')) {
        // For images (jpg, png), we convert them to base64.
        const imageBuffer = fs.readFileSync(filePath);
        const base64Data = imageBuffer.toString('base64');
        return {
          type: 'image',
          data: base64Data,
          mimeType
        };
      } else {
        throw new Error('Unsupported file format for OCR extraction.');
      }
    } catch (error: any) {
      console.error('[OCR Service] Error extracting content:', error);
      if (error.message === 'PDF_SCANNED_OR_EMPTY') {
         throw new Error('The uploaded PDF appears to be a scanned image. Please upload a text-based PDF or a direct image file (JPG/PNG).');
      }
      throw new Error('Failed to process the uploaded document. The file may be encrypted or corrupted.');
    }
  }
};
