import { PrismaClient } from "@prisma/client";
import { buildFitSummary } from "../src/lib/fit";
import { hashDemoPassword, SAMPLE_ACCOUNTS, SAMPLE_PANEL_REVIEWER, SAMPLE_QUANT_EMPLOYER } from "../src/lib/auth";
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
import type { SeedAssessment } from "./seed-data/types";
import { referenceSubmissions, storedProblems } from "./seed-data/stored";
import { markSubmissions } from "../src/lib/oa-marking";
import { summariseIntegrity, type IntegrityEventType } from "../src/lib/assessments";
import { deriveScreeningPlan, serializeScreeningPlan } from "../src/lib/screening";
import { outcomeForPass } from "../src/lib/outcomes";
import { seedScreeningRuns } from "./seed-data/screening";

const prisma = new PrismaClient();

const EVENT_ID = "event-junction-2026";
const EVENT_SLUG = "junction-2026-espoo";
const NOW = Date.now();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function ago(ms: number) {
  return new Date(NOW - ms);
}

function minutesFor(assessment: SeedAssessment, attempt: { minutesUsed?: number }) {
  return attempt.minutesUsed ?? Math.min(20, assessment.durationMinutes || 20);
}

/**
 * Synthetic per-problem marks for seeded scores. This is not a recorded sitting:
 * it distributes the target score across the problem's tests so the reviewer
 * view has a question-level shape to read. Live sittings store real marks.
 */
function seededResults(assessment: SeedAssessment, score: number): string {
  const problems = storedProblems(assessment);
  const totalTests = problems.reduce((total, problem) => total + problem.testCases.length, 0);
  let remaining = Math.round((score / 100) * totalTests);
  const marks = problems.map((problem) => {
    const total = problem.testCases.length;
    const passed = Math.min(total, Math.max(0, remaining));
    remaining -= passed;
    return { problemId: problem.id, title: problem.title, passed, total, error: null };
  });
  return JSON.stringify({
    score,
    passedTests: marks.reduce((total, mark) => total + mark.passed, 0),
    totalTests,
    problems: marks,
  });
}

function seededIntegrity(
  assessment: SeedAssessment,
  attempt: { minutesUsed?: number; integrityEvents?: Array<{ type: IntegrityEventType; atMinute: number }> },
): string | null {
  const summary = summariseIntegrity({
    mode: assessment.proctoring ?? "NONE",
    durationMinutes: assessment.durationMinutes ?? 0,
    startedAt: new Date(0),
    submittedAt: new Date(minutesFor(assessment, attempt) * MINUTE),
    report: {
      events: (attempt.integrityEvents ?? []).map((event) => ({ type: event.type, atSeconds: event.atMinute * 60 })),
      autoSubmitted: false,
      reason: null,
    },
  });
  return summary ? JSON.stringify(summary) : null;
}

function assertSeed(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error("Seed assertion failed: " + message);
}

async function clearDemoData() {
  await prisma.screeningEvent.deleteMany();
  await prisma.screeningRun.deleteMany();
  await prisma.account.deleteMany();
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
        problemsJson: JSON.stringify(storedProblems(assessment)),
        playable: assessment.playable,
        order: assessment.order,
        durationMinutes: assessment.durationMinutes ?? 0,
        proctoring: assessment.proctoring ?? "NONE",
        topicsJson: JSON.stringify(assessment.topics ?? []),
      },
    });
    if (assessment.playable) {
      const reference = markSubmissions(storedProblems(assessment), referenceSubmissions(assessment));
      assertSeed(reference.score === 100, "reference answers do not score 100 for " + assessment.slug);
    }
  }

  function requirementSnapshot(assessmentSlug: string, requiredScore: number) {
    const assessmentId = assessmentIds.get(assessmentSlug);
    const record = seedAssessments.find((entry) => entry.slug === assessmentSlug);
    assertSeed(assessmentId && record, "Unknown role-card assessment " + assessmentSlug);
    return {
      assessmentId,
      requiredScore,
      assessment: {
        id: assessmentId,
        slug: record.slug,
        title: record.title,
        roleFamily: record.roleFamily,
        family: record.family,
        version: record.version,
        difficulty: record.difficulty,
        description: record.description,
        playable: record.playable,
        problemCount: record.problems.length,
        order: record.order,
        durationMinutes: record.durationMinutes ?? 0,
        proctoring: record.proctoring ?? "NONE",
        topics: record.topics ?? [],
      },
    };
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
      const assessmentRecord = roleCard ? seedAssessments.find((entry) => entry.slug === roleCard.assessmentSlug) : null;
      assertSeed(!roleCard || (assessmentId && assessmentRecord), "Missing assessment for role card " + role.slug);
      const requirementList =
        roleCard && assessmentId && assessmentRecord
          ? [
              requirementSnapshot(roleCard.assessmentSlug, roleCard.requiredScore),
              ...(roleCard.additionalRequirements ?? []).map((extra) =>
                requirementSnapshot(extra.assessmentSlug, extra.requiredScore),
              ),
            ]
          : [];
      const requirementsJson = JSON.stringify(requirementList);
      const screeningPlan = deriveScreeningPlan({
        roleTitle: role.title,
        requirements: requirementList,
        signals: roleCard?.signals ?? [],
      });

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
          requirementsJson,
          evidenceSignalsJson: JSON.stringify(roleCard?.signals ?? []),
          screeningPlanJson: serializeScreeningPlan(screeningPlan),
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
        cvFileName:
          candidate.slug === "aino-vikstrom" || candidate.slug === "noor-salmi"
            ? candidate.slug + "-sample.pdf"
            : null,
        cvSource:
          candidate.slug === "aino-vikstrom" || candidate.slug === "noor-salmi" ? "SAMPLE" : null,
        cvUploadedAt:
          candidate.slug === "aino-vikstrom" || candidate.slug === "noor-salmi" ? ago(72 * HOUR) : null,
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

  // Demo-only account records. Sample buttons sign in without a password; the
  // login form also accepts these credentials and verifies the scrypt hash.
  const sampleCandidate = SAMPLE_ACCOUNTS.candidate;
  const sampleEmployer = SAMPLE_ACCOUNTS.employer;
  const candidatePassword = hashDemoPassword(sampleCandidate.password);
  const employerPassword = hashDemoPassword(sampleEmployer.password);
  await prisma.account.create({
    data: {
      eventId: event.id,
      side: "candidate",
      email: sampleCandidate.email,
      displayName: "Aino Vikström",
      passwordHash: candidatePassword.hash,
      passwordSalt: candidatePassword.salt,
      personId: candidateIds.get("aino-vikstrom")!,
    },
  });
  await prisma.account.create({
    data: {
      eventId: event.id,
      side: "employer",
      email: sampleEmployer.email,
      displayName: "Mikko Ranta",
      passwordHash: employerPassword.hash,
      passwordSalt: employerPassword.salt,
      personId: employerIds.get("northwind-labs")!,
    },
  });

  const panelPassword = hashDemoPassword(SAMPLE_PANEL_REVIEWER.password);
  await prisma.account.create({
    data: {
      eventId: event.id,
      side: "employer",
      email: SAMPLE_PANEL_REVIEWER.email,
      displayName: SAMPLE_PANEL_REVIEWER.reviewerName,
      passwordHash: panelPassword.hash,
      passwordSalt: panelPassword.salt,
      personId: employerIds.get("northwind-labs")!,
    },
  });

  const quantPassword = hashDemoPassword(SAMPLE_QUANT_EMPLOYER.password);
  await prisma.account.create({
    data: {
      eventId: event.id,
      side: "employer",
      email: SAMPLE_QUANT_EMPLOYER.email,
      displayName: SAMPLE_QUANT_EMPLOYER.reviewerName,
      passwordHash: quantPassword.hash,
      passwordSalt: quantPassword.salt,
      personId: employerIds.get("kallio-capital")!,
    },
  });

  // Seeded assessment results. These are synthetic scores, not simulated live sittings.
  // Timed or proctored sittings also get a synthetic integrity summary so the
  // reviewer view has something to show; it is labelled as seeded data.
  const attemptIds = new Map<string, string>();
  for (const attempt of seedAssessmentAttempts) {
    const candidateId = candidateIds.get(attempt.candidateSlug);
    const assessmentId = assessmentIds.get(attempt.assessmentSlug);
    const assessment = seedAssessments.find((entry) => entry.slug === attempt.assessmentSlug);
    assertSeed(candidateId && assessmentId && assessment, "Unknown attempt pair: " + attempt.candidateSlug + " / " + attempt.assessmentSlug);
    assertSeed(assessment.playable && assessment.problems.length > 0, "Attempt uses a non-playable assessment: " + attempt.assessmentSlug);
    assertSeed(attempt.score >= 0 && attempt.score <= 100, "Attempt score out of range: " + attempt.candidateSlug);

    const submittedAt = ago(attempt.submittedHoursAgo * HOUR);
    const created = await prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        candidateId,
        problemIdsJson: JSON.stringify(assessment.problems.map((problem) => problem.id)),
        submissionsJson: null,
        resultsJson: seededResults(assessment, attempt.score),
        score: attempt.score,
        integrityJson: seededIntegrity(assessment, attempt),
        startedAt: new Date(submittedAt.getTime() - minutesFor(assessment, attempt) * MINUTE),
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

  // Synthetic pre-screen records: partial human work, not model output.
  for (const spec of seedScreeningRuns) {
    const roleId = roleIds.get(spec.roleSlug);
    const candidateId = candidateIds.get(spec.candidateSlug);
    assertSeed(roleId && candidateId, "Unknown screening pair: " + spec.roleSlug + " / " + spec.candidateSlug);
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { employer: { select: { contactName: true, name: true } } },
    });
    assertSeed(role, "Screening run has no role: " + spec.roleSlug);
    const candidateRecord = candidateRecords.get(spec.candidateSlug);
    assertSeed(candidateRecord, "Screening run has no candidate facts: " + spec.candidateSlug);
    const reviewer = role.employer.contactName || "Hiring team";

    const claimChecks = (spec.claimChecks ?? []).map((check) => {
      const fact = candidateRecord.facts[check.factIndex];
      assertSeed(fact, "Screening claim index out of range: " + spec.candidateSlug + " #" + check.factIndex);
      return {
        factId: fact.id,
        status: check.status,
        note: check.note,
        updatedAt: ago((check.hoursAgo ?? 1) * HOUR).toISOString(),
      };
    });
    const notes = (spec.notes ?? []).map((note, index) => ({
      id: "seed-note-" + spec.roleSlug + "-" + spec.candidateSlug + "-" + index,
      body: note.body,
      author: reviewer,
      createdAt: ago(note.hoursAgo * HOUR).toISOString(),
    }));
    const decidedAt = spec.decision ? ago(spec.decision.decidedHoursAgo * HOUR) : null;
    const outcomeSentAt = spec.decision?.outcomeSentHoursAgo ? ago(spec.decision.outcomeSentHoursAgo * HOUR) : null;
    if (outcomeSentAt) {
      await prisma.outcome.upsert({
        where: { roleId_candidateId: { roleId, candidateId } },
        update: {},
        create: {
          eventId: event.id,
          roleId,
          candidateId,
          kind: "NOT_SELECTED",
          message: outcomeForPass({ roleTitle: role.title, employerName: role.employer.name }).message,
          deliveredAt: outcomeSentAt,
        },
      });
    }

    const events: Array<{ kind: string; detail: string; actor: string; createdAt: Date }> = [
      {
        kind: "OPENED",
        detail: "Opened the pre-screen record.",
        actor: reviewer,
        createdAt: ago(spec.openedHoursAgo * HOUR),
      },
      ...claimChecks.map((check) => ({
        kind: "CLAIM_CHECKED",
        detail:
          check.status === "VERIFIED"
            ? "Claim checked against its artifact."
            : check.status === "NEEDS_CONVERSATION"
              ? "Claim saved for the conversation."
              : check.status === "NOT_CHECKABLE"
                ? "Claim marked not checkable from the record."
                : "Artifact opens; the claim is still unchecked.",
        actor: reviewer,
        createdAt: new Date(check.updatedAt),
      })),
      ...notes.map((note) => ({
        kind: "NOTE_ADDED",
        detail: note.body.slice(0, 140),
        actor: note.author,
        createdAt: new Date(note.createdAt),
      })),
      ...(spec.decision && decidedAt
        ? [
            {
              kind: "DECISION_RECORDED",
              detail: spec.decision.reason.slice(0, 240),
              actor: reviewer,
              createdAt: decidedAt,
            },
          ]
        : []),
      ...(outcomeSentAt
        ? [
            {
              kind: "OUTCOME_SENT",
              detail: "Sent a short not-selected outcome to the candidate.",
              actor: reviewer,
              createdAt: outcomeSentAt,
            },
          ]
        : []),
    ].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

    await prisma.screeningRun.create({
      data: {
        eventId: event.id,
        roleId,
        candidateId,
        stage: spec.stage,
        status: spec.status,
        assignedReviewerName: spec.assignedReviewerName ?? reviewer,
        claimChecksJson: JSON.stringify(claimChecks),
        criterionChecksJson: JSON.stringify(spec.criterionChecks ?? []),
        notesJson: JSON.stringify(notes),
        decisionReason: spec.decision?.reason ?? null,
        decisionBasis: spec.decision?.basis ?? null,
        decisionPlanJson: spec.decision ? role.screeningPlanJson : null,
        decisionPlanVersion: spec.decision ? role.screeningPlanVersion : null,
        decidedBy: spec.decision ? reviewer : null,
        decidedAt,
        outcomeSentAt,
        createdAt: ago(spec.openedHoursAgo * HOUR),
        events: { create: events },
      },
    });
  }

  // Deterministic local fit briefs generated in TypeScript.
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
  assertSeed((await prisma.account.count()) >= 4, "expected the sample accounts");
  const sampleAino = await prisma.candidate.findUnique({ where: { slug: "aino-vikstrom" } });
  assertSeed(sampleAino?.cvUploadedAt, "sample candidate has no CV onboarding state");
  for (const role of liveRoles) {
    const requirements = JSON.parse(role.requirementsJson) as unknown[];
    assertSeed(Array.isArray(requirements) && requirements.length > 0, "live role has no requirements JSON");
  }

  // Every problem has a reference solution that passes every test, and every
  // playable assessment has at least one problem. This catches broken fixtures.
  let problemCount = 0;
  for (const assessment of seedAssessments) {
    if (assessment.playable) {
      assertSeed(assessment.problems.length > 0, "playable assessment has no problems: " + assessment.slug);
    }
    problemCount += assessment.problems.length;
    for (const problem of assessment.problems) {
      if (problem.kind === "choice" || problem.kind === "numeric") continue;
      assertSeed(
        problem.testCases.some((test) => test.hidden === false),
        "problem has no public example: " + problem.id,
      );
    }
    const stored = storedProblems(assessment);
    const marking = markSubmissions(stored, referenceSubmissions(assessment));
    if (assessment.playable) {
      assertSeed(marking.score === 100, "reference solution does not score 100 for " + assessment.slug + ": " + marking.score);
    }
  }

  const counts = {
    event: 1,
    candidates: seedCandidates.length,
    employers: seedEmployers.length,
    roles: seedEmployers.reduce((total, employer) => total + employer.roles.length, 0),
    liveRoleCards: liveRoles.length,
    assessments: seedAssessments.length,
    playableAssessments: seedAssessments.filter((assessment) => assessment.playable).length,
    oaProblems: problemCount,
    accounts: await prisma.account.count(),
    assessmentAttempts: await prisma.assessmentAttempt.count(),
    facts: await prisma.fact.count(),
    matches: await prisma.match.count(),
    messages: await prisma.message.count(),
    decisions: await prisma.decision.count(),
    priorityIntros: await prisma.decision.count({ where: { action: "PRIORITY_INTRO" } }),
    invitations: await prisma.invitation.count(),
    outcomes: await prisma.outcome.count(),
    fitBriefs: fitCount,
    screeningRuns: await prisma.screeningRun.count(),
    screeningEvents: await prisma.screeningEvent.count(),
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
