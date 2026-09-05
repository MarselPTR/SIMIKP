ALTER TABLE `password_reset_tokens` MODIFY COLUMN `created_at` datetime DEFAULT '2026-09-05 06:43:21.375';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT '2026-09-05 06:43:21.374';--> statement-breakpoint
ALTER TABLE `activities` MODIFY COLUMN `created_at` datetime DEFAULT '2026-09-05 06:43:21.437';--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `assigned_at` datetime DEFAULT '2026-09-05 06:43:21.437';--> statement-breakpoint
ALTER TABLE `production_files` MODIFY COLUMN `uploaded_at` datetime DEFAULT '2026-09-05 06:43:21.440';--> statement-breakpoint
ALTER TABLE `production_versions` MODIFY COLUMN `created_at` datetime DEFAULT '2026-09-05 06:43:21.439';--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `reviewed_at` datetime DEFAULT '2026-09-05 06:43:21.442';--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `created_at` datetime DEFAULT '2026-09-05 06:43:21.445';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `created_at` datetime DEFAULT '2026-09-05 06:43:21.445';--> statement-breakpoint
ALTER TABLE `content_types` ADD `role_code` varchar(50) DEFAULT 'PRAHUM' NOT NULL;