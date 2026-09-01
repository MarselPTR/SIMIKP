ALTER TABLE `users` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:45:25.292';--> statement-breakpoint
ALTER TABLE `activities` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:45:25.302';--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `assigned_at` datetime DEFAULT '2026-08-28 14:45:25.303';--> statement-breakpoint
ALTER TABLE `production_files` MODIFY COLUMN `uploaded_at` datetime DEFAULT '2026-08-28 14:45:25.308';--> statement-breakpoint
ALTER TABLE `production_versions` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:45:25.308';--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `reviewed_at` datetime DEFAULT '2026-08-28 14:45:25.312';--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:45:25.320';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `created_at` datetime DEFAULT '2026-08-28 14:45:25.320';--> statement-breakpoint
ALTER TABLE `users` ADD `nik` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` varchar(15);--> statement-breakpoint
ALTER TABLE `users` ADD `birth_place` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `birth_date` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `religion` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `education` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `pas_foto_url` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `scan_ktp_url` varchar(500);