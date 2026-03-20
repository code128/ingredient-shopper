import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing default recipes...');
  
  // Wipe out any existing placeholder recipes so we don't infinitely duplicate them
  await prisma.recipe.deleteMany({
    where: { userId: null }
  });

  console.log('Seeding default recipes...');
  
  // Recipe 1: Classic Spaghetti
  await prisma.recipe.create({
    data: {
      title: 'Classic Spaghetti Bolognese',
      imageUrl: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&w=800&q=80',
      ingredients: {
        create: [
          { originalText: '1 lb Spaghetti pasta', quantity: 1, unit: 'lb', ingredient: { connectOrCreate: { where: { name: 'Spaghetti pasta' }, create: { name: 'Spaghetti pasta', category: 'Pasta' } } } },
          { originalText: '2 tbsp Olive oil', quantity: 2, unit: 'tbsp', ingredient: { connectOrCreate: { where: { name: 'Olive oil' }, create: { name: 'Olive oil', category: 'Pantry' } } } },
          { originalText: '3 cloves Garlic, minced', quantity: 3, unit: 'cloves', ingredient: { connectOrCreate: { where: { name: 'Garlic' }, create: { name: 'Garlic', category: 'Produce' } } } },
          { originalText: '1 can (28oz) Crushed tomatoes', quantity: 28, unit: 'oz', ingredient: { connectOrCreate: { where: { name: 'Crushed tomatoes' }, create: { name: 'Crushed tomatoes', category: 'Canned Goods' } } } }
        ]
      }
    }
  });

  // Recipe 2: Garlic Bread (intentionally sharing ingredients to demonstrate shopping aggregation logic)
  await prisma.recipe.create({
    data: {
      title: 'Homemade Garlic Bread',
      imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=800&q=80',
      ingredients: {
        create: [
          { originalText: '1 loaf French bread', quantity: 1, unit: 'loaf', ingredient: { connectOrCreate: { where: { name: 'French bread' }, create: { name: 'French bread', category: 'Bakery' } } } },
          { originalText: '4 tbsp Olive oil', quantity: 4, unit: 'tbsp', ingredient: { connectOrCreate: { where: { name: 'Olive oil' }, create: { name: 'Olive oil', category: 'Pantry' } } } },
          { originalText: '4 cloves Garlic, minced', quantity: 4, unit: 'cloves', ingredient: { connectOrCreate: { where: { name: 'Garlic' }, create: { name: 'Garlic', category: 'Produce' } } } },
          { originalText: '1 tbsp Fresh parsley', quantity: 1, unit: 'tbsp', ingredient: { connectOrCreate: { where: { name: 'Parsley' }, create: { name: 'Parsley', category: 'Produce' } } } }
        ]
      }
    }
  });

  console.log(`Default recipes seeded properly!`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
