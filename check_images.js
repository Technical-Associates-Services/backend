const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.category.findMany({take: 5});
  console.log('Categories:', cats.map(c => c.image));
  const prods = await prisma.product.findMany({take: 5});
  console.log('Products:', prods.map(p => p.image));
}
main().finally(() => prisma.$disconnect());
