CREATE TABLE `neighborhood_accounts` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`operation` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `neighborhood_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` integer NOT NULL,
	`host_id` text NOT NULL,
	`job_id` text NOT NULL,
	`members` text NOT NULL,
	`stage` integer DEFAULT -1 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`stage_at` integer NOT NULL,
	`status` text DEFAULT 'forming' NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `world_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`host_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_contracts_room` ON `neighborhood_contracts` (`room_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `neighborhood_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`room_id` integer NOT NULL,
	`scope` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `world_rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_room` ON `neighborhood_messages` (`room_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `neighborhood_mutes` (
	`owner_id` text NOT NULL,
	`target_id` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_mutes_pair` ON `neighborhood_mutes` (`owner_id`,`target_id`);--> statement-breakpoint
CREATE TABLE `neighborhood_presence` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`travel` text DEFAULT 'car' NOT NULL,
	`host_id` text,
	`local_x` real DEFAULT 0 NOT NULL,
	`local_z` real DEFAULT 0 NOT NULL,
	`emote` text DEFAULT '' NOT NULL,
	`emote_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `neighborhood_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`message_id` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reports_pair` ON `neighborhood_reports` (`owner_id`,`message_id`);