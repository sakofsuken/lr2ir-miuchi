CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` integer NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `players` ADD `password_hash` text;