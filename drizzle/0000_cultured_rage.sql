CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`house_id` text NOT NULL,
	`member_id` text,
	`action_type` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `house_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `house_members` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`house_id` text NOT NULL,
	`emoji` text DEFAULT '👤',
	`points` integer DEFAULT 0,
	`lifetime_points` integer DEFAULT 0,
	`current_streak` integer DEFAULT 0,
	`last_active_date` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `houses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `houses_code_unique` ON `houses` (`code`);--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`house_id` text NOT NULL,
	`title` text NOT NULL,
	`price` integer NOT NULL,
	`icon` text DEFAULT '🎁',
	FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`house_id` text NOT NULL,
	`title` text NOT NULL,
	`base_points` integer DEFAULT 10 NOT NULL,
	`current_points` integer DEFAULT 10 NOT NULL,
	`assigned_to_id` text,
	`status` text DEFAULT 'pending',
	`completed_by_id` text,
	`completed_at` integer,
	`is_routine` integer DEFAULT false,
	`routine_group_id` text,
	FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_id`) REFERENCES `house_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completed_by_id`) REFERENCES `house_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text
);
