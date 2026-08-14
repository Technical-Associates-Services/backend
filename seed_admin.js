const prisma = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'admin@tas.com';
  const plainPassword = 'password123';

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Updating password...`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    console.log(`Password reset to: ${plainPassword}`);
  } else {
    console.log(`Creating new admin user: ${email}`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await prisma.user.create({
      data: {
        id: 9999, // Use a very high ID to avoid sequence conflicts with existing dumped data
        name: 'Super Admin',
        email,
        password: hashedPassword,
        phone_number: '1234567890',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    console.log(`User created. Credentials: ${email} / ${plainPassword}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
