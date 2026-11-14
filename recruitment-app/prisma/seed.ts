import { PrismaClient } from "@prisma/client";
import { buildFitSummary } from "../src/lib/fit";
import { seedCandidates } from "./seed-data/candidates";
import { seedEmployers } from "./seed-data/employers";
import { seedMatches, seedPriorityIntros } from "./seed-data/interactions";

const prisma = new PrismaClient();

const EVENT_ID = "event-junction-2026";
const EVENT_SLUG = "junction-2026-espoo";
const NOW = Date.now();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function ago(ms: number) {
  return new Date(NOW - ms);
}

async function clearDemoData() {
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.tailoringItem.deleteMany();
  await prisma.tailoringDraft.deleteMany();
  await prisma.linkCheck.deleteMany();
  await prisma.fitSummary.deleteMany();
  await prisma.fact.deleteMany();
  await prisma.role.deleteMany();
  await prisma.employerPrompt.deleteMany();
  await prisma.employer.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.event.deleteMany();
  await prisma.aiRun.deleteMany();
  await prisma.aiCache.deleteMany();
}

async function main() {
  console.log("Resetting synthetic demo data…");
  await clearDemoData();

  const event = await prisma.event.create({
    data: {
      id: EVENT_ID,
      slug: EVENT_SLUG,
      name: "Junction 2026 · Espoo Career Event",
      city: "Espoo, Finland",
      dateLabel: "14 November 2026",
      tagline: "Hiring goes both ways.",
    },
  });

  const employerIds = new Map<string, string>();
  const roleIds = new Map<string, string>();
  const roleRecords = new Map<string, { employerName: string; title: string; summary: string; problemNow: string; skills: string[] }>();
  const employerIdsBySlug = new Map<string, string>();

  for (const employer of seedEmployers) {
    const employerId = "emp-" + employer.slug;
    employerIds.set(employer.slug, employerId);
    employerIdsBySlug.set(employer.slug, employerId);

    await prisma.employer.create({
      data: {
        id: employerId,
        slug: employer.slug,
        eventId: event.id,
        name: employer.name,
        tagline: employer.tagline,
        about: employer.about,
        industry: employer.industry,
        teamSize: employer.teamSize,
        location: employer.location,
        logoMark: employer.logoMark,
        palette: employer.palette,
        order: employer.order,
        prompts: {
          create: employer.prompts.map((prompt) => ({
            prompt: prompt.prompt,
            answer: prompt.answer,
            order: prompt.order,
          })),
        },
      },
    });

    for (const role of employer.roles) {
      const roleId = "role-" + role.slug;
      roleIds.set(role.slug, roleId);
      roleRecords.set(role.slug, {
        employerName: employer.name,
        title: role.title,
        summary: role.summary,
        problemNow: role.problemNow,
        skills: role.skills,
      });

      await prisma.role.create({
        data: {
          id: roleId,
          slug: role.slug,
          eventId: event.id,
          employerId,
          title: role.title,
          employmentType: role.employmentType,
          workMode: role.workMode,
          location: role.location,
          summary: role.summary,
          whyJoin: role.whyJoin,
          problemNow: role.problemNow,
          first90: role.first90,
          skillsJson: JSON.stringify(role.skills),
          portfolioRequired: role.portfolioRequired ?? false,
          order: role.order,
        },
      });
    }
  }

  const candidateIds = new Map<string, string>();
  const candidateRecords = new Map<string, { name: string; tags: string[]; facts: Array<{ id: string; claim: string; skillTags: string[]; evidenceUrl?: string | null }> }>();

  for (const candidate of seedCandidates) {
    const candidateId = "cand-" + candidate.slug;
    candidateIds.set(candidate.slug, candidateId);

    await prisma.candidate.create({
      data: {
        id: candidateId,
        slug: candidate.slug,
        eventId: event.id,
        name: candidate.name,
        headline: candidate.headline,
        location: candidate.location,
        bio: candidate.bio,
        monogram: candidate.monogram,
        palette: candidate.palette,
        tagsJson: JSON.stringify(candidate.tags),
        order: candidate.order,
        priorityIntroAllowance: 3,
      },
    });

    const createdFacts: Array<{ id: string; claim: string; skillTags: string[]; evidenceUrl?: string | null }> = [];
    let factOrder = 1;
    for (const fact of candidate.facts) {
      const isConfirmed = fact.provenance === "EMPLOYER_CONFIRMED";
      const confirmedByEmployerId = isConfirmed && fact.confirmedByEmployerSlug
        ? employerIdsBySlug.get(fact.confirmedByEmployerSlug) ?? null
        : null;
      if (isConfirmed && !confirmedByEmployerId) {
        throw new Error("Unknown confirming employer: " + fact.confirmedByEmployerSlug);
      }

      const created = await prisma.fact.create({
        data: {
          candidateId,
          prompt: fact.prompt,
          claim: fact.claim,
          skillTagsJson: JSON.stringify(fact.skillTags),
          metaJson: JSON.stringify(fact.meta ?? {}),
          evidenceUrl: fact.evidenceUrl ?? null,
          provenance: isConfirmed ? "EMPLOYER_CONFIRMED" : "SELF_CLAIMED",
          confirmedByEmployerId,
          origin: fact.origin ?? "SEED",
          order: factOrder++,
        },
      });
      createdFacts.push({
        id: created.id,
        claim: created.claim,
        skillTags: fact.skillTags,
        evidenceUrl: created.evidenceUrl,
      });
    }

    candidateRecords.set(candidate.slug, {
      name: candidate.name,
      tags: candidate.tags,
      facts: createdFacts,
    });
  }

  // Existing mutual matches: both sides said yes. No pass, no hidden ranking.
  for (const [index, seededMatch] of seedMatches.entries()) {
    const roleId = roleIds.get(seededMatch.roleSlug);
    const candidateId = candidateIds.get(seededMatch.candidateSlug);
    if (!roleId || !candidateId) {
      throw new Error("Unknown seeded match pair: " + seededMatch.roleSlug + " / " + seededMatch.candidateSlug);
    }
    const role = await prisma.role.findUniqueOrThrow({ where: { id: roleId } });
    const matchCreatedAt = ago(3 * 24 * HOUR - index * 17 * MINUTE);
    const oldestMessage = Math.max(...seededMatch.messages.map((message) => message.minutesAgo));
    const lastMessage = Math.min(...seededMatch.messages.map((message) => message.minutesAgo));

    await prisma.decision.createMany({
      data: [
        {
          eventId: event.id,
          roleId,
          candidateId,
          actorType: "CANDIDATE",
          action: "LIKE",
          createdAt: ago(5 * 24 * HOUR - index * 11 * MINUTE),
        },
        {
          eventId: event.id,
          roleId,
          candidateId,
          actorType: "EMPLOYER",
          action: "LIKE",
          createdAt: ago(5 * 24 * HOUR - index * 13 * MINUTE),
        },
      ],
    });

    const match = await prisma.match.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        createdAt: matchCreatedAt,
        lastMessageAt: ago(lastMessage * MINUTE),
      },
    });

    await prisma.message.createMany({
      data: seededMatch.messages.map((message) => ({
        matchId: match.id,
        senderType: message.sender === "candidate" ? "CANDIDATE" : "EMPLOYER",
        body: message.body,
        createdAt: ago(message.minutesAgo * MINUTE),
      })),
    });

    console.log(
      "  seeded match · " +
        seededMatch.candidateSlug +
        " ↔ " +
        seededMatch.roleSlug +
        " (" +
        oldestMessage +
        "–" +
        lastMessage +
        "m)",
    );
  }

  // Pending priority intros: one inbound for every seed persona, never exceeding the sender's allowance.
  for (const intro of seedPriorityIntros) {
    const roleId = roleIds.get(intro.roleSlug);
    const candidateId = candidateIds.get(intro.candidateSlug);
    if (!roleId || !candidateId) {
      throw new Error("Unknown priority intro pair: " + intro.roleSlug + " / " + intro.candidateSlug);
    }
    await prisma.decision.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        actorType: intro.sender === "candidate" ? "CANDIDATE" : "EMPLOYER",
        action: "PRIORITY_INTRO",
        reason: intro.reason,
        createdAt: ago(intro.hoursAgo * HOUR),
      },
    });
  }

  // Deterministic local fit briefs (the Modal batch can regenerate/import these).
  let fitCount = 0;
  for (const candidate of seedCandidates) {
    const candidateRecord = candidateRecords.get(candidate.slug);
    if (!candidateRecord) continue;
    for (const employer of seedEmployers) {
      for (const role of employer.roles) {
        const fit = buildFitSummary({
          candidateName: candidateRecord.name,
          candidateTags: candidateRecord.tags,
          facts: candidateRecord.facts,
          role: {
            title: role.title,
            summary: role.summary,
            problemNow: role.problemNow,
            skills: role.skills,
            employerName: employer.name,
          },
        });
        await prisma.fitSummary.create({
          data: {
            eventId: event.id,
            roleId: roleIds.get(role.slug)!,
            candidateId: candidateIds.get(candidate.slug)!,
            digest: fit.digest,
            sharedThemesJson: JSON.stringify(fit.sharedThemes),
            questionsJson: JSON.stringify(fit.questions),
            evidenceCoverage: fit.evidenceCoverage,
            generatedBy: "local-fallback",
          },
        });
        fitCount++;
      }
    }
  }

  const counts = {
    event: 1,
    candidates: seedCandidates.length,
    employers: seedEmployers.length,
    roles: seedEmployers.reduce((total, employer) => total + employer.roles.length, 0),
    facts: await prisma.fact.count(),
    matches: await prisma.match.count(),
    messages: await prisma.message.count(),
    decisions: await prisma.decision.count(),
    priorityIntros: await prisma.decision.count({ where: { action: "PRIORITY_INTRO" } }),
    fitBriefs: fitCount,
  };

  console.log("\nSeed complete.");
  console.log(JSON.stringify(counts, null, 2));
  console.log("\nTry Aino (candidate) ↔ Northwind Labs (employer).");
  console.log("Start: npm run dev → http://localhost:3000/enter");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
