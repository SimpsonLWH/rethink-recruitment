import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getRepository } from "@/lib/repo";

async function main() {
  const inputs = await getRepository().getFitInputs();
  const dataset = {
    version: 1,
    generatedAt: new Date().toISOString(),
    eventId: inputs.eventId,
    candidates: inputs.candidates,
    roles: inputs.roles,
  };
  const target = path.resolve("modal/data/dataset.json");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(dataset, null, 2) + "\n", "utf8");
  console.log("Wrote " + target);
  console.log(inputs.candidates.length + " candidates · " + inputs.roles.length + " roles · " + inputs.candidates.length * inputs.roles.length + " pairs");
  console.log("The dataset is synthetic and ignored by git. Run the Modal job or npm run fit:local; then import only with approval.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
