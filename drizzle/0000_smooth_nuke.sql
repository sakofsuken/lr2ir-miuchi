CREATE TABLE `bbs` (
	`id` integer PRIMARY KEY NOT NULL,
	`player_id` integer,
	`player_name` text,
	`message` text NOT NULL,
	`posted_at` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `charts` (
	`md5` text PRIMARY KEY NOT NULL,
	`bms_id` integer,
	`title` text NOT NULL,
	`genre` text,
	`artist` text,
	`bpm_min` text,
	`bpm_max` text,
	`level` text,
	`keys` text NOT NULL,
	`judge_rank` text,
	`play_count` integer DEFAULT 0 NOT NULL,
	`play_people` integer DEFAULT 0 NOT NULL,
	`clear_count` integer DEFAULT 0 NOT NULL,
	`clear_people` integer DEFAULT 0 NOT NULL,
	`fc_count` integer DEFAULT 0 NOT NULL,
	`hard_count` integer DEFAULT 0 NOT NULL,
	`normal_count` integer DEFAULT 0 NOT NULL,
	`easy_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`body_url` text,
	`diff_url` text,
	`comment` text,
	`tags` text,
	`suspended` integer DEFAULT 0 NOT NULL,
	`last_updated_by` text,
	`last_updated_at` text
);
--> statement-breakpoint
CREATE TABLE `course_scores` (
	`course_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`clear` integer NOT NULL,
	`exscore` integer NOT NULL,
	`score_max` integer,
	`pg` integer DEFAULT 0 NOT NULL,
	`gr` integer DEFAULT 0 NOT NULL,
	`gd` integer DEFAULT 0 NOT NULL,
	`bd` integer DEFAULT 0 NOT NULL,
	`pr` integer DEFAULT 0 NOT NULL,
	`maxcombo` integer DEFAULT 0 NOT NULL,
	`minbp` integer DEFAULT 0 NOT NULL,
	`option_1` text,
	`option_2` text,
	`input` text,
	`client` text,
	`is_cheated` integer DEFAULT 0 NOT NULL,
	`has_ghost` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`course_id`, `player_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `course_scores_ranking_idx` ON `course_scores` (`course_id`,`exscore`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text,
	`keys` text NOT NULL,
	`creator_id` integer,
	`stages` text NOT NULL,
	`play_count` integer DEFAULT 0 NOT NULL,
	`play_people` integer DEFAULT 0 NOT NULL,
	`clear_count` integer DEFAULT 0 NOT NULL,
	`clear_people` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ghosts` (
	`song_md5` text NOT NULL,
	`player_id` integer NOT NULL,
	`data` blob NOT NULL,
	PRIMARY KEY(`song_md5`, `player_id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`dan_sp` text,
	`dan_dp` text,
	`play_count` integer DEFAULT 0 NOT NULL,
	`fc_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rivals` (
	`player_id` integer NOT NULL,
	`rival_id` integer NOT NULL,
	PRIMARY KEY(`player_id`, `rival_id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rival_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rivals_reverse_idx` ON `rivals` (`rival_id`);--> statement-breakpoint
CREATE TABLE `scores` (
	`song_md5` text NOT NULL,
	`player_id` integer NOT NULL,
	`clear` integer NOT NULL,
	`exscore` integer NOT NULL,
	`score_max` integer,
	`pg` integer DEFAULT 0 NOT NULL,
	`gr` integer DEFAULT 0 NOT NULL,
	`gd` integer DEFAULT 0 NOT NULL,
	`bd` integer DEFAULT 0 NOT NULL,
	`pr` integer DEFAULT 0 NOT NULL,
	`maxcombo` integer DEFAULT 0 NOT NULL,
	`combo_max` integer,
	`minbp` integer DEFAULT 0 NOT NULL,
	`option_1` text,
	`option_2` text,
	`input` text,
	`client` text,
	`note` text,
	`is_cheated` integer DEFAULT 0 NOT NULL,
	`has_ghost` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`song_md5`, `player_id`),
	FOREIGN KEY (`song_md5`) REFERENCES `charts`(`md5`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `scores_ranking_idx` ON `scores` (`song_md5`,`exscore`);--> statement-breakpoint
CREATE TABLE `table_charts` (
	`table_id` integer NOT NULL,
	`chart_md5` text NOT NULL,
	`level` text NOT NULL,
	PRIMARY KEY(`table_id`, `chart_md5`),
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chart_md5`) REFERENCES `charts`(`md5`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL
);
