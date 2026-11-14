import { PrismaClient } from "@prisma/client";
import { buildFitSummary } from "../src/lib/fit";
import { seedAssessments } from "./seed-data/assessments";
import { seedCandidates } from "./seed-data/candidates";
import { seedEmployers } from "./seed-data/employers";
import {
  seedAssessmentAttempts,
  seedCandidateInterests,
  seedInvitations,
  seedMatches,
  seedOutcomes,
  seedPriorityIntros,
} from "./seed-data/interactions";
import { seedEmployerContacts, seedRoleCards } from "./seed-data/role-cards";

const prisma = new PrismaClient();

const EVENT_ID = "event-junction-2026";
const EVENT_SLUG = "junction-2026-espoo";
const NOW = Date.now();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function ago(ms: number) {
  return new Date(NOW - ms);
}

function assertSeed(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error("Seed assertion failed: " + message);
}

async function clearDemoData() {
  await prisma.reviewRequest.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
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
  await prisma.assessment.deleteMany();
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
      tagline: "Evidence first. Then decide.",
    },
  });

  const assessmentIds = new Map<string, string>();
  for (const assessment of seedAssessments) {
    const assessmentId = "assess-" + assessment.slug;
    assessmentIds.set(assessment.slug, assessmentId);
    await prisma.assessment.create({
      data: {
        id: assessmentId,
        eventId: event.id,
        slug: assessment.slug,
        title: assessment.title,
        roleFamily: assessment.roleFamily,
        family: assessment.family,
        version: assessment.version,
        difficulty: assessment.difficulty,
        description: assessment.description,
        questionsJson: JSON.stringify(assessment.questions),
        playable: assessment.playable,
        retakeLimit: assessment.retakeLimit ?? 1,
        cooldownHours: assessment.cooldownHours ?? 24,
        order: assessment.order,
      },
    });
  }

  const roleCardBySlug = new Map(seedRoleCards.map((card) => [card.roleSlug, card] as const));
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
        contactName: employer.contactName ?? seedEmployerContacts[employer.slug] ?? "Hiring team",
        order: employer.order,
        priorityIntroAllowance: 1,
        likeAllowance: employer.likeAllowance ?? 10,
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
      const roleCard = roleCardBySlug.get(role.slug);
      const assessmentId = roleCard ? assessmentIds.get(roleCard.assessmentSlug) : null;
      assertSeed(!roleCard || assessmentId, "Missing assessment for role card " + role.slug);

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
          roleFamily: roleCard?.roleFamily ?? "Software engineering",
          assessmentId: assessmentId ?? null,
          requiredScore: roleCard?.requiredScore ?? null,
          evidenceSignalsJson: JSON.stringify(roleCard?.signals ?? []),
          configStatus: roleCard ? "LIVE" : "DRAFT",
          reviewOwnerName: roleCard?.reviewOwnerName ?? null,
          reviewDueHours: 48,
          publishedAt: roleCard ? new Date() : null,
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
        interestsJson: JSON.stringify(candidate.interests ?? candidate.tags),
        availability: candidate.availability ?? "Open to roles in the Espoo capital region",
        discoveryOptIn: candidate.discoveryOptIn ?? true,
        order: candidate.order,
        priorityIntroAllowance: 1,
        likeAllowance: candidate.likeAllowance ?? 5,
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

  // Seeded assessment results. These are synthetic scores, not simulated live sittings.
  const attemptIds = new Map<string, string>();
  for (const attempt of seedAssessmentAttempts) {
    const candidateId = candidateIds.get(attempt.candidateSlug);
    const assessmentId = assessmentIds.get(attempt.assessmentSlug);
    const assessment = seedAssessments.find((entry) => entry.slug === attempt.assessmentSlug);
    assertSeed(candidateId && assessmentId && assessment, "Unknown attempt pair: " + attempt.candidateSlug + " / " + attempt.assessmentSlug);
    assertSeed(assessment.playable && assessment.questions.length >= 4, "Attempt uses a non-playable assessment: " + attempt.assessmentSlug);

    const submittedAt = ago(attempt.submittedHoursAgo * HOUR);
    const attemptNumber = attempt.attemptNumber ?? 1;
    const presentedQuestionIds = assessment.questions.slice(0, 4).map((question) => question.id);
    const created = await prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        candidateId,
        presentedQuestionIdsJson: JSON.stringify(presentedQuestionIds),
        answersJson: null,
        score: attempt.score,
        attemptNumber,
        startedAt: new Date(submittedAt.getTime() - 20 * MINUTE),
        submittedAt,
      },
    });
    attemptIds.set(attempt.candidateSlug + ":" + attempt.assessmentSlug, created.id);
  }

  // Existing mutual matches: both sides said yes. No pass, no hidden ranking.
  for (const [index, seededMatch] of seedMatches.entries()) {
    const roleId = roleIds.get(seededMatch.roleSlug);
    const candidateId = candidateIds.get(seededMatch.candidateSlug);
    assertSeed(roleId && candidateId, "Unknown seeded match pair: " + seededMatch.roleSlug + " / " + seededMatch.candidateSlug);

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
          source: "SWIPE",
          createdAt: ago(5 * 24 * HOUR - index * 11 * MINUTE),
        },
        {
          eventId: event.id,
          roleId,
          candidateId,
          actorType: "EMPLOYER",
          action: "LIKE",
          source: "SWIPE",
          createdAt: ago(5 * 24 * HOUR - index * 13 * MINUTE),
        },
      ],
    });

    const match = await prisma.match.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        stage: seededMatch.stage ?? "INTRO_CALL",
        stageUpdatedAt: matchCreatedAt,
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

    console.log("  seeded match · " + seededMatch.candidateSlug + " ↔ " + seededMatch.roleSlug + " (" + oldestMessage + "–" + lastMessage + "m)");
  }

  // Candidate-side ordinary interest that is not yet mutual.
  for (const interest of seedCandidateInterests) {
    const roleId = roleIds.get(interest.roleSlug);
    const candidateId = candidateIds.get(interest.candidateSlug);
    assertSeed(roleId && candidateId, "Unknown candidate interest pair: " + interest.roleSlug + " / " + interest.candidateSlug);
    await prisma.decision.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        actorType: "CANDIDATE",
        action: "LIKE",
        source: "SWIPE",
        createdAt: ago(interest.hoursAgo * HOUR),
      },
    });
  }

  // Pending priority intros: visible interest, never a suitability score.
  for (const intro of seedPriorityIntros) {
    const roleId = roleIds.get(intro.roleSlug);
    const candidateId = candidateIds.get(intro.candidateSlug);
    assertSeed(roleId && candidateId, "Unknown priority intro pair: " + intro.roleSlug + " / " + intro.candidateSlug);
    await prisma.decision.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        actorType: intro.sender === "candidate" ? "CANDIDATE" : "EMPLOYER",
        action: "PRIORITY_INTRO",
        source: "SWIPE",
        reason: intro.reason,
        createdAt: ago(intro.hoursAgo * HOUR),
      },
    });
  }

  // Message-only invitations from recruiter discovery.
  for (const invitation of seedInvitations) {
    const roleId = roleIds.get(invitation.roleSlug);
    const candidateId = candidateIds.get(invitation.candidateSlug);
    assertSeed(roleId && candidateId, "Unknown invitation pair: " + invitation.roleSlug + " / " + invitation.candidateSlug);
    const citedAttemptId = attemptIds.get(invitation.candidateSlug + ":" + invitation.citedAssessmentSlug) ?? null;
    assertSeed(citedAttemptId, "Invitation has no cited attempt: " + invitation.candidateSlug + " / " + invitation.citedAssessmentSlug);
    const respondedAt = invitation.status === "PENDING" ? null : ago(Math.max(1, invitation.hoursAgo - 2) * HOUR);

    await prisma.invitation.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        message: invitation.message,
        citedAttemptId,
        status: invitation.status,
        createdAt: ago(invitation.hoursAgo * HOUR),
        respondedAt,
      },
    });
  }

  // Seeded outcomes. Every outcome belongs to a candidate who expressed interest.
  for (const outcome of seedOutcomes) {
    const roleId = roleIds.get(outcome.roleSlug);
    const candidateId = candidateIds.get(outcome.candidateSlug);
    assertSeed(roleId && candidateId, "Unknown outcome pair: " + outcome.roleSlug + " / " + outcome.candidateSlug);

    const candidateDecision = await prisma.decision.findFirst({
      where: { roleId, candidateId, actorType: "CANDIDATE" },
    });
    if (!candidateDecision) {
      await prisma.decision.create({
        data: {
          eventId: event.id,
          roleId,
          candidateId,
          actorType: "CANDIDATE",
          action: "LIKE",
          source: "SWIPE",
          createdAt: ago(40 * HOUR),
        },
      });
    }
    const employerDecision = await prisma.decision.findFirst({
      where: { roleId, candidateId, actorType: "EMPLOYER" },
    });
    if (!employerDecision) {
      await prisma.decision.create({
        data: {
          eventId: event.id,
          roleId,
          candidateId,
          actorType: "EMPLOYER",
          action: "PASS",
          source: "SWIPE",
          createdAt: ago(24 * HOUR),
        },
      });
    }

    await prisma.outcome.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        kind: outcome.kind,
        message: outcome.message,
        deliveredAt: ago(outcome.hoursAgo * HOUR),
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

  const liveRoles = await prisma.role.findMany({ where: { configStatus: "LIVE" }, include: { assessment: true } });
  assertSeed(liveRoles.length === seedRoleCards.length, "expected " + seedRoleCards.length + " live role cards, found " + liveRoles.length);
  for (const role of liveRoles) {
    assertSeed(role.assessment?.playable, "live role card uses a non-playable assessment: " + role.slug);
    assertSeed(role.requiredScore !== null && role.requiredScore >= 0 && role.requiredScore <= 100, "invalid required score: " + role.slug);
  }

  const candidates = await prisma.candidate.findMany({ where: { eventId: event.id } });
  for (const candidate of candidates) {
    const decisions = await prisma.decision.findMany({ where: { candidateId: candidate.id, actorType: "CANDIDATE" } });
    const likes = decisions.filter((decision) => decision.action === "LIKE" && decision.source === "SWIPE").length;
    const intros = decisions.filter((decision) => decision.action === "PRIORITY_INTRO").length;
    assertSeed(likes <= candidate.likeAllowance, candidate.slug + " exceeded Like allowance");
    assertSeed(intros <= candidate.priorityIntroAllowance, candidate.slug + " exceeded Priority-intro allowance");
  }

  const employers = await prisma.employer.findMany({ where: { eventId: event.id } });
  for (const employer of employers) {
    const decisions = await prisma.decision.findMany({
      where: { actorType: "EMPLOYER", role: { employerId: employer.id } },
    });
    const likes = decisions.filter((decision) => decision.action === "LIKE" && decision.source === "SWIPE").length;
    const intros = decisions.filter((decision) => decision.action === "PRIORITY_INTRO").length;
    assertSeed(likes <= employer.likeAllowance, employer.slug + " exceeded Like allowance");
    assertSeed(intros <= employer.priorityIntroAllowance, employer.slug + " exceeded Priority-intro allowance");
  }

  const northwindProduct = roleIds.get("northwind-product-engineer");
  const noorId = candidateIds.get("noor-salmi");
  const meiId = candidateIds.get("mei-laine");
  assertSeed(northwindProduct && noorId && meiId, "feed fixture IDs missing");
  assertSeed(
    await prisma.decision.findFirst({ where: { roleId: northwindProduct, candidateId: meiId, actorType: "CANDIDATE", action: "LIKE" } }),
    "Northwind Product has no interested cohort fixture",
  );
  assertSeed(
    !(await prisma.decision.findFirst({ where: { roleId: northwindProduct, candidateId: noorId, actorType: "CANDIDATE" } })),
    "Noor should be a discovery fixture for Northwind Product",
  );

  const ainoId = candidateIds.get("aino-vikstrom");
  const commonGroundFrontend = roleIds.get("common-ground-frontend-engineer");
  assertSeed(ainoId && commonGroundFrontend, "Aino feed fixture IDs missing");
  assertSeed(
    await prisma.decision.findFirst({
      where: { roleId: commonGroundFrontend, candidateId: ainoId, actorType: "EMPLOYER", action: "PRIORITY_INTRO" },
    }),
    "Aino has no interested-role fixture",
  );
  assertSeed(
    await prisma.assessmentAttempt.count(),
    "no assessment attempts seeded",
  );
  assertSeed(await prisma.invitation.count(), "no invitations seeded");
  assertSeed(await prisma.outcome.count(), "no outcomes seeded");

  const counts = {
    event: 1,
    candidates: seedCandidates.length,
    employers: seedEmployers.length,
    roles: seedEmployers.reduce((total, employer) => total + employer.roles.length, 0),
    liveRoleCards: liveRoles.length,
    assessments: seedAssessments.length,
    playableAssessments: seedAssessments.filter((assessment) => assessment.playable).length,
    assessmentAttempts: await prisma.assessmentAttempt.count(),
    facts: await prisma.fact.count(),
    matches: await prisma.match.count(),
    messages: await prisma.message.count(),
    decisions: await prisma.decision.count(),
    priorityIntros: await prisma.decision.count({ where: { action: "PRIORITY_INTRO" } }),
    invitations: await prisma.invitation.count(),
    outcomes: await prisma.outcome.count(),
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
