import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import {
  canonicalEntities,
  entityAliases,
  flavors,
  recipeFlavors,
  recipeGarnishes,
  recipeIngredients,
  recipes,
  users,
} from './schema.ts';

const SYSTEM_AUTHORS = [
  {
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    email: 'chief@barcraft.dev',
    id: '00000000-0000-0000-0000-000000000001',
    name: 'BarCraft 首席調酒師',
  },
  {
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    email: 'bourbon@barcraft.dev',
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Bourbon Alchemist',
  },
  {
    avatarUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    email: 'botanical@barcraft.dev',
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Botanical Explorer',
  },
  {
    avatarUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    email: 'tropical@barcraft.dev',
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Tropical Sips',
  },
];

const FLAVORS_DATA = [
  { id: 'flavor_sour', nameEn: 'Sour & Tart', nameZh: '酸爽清新' },
  { id: 'flavor_sweet', nameEn: 'Sweet & Lush', nameZh: '甘甜圓潤' },
  { id: 'flavor_bitter', nameEn: 'Bitter & Complex', nameZh: '深沉苦韻' },
  { id: 'flavor_bubbly', nameEn: 'Effervescent & Bubbly', nameZh: '輕盈氣泡' },
  { id: 'flavor_fruity', nameEn: 'Fruity', nameZh: '果香奔放' },
  { id: 'flavor_floral', nameEn: 'Floral', nameZh: '優雅花香' },
  { id: 'flavor_herbal', nameEn: 'Herbal & Botanical', nameZh: '草本植物' },
  { id: 'flavor_smoky', nameEn: 'Smoky & Peaty', nameZh: '煙燻木質' },
  { id: 'flavor_spicy', nameEn: 'Spicy & Warm', nameZh: '辛辣溫暖' },
  { id: 'flavor_refresh', nameEn: 'Crisp & Refreshing', nameZh: '冰涼消暑' },
];

const CANONICAL_ENTITIES_DATA = [
  // Brands
  {
    category: 'brand',
    defaultAbv: '47.3',
    id: 'brand_tanqueray',
    nameEn: 'Tanqueray No. 10 / London Dry',
    nameZh: '坦奎利 (Tanqueray)',
  },
  {
    category: 'brand',
    defaultAbv: '40.0',
    id: 'brand_bombay',
    nameEn: 'Bombay Sapphire',
    nameZh: '龐貝藍鑽 (Bombay Sapphire)',
  },
  {
    category: 'brand',
    defaultAbv: '41.4',
    id: 'brand_hendricks',
    nameEn: "Hendrick's Gin",
    nameZh: "亨利爵士 (Hendrick's)",
  },
  {
    category: 'brand',
    defaultAbv: '25.0',
    id: 'brand_campari',
    nameEn: 'Campari Bitter',
    nameZh: '金巴利苦酒 (Campari)',
  },
  {
    category: 'brand',
    defaultAbv: '16.5',
    id: 'brand_carpano',
    nameEn: 'Carpano Antica Formula Sweet Vermouth',
    nameZh: '卡帕諾安提卡 (Carpano Antica Formula)',
  },
  {
    category: 'brand',
    defaultAbv: '40.0',
    id: 'brand_bacardi',
    nameEn: 'Bacardi Carta Blanca',
    nameZh: '百加得 (Bacardi)',
  },
  {
    category: 'brand',
    defaultAbv: '45.0',
    id: 'brand_makers_mark',
    nameEn: "Maker's Mark Bourbon",
    nameZh: "美格波本 (Maker's Mark)",
  },
  {
    category: 'brand',
    defaultAbv: '44.7',
    id: 'brand_angostura',
    nameEn: 'Angostura Aromatic Bitters',
    nameZh: '安格仕苦精 (Angostura Bitters)',
  },
  // Glasses
  {
    category: 'glass',
    id: 'glass_rocks',
    nameEn: 'Old Fashioned / Rocks Glass',
    nameZh: '古典杯 / 低球杯',
  },
  {
    category: 'glass',
    id: 'glass_martini',
    nameEn: 'Martini / Cocktail Glass',
    nameZh: '馬丁尼杯',
  },
  { category: 'glass', id: 'glass_coupe', nameEn: 'Coupe Glass', nameZh: '碟型香檳杯' },
  {
    category: 'glass',
    id: 'glass_highball',
    nameEn: 'Highball / Collins Glass',
    nameZh: '高球杯 / 可林杯',
  },
  {
    category: 'glass',
    id: 'glass_nick_nora',
    nameEn: 'Nick & Nora Glass',
    nameZh: '尼克與諾拉杯',
  },
  // Ice
  { category: 'ice', id: 'ice_cube', nameEn: 'Clear Ice Cube', nameZh: '手鑿大方老冰' },
  { category: 'ice', id: 'ice_sphere', nameEn: 'Ice Sphere', nameZh: '純淨大冰球' },
  { category: 'ice', id: 'ice_spear', nameEn: 'Ice Spear', nameZh: '長條老冰柱' },
  { category: 'ice', id: 'ice_none', nameEn: 'Straight Up', nameZh: '搖盪濾冰 (無冰)' },
  // Garnishes
  {
    category: 'garnish',
    id: 'garnish_orange_twist',
    nameEn: 'Orange Twist',
    nameZh: '新鮮橙皮捲',
  },
  {
    category: 'garnish',
    id: 'garnish_cherry_orange',
    nameEn: 'Cherry & Orange Peel',
    nameZh: '酒漬櫻桃與橙皮',
  },
  {
    category: 'garnish',
    id: 'garnish_cucumber_ribbon',
    nameEn: 'Cucumber Ribbon',
    nameZh: '薄切小黃瓜片',
  },
  { category: 'garnish', id: 'garnish_lime_wheel', nameEn: 'Lime Wheel', nameZh: '新鮮青檸輪片' },
  // Common Ingredients
  {
    category: 'ingredient',
    defaultAbv: '40.0',
    id: 'ing_gin',
    nameEn: 'Gin',
    nameZh: '琴酒',
  },
  {
    category: 'ingredient',
    defaultAbv: '45.0',
    id: 'ing_whiskey',
    nameEn: 'Whiskey',
    nameZh: '威士忌',
  },
  {
    category: 'ingredient',
    defaultAbv: '40.0',
    id: 'ing_rum',
    nameEn: 'Rum',
    nameZh: '蘭姆酒',
  },
  {
    category: 'ingredient',
    defaultAbv: '25.0',
    id: 'ing_campari',
    nameEn: 'Campari Bitter',
    nameZh: '金巴利苦酒',
  },
  {
    category: 'ingredient',
    defaultAbv: '16.5',
    id: 'ing_sweet_vermouth',
    nameEn: 'Sweet Vermouth',
    nameZh: '甜苦艾酒',
  },
  {
    category: 'ingredient',
    defaultAbv: '44.7',
    id: 'ing_angostura',
    nameEn: 'Angostura Bitters',
    nameZh: '安格仕芳香苦精',
  },
  {
    category: 'ingredient',
    defaultAbv: '0.0',
    id: 'ing_simple_syrup',
    nameEn: 'Simple Syrup',
    nameZh: '糖漿',
  },
  {
    category: 'ingredient',
    defaultAbv: '0.0',
    id: 'ing_tonic',
    nameEn: 'Tonic Water',
    nameZh: '通寧水',
  },
  {
    category: 'ingredient',
    defaultAbv: '0.0',
    id: 'ing_lime_juice',
    nameEn: 'Lime Juice',
    nameZh: '青檸汁',
  },
];

const ALIASES_DATA = [
  // brand_tanqueray
  { aliasText: '坦奎利', entityId: 'brand_tanqueray' },
  { aliasText: '添佳力', entityId: 'brand_tanqueray' },
  { aliasText: 'tanqueray', entityId: 'brand_tanqueray' },
  { aliasText: 'tanqueray 10', entityId: 'brand_tanqueray' },
  { aliasText: 'tanqueray ten', entityId: 'brand_tanqueray' },
  { aliasText: '坦奎利10號', entityId: 'brand_tanqueray' },
  // brand_bombay
  { aliasText: '龐貝', entityId: 'brand_bombay' },
  { aliasText: '孟買', entityId: 'brand_bombay' },
  { aliasText: '藍鑽', entityId: 'brand_bombay' },
  { aliasText: 'bombay', entityId: 'brand_bombay' },
  { aliasText: 'bombay sapphire', entityId: 'brand_bombay' },
  // brand_hendricks
  { aliasText: '亨利爵士', entityId: 'brand_hendricks' },
  { aliasText: '亨利', entityId: 'brand_hendricks' },
  { aliasText: 'hendricks', entityId: 'brand_hendricks' },
  { aliasText: "hendrick's", entityId: 'brand_hendricks' },
  { aliasText: '小黃瓜琴酒', entityId: 'brand_hendricks' },
  // brand_campari
  { aliasText: '金巴利', entityId: 'brand_campari' },
  { aliasText: '康帕利', entityId: 'brand_campari' },
  { aliasText: 'campari', entityId: 'brand_campari' },
  { aliasText: 'campari bitter', entityId: 'brand_campari' },
  { aliasText: '義大利苦酒', entityId: 'brand_campari' },
  // brand_carpano
  { aliasText: '卡帕諾', entityId: 'brand_carpano' },
  { aliasText: '安提卡', entityId: 'brand_carpano' },
  { aliasText: 'carpano', entityId: 'brand_carpano' },
  { aliasText: 'antica formula', entityId: 'brand_carpano' },
  { aliasText: 'carpano antica', entityId: 'brand_carpano' },
  { aliasText: '經典紅香艾酒', entityId: 'brand_carpano' },
  // brand_bacardi
  { aliasText: '百加得', entityId: 'brand_bacardi' },
  { aliasText: '白家得', entityId: 'brand_bacardi' },
  { aliasText: 'bacardi', entityId: 'brand_bacardi' },
  { aliasText: 'bacardi superior', entityId: 'brand_bacardi' },
  { aliasText: 'bacardi white', entityId: 'brand_bacardi' },
  // brand_makers_mark
  { aliasText: '美格', entityId: 'brand_makers_mark' },
  { aliasText: '美格波本', entityId: 'brand_makers_mark' },
  { aliasText: "maker's mark", entityId: 'brand_makers_mark' },
  { aliasText: 'makers mark', entityId: 'brand_makers_mark' },
  { aliasText: '美格紅蠟', entityId: 'brand_makers_mark' },
  // brand_angostura
  { aliasText: '安格仕', entityId: 'brand_angostura' },
  { aliasText: '安果', entityId: 'brand_angostura' },
  { aliasText: '苦精', entityId: 'brand_angostura' },
  { aliasText: 'angostura', entityId: 'brand_angostura' },
  { aliasText: 'angostura bitters', entityId: 'brand_angostura' },
  { aliasText: 'aromatic bitters', entityId: 'brand_angostura' },
  // glass_rocks
  { aliasText: 'rocks', entityId: 'glass_rocks' },
  { aliasText: 'old fashioned', entityId: 'glass_rocks' },
  { aliasText: '低球杯', entityId: 'glass_rocks' },
  { aliasText: '古典杯', entityId: 'glass_rocks' },
  // glass_martini
  { aliasText: 'martini', entityId: 'glass_martini' },
  { aliasText: 'cocktail glass', entityId: 'glass_martini' },
  { aliasText: '馬丁尼', entityId: 'glass_martini' },
  { aliasText: '三角杯', entityId: 'glass_martini' },
  // glass_coupe
  { aliasText: 'coupe', entityId: 'glass_coupe' },
  { aliasText: '香檳杯', entityId: 'glass_coupe' },
  { aliasText: '碟型杯', entityId: 'glass_coupe' },
  // glass_highball
  { aliasText: 'highball', entityId: 'glass_highball' },
  { aliasText: 'collins', entityId: 'glass_highball' },
  { aliasText: '高球', entityId: 'glass_highball' },
  { aliasText: '長飲杯', entityId: 'glass_highball' },
  // glass_nick_nora
  { aliasText: 'nick nora', entityId: 'glass_nick_nora' },
  { aliasText: 'nick and nora', entityId: 'glass_nick_nora' },
  { aliasText: '尼克諾拉', entityId: 'glass_nick_nora' },
];

const SEED_RECIPES = [
  {
    authorId: '00000000-0000-0000-0000-000000000001',
    baseSpirit: 'Gin',
    calculatedAbv: '29.6',
    dilutionRatio: '0.22',
    favoritesCount: 42,
    flavors: ['flavor_bitter', 'flavor_sweet', 'flavor_herbal'],
    garnishCustom: '新鮮橙皮捲 (Orange Twist)',
    garnishEntityId: 'garnish_orange_twist',
    glassCustom: '古典杯 (Rocks Glass)',
    glassEntityId: 'glass_rocks',
    iceCustom: '手鑿大方老冰 (Clear Ice Cube)',
    iceEntityId: 'ice_cube',
    id: '10000000-0000-0000-0000-000000000001',
    imageUrl:
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80',
    ingredients: [
      {
        abv: '47.3',
        amount: '30.00',
        brandCustom: 'Tanqueray No. 10',
        brandEntityId: 'brand_tanqueray',
        ingredientEntityId: 'ing_gin',
        name: '琴酒',
        sortOrder: 1,
        unit: 'ml',
      },
      {
        abv: '25.0',
        amount: '30.00',
        brandCustom: 'Campari Bitter',
        brandEntityId: 'brand_campari',
        ingredientEntityId: 'ing_campari',
        name: '金巴利苦酒',
        sortOrder: 2,
        unit: 'ml',
      },
      {
        abv: '16.5',
        amount: '30.00',
        brandCustom: 'Carpano Antica Formula',
        brandEntityId: 'brand_carpano',
        ingredientEntityId: 'ing_sweet_vermouth',
        name: '甜苦艾酒',
        sortOrder: 3,
        unit: 'ml',
      },
    ],
    instructions: [
      '將調酒杯中加入大塊方冰預冷。',
      '依序注入琴酒、金巴利苦酒與甜紅苦艾酒。',
      '使用吧匙順暢攪拌約 25-30 秒至酒液冰透且充分稀釋。',
      '透過濾冰器將酒液濾入預先放好大冰塊的古典杯中。',
      '在杯口噴灑橙皮精油並將橙皮扭捲飾於杯中。',
    ],
    likesCount: 128,
    method: 'Stir (攪拌法)',
    nameEn: 'Negroni',
    nameZh: '經典內格羅尼',
    story:
      '這款義大利國寶級經典擁有紅寶石般深邃光澤，融合了倫敦琴酒的草本杜松子、金巴利的厚實苦甜與紅苦艾酒的草本圓潤。',
  },
  {
    authorId: '00000000-0000-0000-0000-000000000002',
    baseSpirit: 'Whiskey',
    calculatedAbv: '32.1',
    dilutionRatio: '0.18',
    favoritesCount: 18,
    flavors: ['flavor_smoky', 'flavor_sweet', 'flavor_bitter'],
    garnishCustom: '酒漬櫻桃與橙皮 (Cherry & Orange Peel)',
    garnishEntityId: 'garnish_cherry_orange',
    glassCustom: '厚底古典杯 (Rocks Glass)',
    glassEntityId: 'glass_rocks',
    iceCustom: '純淨大冰球 (Ice Sphere)',
    iceEntityId: 'ice_sphere',
    id: '10000000-0000-0000-0000-000000000002',
    imageUrl:
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80',
    ingredients: [
      {
        abv: '45.0',
        amount: '60.00',
        brandCustom: "Maker's Mark",
        brandEntityId: 'brand_makers_mark',
        ingredientEntityId: 'ing_whiskey',
        name: '波本威士忌',
        sortOrder: 1,
        unit: 'ml',
      },
      {
        abv: '44.7',
        amount: '3.00',
        brandCustom: 'Angostura Aromatic Bitters',
        brandEntityId: 'brand_angostura',
        ingredientEntityId: 'ing_angostura',
        name: '安格仕芳香苦精',
        sortOrder: 2,
        unit: 'dashes',
      },
      {
        abv: '0.0',
        amount: '5.00',
        brandCustom: '自製甘蔗糖漿',
        brandEntityId: null,
        ingredientEntityId: 'ing_simple_syrup',
        name: '原色方糖 / 糖漿',
        sortOrder: 3,
        unit: 'ml',
      },
    ],
    instructions: [
      '在古典杯中放入原色方糖，滴入 3 Dash 安格仕芳香苦精與少量純水潤濕。',
      '用搗棒將方糖完全搗碎融化。',
      '放入一顆純淨大冰球，倒入 60ml 美格波本威士忌。',
      '以吧匙輕柔攪拌約 20 秒，噴上橙皮油後飾以頂級酒漬櫻桃。',
    ],
    likesCount: 95,
    method: 'Build (直調法)',
    nameEn: 'Old Fashioned',
    nameZh: '古典調酒',
    story:
      '調酒史上的永恆先驅。透過微量糖與芳香苦精解構波本威士忌的焦糖、香草與橡木桶深層香氣，歷久彌新。',
  },
  {
    authorId: '00000000-0000-0000-0000-000000000003',
    baseSpirit: 'Gin',
    calculatedAbv: '10.3',
    dilutionRatio: '0.18',
    favoritesCount: 56,
    flavors: ['flavor_bubbly', 'flavor_refresh', 'flavor_herbal', 'flavor_floral'],
    garnishCustom: '薄切小黃瓜片 (Cucumber Ribbon)',
    garnishEntityId: 'garnish_cucumber_ribbon',
    glassCustom: '高球杯 (Highball Glass)',
    glassEntityId: 'glass_highball',
    iceCustom: '長條老冰柱 (Ice Spear)',
    iceEntityId: 'ice_spear',
    id: '10000000-0000-0000-0000-000000000003',
    imageUrl:
      'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=80',
    ingredients: [
      {
        abv: '41.4',
        amount: '50.00',
        brandCustom: "Hendrick's Gin",
        brandEntityId: 'brand_hendricks',
        ingredientEntityId: 'ing_gin',
        name: '小黃瓜玫瑰琴酒',
        sortOrder: 1,
        unit: 'ml',
      },
      {
        abv: '0.0',
        amount: '120.00',
        brandCustom: 'Fever-Tree 經典通寧水',
        brandEntityId: null,
        ingredientEntityId: 'ing_tonic',
        name: '優質通寧水',
        sortOrder: 2,
        unit: 'ml',
      },
    ],
    instructions: [
      '高球杯預先冰鎮並放入一根修整平滑的純淨長條老冰。',
      '沿著冰塊輕輕倒入 50ml 亨利爵士琴酒。',
      '斜拿酒杯，沿著吧匙緩緩注入冰涼通寧水至九分滿以維持氣泡活躍。',
      '以吧匙由底向上輕輕提拉一次即可，杯壁貼上長薄片小黃瓜點綴。',
    ],
    likesCount: 182,
    method: 'Build (直調法)',
    nameEn: "Hendrick's Gin & Tonic",
    nameZh: '亨利爵士琴通寧',
    story:
      '經典沁涼調酒。以亨利爵士琴酒獨特的小黃瓜與保加利亞玫瑰精華為靈魂，搭配氣泡細緻的頂級通寧水，清爽解渴。',
  },
  {
    authorId: '00000000-0000-0000-0000-000000000004',
    baseSpirit: 'Rum',
    calculatedAbv: '17.2',
    dilutionRatio: '0.33',
    favoritesCount: 31,
    flavors: ['flavor_sour', 'flavor_sweet', 'flavor_refresh'],
    garnishCustom: '新鮮青檸輪片 (Lime Wheel)',
    garnishEntityId: 'garnish_lime_wheel',
    glassCustom: '碟型香檳杯 (Coupe Glass)',
    glassEntityId: 'glass_coupe',
    iceCustom: '搖盪濾冰 (Straight Up)',
    iceEntityId: 'ice_none',
    id: '10000000-0000-0000-0000-000000000004',
    imageUrl:
      'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?auto=format&fit=crop&w=900&q=80',
    ingredients: [
      {
        abv: '40.0',
        amount: '60.00',
        brandCustom: 'Bacardi Carta Blanca',
        brandEntityId: 'brand_bacardi',
        ingredientEntityId: 'ing_rum',
        name: '白蘭姆酒',
        sortOrder: 1,
        unit: 'ml',
      },
      {
        abv: '0.0',
        amount: '30.00',
        brandCustom: '鮮榨青檸',
        brandEntityId: null,
        ingredientEntityId: 'ing_lime_juice',
        name: '新鮮現榨青檸汁',
        sortOrder: 2,
        unit: 'ml',
      },
      {
        abv: '0.0',
        amount: '15.00',
        brandCustom: '自製 2:1 糖漿',
        brandEntityId: null,
        ingredientEntityId: 'ing_simple_syrup',
        name: '二號砂糖漿',
        sortOrder: 3,
        unit: 'ml',
      },
    ],
    instructions: [
      '搖酒器中加入白蘭姆酒、現榨青檸汁與糖漿。',
      '裝滿硬質方形冰塊，用力有節奏地搖盪 12 秒至搖酒器外壁結霜。',
      '使用雙重濾網 (Double Strain) 將酒液細緻濾入冰透的 Coupe 杯中。',
      '置放一枚薄切青檸輪片於酒液表面。',
    ],
    likesCount: 110,
    method: 'Shake (搖盪法)',
    nameEn: 'Classic Daiquiri',
    nameZh: '海明威黛綺莉',
    story: '古巴經典三合一極簡調酒。白蘭姆酒的甘蔗芳醇與青檸的清亮酸度達到絕妙平衡，冷冽順口。',
  },
];

export async function runSeed() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boozer_cannon';
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool);

  try {
    await seedTaxonomy(db);
    await seedRecipes(db);
  } finally {
    await pool.end();
  }
}

async function seedRecipes(db: ReturnType<typeof drizzle>) {
  for (const item of SEED_RECIPES) {
    const { flavors: itemFlavors, ingredients, ...recipeData } = item;

    await db.insert(recipes).values(recipeData).onConflictDoNothing();

    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeData.id));
    await db.delete(recipeGarnishes).where(eq(recipeGarnishes.recipeId, recipeData.id));
    await db.delete(recipeFlavors).where(eq(recipeFlavors.recipeId, recipeData.id));

    for (const ing of ingredients) {
      await db
        .insert(recipeIngredients)
        .values({
          abv: ing.abv,
          amount: ing.amount,
          brandCustom: ing.brandCustom,
          brandEntityId: ing.brandEntityId,
          ingredientEntityId: ing.ingredientEntityId,
          name: ing.name,
          recipeId: recipeData.id,
          sortOrder: ing.sortOrder,
          unit: ing.unit,
        })
        .onConflictDoNothing();
    }

    if (recipeData.garnishEntityId || recipeData.garnishCustom) {
      await db
        .insert(recipeGarnishes)
        .values({
          garnishCustom: recipeData.garnishCustom,
          garnishEntityId: recipeData.garnishEntityId,
          recipeId: recipeData.id,
        })
        .onConflictDoNothing();
    }

    for (const fId of itemFlavors) {
      await db
        .insert(recipeFlavors)
        .values({
          flavorId: fId,
          recipeId: recipeData.id,
        })
        .onConflictDoNothing();
    }
  }
}

async function seedTaxonomy(db: ReturnType<typeof drizzle>) {
  for (const user of SYSTEM_AUTHORS) {
    await db.insert(users).values(user).onConflictDoNothing();
  }
  for (const flavor of FLAVORS_DATA) {
    await db.insert(flavors).values(flavor).onConflictDoNothing();
  }
  for (const entity of CANONICAL_ENTITIES_DATA) {
    await db.insert(canonicalEntities).values(entity).onConflictDoNothing();
  }
  for (const alias of ALIASES_DATA) {
    await db.insert(entityAliases).values(alias).onConflictDoNothing();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed().catch((err) => {
    process.stderr.write(`Seed failed: ${err.message}\n`);
    process.exit(1);
  });
}
