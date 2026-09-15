CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`pair_key` text NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`from_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "friendship_status" CHECK("friendships"."status" in ('pending','accepted')),
	CONSTRAINT "friendship_distinct_players" CHECK("friendships"."from_id" <> "friendships"."to_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_friendships_pair` ON `friendships` (`pair_key`);--> statement-breakpoint
CREATE INDEX `idx_friendships_from` ON `friendships` (`from_id`);--> statement-breakpoint
CREATE INDEX `idx_friendships_to` ON `friendships` (`to_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`friend_code` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`status` text NOT NULL,
	`note` text NOT NULL,
	`home_id` text NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_owner` ON `profiles` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_friend_code` ON `profiles` (`friend_code`);