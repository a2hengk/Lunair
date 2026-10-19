CREATE TABLE "pet" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"last_fed_at" timestamp with time zone,
	"last_pet_at" timestamp with time zone,
	"streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_streak_day" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"pet_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pet_actions" ADD CONSTRAINT "pet_actions_pet_id_pet_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_actions" ADD CONSTRAINT "pet_actions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pet_actions_pet_created_idx" ON "pet_actions" USING btree ("pet_id","created_at" DESC NULLS LAST);