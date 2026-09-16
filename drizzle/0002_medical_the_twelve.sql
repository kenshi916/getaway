CREATE TABLE `first_hour` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT '{}' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`invite_token` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_first_hour_invite` ON `first_hour` (`invite_token`);