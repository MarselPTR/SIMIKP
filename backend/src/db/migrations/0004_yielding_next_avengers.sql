ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:59:56.409';--> statement-breakpoint
ALTER TABLE `activities` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:59:56.417';--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `assigned_at` datetime DEFAULT '2026-08-28 14:59:56.418';--> statement-breakpoint
ALTER TABLE `production_files` MODIFY COLUMN `uploaded_at` datetime DEFAULT '2026-08-28 14:59:56.421';--> statement-breakpoint
ALTER TABLE `production_versions` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:59:56.421';--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `reviewed_at` datetime DEFAULT '2026-08-28 14:59:56.424';--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:59:56.435';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:59:56.435';--> statement-breakpoint
ALTER TABLE `users` ADD `email` varchar(255);