import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error(
      "❌ Please set ADMIN_EMAIL in your environment variables to seed the admin user."
    );
    return;
  }

  console.log(`🚀 Seeding admin user: ${adminEmail}`);

  // 1. Create or Update Admin User
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      role: "ADMIN",
    },
  });

  // 2. Seed Initial Guides from Supabase Storage bucket 'guides'
  // Note: These bucketPaths MUST match the actual file names in your 'guides' bucket in Supabase Storage.
  const initialGuides = [
    { title: "Indian Keto Diet Guide", bucketPath: "keto-guide.pdf" },
    { title: "Home Workout Essentials", bucketPath: "home-workout.pdf" },
    { title: "Vegetarian Protein Sources", bucketPath: "veg-protein.pdf" },
    {
      title: "Standard Nutrition Principles",
      bucketPath: "nutrition-basics.pdf",
    },
    { title: "Muscle Building Roadmap", bucketPath: "muscle-guide.pdf" },
  ];

  console.log("📚 Seeding RAG Knowledge Base placeholders...");

  for (const guide of initialGuides) {
    await prisma.fileAsset.upsert({
      where: { id: guide.bucketPath },
      update: {
        title: guide.title,
        bucketPath: guide.bucketPath,
      },
      create: {
        id: guide.bucketPath,
        title: guide.title,
        bucketPath: guide.bucketPath,
      },
    });
  }

  console.log("✅ Seeding completed successfully.");
  console.log("👉 Next Steps:");
  console.log(
    "1. Ensure the files above are uploaded to your Supabase 'guides' bucket."
  );
  console.log(
    "2. Go to /admin and click 'Re-Ingest' for each file to generate AI embeddings."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
