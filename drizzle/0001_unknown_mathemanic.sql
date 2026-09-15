CREATE TABLE `residences` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`unit` integer NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`credits` integer DEFAULT 120 NOT NULL,
	`deliveries` integer DEFAULT 0 NOT NULL,
	`job_id` text,
	`job_stage` integer DEFAULT 0 NOT NULL,
	`job_started_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "residence_level" CHECK("residences"."level" between 0 and 3),
	CONSTRAINT "residence_credits" CHECK("residences"."credits" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_residences_address` ON `residences` (`home_id`,`unit`);--> statement-breakpoint
CREATE TABLE `world_members` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`room_id` integer NOT NULL,
	`session` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`heading` real DEFAULT 0 NOT NULL,
	`mode` text NOT NULL,
	`car_id` text NOT NULL,
	`last_seen` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `world_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "world_member_mode" CHECK("world_members"."mode" in ('apartment','garage','driving','destination'))
);
--> statement-breakpoint
CREATE INDEX `idx_world_members_room_seen` ON `world_members` (`room_id`,`last_seen`);--> statement-breakpoint
CREATE TABLE `world_rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL
);
