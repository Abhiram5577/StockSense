-- ==============================================================
-- StockSense Inventory Management System
-- Authentication Database Schema (MySQL)
-- ==============================================================
-- Instructions:
-- 1. Open MySQL Workbench or MySQL Command Line Client.
-- 2. Run this entire script to create the database and tables.
-- ==============================================================

-- 1. Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS stocksense
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE stocksense;

-- 2. Create the users table
-- Stores user credentials, hashed passwords, and organizational roles
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create the password_reset_otps table
-- Stores hashed 6-digit OTPs for secure forgot-password flows
-- OTPs are NEVER stored in plaintext. Single-use and expiration enforced.
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_otp_user_used (user_id, used),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================
-- Verification Queries (Optional, for debugging & sanity checks)
-- ==============================================================
-- DESCRIBE users;
-- DESCRIBE password_reset_otps;
-- SELECT * FROM users;
-- SELECT * FROM password_reset_otps;
