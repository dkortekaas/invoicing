import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/server-utils';
import { hasFeatureAccess } from '@/lib/stripe/subscriptions';
import { extractReceiptData } from '@/lib/ocr';

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

    // Validate file path (must be in uploads/receipts)
    if (!receiptUrl.startsWith('/uploads/receipts/')) {
      return NextResponse.json(
        { error: 'Ongeldig bestandspad' },
        { status: 400 }
      );
    }

    // Extract data using OCR
    const result = await extractReceiptData(receiptUrl);

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
