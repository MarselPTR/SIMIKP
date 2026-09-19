CREATE TABLE `password_reset_tokens` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` char(36) NOT NULL,
	`name` varchar(50) NOT NULL,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` char(36) NOT NULL,
	`role_id` char(36) NOT NULL,
	CONSTRAINT `user_roles_user_id_role_id_pk` PRIMARY KEY(`user_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`staff_type` varchar(50),
	`email` varchar(255),
	`phone` varchar(30),
	`bio` text,
	`gender` varchar(15),
	`birth_place` varchar(100),
	`birth_date` date,
	`pas_foto_url` text,
	`active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`user_id` char(36) NOT NULL,
	`email_enabled` boolean NOT NULL DEFAULT true,
	`browser_enabled` boolean NOT NULL DEFAULT true,
	`sound_enabled` boolean NOT NULL DEFAULT true,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `content_types` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role_code` varchar(50) NOT NULL DEFAULT 'PRAHUM',
	CONSTRAINT `content_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(255),
	`kecamatan` varchar(100),
	`desa_kelurahan` varchar(100),
	`lat` double,
	`lng` double,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opds` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`singkatan` varchar(50),
	CONSTRAINT `opds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` char(36) NOT NULL,
	`activity_code` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`activity_date` date NOT NULL,
	`activity_time` varchar(50),
	`start_time` time,
	`end_time` time,
	`location_id` char(36),
	`opd_id` char(36),
	`description` text,
	`priority` varchar(50),
	`status` varchar(50) NOT NULL,
	`created_by` char(36) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `activities_activity_code_unique` UNIQUE(`activity_code`)
);
--> statement-breakpoint
CREATE TABLE `activity_required_contents` (
	`activity_id` char(36) NOT NULL,
	`content_type_id` char(36) NOT NULL,
	CONSTRAINT `activity_required_contents_activity_id_content_type_id_pk` PRIMARY KEY(`activity_id`,`content_type_id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` char(36) NOT NULL,
	`activity_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`content_type_id` char(36) NOT NULL,
	`assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`start_time` time,
	`end_time` time,
	`deadline` datetime,
	`status` varchar(50) NOT NULL,
	`instruction` text,
	`work_link` text,
	`revision_notes` text,
	`revision_author` varchar(255),
	`revision_date` datetime,
	`created_by` char(36) NOT NULL,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_assignment_activity_content` UNIQUE(`activity_id`,`content_type_id`)
);
--> statement-breakpoint
CREATE TABLE `production_files` (
	`id` char(36) NOT NULL,
	`production_version_id` char(36) NOT NULL,
	`original_filename` varchar(255) NOT NULL,
	`stored_filename` varchar(255) NOT NULL,
	`storage_path` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_extension` varchar(10) NOT NULL,
	`file_size` bigint NOT NULL,
	`uploaded_by` char(36),
	`uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `production_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_files_stored_filename_unique` UNIQUE(`stored_filename`)
);
--> statement-breakpoint
CREATE TABLE `production_items` (
	`id` char(36) NOT NULL,
	`assignment_id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL,
	`production_date` datetime,
	CONSTRAINT `production_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_items_assignment_id_unique` UNIQUE(`assignment_id`)
);
--> statement-breakpoint
CREATE TABLE `production_versions` (
	`id` char(36) NOT NULL,
	`production_item_id` char(36) NOT NULL,
	`version_number` int NOT NULL,
	`work_link` varchar(500),
	`is_current` boolean DEFAULT false,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `production_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `production_versions_production_item_id_version_number_unique` UNIQUE(`production_item_id`,`version_number`)
);
--> statement-breakpoint
CREATE TABLE `publications` (
	`id` char(36) NOT NULL,
	`production_version_id` char(36) NOT NULL,
	`status` varchar(50) NOT NULL,
	`channel` varchar(255) NOT NULL,
	`url` varchar(255),
	`notes` text,
	`recorded_by` char(36) NOT NULL,
	`publication_date` datetime,
	CONSTRAINT `publications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` char(36) NOT NULL,
	`production_version_id` char(36) NOT NULL,
	`reviewer_id` char(36) NOT NULL,
	`status` varchar(50) NOT NULL,
	`comment` text,
	`reviewed_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` char(36) NOT NULL,
	`actor_user_id` char(36),
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` varchar(100) NOT NULL,
	`metadata` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`read_at` datetime,
	`metadata` json,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_opd_id_opds_id_fk` FOREIGN KEY (`opd_id`) REFERENCES `opds`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_required_contents` ADD CONSTRAINT `activity_required_contents_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_required_contents` ADD CONSTRAINT `activity_required_contents_content_type_id_content_types_id_fk` FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_content_type_id_content_types_id_fk` FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_files` ADD CONSTRAINT `production_files_production_version_id_production_versions_id_fk` FOREIGN KEY (`production_version_id`) REFERENCES `production_versions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_files` ADD CONSTRAINT `production_files_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_items` ADD CONSTRAINT `production_items_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_versions` ADD CONSTRAINT `production_versions_production_item_id_production_items_id_fk` FOREIGN KEY (`production_item_id`) REFERENCES `production_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publications` ADD CONSTRAINT `publications_production_version_id_production_versions_id_fk` FOREIGN KEY (`production_version_id`) REFERENCES `production_versions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publications` ADD CONSTRAINT `publications_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_production_version_id_production_versions_id_fk` FOREIGN KEY (`production_version_id`) REFERENCES `production_versions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewer_id_users_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_activity_date` ON `activities` (`activity_date`);--> statement-breakpoint
CREATE INDEX `idx_activity_status` ON `activities` (`status`);--> statement-breakpoint
CREATE INDEX `idx_assignment_status` ON `assignments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_assignment_user_status_deadline` ON `assignments` (`user_id`,`status`,`deadline`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor_time` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifs_user_read_time` ON `notifications` (`user_id`,`read_at`,`created_at`);