ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:58:27.396';--> statement-breakpoint
ALTER TABLE `activities` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:58:27.407';--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `assigned_at` datetime DEFAULT '2026-08-20 03:58:27.407';--> statement-breakpoint
ALTER TABLE `production_files` MODIFY COLUMN `uploaded_at` datetime DEFAULT '2026-08-20 03:58:27.411';--> statement-breakpoint
ALTER TABLE `production_versions` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:58:27.410';--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `reviewed_at` datetime DEFAULT '2026-08-20 03:58:27.413';--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:58:27.418';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-20 03:58:27.418';--> statement-breakpoint
ALTER TABLE `users` ADD `staff_type` varchar(50);--> statement-breakpoint
ALTER TABLE `activities` ADD `start_time` time;--> statement-breakpoint
ALTER TABLE `activities` ADD `end_time` time;