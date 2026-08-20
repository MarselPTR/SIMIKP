CREATE TABLE `opds` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`singkatan` varchar(50),
	CONSTRAINT `opds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity_required_contents` (
	`activity_id` char(36) NOT NULL,
	`content_type_id` char(36) NOT NULL,
	CONSTRAINT `activity_required_contents_activity_id_content_type_id_pk` PRIMARY KEY(`activity_id`,`content_type_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:22:28.515';--> statement-breakpoint
ALTER TABLE `activities` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:22:28.528';--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `assigned_at` datetime DEFAULT '2026-08-20 03:22:28.529';--> statement-breakpoint
ALTER TABLE `production_files` MODIFY COLUMN `uploaded_at` datetime DEFAULT '2026-08-20 03:22:28.534';--> statement-breakpoint
ALTER TABLE `production_versions` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:22:28.534';--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `reviewed_at` datetime DEFAULT '2026-08-20 03:22:28.541';--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:22:28.553';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:22:28.553';--> statement-breakpoint
ALTER TABLE `activities` ADD `opd_id` char(36);--> statement-breakpoint
ALTER TABLE `assignments` ADD `start_time` time;--> statement-breakpoint
ALTER TABLE `assignments` ADD `end_time` time;--> statement-breakpoint
ALTER TABLE `production_versions` ADD `work_link` varchar(500);--> statement-breakpoint
ALTER TABLE `activity_required_contents` ADD CONSTRAINT `activity_required_contents_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_required_contents` ADD CONSTRAINT `activity_required_contents_content_type_id_content_types_id_fk` FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_opd_id_opds_id_fk` FOREIGN KEY (`opd_id`) REFERENCES `opds`(`id`) ON DELETE no action ON UPDATE no action;