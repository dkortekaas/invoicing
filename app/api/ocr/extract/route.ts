import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/server-utils';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';
import { extractReceiptData } from '@/lib/ocr';
import { classifyExpense } from '@/lib/categorization';
import type { ClassificationInfo } from '@/lib/ocr/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Niet ingelogd' },
        { status: 401 }
      );
    }

    // Check feature access (PRO only)
    const hasAccess = await hasFeatureAccess(userId, 'ocr_extraction');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'OCR is alleen beschikbaar voor Pro gebruikers' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { receiptUrl } = body;

    if (!receiptUrl || typeof receiptUrl !== 'string') {
      return NextResponse.json(
        { error: 'receiptUrl is verplicht' },
        { status: 400 }
      );
    }

    // Validate URL (must be a Vercel Blob URL or local uploads path)
    const isVercelBlob = receiptUrl.includes('blob.vercel-storage.com');
    const isLocalUploads = receiptUrl.startsWith('/uploads/receipts/');

    if (!isVercelBlob && !isLocalUploads) {
      return NextResponse.json(
        { error: 'Ongeldig bestandspad' },
        { status: 400 }
      );
    }

    // Extract data using OCR
    const result = await extractReceiptData(receiptUrl);

    // If extraction was successful, run classification
    if (result.success && result.data) {
      const classificationResult = await classifyExpense({
        userId,
        supplier: result.data.supplier,
        description: result.data.description,
        ocrSuggestedCategory: result.data.suggestedCategory,
      });

      // Build classification info
      const classification: ClassificationInfo = {
        category: classificationResult.category,
        source: classificationResult.source,
        confidence: classificationResult.confidence,
        explanation: classificationResult.explanation,
      };

      // Include vendor info if matched
      if (classificationResult.vendorMatch) {
        classification.vendorId = classificationResult.vendorMatch.vendor.id;
        classification.vendorName = classificationResult.vendorMatch.vendor.name;
      }

      // Update the suggested category with the classification result
      result.data.suggestedCategory = classificationResult.category;
      result.classification = classification;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR verwerking mislukt'
      },
      { status: 500 }
    );
  }
}
