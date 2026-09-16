CREATE TABLE `testnet_accounts` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`registry` text DEFAULT '' NOT NULL,
	`token` text DEFAULT '' NOT NULL,
	`wallet` text,
	`nonce` text,
	`expires_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
