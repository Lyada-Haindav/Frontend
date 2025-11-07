import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { templates } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single template by ID
    if (id) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json({ 
          error: "Invalid UUID format",
          code: "INVALID_UUID" 
        }, { status: 400 });
      }

      const template = await db.select()
        .from(templates)
        .where(eq(templates.id, id))
        .limit(1);

      if (template.length === 0) {
        return NextResponse.json({ 
          error: 'Template not found',
          code: "TEMPLATE_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(template[0], { status: 200 });
    }

    // List templates with pagination, search, and filter
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let query = db.select().from(templates);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(templates.name, `%${search}%`),
          like(templates.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(templates.category, category));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query
      .orderBy(desc(templates.createdAt))
      .limit(limit)
      .offset(offset);

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
    const { name, description, icon, category, config } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!config) {
      return NextResponse.json({ 
        error: "Config is required",
        code: "MISSING_CONFIG" 
      }, { status: 400 });
    }

    // Validate config is a valid JSON object
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      return NextResponse.json({ 
        error: "Config must be a valid JSON object",
        code: "INVALID_CONFIG" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedName = name.trim();

    // Auto-generate system fields
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    // Insert new template
    const newTemplate = await db.insert(templates)
      .values({
        id,
        name: sanitizedName,
        description: description ? description.trim() : null,
        icon: icon ? icon.trim() : null,
        category: category ? category.trim() : null,
        config,
        createdAt
      })
      .returning();

    return NextResponse.json(newTemplate[0], { status: 201 });
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
    if (!id) {
      return NextResponse.json({ 
        error: "ID parameter is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ 
        error: "Invalid UUID format",
        code: "INVALID_UUID" 
      }, { status: 400 });
    }

    // Check if template exists
    const existingTemplate = await db.select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json({ 
        error: 'Template not found',
        code: "TEMPLATE_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, icon, category, config } = body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ 
        error: "Name must be a non-empty string",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    // Validate config if provided
    if (config !== undefined) {
      if (typeof config !== 'object' || config === null || Array.isArray(config)) {
        return NextResponse.json({ 
          error: "Config must be a valid JSON object",
          code: "INVALID_CONFIG" 
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (icon !== undefined) {
      updates.icon = icon ? icon.trim() : null;
    }

    if (category !== undefined) {
      updates.category = category ? category.trim() : null;
    }

    if (config !== undefined) {
      updates.config = config;
    }

    // Update template
    const updatedTemplate = await db.update(templates)
      .set(updates)
      .where(eq(templates.id, id))
      .returning();

    return NextResponse.json(updatedTemplate[0], { status: 200 });
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
    if (!id) {
      return NextResponse.json({ 
        error: "ID parameter is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ 
        error: "Invalid UUID format",
        code: "INVALID_UUID" 
      }, { status: 400 });
    }

    // Check if template exists
    const existingTemplate = await db.select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json({ 
        error: 'Template not found',
        code: "TEMPLATE_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete template
    const deleted = await db.delete(templates)
      .where(eq(templates.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'Template deleted successfully',
      template: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}