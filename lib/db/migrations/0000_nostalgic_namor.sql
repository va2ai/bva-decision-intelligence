CREATE TABLE `agent_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`research_run_id` text NOT NULL,
	`agent_name` text NOT NULL,
	`action` text NOT NULL,
	`input` text,
	`output` text,
	`tokens_used` integer,
	`duration` integer,
	`status` text NOT NULL,
	`error` text,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cost_tracking` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer NOT NULL,
	`output_tokens` integer NOT NULL,
	`total_tokens` integer NOT NULL,
	`cost` real NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`citation_number` text NOT NULL,
	`bva_api_id` text,
	`decision_date` integer NOT NULL,
	`decision_type` text NOT NULL,
	`docket_numbers` text,
	`source_url` text,
	`filename` text,
	`outcome` text,
	`outcome_details` text,
	`outcome_confidence` real,
	`raw_text` text NOT NULL,
	`paragraphs` text NOT NULL,
	`sections` text,
	`extracted_data` text,
	`issues` text,
	`board_member_name` text,
	`veteran_name` text,
	`synced_at` integer NOT NULL,
	`last_updated` integer NOT NULL,
	`indexed` integer DEFAULT false,
	`embedding_generated` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decisions_citation_number_unique` ON `decisions` (`citation_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `decisions_bva_api_id_unique` ON `decisions` (`bva_api_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`scope` text NOT NULL,
	`content_markdown` text NOT NULL,
	`content_html` text NOT NULL,
	`citation_map` text NOT NULL,
	`citation_count` integer DEFAULT 0,
	`quality_flags` text,
	`verified_claims` integer,
	`total_claims` integer,
	`tags` text,
	`research_run_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `research_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`objective` text NOT NULL,
	`config` text NOT NULL,
	`status` text NOT NULL,
	`progress` integer DEFAULT 0,
	`current_phase` text,
	`decision_ids` text NOT NULL,
	`decision_count` integer NOT NULL,
	`agent_logs` text,
	`artifacts` text,
	`final_report` text,
	`report_id` text,
	`tokens_used` integer DEFAULT 0,
	`estimated_cost` real DEFAULT 0,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`last_activity` integer
);
--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`last_sync_date` integer,
	`total_decisions` integer DEFAULT 0,
	`last_sync_status` text,
	`last_sync_error` text
);
