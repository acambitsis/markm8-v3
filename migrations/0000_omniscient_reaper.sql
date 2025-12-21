CREATE TYPE "public"."essay_status" AS ENUM('draft', 'submitted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."grade_status" AS ENUM('queued', 'processing', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."grading_scale" AS ENUM('percentage', 'letter', 'uk', 'gpa', 'pass_fail');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('signup_bonus', 'purchase', 'grading', 'refund');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"description" text,
	"grade_id" uuid,
	"stripe_payment_intent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"reserved" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "essays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"author_user_id" text,
	"assignment_brief" jsonb,
	"rubric" jsonb,
	"content" text,
	"word_count" integer,
	"focus_areas" text[],
	"status" "essay_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"essay_id" uuid NOT NULL,
	"status" "grade_status" DEFAULT 'queued' NOT NULL,
	"letter_grade_range" text,
	"percentage_range" jsonb,
	"feedback" jsonb,
	"model_results" jsonb,
	"total_tokens" integer DEFAULT 0,
	"api_cost" numeric(10, 4),
	"error_message" text,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"signup_bonus_amount" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"institution" text,
	"course" text,
	"default_grading_scale" "grading_scale",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credits" ADD CONSTRAINT "credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "essays" ADD CONSTRAINT "essays_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "essays" ADD CONSTRAINT "essays_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_essay_id_essays_id_fk" FOREIGN KEY ("essay_id") REFERENCES "public"."essays"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_credit_transactions_user_id" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_credit_transactions_created_at" ON "credit_transactions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_essays_user_id" ON "essays" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_essays_status" ON "essays" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_essays_submitted_at" ON "essays" USING btree ("submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_essays_user_draft" ON "essays" USING btree ("user_id","updated_at") WHERE status = 'draft';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_grades_user_id" ON "grades" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_grades_status" ON "grades" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_grades_essay_id" ON "grades" USING btree ("essay_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_grades_essay_created" ON "grades" USING btree ("essay_id","created_at" DESC NULLS LAST);