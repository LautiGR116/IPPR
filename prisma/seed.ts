import { PrismaClient } from "@prisma/client";
import { IPPR_FIELDS, IPPR_TEST } from "../src/lib/ippr-content";

const prisma = new PrismaClient();

async function main() {
  const test = await prisma.test.upsert({
    where: { slug: IPPR_TEST.slug },
    update: {
      name: IPPR_TEST.name,
      description: IPPR_TEST.description,
      version: IPPR_TEST.version
    },
    create: IPPR_TEST
  });

  for (const [moduleIndex, field] of IPPR_FIELDS.entries()) {
    const module = await prisma.testModule.upsert({
      where: {
        testId_key: {
          testId: test.id,
          key: field.key
        }
      },
      update: {
        title: field.label,
        icon: field.icon,
        order: moduleIndex
      },
      create: {
        testId: test.id,
        key: field.key,
        title: field.label,
        icon: field.icon,
        order: moduleIndex
      }
    });

    for (const [itemIndex, prompt] of field.items.entries()) {
      await prisma.testItem.upsert({
        where: {
          moduleId_key: {
            moduleId: module.id,
            key: `${field.key}-${itemIndex + 1}`
          }
        },
        update: {
          prompt,
          sourceText: prompt,
          kind: "activity",
          order: itemIndex
        },
        create: {
          moduleId: module.id,
          key: `${field.key}-${itemIndex + 1}`,
          prompt,
          sourceText: prompt,
          kind: "activity",
          order: itemIndex
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
