CREATE TABLE `recurring_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`house_id` text NOT NULL,
	`title` text NOT NULL,
	`base_points` integer DEFAULT 10 NOT NULL,
	`frequency` text NOT NULL,
	`default_assignee_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_assignee_id`) REFERENCES `house_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurring_task_id` text REFERENCES recurring_tasks(id);--> statement-breakpoint
ALTER TABLE `tasks` ADD `due_date` integer;