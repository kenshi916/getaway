CREATE TABLE `club_accounts` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`chips` integer DEFAULT 500 NOT NULL,
	`gift_day` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "club_chips_nonnegative" CHECK("club_accounts"."chips" >= 0)
);
--> statement-breakpoint
CREATE TABLE `club_tables` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` integer NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`operation` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `world_rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `neighborhood_presence` ADD `venue` text DEFAULT '' NOT NULL;