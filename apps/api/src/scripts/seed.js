import { DEFAULT_TOPICS, ACCESSORIES_CATALOG } from '@learnquest/shared';
import { getDb, initDatabase } from '../db/index.js';

async function seed() {
  console.log('[Seed] Initializing database seed...');
  await initDatabase();
  const { isPrismaConnected, prisma } = getDb();

  if (isPrismaConnected) {
    // Seed Topics
    for (const top of DEFAULT_TOPICS) {
      await prisma.topic.upsert({
        where: { slug: top.slug },
        update: { title: top.title, description: top.description, category: top.category },
        create: {
          slug: top.slug,
          title: top.title,
          description: top.description,
          category: top.category,
          icon: top.icon
        }
      });
      console.log(`[Seed] Seeded topic: ${top.title}`);
    }

    // Seed Store Items
    for (const item of ACCESSORIES_CATALOG) {
      await prisma.storeItem.upsert({
        where: { sku: item.sku },
        update: { priceTokens: item.priceTokens, isAvailable: true },
        create: {
          sku: item.sku,
          name: item.name,
          description: item.description,
          category: item.category,
          priceTokens: item.priceTokens,
          metadata: item.metadata
        }
      });
      console.log(`[Seed] Seeded store item: ${item.name} (${item.sku})`);
    }
  } else {
    console.log('[Seed] In-memory storage ready with built-in default catalog and curriculum.');
  }

  console.log('[Seed] Database seed completed successfully!');
}

seed().catch(err => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
