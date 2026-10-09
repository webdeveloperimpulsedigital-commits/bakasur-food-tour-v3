-- ==========================================================
-- Bakasur Ka Food Tour - Complete MySQL Database Schema
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `bakasur_food_tour` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `bakasur_food_tour`;

-- 0. Locations (Cities) Table
CREATE TABLE IF NOT EXISTS `locations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `region` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(20) DEFAULT '📍',
    `is_active` TINYINT(1) DEFAULT 1,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_loc_name` (`name`),
    INDEX `idx_loc_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 0.1 Food Categories Table (Swiggy/Zomato Taxonomy)
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `hindi_name` VARCHAR(150),
    `icon` VARCHAR(30) DEFAULT '🍽️',
    `signature_image` VARCHAR(1000),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_cat_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. Restaurants Table
CREATE TABLE IF NOT EXISTS `restaurants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `address` VARCHAR(500) NOT NULL,
    `area` VARCHAR(150),
    `city` VARCHAR(100) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `rating` DECIMAL(3, 2) DEFAULT 4.50,
    `image` VARCHAR(1000) NOT NULL,
    `is_campaign_active` TINYINT(1) DEFAULT 1,
    `total_visits` INT DEFAULT 0,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_city` (`city`),
    INDEX `idx_rating` (`rating`),
    INDEX `idx_lat_lng` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.1 Restaurant Menus Table
CREATE TABLE IF NOT EXISTS `menus` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `restaurant_id` INT NOT NULL,
    `name` VARCHAR(150) NOT NULL DEFAULT 'Main Menu',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
    INDEX `idx_menu_rest_id` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Dishes Table (Relational: Restaurant, Menu, Category)
CREATE TABLE IF NOT EXISTS `dishes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `restaurant_id` INT NOT NULL,
    `menu_id` INT NULL,
    `category_id` INT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `price` DECIMAL(8, 2) DEFAULT 150.00,
    `image` VARCHAR(1000) NOT NULL,
    `flying_image` VARCHAR(1000) NULL,
    `rating` DECIMAL(3, 2) DEFAULT 4.70,
    `popularity` INT DEFAULT 95,
    `is_recommended` TINYINT(1) DEFAULT 1,
    `is_veg` TINYINT(1) DEFAULT 1,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    INDEX `idx_restaurant_id` (`restaurant_id`),
    INDEX `idx_menu_id` (`menu_id`),
    INDEX `idx_category_id` (`category_id`),
    INDEX `idx_dish_popularity` (`popularity`),
    INDEX `idx_dish_veg` (`is_veg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.1 Food Images & Assets Mapping Table (Swiggy/Zomato Food CDN)
CREATE TABLE IF NOT EXISTS `food_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NULL,
    `keyword_patterns` TEXT NOT NULL,
    `plate_image` VARCHAR(1000) NOT NULL,
    `flying_image` VARCHAR(1000) NOT NULL,
    `cuisine` VARCHAR(100) DEFAULT 'Indian',
    `is_verified` TINYINT(1) DEFAULT 1,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bakasur Videos & Eating Stages Table
CREATE TABLE IF NOT EXISTS `bakasur_videos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `restaurant_id` INT NULL,
    `dish_id` INT NULL,
    `stage` VARCHAR(50) NOT NULL, -- 'intro', 'stage_1', 'stage_2', 'stage_3', 'acidity', 'generic'
    `stage_number` INT DEFAULT 1,
    `video_url` VARCHAR(1000) NOT NULL,
    `thumbnail` VARCHAR(1000),
    `duration` INT DEFAULT 15, -- seconds
    `meter_percentage` INT NOT NULL DEFAULT 20, -- target meter after this stage
    `message` TEXT NOT NULL, -- dialogue: "Aur Khilo! Bakasur ki bhookh abhi shant nahi hui!"
    `cta_text` VARCHAR(100) DEFAULT '🍽️ AUR KHILO',
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_rest_dish_stage` (`restaurant_id`, `dish_id`, `stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Campaign Sessions Table
CREATE TABLE IF NOT EXISTS `campaign_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL UNIQUE,
    `user_location` VARCHAR(255),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `restaurant_id` INT,
    `dish_id` INT,
    `current_stage` VARCHAR(50) DEFAULT 'stage_1',
    `food_meter_percentage` INT DEFAULT 20,
    `aur_khilo_clicks` INT DEFAULT 0,
    `video_completed` TINYINT(1) DEFAULT 0,
    `map_visited` TINYINT(1) DEFAULT 0,
    `form_submitted` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Campaign Global Visits Table (Shared Food Tour Map)
CREATE TABLE IF NOT EXISTS `campaign_visits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL,
    `restaurant_id` INT NOT NULL,
    `dish_id` INT,
    `city` VARCHAR(100),
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `visited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
    INDEX `idx_visit_restaurant` (`restaurant_id`),
    INDEX `idx_visited_at` (`visited_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Participants & Contest Entries Table
CREATE TABLE IF NOT EXISTS `participants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL,
    `participation_id` VARCHAR(50) NOT NULL UNIQUE, -- e.g. BKT-892415
    `name` VARCHAR(255) NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `restaurant_id` INT NULL,
    `restaurant_name` VARCHAR(255),
    `dish_id` INT NULL,
    `dish_name` VARCHAR(255),
    `consent` TINYINT(1) DEFAULT 1,
    `terms_accepted` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_participants_mobile` (`mobile`),
    INDEX `idx_participation_id` (`participation_id`),
    INDEX `idx_city` (`city`),
    INDEX `idx_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Campaign Dynamic Config Table
CREATE TABLE IF NOT EXISTS `campaign_configs` (
    `key_name` VARCHAR(100) PRIMARY KEY,
    `value_text` TEXT NOT NULL,
    `description` VARCHAR(255),
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. User Journey Steps Table (Detailed Chronological Step-by-Step History)
CREATE TABLE IF NOT EXISTS `user_journey_steps` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` VARCHAR(100) NOT NULL,
    `step_number` INT NOT NULL DEFAULT 1,
    `step_name` VARCHAR(50) NOT NULL,
    `step_title` VARCHAR(150),
    `metadata` JSON,
    `user_location` VARCHAR(255),
    `ip_address` VARCHAR(100),
    `user_agent` VARCHAR(500),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_journey_session` (`session_id`),
    INDEX `idx_journey_step` (`step_name`),
    INDEX `idx_journey_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

