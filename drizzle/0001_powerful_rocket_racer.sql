CREATE TABLE `scrape_progress` (
	`task` text PRIMARY KEY NOT NULL,
	`last_page` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`updated_at` text NOT NULL
);
