DROP TABLE IF EXISTS `archive_assets`;--> statement-breakpoint
CREATE INDEX `idx_activity_date` ON `activities` (`activity_date`);--> statement-breakpoint
CREATE INDEX `idx_activity_status` ON `activities` (`status`);--> statement-breakpoint
CREATE INDEX `idx_assignment_status` ON `assignments` (`status`);