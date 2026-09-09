CREATE TABLE `cart_versions` (
	`owner` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DROP INDEX `members_circle_owner`;--> statement-breakpoint
CREATE UNIQUE INDEX `members_circle_owner_unique` ON `members` (`circle_id`,`owner`);