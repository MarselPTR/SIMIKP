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
	`active` boolean DEFAULT true,
	`created_at` datetime DEFAULT '2026-08-19 05:49:00.935',
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `content_types` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `content_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `keywords` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `keywords_id` PRIMARY KEY(`id`),
	CONSTRAINT `keywords_name_unique` UNIQUE(`name`)
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
CREATE TABLE `persons` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`position` varchar(255),
	`organization` varchar(255),
	CONSTRAINT `persons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategic_issues` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `strategic_issues_id` PRIMARY KEY(`id`),
	CONSTRAINT `strategic_issues_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` char(36) NOT NULL,
	`activity_code` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`strakom_number` varchar(100),
	`activity_date` date NOT NULL,
	`activity_time` varchar(50),
	`location_id` char(36),
	`description` text,
	`priority` varchar(50),
	`status` varchar(50) NOT NULL,
	`created_by` char(36) NOT NULL,
	`created_at` datetime DEFAULT '2026-08-19 05:49:00.942',
	CONSTRAINT `activities_id` PRIMARY KEY(`id`),
	CONSTRAINT `activities_activity_code_unique` UNIQUE(`activity_code`)
);
--> statement-breakpoint
CREATE TABLE `activity_keywords` (
	`activity_id` char(36) NOT NULL,
	`keyword_id` char(36) NOT NULL,
	CONSTRAINT `activity_keywords_activity_id_keyword_id_pk` PRIMARY KEY(`activity_id`,`keyword_id`)
);
--> statement-breakpoint
CREATE TABLE `activity_persons` (
	`activity_id` char(36) NOT NULL,
	`person_id` char(36) NOT NULL,
	CONSTRAINT `activity_persons_activity_id_person_id_pk` PRIMARY KEY(`activity_id`,`person_id`)
);
--> statement-breakpoint
CREATE TABLE `activity_strategic_issues` (
	`activity_id` char(36) NOT NULL,
	`issue_id` char(36) NOT NULL,
	CONSTRAINT `activity_strategic_issues_activity_id_issue_id_pk` PRIMARY KEY(`activity_id`,`issue_id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` char(36) NOT NULL,
	`activity_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`content_type_id` char(36) NOT NULL,
	`assigned_at` datetime DEFAULT '2026-08-19 05:49:00.942',
	`deadline` datetime,
	`status` varchar(50) NOT NULL,
	`instruction` text,
	`created_by` char(36) NOT NULL,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
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
	`uploaded_by` char(36) NOT NULL,
	`uploaded_at` datetime DEFAULT '2026-08-19 05:49:00.945',
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
	`is_current` boolean DEFAULT false,
	`created_at` datetime DEFAULT '2026-08-19 05:49:00.945',
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
	`reviewed_at` datetime DEFAULT '2026-08-19 05:49:00.948',
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archive_assets` (
	`id` char(36) NOT NULL,
	`production_file_id` char(36) NOT NULL,
	`title` varchar(255),
	`description` text,
	`is_public` boolean DEFAULT false,
	CONSTRAINT `archive_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `archive_assets_production_file_id_unique` UNIQUE(`production_file_id`)
);
--> statement-breakpoint
CREATE TABLE `archive_keywords` (
	`archive_asset_id` char(36) NOT NULL,
	`keyword_id` char(36) NOT NULL,
	CONSTRAINT `archive_keywords_archive_asset_id_keyword_id_pk` PRIMARY KEY(`archive_asset_id`,`keyword_id`)
);
--> statement-breakpoint
CREATE TABLE `archive_persons` (
	`archive_asset_id` char(36) NOT NULL,
	`person_id` char(36) NOT NULL,
	CONSTRAINT `archive_persons_archive_asset_id_person_id_pk` PRIMARY KEY(`archive_asset_id`,`person_id`)
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
	`created_at` datetime DEFAULT '2026-08-19 05:49:00.953',
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
	`created_at` datetime DEFAULT '2026-08-19 05:49:00.953',
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_keywords` ADD CONSTRAINT `activity_keywords_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_keywords` ADD CONSTRAINT `activity_keywords_keyword_id_keywords_id_fk` FOREIGN KEY (`keyword_id`) REFERENCES `keywords`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_persons` ADD CONSTRAINT `activity_persons_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_persons` ADD CONSTRAINT `activity_persons_person_id_persons_id_fk` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_strategic_issues` ADD CONSTRAINT `activity_strategic_issues_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_strategic_issues` ADD CONSTRAINT `activity_strategic_issues_issue_id_strategic_issues_id_fk` FOREIGN KEY (`issue_id`) REFERENCES `strategic_issues`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_activity_id_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_content_type_id_content_types_id_fk` FOREIGN KEY (`content_type_id`) REFERENCES `content_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_files` ADD CONSTRAINT `production_files_production_version_id_production_versions_id_fk` FOREIGN KEY (`production_version_id`) REFERENCES `production_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_files` ADD CONSTRAINT `production_files_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_items` ADD CONSTRAINT `production_items_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_versions` ADD CONSTRAINT `production_versions_production_item_id_production_items_id_fk` FOREIGN KEY (`production_item_id`) REFERENCES `production_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publications` ADD CONSTRAINT `publications_production_version_id_production_versions_id_fk` FOREIGN KEY (`production_version_id`) REFERENCES `production_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publications` ADD CONSTRAINT `publications_recorded_by_users_id_fk` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_production_version_id_production_versions_id_fk` FOREIGN KEY (`production_version_id`) REFERENCES `production_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewer_id_users_id_fk` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `archive_assets` ADD CONSTRAINT `archive_assets_production_file_id_production_files_id_fk` FOREIGN KEY (`production_file_id`) REFERENCES `production_files`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `archive_keywords` ADD CONSTRAINT `archive_keywords_archive_asset_id_archive_assets_id_fk` FOREIGN KEY (`archive_asset_id`) REFERENCES `archive_assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `archive_keywords` ADD CONSTRAINT `archive_keywords_keyword_id_keywords_id_fk` FOREIGN KEY (`keyword_id`) REFERENCES `keywords`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `archive_persons` ADD CONSTRAINT `archive_persons_archive_asset_id_archive_assets_id_fk` FOREIGN KEY (`archive_asset_id`) REFERENCES `archive_assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `archive_persons` ADD CONSTRAINT `archive_persons_person_id_persons_id_fk` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;