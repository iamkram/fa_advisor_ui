-- Add households table
CREATE TABLE IF NOT EXISTS `households` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `advisorId` int NOT NULL,
  `householdName` varchar(255) NOT NULL,
  `primaryContactName` varchar(255),
  `email` varchar(320),
  `phone` varchar(50),
  `address` text,
  `totalNetWorth` decimal(15,2),
  `riskTolerance` enum('conservative','moderate','aggressive'),
  `investmentObjective` text,
  `salesforceId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `household_advisor_idx` (`advisorId`),
  KEY `household_salesforce_idx` (`salesforceId`),
  FOREIGN KEY (`advisorId`) REFERENCES `users`(`id`)
);

-- Add accounts table
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `householdId` int NOT NULL,
  `accountNumber` varchar(64) NOT NULL UNIQUE,
  `accountName` varchar(255) NOT NULL,
  `accountType` enum('taxable','ira_traditional','ira_roth','401k','403b','529','trust','other') NOT NULL,
  `ownerName` varchar(255),
  `currentValue` decimal(15,2),
  `costBasis` decimal(15,2),
  `ytdReturn` decimal(10,4),
  `oneYearReturn` decimal(10,4),
  `status` enum('active','closed','pending') DEFAULT 'active',
  `salesforceId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `account_household_idx` (`householdId`),
  KEY `account_salesforce_idx` (`salesforceId`),
  FOREIGN KEY (`householdId`) REFERENCES `households`(`id`)
);

-- Add S&P 500 companies table
CREATE TABLE IF NOT EXISTS `sp500Companies` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ticker` varchar(20) NOT NULL UNIQUE,
  `companyName` varchar(255) NOT NULL,
  `sector` varchar(100),
  `industry` varchar(100),
  `marketCap` decimal(20,2),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `sp500_sector_idx` (`sector`)
);

-- Modify clients table to add householdId
ALTER TABLE `clients` ADD COLUMN IF NOT EXISTS `householdId` int;
ALTER TABLE `clients` ADD KEY IF NOT EXISTS `client_household_idx` (`householdId`);

-- Modify holdings table to add new columns
ALTER TABLE `holdings` ADD COLUMN IF NOT EXISTS `accountId` int NOT NULL AFTER `id`;
ALTER TABLE `holdings` ADD COLUMN IF NOT EXISTS `cusip` varchar(9) AFTER `companyName`;
ALTER TABLE `holdings` ADD COLUMN IF NOT EXISTS `unrealizedGainLoss` decimal(15,2) AFTER `assetClass`;
ALTER TABLE `holdings` ADD COLUMN IF NOT EXISTS `unrealizedGainLossPercent` decimal(10,4) AFTER `unrealizedGainLoss`;
ALTER TABLE `holdings` ADD COLUMN IF NOT EXISTS `purchaseDate` timestamp AFTER `unrealizedGainLossPercent`;
ALTER TABLE `holdings` ADD KEY IF NOT EXISTS `holding_account_idx` (`accountId`);

-- Modify users table to add advisor fields
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `advisorId` varchar(64) AFTER `role`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `firmName` text AFTER `advisorId`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `photoUrl` text AFTER `firmName`;
ALTER TABLE `users` ADD KEY IF NOT EXISTS `advisor_id_idx` (`advisorId`);

-- Modify meetings table to add householdId
ALTER TABLE `meetings` ADD COLUMN IF NOT EXISTS `householdId` int AFTER `advisorId`;
ALTER TABLE `meetings` ADD KEY IF NOT EXISTS `meeting_household_idx` (`householdId`);

-- Modify tasks table to add householdId
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `householdId` int AFTER `advisorId`;

-- Modify aiQueries table to add householdId
ALTER TABLE `aiQueries` ADD COLUMN IF NOT EXISTS `householdId` int AFTER `advisorId`;
