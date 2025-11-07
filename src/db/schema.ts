import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Templates table - pre-built form templates
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  category: text('category'),
  config: text('config', { mode: 'json' }).notNull(),
  createdAt: text('created_at').notNull(),
});

// Forms table - user-created forms
export const forms = sqliteTable('forms', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  templateId: text('template_id').references(() => templates.id),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Steps table - form steps/pages
export const steps = sqliteTable('steps', {
  id: text('id').primaryKey(),
  formId: text('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  createdAt: text('created_at').notNull(),
});

// Fields table - form fields within steps
export const fields = sqliteTable('fields', {
  id: text('id').primaryKey(),
  stepId: text('step_id').notNull().references(() => steps.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  label: text('label').notNull(),
  placeholder: text('placeholder'),
  defaultValue: text('default_value'),
  required: integer('required', { mode: 'boolean' }).default(false),
  orderIndex: integer('order_index').notNull(),
  validationRules: text('validation_rules', { mode: 'json' }),
  conditionalLogic: text('conditional_logic', { mode: 'json' }),
  options: text('options', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
});

// Submissions table - form responses
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  formId: text('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  data: text('data', { mode: 'json' }).notNull(),
  submittedAt: text('submitted_at').notNull(),
});