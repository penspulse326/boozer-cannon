CREATE TABLE "canonical_entities" (
	"category" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"default_abv" numeric(4, 1),
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"name_zh" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "entity_aliases" (
	"alias_text" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"entity_id" varchar(50) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flavors" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name_en" varchar(50) NOT NULL,
	"name_zh" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_favorites" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "recipe_favorites_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_flavors" (
	"flavor_id" varchar(50) NOT NULL,
	"recipe_id" uuid NOT NULL,
	CONSTRAINT "recipe_flavors_recipe_id_flavor_id_pk" PRIMARY KEY("recipe_id","flavor_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_garnishes" (
	"garnish_custom" varchar(100),
	"garnish_entity_id" varchar(50),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"abv" numeric(4, 1) DEFAULT '0.0' NOT NULL,
	"amount" numeric(6, 2) NOT NULL,
	"brand_custom" varchar(100),
	"brand_entity_id" varchar(50),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_entity_id" varchar(50),
	"name" varchar(100) NOT NULL,
	"recipe_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"unit" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_likes" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "recipe_likes_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"author_id" uuid NOT NULL,
	"base_spirit" varchar(50) NOT NULL,
	"calculated_abv" numeric(4, 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"dilution_ratio" numeric(4, 2),
	"favorites_count" integer DEFAULT 0 NOT NULL,
	"glass_custom" varchar(100),
	"glass_entity_id" varchar(50),
	"ice_custom" varchar(100),
	"ice_entity_id" varchar(50),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" varchar(500),
	"instructions" jsonb,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"method" varchar(50) NOT NULL,
	"name_en" varchar(150),
	"name_zh" varchar(150),
	"story" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_aliases" ADD CONSTRAINT "entity_aliases_entity_id_canonical_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."canonical_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_favorites" ADD CONSTRAINT "recipe_favorites_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_favorites" ADD CONSTRAINT "recipe_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_flavors" ADD CONSTRAINT "recipe_flavors_flavor_id_flavors_id_fk" FOREIGN KEY ("flavor_id") REFERENCES "public"."flavors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_flavors" ADD CONSTRAINT "recipe_flavors_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_garnishes" ADD CONSTRAINT "recipe_garnishes_garnish_entity_id_canonical_entities_id_fk" FOREIGN KEY ("garnish_entity_id") REFERENCES "public"."canonical_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_garnishes" ADD CONSTRAINT "recipe_garnishes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_brand_entity_id_canonical_entities_id_fk" FOREIGN KEY ("brand_entity_id") REFERENCES "public"."canonical_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_entity_id_canonical_entities_id_fk" FOREIGN KEY ("ingredient_entity_id") REFERENCES "public"."canonical_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_glass_entity_id_canonical_entities_id_fk" FOREIGN KEY ("glass_entity_id") REFERENCES "public"."canonical_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_ice_entity_id_canonical_entities_id_fk" FOREIGN KEY ("ice_entity_id") REFERENCES "public"."canonical_entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "canonical_entities_category_idx" ON "canonical_entities" USING btree ("category");--> statement-breakpoint
CREATE INDEX "entity_aliases_alias_text_idx" ON "entity_aliases" USING btree ("alias_text");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_aliases_entity_id_alias_text_idx" ON "entity_aliases" USING btree ("entity_id","alias_text");--> statement-breakpoint
CREATE INDEX "recipe_favorites_user_id_idx" ON "recipe_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipe_flavors_flavor_id_idx" ON "recipe_flavors" USING btree ("flavor_id");--> statement-breakpoint
CREATE INDEX "recipe_garnishes_recipe_id_idx" ON "recipe_garnishes" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_garnishes_garnish_entity_id_idx" ON "recipe_garnishes" USING btree ("garnish_entity_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_ingredient_entity_id_idx" ON "recipe_ingredients" USING btree ("ingredient_entity_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_brand_entity_id_idx" ON "recipe_ingredients" USING btree ("brand_entity_id");--> statement-breakpoint
CREATE INDEX "recipe_likes_recipe_id_idx" ON "recipe_likes" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipes_author_id_idx" ON "recipes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "recipes_base_spirit_idx" ON "recipes" USING btree ("base_spirit");--> statement-breakpoint
CREATE INDEX "recipes_method_idx" ON "recipes" USING btree ("method");--> statement-breakpoint
CREATE INDEX "recipes_calculated_abv_idx" ON "recipes" USING btree ("calculated_abv");--> statement-breakpoint
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts" USING btree ("user_id");