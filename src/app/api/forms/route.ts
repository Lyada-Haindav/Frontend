import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { forms } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json({ 
          error: 'Invalid UUID format',
          code: 'INVALID_UUID' 
        }, { status: 400 });
      }

      const form = await db.select()
        .from(forms)
        .where(eq(forms.id, id))
        .limit(1);

      if (form.length === 0) {
        return NextResponse.json({ 
          error: 'Form not found',
          code: 'FORM_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(form[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const isPublishedParam = searchParams.get('isPublished');

    let query = db.select().from(forms);
    const conditions = [];

    // Search in title and description
    if (search) {
      conditions.push(
        or(
          like(forms.title, `%${search}%`),
          like(forms.description, `%${search}%`)
        )
      );
    }

    // Filter by userId
    if (userId) {
      conditions.push(eq(forms.userId, userId));
    }

    // Filter by isPublished
    if (isPublishedParam !== null) {
      const isPublished = isPublishedParam === 'true';
      conditions.push(eq(forms.isPublished, isPublished));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(forms.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, templateId, isPublished } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required and must be a non-empty string',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: 'title is required and must be a non-empty string',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    // Validate isPublished if provided
    if (isPublished !== undefined && typeof isPublished !== 'boolean') {
      return NextResponse.json({ 
        error: 'isPublished must be a boolean',
        code: 'INVALID_IS_PUBLISHED' 
      }, { status: 400 });
    }

    // Validate templateId if provided (UUID format)
    if (templateId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(templateId)) {
        return NextResponse.json({ 
          error: 'templateId must be a valid UUID',
          code: 'INVALID_TEMPLATE_ID' 
        }, { status: 400 });
      }
    }

    // Prepare data for insertion
    const now = new Date().toISOString();
    const newForm = await db.insert(forms)
      .values({
        id: randomUUID(),
        userId: userId.trim(),
        title: title.trim(),
        description: description ? description.trim() : null,
        templateId: templateId || null,
        isPublished: isPublished ?? false,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newForm[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
        error: 'ID parameter is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ 
        error: 'Invalid UUID format',
        code: 'INVALID_UUID' 
      }, { status: 400 });
    }

    // Check if form exists
    const existing = await db.select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Form not found',
        code: 'FORM_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, templateId, isPublished } = body;

    // Validate title if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return NextResponse.json({ 
        error: 'title must be a non-empty string',
        code: 'INVALID_TITLE' 
      }, { status: 400 });
    }

    // Validate isPublished if provided
    if (isPublished !== undefined && typeof isPublished !== 'boolean') {
      return NextResponse.json({ 
        error: 'isPublished must be a boolean',
        code: 'INVALID_IS_PUBLISHED' 
      }, { status: 400 });
    }

    // Validate templateId if provided (UUID format)
    if (templateId !== undefined && templateId !== null) {
      if (!uuidRegex.test(templateId)) {
        return NextResponse.json({ 
          error: 'templateId must be a valid UUID',
          code: 'INVALID_TEMPLATE_ID' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (templateId !== undefined) updates.templateId = templateId;
    if (isPublished !== undefined) updates.isPublished = isPublished;

    const updated = await db.update(forms)
      .set(updates)
      .where(eq(forms.id, id))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
        error: 'ID parameter is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ 
        error: 'Invalid UUID format',
        code: 'INVALID_UUID' 
      }, { status: 400 });
    }

    // Check if form exists before deleting
    const existing = await db.select()
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Form not found',
        code: 'FORM_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the form (cascade will handle related steps and fields)
    const deleted = await db.delete(forms)
      .where(eq(forms.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'Form deleted successfully',
      form: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}