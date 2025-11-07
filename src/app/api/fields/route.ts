import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fields } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const stepId = searchParams.get('stepId');

    // Single field by ID
    if (id) {
      if (!id.trim()) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const field = await db
        .select()
        .from(fields)
        .where(eq(fields.id, id))
        .limit(1);

      if (field.length === 0) {
        return NextResponse.json(
          { error: 'Field not found', code: 'FIELD_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(field[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(fields);

    // Filter by stepId if provided
    if (stepId) {
      query = query.where(eq(fields.stepId, stepId));
    }

    // Always order by orderIndex when filtering by stepId, or as default
    query = query.orderBy(asc(fields.orderIndex));

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.stepId || typeof body.stepId !== 'string' || !body.stepId.trim()) {
      return NextResponse.json(
        { error: 'stepId is required and must be a non-empty string', code: 'MISSING_STEP_ID' },
        { status: 400 }
      );
    }

    if (!body.type || typeof body.type !== 'string' || !body.type.trim()) {
      return NextResponse.json(
        { error: 'type is required and must be a non-empty string', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
      return NextResponse.json(
        { error: 'label is required and must be a non-empty string', code: 'MISSING_LABEL' },
        { status: 400 }
      );
    }

    if (body.orderIndex === undefined || body.orderIndex === null) {
      return NextResponse.json(
        { error: 'orderIndex is required', code: 'MISSING_ORDER_INDEX' },
        { status: 400 }
      );
    }

    const orderIndex = parseInt(body.orderIndex);
    if (isNaN(orderIndex) || orderIndex < 0) {
      return NextResponse.json(
        { error: 'orderIndex must be a non-negative integer', code: 'INVALID_ORDER_INDEX' },
        { status: 400 }
      );
    }

    // Validate boolean field if provided
    if (body.required !== undefined && typeof body.required !== 'boolean') {
      return NextResponse.json(
        { error: 'required must be a boolean', code: 'INVALID_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    // Validate JSON fields if provided
    if (body.validationRules !== undefined && body.validationRules !== null) {
      try {
        if (typeof body.validationRules === 'string') {
          JSON.parse(body.validationRules);
        } else if (typeof body.validationRules !== 'object') {
          throw new Error('Invalid format');
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'validationRules must be valid JSON', code: 'INVALID_VALIDATION_RULES' },
          { status: 400 }
        );
      }
    }

    if (body.conditionalLogic !== undefined && body.conditionalLogic !== null) {
      try {
        if (typeof body.conditionalLogic === 'string') {
          JSON.parse(body.conditionalLogic);
        } else if (typeof body.conditionalLogic !== 'object') {
          throw new Error('Invalid format');
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'conditionalLogic must be valid JSON', code: 'INVALID_CONDITIONAL_LOGIC' },
          { status: 400 }
        );
      }
    }

    if (body.options !== undefined && body.options !== null) {
      try {
        if (typeof body.options === 'string') {
          JSON.parse(body.options);
        } else if (typeof body.options !== 'object') {
          throw new Error('Invalid format');
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'options must be valid JSON', code: 'INVALID_OPTIONS' },
          { status: 400 }
        );
      }
    }

    // Prepare field data
    const newField = {
      id: randomUUID(),
      stepId: body.stepId.trim(),
      type: body.type.trim(),
      label: body.label.trim(),
      placeholder: body.placeholder?.trim() || null,
      defaultValue: body.defaultValue?.trim() || null,
      required: body.required ?? false,
      orderIndex: orderIndex,
      validationRules: body.validationRules || null,
      conditionalLogic: body.conditionalLogic || null,
      options: body.options || null,
      createdAt: new Date().toISOString(),
    };

    const created = await db.insert(fields).values(newField).returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if field exists
    const existing = await db
      .select()
      .from(fields)
      .where(eq(fields.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Field not found', code: 'FIELD_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.type !== undefined) {
      if (typeof body.type !== 'string' || !body.type.trim()) {
        return NextResponse.json(
          { error: 'type must be a non-empty string', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      updates.type = body.type.trim();
    }

    if (body.label !== undefined) {
      if (typeof body.label !== 'string' || !body.label.trim()) {
        return NextResponse.json(
          { error: 'label must be a non-empty string', code: 'INVALID_LABEL' },
          { status: 400 }
        );
      }
      updates.label = body.label.trim();
    }

    if (body.placeholder !== undefined) {
      updates.placeholder = body.placeholder?.trim() || null;
    }

    if (body.defaultValue !== undefined) {
      updates.defaultValue = body.defaultValue?.trim() || null;
    }

    if (body.required !== undefined) {
      if (typeof body.required !== 'boolean') {
        return NextResponse.json(
          { error: 'required must be a boolean', code: 'INVALID_REQUIRED_FIELD' },
          { status: 400 }
        );
      }
      updates.required = body.required;
    }

    if (body.orderIndex !== undefined) {
      const orderIndex = parseInt(body.orderIndex);
      if (isNaN(orderIndex) || orderIndex < 0) {
        return NextResponse.json(
          { error: 'orderIndex must be a non-negative integer', code: 'INVALID_ORDER_INDEX' },
          { status: 400 }
        );
      }
      updates.orderIndex = orderIndex;
    }

    if (body.validationRules !== undefined) {
      if (body.validationRules !== null) {
        try {
          if (typeof body.validationRules === 'string') {
            JSON.parse(body.validationRules);
          } else if (typeof body.validationRules !== 'object') {
            throw new Error('Invalid format');
          }
        } catch (e) {
          return NextResponse.json(
            { error: 'validationRules must be valid JSON', code: 'INVALID_VALIDATION_RULES' },
            { status: 400 }
          );
        }
      }
      updates.validationRules = body.validationRules;
    }

    if (body.conditionalLogic !== undefined) {
      if (body.conditionalLogic !== null) {
        try {
          if (typeof body.conditionalLogic === 'string') {
            JSON.parse(body.conditionalLogic);
          } else if (typeof body.conditionalLogic !== 'object') {
            throw new Error('Invalid format');
          }
        } catch (e) {
          return NextResponse.json(
            { error: 'conditionalLogic must be valid JSON', code: 'INVALID_CONDITIONAL_LOGIC' },
            { status: 400 }
          );
        }
      }
      updates.conditionalLogic = body.conditionalLogic;
    }

    if (body.options !== undefined) {
      if (body.options !== null) {
        try {
          if (typeof body.options === 'string') {
            JSON.parse(body.options);
          } else if (typeof body.options !== 'object') {
            throw new Error('Invalid format');
          }
        } catch (e) {
          return NextResponse.json(
            { error: 'options must be valid JSON', code: 'INVALID_OPTIONS' },
            { status: 400 }
          );
        }
      }
      updates.options = body.options;
    }

    const updated = await db
      .update(fields)
      .set(updates)
      .where(eq(fields.id, id))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if field exists
    const existing = await db
      .select()
      .from(fields)
      .where(eq(fields.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Field not found', code: 'FIELD_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(fields)
      .where(eq(fields.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Field deleted successfully',
        field: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}