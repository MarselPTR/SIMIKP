CREATE TABLE `notification_preferences` (
  `user_id` char(36) NOT NULL,
  `email_enabled` boolean NOT NULL DEFAULT true,
  `browser_enabled` boolean NOT NULL DEFAULT true,
  `sound_enabled` boolean NOT NULL DEFAULT true,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `notification_preferences_user_id_pk` PRIMARY KEY(`user_id`),
  CONSTRAINT `notification_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
);