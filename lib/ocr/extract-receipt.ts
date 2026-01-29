import * as fs from 'fs/promises';
import * as path from 'path';
import { anthropic } from './client';
import { RECEIPT_EXTRACTION_PROMPT } from './prompts';
import { convertPdfToImage, isPdf, getImageMimeType } from './pdf-converter';
import { suggestCategory } from './category-mapper';
import type { OcrResult, OcrExtractedData } from './types';

/**
 * Extracts receipt data from an image or PDF using Claude's vision API
 */
export async function extractReceiptData(filePath: string): Promise<OcrResult> {
  try {
    // Get the full file path
    const fullPath = path.join(process.cwd(), 'public', filePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return {
        success: false,
        confidence: 0,
        error: 'Bestand niet gevonden',
      };
    }

    // Prepare image data for Claude
    let imageData: string;
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    if (isPdf(fullPath)) {
      // Convert PDF to image
      imageData = await convertPdfToImage(fullPath);
      mediaType = 'image/png';
    } else {
      // Read image file directly
      const buffer = await fs.readFile(fullPath);
      imageData = buffer.toString('base64');
      mediaType = getImageMimeType(fullPath);
    }

    // Call Claude vision API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: RECEIPT_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        confidence: 0,
        error: 'Geen tekst response van OCR service',
      };
    }

    // Parse JSON response
    const jsonText = textContent.text.trim();
    let extractedData: OcrExtractedData;

    try {
      // Try to extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      extractedData = JSON.parse(jsonMatch[0]);
    } catch {
      return {
        success: false,
        confidence: 0,
        error: 'Kon OCR resultaat niet verwerken',
      };
    }

    // Validate and clean extracted data
    const cleanedData = cleanExtractedData(extractedData);

    // Calculate confidence score
    const confidence = calculateConfidence(cleanedData);

    // Suggest category based on supplier/description
    if (!cleanedData.suggestedCategory) {
      const category = suggestCategory(
        cleanedData.supplier,
        cleanedData.description
      );
      if (category) {
        cleanedData.suggestedCategory = category;
      }
    }

    return {
      success: true,
      data: cleanedData,
      confidence,
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      success: false,
      confidence: 0,
      error:
        error instanceof Error
          ? error.message
          : 'Onbekende fout bij OCR verwerking',
    };
  }
}

/**
 * Cleans and validates extracted data
 */
function cleanExtractedData(data: OcrExtractedData): OcrExtractedData {
  const cleaned: OcrExtractedData = {};

  // Supplier
  if (data.supplier && typeof data.supplier === 'string') {
    cleaned.supplier = data.supplier.trim();
  }

  // Invoice number
  if (data.invoiceNumber && typeof data.invoiceNumber === 'string') {
    cleaned.invoiceNumber = data.invoiceNumber.trim();
  }

  // Date (validate ISO format)
  if (data.date && typeof data.date === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(data.date)) {
      const parsed = new Date(data.date);
      if (!isNaN(parsed.getTime())) {
        cleaned.date = data.date;
      }
    }
  }

  // Amount
  if (typeof data.amount === 'number' && data.amount > 0) {
    cleaned.amount = Math.round(data.amount * 100) / 100;
  }

  // VAT amount
  if (typeof data.vatAmount === 'number' && data.vatAmount >= 0) {
    cleaned.vatAmount = Math.round(data.vatAmount * 100) / 100;
  }

  // VAT rate (only 0, 9, or 21)
  if (
    typeof data.vatRate === 'number' &&
    [0, 9, 21].includes(data.vatRate)
  ) {
    cleaned.vatRate = data.vatRate;
  }

  // Description
  if (data.description && typeof data.description === 'string') {
    cleaned.description = data.description.trim().slice(0, 100);
  }

  return cleaned;
}

/**
 * Calculates a confidence score based on extracted fields
 */
function calculateConfidence(data: OcrExtractedData): number {
  const weights = {
    amount: 0.3, // Most important
    date: 0.2,
    supplier: 0.15,
    vatRate: 0.15,
    vatAmount: 0.1,
    invoiceNumber: 0.05,
    description: 0.05,
  };

  let score = 0;

  if (data.amount !== undefined) score += weights.amount;
  if (data.date !== undefined) score += weights.date;
  if (data.supplier !== undefined) score += weights.supplier;
  if (data.vatRate !== undefined) score += weights.vatRate;
  if (data.vatAmount !== undefined) score += weights.vatAmount;
  if (data.invoiceNumber !== undefined) score += weights.invoiceNumber;
  if (data.description !== undefined) score += weights.description;

  return Math.round(score * 100) / 100;
}
