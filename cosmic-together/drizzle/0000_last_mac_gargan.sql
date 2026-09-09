CREATE TABLE `cart` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`color` text NOT NULL,
	`size` text NOT NULL,
	`rationale` text NOT NULL,
	`confirmed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cart_owner` ON `cart` (`owner`);--> statement-breakpoint
CREATE TABLE `circles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`goal` text NOT NULL,
	`products` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_owner` ON `events` (`owner`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL,
	`removed` integer DEFAULT 0 NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `members_circle_owner` ON `members` (`circle_id`,`owner`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`name` text NOT NULL,
	`text` text NOT NULL,
	`type` text DEFAULT 'chat' NOT NULL,
	`product_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_circle_time` ON `messages` (`circle_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shoppers` (
	`id` text PRIMARY KEY NOT NULL,
	`preferences` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`circle_id` text NOT NULL,
	`member_id` text NOT NULL,
	`product_id` text NOT NULL,
	PRIMARY KEY(`circle_id`, `member_id`, `product_id`)
);
