CREATE TYPE "public"."contact_status" AS ENUM('new', 'qualified', 'contacted', 'customer', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"status" "contact_status" DEFAULT 'new' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"last_activity_at" timestamp with time zone,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contact_id" uuid,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"value" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"stage" "deal_stage" DEFAULT 'new' NOT NULL,
	"probability" integer DEFAULT 10 NOT NULL,
	"expected_close_date" timestamp with time zone,
	"notes" text,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_org_idx" ON "contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "deals_org_idx" ON "deals" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "deals_stage_idx" ON "deals" USING btree ("organization_id","stage");--> statement-breakpoint
INSERT INTO "contacts" ("id","organization_id","first_name","last_name","company","email","phone","status","source","tags","notes","last_activity_at","demo") VALUES
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','Sophie','Martin','Maison Aster','sophie@maison-aster.demo','+33 6 12 34 56 78','qualified','Intent signal',ARRAY['prioritaire','retail'],'Prospect de démonstration migré.',now(),true),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Julien','Morel','Groupe Belvédère','julien@groupe-belvedere.demo','+33 6 23 45 67 89','contacted','Site web',ARRAY['saas'],'Prospect de démonstration migré.',now(),true),
('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','Léa','Robert','Studio Éclat','lea@studio-eclat.demo','+33 6 34 56 78 90','new','Import',ARRAY['créatif'],'Prospect de démonstration migré.',now(),true),
('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','Marc','Petit','Atelier Rivoli','marc@atelier-rivoli.demo','+33 6 45 67 89 01','qualified','Referral',ARRAY['b2b'],'Prospect de démonstration migré.',now(),true);--> statement-breakpoint
INSERT INTO "deals" ("organization_id","contact_id","title","company","value","currency","stage","probability","expected_close_date","notes","demo") VALUES
('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Refonte acquisition','Maison Aster',18500,'EUR','new',15,now()+interval '30 days','Deal de démonstration migré.',true),
('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Déploiement NOVA','Groupe Belvédère',9800,'EUR','qualified',35,now()+interval '45 days','Deal de démonstration migré.',true),
('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','Support Enterprise','Studio Éclat',24000,'EUR','proposal',60,now()+interval '20 days','Deal de démonstration migré.',true),
('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004','Automatisation CRM','Atelier Rivoli',32000,'EUR','negotiation',80,now()+interval '12 days','Deal de démonstration migré.',true);
