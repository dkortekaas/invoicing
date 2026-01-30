/**
 * Converts the first page of a PDF to a PNG image buffer
 * Returns base64 encoded image data
 *
 * Note: Uses dynamic import to avoid build-time errors with native modules
 */
export async function convertPdfToImage(pdfBuffer: Buffer | ArrayBuffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time canvas issues
    const { pdf } = await import('pdf-to-img');

    // Ensure we have a Buffer
    const buffer = pdfBuffer instanceof ArrayBuffer
      ? Buffer.from(pdfBuffer)
      : pdfBuffer;

    // Convert to images (only first page for receipts)
    const document = await pdf(buffer, { scale: 2.0 });

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
 * Checks if a URL or filename is a PDF based on extension
 */
export function isPdf(urlOrPath: string): boolean {
  // Remove query parameters if present
  const pathPart = urlOrPath.split('?')[0] ?? urlOrPath;
  return pathPart.toLowerCase().endsWith('.pdf');
}

/**
 * Gets the MIME type of an image file from URL or filename
 */
export function getImageMimeType(
  urlOrPath: string
): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  // Remove query parameters if present
  const pathPart = (urlOrPath.split('?')[0] ?? urlOrPath).toLowerCase();

  if (pathPart.endsWith('.jpg') || pathPart.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (pathPart.endsWith('.png')) {
    return 'image/png';
  }
  if (pathPart.endsWith('.webp')) {
    return 'image/webp';
  }
  if (pathPart.endsWith('.gif')) {
    return 'image/gif';
  }
  return 'image/jpeg';
}
