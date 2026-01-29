import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Converts the first page of a PDF to a PNG image buffer
 * Returns base64 encoded image data
 *
 * Note: Uses dynamic import to avoid build-time errors with native modules
 */
export async function convertPdfToImage(pdfPath: string): Promise<string> {
  try {
    // Dynamic import to avoid build-time canvas issues
    const { pdf } = await import('pdf-to-img');

    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);

    // Convert to images (only first page for receipts)
    const document = await pdf(pdfBuffer, { scale: 2.0 });

    // Get the first page
    for await (const image of document) {
      // Return as base64 string
      return image.toString('base64');
    }

    throw new Error('PDF bevat geen paginas');
  } catch (error) {
    // If pdf-to-img fails (e.g., no canvas), throw a user-friendly error
    console.error('PDF conversion error:', error);
    throw new Error(
      'PDF conversie niet beschikbaar. Upload een afbeelding (PNG, JPG) in plaats van een PDF.'
    );
  }
}

/**
 * Checks if a file is a PDF based on extension
 */
export function isPdf(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.pdf';
}

/**
 * Gets the MIME type of an image file
 */
export function getImageMimeType(
  filePath: string
): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}
