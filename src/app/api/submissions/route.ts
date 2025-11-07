import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { submissions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const formId = searchParams.get('formId');

    // Single submission by ID
    if (id) {
      const submission = await db.select()
        .from(submissions)
        .where(eq(submissions.id, id))
        .limit(1);

      if (submission.length === 0) {
        return NextResponse.json({ 
          error: 'Submission not found',
          code: 'SUBMISSION_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(submission[0], { status: 200 });
    }

    // List submissions with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt));

    // Filter by formId if provided
    if (formId) {
      query = query.where(eq(submissions.formId, formId));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, data } = body;

    // Validate required fields
    if (!formId) {
      return NextResponse.json({ 
        error: 'formId is required',
        code: 'MISSING_FORM_ID'
      }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'data is required',
        code: 'MISSING_DATA'
      }, { status: 400 });
    }

    // Validate data is a non-empty object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return NextResponse.json({ 
        error: 'data must be a valid JSON object',
        code: 'INVALID_DATA_FORMAT'
      }, { status: 400 });
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ 
        error: 'data cannot be an empty object',
        code: 'EMPTY_DATA'
      }, { status: 400 });
    }

    // Validate formId is a non-empty string
    if (typeof formId !== 'string' || formId.trim() === '') {
      return NextResponse.json({ 
        error: 'formId must be a non-empty string',
        code: 'INVALID_FORM_ID'
      }, { status: 400 });
    }

    // Create new submission
    const newSubmission = await db.insert(submissions)
      .values({
        id: randomUUID(),
        formId: formId.trim(),
        data,
        submittedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newSubmission[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { data } = body;

    // Validate data field
    if (!data) {
      return NextResponse.json({ 
        error: 'data is required',
        code: 'MISSING_DATA'
      }, { status: 400 });
    }

    // Validate data is a non-empty object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return NextResponse.json({ 
        error: 'data must be a valid JSON object',
        code: 'INVALID_DATA_FORMAT'
      }, { status: 400 });
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ 
        error: 'data cannot be an empty object',
        code: 'EMPTY_DATA'
      }, { status: 400 });
    }

    // Check if submission exists
    const existing = await db.select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND'
      }, { status: 404 });
    }

    // Update submission
    const updated = await db.update(submissions)
      .set({
        data
      })
      .where(eq(submissions.id, id))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    // Check if submission exists
    const existing = await db.select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND'
      }, { status: 404 });
    }

    // Delete submission
    const deleted = await db.delete(submissions)
      .where(eq(submissions.id, id))
      .returning();

    return NextResponse.json({
      message: 'Submission deleted successfully',
      submission: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}