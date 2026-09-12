import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  passwordHash: text('password_hash'),
  emoji: text('emoji').default('👤'),
  avatarUrl: text('avatar_url')
});

export const houses = sqliteTable('houses', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  enableStore: integer('enable_store', { mode: 'boolean' }).default(true),
  enableFeed: integer('enable_feed', { mode: 'boolean' }).default(true),
  enablePoints: integer('enable_points', { mode: 'boolean' }).default(true),
  enableQuarantine: integer('enable_quarantine', { mode: 'boolean' }).default(true),
  enableDueDates: integer('enable_due_dates', { mode: 'boolean' }).default(false),
  enableInventory: integer('enable_inventory', { mode: 'boolean' }).default(false),
  enableTaskCategories: integer('enable_task_categories', { mode: 'boolean' }).default(true),
  enableInventoryLocations: integer('enable_inventory_locations', { mode: 'boolean' }).default(true),
  theme: text('theme').default('warm-peach')
});

export const houseMembers = sqliteTable('house_members', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  houseId: text('house_id').notNull().references(() => houses.id),
  displayName: text('display_name'),
  emoji: text('emoji').default('👤'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['admin', 'member'] }).default('member').notNull(),
  points: integer('points').default(0),
  lifetimePoints: integer('lifetime_points').default(0),
  currentStreak: integer('current_streak').default(0),
  lastActiveDate: integer('last_active_date', { mode: 'timestamp' })
});

export const taskCategories = sqliteTable('task_categories', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  name: text('name').notNull(),
  icon: text('icon').default('📦'),
  color: text('color').default('cyan'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const taskTemplates = sqliteTable('task_templates', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  categoryId: text('category_id').references(() => taskCategories.id),
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
  categoryId: text('category_id').references(() => taskCategories.id),
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

export const taskAssignees = sqliteTable('task_assignees', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  memberId: text('member_id').notNull().references(() => houseMembers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
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

export const inventoryLocations = sqliteTable('inventory_locations', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  name: text('name').notNull(),
  icon: text('icon').default('🧊'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  houseId: text('house_id').notNull().references(() => houses.id),
  locationId: text('location_id').references(() => inventoryLocations.id),
  name: text('name').notNull(),
  icon: text('icon').default('📦'),
  quantity: integer('quantity').notNull().default(1),
  unit: text('unit'), // 'uds', 'kg', 'L', 'paquete', etc.
  inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
  neededInShoppingList: integer('needed_in_shopping_list', { mode: 'boolean' }).notNull().default(false),
  shoppingQuantity: integer('shopping_quantity').notNull().default(1),
  isBought: integer('is_bought', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
