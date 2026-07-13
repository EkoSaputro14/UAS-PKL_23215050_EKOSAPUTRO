#!/bin/sh
set -e

echo "🤖 Mimotes - Starting..."

# Skip Prisma generate in production — use build-time client
# The build-time client is already generated and works with the current schema
# Only regenerate if explicitly needed (e.g., DATABASE_URL changed)
if [ "$REGENERATE_PRISMA" = "true" ]; then
  echo "🔄 Regenerating Prisma Client..."
  if [ -f "./node_modules/prisma/build/index.js" ]; then
    node ./node_modules/prisma/build/index.js generate 2>&1 || echo "⚠️  Prisma generate failed, using build-time client"
  else
    echo "⚠️  Prisma CLI not found, using build-time client"
  fi
else
  echo "📦 Using build-time Prisma Client (set REGENERATE_PRISMA=true to regenerate)"
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
