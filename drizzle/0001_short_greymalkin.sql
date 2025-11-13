CREATE TABLE `aiQueries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advisorId` int NOT NULL,
	`clientId` int,
	`query` text NOT NULL,
	`response` text,
	`queryType` varchar(50),
	`executionTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiQueries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advisorId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`netWorth` int,
	`portfolioValue` int,
	`riskTolerance` enum('conservative','moderate','aggressive'),
	`nextMeetingDate` timestamp,
	`lastMeetingDate` timestamp,
	`retirementDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`ticker` varchar(10) NOT NULL,
	`companyName` varchar(255),
	`shares` int NOT NULL,
	`costBasis` int,
	`currentPrice` int,
	`currentValue` int,
	`sector` varchar(100),
	`assetClass` varchar(50),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `holdings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`advisorId` int NOT NULL,
	`meetingDate` timestamp NOT NULL,
	`meetingType` enum('review','planning','onboarding','check-in'),
	`talkingPoints` text,
	`aiInsights` text,
	`riskFlags` text,
	`recommendedQuestions` text,
	`notes` text,
	`status` enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(10),
	`title` varchar(500) NOT NULL,
	`summary` text,
	`url` text,
	`source` varchar(255),
	`publishedAt` timestamp,
	`relevanceScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advisorId` int NOT NULL,
	`clientId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`status` enum('pending','in_progress','completed') DEFAULT 'pending',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `advisorId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `firmName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` text;