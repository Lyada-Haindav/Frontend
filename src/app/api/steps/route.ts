import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { steps, forms } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const formId = searchParams.get('formId');

    // Single step by ID
    if (id) {
      const step = await db.select()
        .from(steps)
        .where(eq(steps.id, id))
        .limit(1);

      if (step.length === 0) {
        return NextResponse.json({ 
          error: 'Step not found',
          code: 'STEP_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(step[0]);
    }

    // List steps with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(steps);

    // Filter by formId and order by orderIndex
    if (formId) {
      query = query
        .where(eq(steps.formId, formId))
        .orderBy(asc(steps.orderIndex));
    } else {
      query = query.orderBy(asc(steps.orderIndex));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);

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
    const { formId, title, description, orderIndex } = body;

    // Validate required fields
    if (!formId || typeof formId !== 'string' || formId.trim() === '') {
      return NextResponse.json({ 
        error: 'formId is required and must be a non-empty string',
        code: 'MISSING_FORM_ID' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: 'title is required and must be a non-empty string',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (orderIndex === undefined || orderIndex === null || typeof orderIndex !== 'number' || !Number.isInteger(orderIndex) || orderIndex < 0) {
      return NextResponse.json({ 
        error: 'orderIndex is required and must be a non-negative integer',
        code: 'INVALID_ORDER_INDEX' 
      }, { status: 400 });
    }

    // Verify that the referenced form exists
    const formExists = await db.select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (formExists.length === 0) {
      return NextResponse.json({ 
        error: 'Referenced form does not exist',
        code: 'FORM_NOT_FOUND' 
      }, { status: 400 });
    }

    // Create new step
    const newStep = await db.insert(steps)
      .values({
        id: randomUUID(),
        formId: formId.trim(),
        title: title.trim(),
        description: description ? description.trim() : null,
        orderIndex: orderIndex,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newStep[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || id.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if step exists
    const existingStep = await db.select()
      .from(steps)
      .where(eq(steps.id, id))
      .limit(1);

    if (existingStep.length === 0) {
      return NextResponse.json({ 
        error: 'Step not found',
        code: 'STEP_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, orderIndex } = body;

    // Build update object with only provided fields
    const updates: Record<string, any> = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json({ 
          error: 'title must be a non-empty string',
          code: 'INVALID_TITLE' 
        }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (orderIndex !== undefined) {
      if (typeof orderIndex !== 'number' || !Number.isInteger(orderIndex) || orderIndex < 0) {
        return NextResponse.json({ 
          error: 'orderIndex must be a non-negative integer',
          code: 'INVALID_ORDER_INDEX' 
        }, { status: 400 });
      }
      updates.orderIndex = orderIndex;
    }

    // Update step
    const updated = await db.update(steps)
      .set(updates)
      .where(eq(steps.id, id))
      .returning();

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || id.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if step exists
    const existingStep = await db.select()
      .from(steps)
      .where(eq(steps.id, id))
      .limit(1);

    if (existingStep.length === 0) {
      return NextResponse.json({ 
        error: 'Step not found',
        code: 'STEP_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete step (cascade will handle related fields)
    const deleted = await db.delete(steps)
      .where(eq(steps.id, id))
      .returning();

    return NextResponse.json({
      message: 'Step deleted successfully',
      step: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}