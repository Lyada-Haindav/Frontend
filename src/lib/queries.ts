import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './db-client';
import { templates, forms, steps, fields, submissions } from '@/db/schema';

// Templates
export async function getTemplates() {
  return await db.select().from(templates).orderBy(templates.createdAt);
}

export async function getTemplateById(id: string) {
  const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  return result[0];
}

// Forms
export async function getFormsByUserId(userId: string) {
  return await db.select().from(forms).where(eq(forms.userId, userId)).orderBy(desc(forms.createdAt));
}

// Fast forms query with submission counts in single query
export async function getFormsByUserIdWithCounts(userId: string) {
  const result = await db
    .select({
      id: forms.id,
      userId: forms.userId,
      title: forms.title,
      description: forms.description,
      templateId: forms.templateId,
      isPublished: forms.isPublished,
      createdAt: forms.createdAt,
      updatedAt: forms.updatedAt,
      submission_count: sql<number>`CAST(COUNT(DISTINCT ${submissions.id}) AS INTEGER)`,
    })
    .from(forms)
    .leftJoin(submissions, eq(forms.id, submissions.formId))
    .where(eq(forms.userId, userId))
    .groupBy(forms.id)
    .orderBy(desc(forms.createdAt));
  
  return result;
}

export async function getFormById(id: string) {
  const result = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  return result[0];
}

export async function createForm(data: {
  id: string;
  userId: string;
  title: string;
  description?: string;
  templateId?: string;
  isPublished?: boolean;
}) {
  const now = new Date().toISOString();
  await db.insert(forms).values({
    ...data,
    isPublished: data.isPublished || false,
    createdAt: now,
    updatedAt: now,
  });
  return await getFormById(data.id);
}

export async function updateForm(id: string, data: {
  title?: string;
  description?: string;
  isPublished?: boolean;
}) {
  const now = new Date().toISOString();
  await db.update(forms).set({ ...data, updatedAt: now }).where(eq(forms.id, id));
  return await getFormById(id);
}

export async function deleteForm(id: string) {
  await db.delete(forms).where(eq(forms.id, id));
}

// Steps
export async function getStepsByFormId(formId: string) {
  return await db.select().from(steps).where(eq(steps.formId, formId)).orderBy(steps.orderIndex);
}

export async function createStep(data: {
  id: string;
  formId: string;
  title: string;
  description?: string;
  orderIndex: number;
}) {
  const now = new Date().toISOString();
  await db.insert(steps).values({
    ...data,
    createdAt: now,
  });
  const result = await db.select().from(steps).where(eq(steps.id, data.id)).limit(1);
  return result[0];
}

export async function deleteStep(id: string) {
  await db.delete(steps).where(eq(steps.id, id));
}

// Fields
export async function getFieldsByStepId(stepId: string) {
  return await db.select().from(fields).where(eq(fields.stepId, stepId)).orderBy(fields.orderIndex);
}

export async function createField(data: {
  id: string;
  stepId: string;
  type: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  orderIndex: number;
  validationRules?: any;
  conditionalLogic?: any;
  options?: any;
}) {
  const now = new Date().toISOString();
  await db.insert(fields).values({
    ...data,
    required: data.required || false,
    createdAt: now,
  });
  const result = await db.select().from(fields).where(eq(fields.id, data.id)).limit(1);
  return result[0];
}

// Submissions
export async function getSubmissionsByFormId(formId: string) {
  return await db.select().from(submissions).where(eq(submissions.formId, formId)).orderBy(desc(submissions.submittedAt));
}

export async function createSubmission(data: {
  id: string;
  formId: string;
  data: any;
}) {
  const now = new Date().toISOString();
  await db.insert(submissions).values({
    ...data,
    submittedAt: now,
  });
}