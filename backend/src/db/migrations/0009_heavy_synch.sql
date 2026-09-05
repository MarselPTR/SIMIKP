ALTER TABLE `password_reset_tokens` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `birth_date` date;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `activities` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `revision_date` datetime;--> statement-breakpoint
ALTER TABLE `production_files` MODIFY COLUMN `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `production_versions` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `reviewed_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `created_at` datetime DEFAULT '2026-09-05 08:46:45.176';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;