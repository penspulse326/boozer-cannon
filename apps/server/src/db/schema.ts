import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ==========================================
// 1. 使用者與第三方認證 (User & OAuth)
// ==========================================
export const users = pgTable('users', {
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    provider: varchar('provider', { length: 50 }).notNull().default('google'),
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('oauth_provider_user_idx').on(table.provider, table.providerUserId),
    index('oauth_accounts_user_id_idx').on(table.userId),
  ],
);

// ==========================================
// 2. 標準字典與別名 (Canonical Taxonomy)
// ==========================================
export const canonicalEntities = pgTable(
  'canonical_entities',
  {
    category: varchar('category', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    defaultAbv: numeric('default_abv', { precision: 4, scale: 1 }),
    id: varchar('id', { length: 50 }).primaryKey(),
    nameEn: varchar('name_en', { length: 100 }).notNull(),
    nameZh: varchar('name_zh', { length: 100 }),
  },
  (table) => [index('canonical_entities_category_idx').on(table.category)],
);

export const entityAliases = pgTable(
  'entity_aliases',
  {
    aliasText: varchar('alias_text', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    entityId: varchar('entity_id', { length: 50 })
      .notNull()
      .references(() => canonicalEntities.id, { onDelete: 'cascade' }),
    id: uuid('id').defaultRandom().primaryKey(),
  },
  (table) => [
    index('entity_aliases_alias_text_idx').on(table.aliasText),
    uniqueIndex('entity_aliases_entity_id_alias_text_idx').on(table.entityId, table.aliasText),
  ],
);

export const flavors = pgTable('flavors', {
  id: varchar('id', { length: 50 }).primaryKey(),
  nameEn: varchar('name_en', { length: 50 }).notNull(),
  nameZh: varchar('name_zh', { length: 50 }).notNull(),
});

// ==========================================
// 3. 酒譜核心 (Cocktail Recipes)
// ==========================================
export const recipes = pgTable(
  'recipes',
  {
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    baseSpirit: varchar('base_spirit', { length: 50 }).notNull(),
    calculatedAbv: numeric('calculated_abv', { precision: 4, scale: 1 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    dilutionRatio: numeric('dilution_ratio', { precision: 4, scale: 2 }),
    favoritesCount: integer('favorites_count').default(0).notNull(),
    glassCustom: varchar('glass_custom', { length: 100 }),
    glassEntityId: varchar('glass_entity_id', { length: 50 }).references(
      () => canonicalEntities.id,
      { onDelete: 'set null' },
    ),
    iceCustom: varchar('ice_custom', { length: 100 }),
    iceEntityId: varchar('ice_entity_id', { length: 50 }).references(() => canonicalEntities.id, {
      onDelete: 'set null',
    }),
    id: uuid('id').defaultRandom().primaryKey(),
    imageUrl: varchar('image_url', { length: 500 }),
    instructions: jsonb('instructions').$type<string[]>(),
    likesCount: integer('likes_count').default(0).notNull(),
    method: varchar('method', { length: 50 }).notNull(),
    nameEn: varchar('name_en', { length: 150 }),
    nameZh: varchar('name_zh', { length: 150 }),
    story: text('story'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('recipes_author_id_idx').on(table.authorId),
    index('recipes_base_spirit_idx').on(table.baseSpirit),
    index('recipes_method_idx').on(table.method),
    index('recipes_calculated_abv_idx').on(table.calculatedAbv),
  ],
);

// ==========================================
// 4. 材料關聯 (Recipe Ingredients)
// ==========================================
export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    abv: numeric('abv', { precision: 4, scale: 1 }).default('0.0').notNull(),
    amount: numeric('amount', { precision: 6, scale: 2 }).notNull(),
    brandCustom: varchar('brand_custom', { length: 100 }),
    brandEntityId: varchar('brand_entity_id', { length: 50 }).references(
      () => canonicalEntities.id,
      { onDelete: 'set null' },
    ),
    id: uuid('id').defaultRandom().primaryKey(),
    ingredientEntityId: varchar('ingredient_entity_id', { length: 50 }).references(
      () => canonicalEntities.id,
      { onDelete: 'set null' },
    ),
    name: varchar('name', { length: 100 }).notNull(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    unit: varchar('unit', { length: 20 }).notNull(),
  },
  (table) => [
    index('recipe_ingredients_recipe_id_idx').on(table.recipeId),
    index('recipe_ingredients_ingredient_entity_id_idx').on(table.ingredientEntityId),
    index('recipe_ingredients_brand_entity_id_idx').on(table.brandEntityId),
  ],
);

// ==========================================
// 5. 裝飾物 N:N 關聯 (Recipe Garnishes)
// ==========================================
export const recipeGarnishes = pgTable(
  'recipe_garnishes',
  {
    garnishCustom: varchar('garnish_custom', { length: 100 }),
    garnishEntityId: varchar('garnish_entity_id', { length: 50 }).references(
      () => canonicalEntities.id,
      { onDelete: 'set null' },
    ),
    id: uuid('id').defaultRandom().primaryKey(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('recipe_garnishes_recipe_id_idx').on(table.recipeId),
    index('recipe_garnishes_garnish_entity_id_idx').on(table.garnishEntityId),
  ],
);

// ==========================================
// 6. 風味多對多 (Recipe Flavors)
// ==========================================
export const recipeFlavors = pgTable(
  'recipe_flavors',
  {
    flavorId: varchar('flavor_id', { length: 50 })
      .notNull()
      .references(() => flavors.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.flavorId] }),
    index('recipe_flavors_flavor_id_idx').on(table.flavorId),
  ],
);

// ==========================================
// 7. 社群互動 (Likes & Favorites)
// ==========================================
export const recipeLikes = pgTable(
  'recipe_likes',
  {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.recipeId] }),
    index('recipe_likes_recipe_id_idx').on(table.recipeId),
  ],
);

export const recipeFavorites = pgTable(
  'recipe_favorites',
  {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.recipeId] }),
    index('recipe_favorites_user_id_idx').on(table.userId),
  ],
);

// ==========================================
// 8. 關聯關聯 (Drizzle Relations)
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(recipeFavorites),
  likes: many(recipeLikes),
  oauthAccounts: many(oauthAccounts),
  recipes: many(recipes),
}));

export const canonicalEntitiesRelations = relations(canonicalEntities, ({ many }) => ({
  aliases: many(entityAliases),
}));

export const entityAliasesRelations = relations(entityAliases, ({ one }) => ({
  canonicalEntity: one(canonicalEntities, {
    fields: [entityAliases.entityId],
    references: [canonicalEntities.id],
  }),
}));

export const flavorsRelations = relations(flavors, ({ many }) => ({
  recipeFlavors: many(recipeFlavors),
}));

export const recipesRelations = relations(recipes, ({ many, one }) => ({
  author: one(users, {
    fields: [recipes.authorId],
    references: [users.id],
  }),
  favorites: many(recipeFavorites),
  garnishes: many(recipeGarnishes),
  glassEntity: one(canonicalEntities, {
    fields: [recipes.glassEntityId],
    references: [canonicalEntities.id],
  }),
  iceEntity: one(canonicalEntities, {
    fields: [recipes.iceEntityId],
    references: [canonicalEntities.id],
  }),
  ingredients: many(recipeIngredients),
  likes: many(recipeLikes),
  recipeFlavors: many(recipeFlavors),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  brandEntity: one(canonicalEntities, {
    fields: [recipeIngredients.brandEntityId],
    references: [canonicalEntities.id],
    relationName: 'brandEntity',
  }),
  ingredientEntity: one(canonicalEntities, {
    fields: [recipeIngredients.ingredientEntityId],
    references: [canonicalEntities.id],
    relationName: 'ingredientEntity',
  }),
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeGarnishesRelations = relations(recipeGarnishes, ({ one }) => ({
  garnishEntity: one(canonicalEntities, {
    fields: [recipeGarnishes.garnishEntityId],
    references: [canonicalEntities.id],
  }),
  recipe: one(recipes, {
    fields: [recipeGarnishes.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeFlavorsRelations = relations(recipeFlavors, ({ one }) => ({
  flavor: one(flavors, {
    fields: [recipeFlavors.flavorId],
    references: [flavors.id],
  }),
  recipe: one(recipes, {
    fields: [recipeFlavors.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeLikesRelations = relations(recipeLikes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeLikes.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeLikes.userId],
    references: [users.id],
  }),
}));

export const recipeFavoritesRelations = relations(recipeFavorites, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeFavorites.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeFavorites.userId],
    references: [users.id],
  }),
}));
