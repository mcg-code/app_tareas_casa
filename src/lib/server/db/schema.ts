import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url')
});

export const houses = sqliteTable('houses', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull()
});

export const houseMembers = sqliteTable('house_members', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  houseId: text('house_id').notNull().references(() => houses.id),
  emoji: text('emoji').default('👤'),
  points: integer('points').default(0),
  lifetimePoints: integer('lifetime_points').default(0),
  currentStreak: integer('current_streak').default(0),
  lastActiveDate: integer('last_active_date', { mode: 'timestamp' })
});

export const taskTemplates = sqliteTable('task_templates', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  title: text('title').notNull(),
  basePoints: integer('base_points').notNull().default(10),
  frequency: text('frequency', { enum: ['none', 'daily', 'weekly', 'monthly'] }).default('none'),
  frequencyValue: integer('frequency_value'), // 1-7 for day of week, 1-31 for day of month
  creatorId: text('creator_id').references(() => houseMembers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const taskApprovals = sqliteTable('task_approvals', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => taskTemplates.id),
  memberId: text('member_id').notNull().references(() => houseMembers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const frozenPoints = sqliteTable('frozen_points', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  memberId: text('member_id').notNull().references(() => houseMembers.id),
  taskId: text('task_id').notNull().references(() => tasks.id), // Instancia de la tarea completada
  templateId: text('template_id').notNull().references(() => taskTemplates.id),
  points: integer('points').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  templateId: text('template_id').references(() => taskTemplates.id),
  title: text('title').notNull(),
  basePoints: integer('base_points').notNull().default(10),
  currentPoints: integer('current_points').notNull().default(10),
  assignedToId: text('assigned_to_id').references(() => houseMembers.id),
  status: text('status', { enum: ['pending', 'up_for_grabs', 'completed'] }).default('pending'),
  completedById: text('completed_by_id').references(() => houseMembers.id),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date())
});

export const rewards = sqliteTable('rewards', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  title: text('title').notNull(),
  price: integer('price').notNull(),
  icon: text('icon').default('🎁')
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  memberId: text('member_id').references(() => houseMembers.id),
  actionType: text('action_type').notNull(), // 'COMPLETED_TASK', 'BOUGHT_REWARD', 'PASSED_TASK', 'UNFROZEN_POINTS'
  description: text('description').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
