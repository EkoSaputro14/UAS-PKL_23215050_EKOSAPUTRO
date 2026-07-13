#!/bin/sh
set -e

echo "🤖 Mimotes - Starting..."

# Regenerate Prisma Client with runtime DATABASE_URL
# (build-time URL may differ from runtime URL in Docker)
echo "🔄 Regenerating Prisma Client..."
if [ -f "./node_modules/prisma/build/index.js" ]; then
  node ./node_modules/prisma/build/index.js generate 2>&1 || echo "⚠️  Prisma generate failed, using build-time client"
elif [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma generate 2>&1 || echo "⚠️  Prisma generate failed, using build-time client"
else
  echo "⚠️  Prisma CLI not found, using build-time client"
fi

# Seed admin user if SEED_ADMIN is set
if [ "$SEED_ADMIN" = "true" ]; then
  echo "🌱 Seeding admin user..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();
    
    async function seed() {
      const email = process.env.ADMIN_EMAIL || 'admin@mimotes.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create or update admin user
      const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash, name: 'Admin' },
        create: { email, name: 'Admin', passwordHash },
      });
      
      console.log('✅ Admin user: ' + email);
      await prisma.\$disconnect();
    }
    seed().catch(console.error);
  "
fi

echo "🚀 Starting Mimotes..."
exec "$@"
