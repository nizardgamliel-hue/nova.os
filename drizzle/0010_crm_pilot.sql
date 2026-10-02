CREATE TABLE "crm_billing_profiles" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"party" jsonb NOT NULL,
	"payment_instructions" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"legal_id" text DEFAULT '' NOT NULL,
	"vat_id" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_followup_rules" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"delay_days" integer DEFAULT 7 NOT NULL,
	"subject" text NOT NULL,
	"template" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_invoice_counters" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"value" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"number" text,
	"version" integer DEFAULT 1 NOT NULL,
	"snapshot" jsonb NOT NULL,
	"pdf_base64" text,
	"finalized_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_mail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"invoice_id" uuid,
	"dedup_key" text NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'prepared' NOT NULL,
	"automatic" boolean DEFAULT false NOT NULL,
	"provider_id" text,
	"error" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempted_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contact_id" uuid,
	"title" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "legal_id" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "vat_id" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_billing_profiles" ADD CONSTRAINT "crm_billing_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_companies" ADD CONSTRAINT "crm_companies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_followup_rules" ADD CONSTRAINT "crm_followup_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_followup_rules" ADD CONSTRAINT "crm_followup_rules_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_imports" ADD CONSTRAINT "crm_imports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoice_counters" ADD CONSTRAINT "crm_invoice_counters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_mail" ADD CONSTRAINT "crm_mail_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_mail" ADD CONSTRAINT "crm_mail_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_mail" ADD CONSTRAINT "crm_mail_invoice_id_crm_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."crm_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crm_companies_org_id_unique" ON "crm_companies" USING btree ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_invoices_org_number_unique" ON "crm_invoices" USING btree ("organization_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_mail_org_dedup_unique" ON "crm_mail" USING btree ("organization_id","dedup_key");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_org_email_unique" ON "contacts" USING btree ("organization_id",lower(btrim("email")));
--> statement-breakpoint
ALTER TABLE crm_invoices ADD CONSTRAINT crm_invoices_status_check CHECK(status IN ('draft','finalized'));
--> statement-breakpoint
ALTER TABLE crm_mail ADD CONSTRAINT crm_mail_status_check CHECK(status IN ('prepared','sending','accepted','failed','uncertain','cancelled'));
--> statement-breakpoint
ALTER TABLE crm_followup_rules ADD CONSTRAINT crm_followup_delay_check CHECK(delay_days BETWEEN 7 AND 365);
--> statement-breakpoint
CREATE FUNCTION crm_finalize_invoice(p_org uuid,p_id uuid,p_version integer,p_actor text) RETURNS crm_invoices LANGUAGE plpgsql AS $$
DECLARE r crm_invoices; n bigint;
BEGIN
 SELECT * INTO r FROM crm_invoices WHERE id=p_id AND organization_id=p_org FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
 IF r.status='finalized' THEN RETURN r; END IF;
 IF r.version<>p_version THEN RAISE EXCEPTION 'DRAFT_CHANGED'; END IF;
 INSERT INTO crm_invoice_counters(organization_id,value) VALUES(p_org,1) ON CONFLICT(organization_id) DO UPDATE SET value=crm_invoice_counters.value+1 RETURNING value INTO n;
 UPDATE crm_invoices SET status='finalized',number='NOVA-'||lpad(n::text,8,'0'),finalized_at=now() WHERE id=p_id RETURNING * INTO r;
 INSERT INTO audit_logs(organization_id,user_id,action,resource_type,resource_id,metadata) VALUES(p_org,p_actor,'invoice.finalized','invoice',p_id::text,jsonb_build_object('number',r.number));
 RETURN r;
END $$;
--> statement-breakpoint
CREATE FUNCTION crm_protect_invoice() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' AND OLD.status='finalized' THEN RAISE EXCEPTION 'FINALIZED_IMMUTABLE'; END IF;
 IF TG_OP='UPDATE' AND OLD.status='finalized' AND (NEW.snapshot IS DISTINCT FROM OLD.snapshot OR NEW.number IS DISTINCT FROM OLD.number OR NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.contact_id IS DISTINCT FROM OLD.contact_id OR NEW.status IS DISTINCT FROM OLD.status OR NEW.finalized_at IS DISTINCT FROM OLD.finalized_at OR (OLD.pdf_base64 IS NOT NULL AND NEW.pdf_base64 IS DISTINCT FROM OLD.pdf_base64)) THEN RAISE EXCEPTION 'FINALIZED_IMMUTABLE'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER crm_invoice_immutable BEFORE UPDATE OR DELETE ON crm_invoices FOR EACH ROW EXECUTE FUNCTION crm_protect_invoice();
--> statement-breakpoint
CREATE FUNCTION crm_check_contact_org() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.contact_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM contacts WHERE id=NEW.contact_id AND organization_id=NEW.organization_id) THEN RAISE EXCEPTION 'CONTACT_ORGANIZATION_MISMATCH'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER crm_notes_tenant BEFORE INSERT OR UPDATE ON crm_notes FOR EACH ROW EXECUTE FUNCTION crm_check_contact_org();
--> statement-breakpoint
CREATE TRIGGER crm_tasks_tenant BEFORE INSERT OR UPDATE ON crm_tasks FOR EACH ROW EXECUTE FUNCTION crm_check_contact_org();
--> statement-breakpoint
CREATE TRIGGER crm_invoices_tenant BEFORE INSERT OR UPDATE ON crm_invoices FOR EACH ROW EXECUTE FUNCTION crm_check_contact_org();
--> statement-breakpoint
CREATE TRIGGER crm_mail_tenant BEFORE INSERT OR UPDATE ON crm_mail FOR EACH ROW EXECUTE FUNCTION crm_check_contact_org();

--> statement-breakpoint
CREATE TRIGGER crm_deals_tenant BEFORE INSERT OR UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION crm_check_contact_org();
