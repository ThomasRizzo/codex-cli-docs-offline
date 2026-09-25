import {
  COURSE,
  DIFFS,
  FILES,
  FINAL_DIFFS,
  FINAL_HOMEPAGE_HEADING,
  STEPS,
} from "./course-data.js?v=98f31d9e6951";
import { COURSE_STORAGE_KEY } from "./course-manifest.js";
import { isRequiredHomepageReviewComment } from "./review-contract.js";

const originalFetch = window.fetch.bind(window);
const courseBasePath = "/training/codex-lab";
const model = "gpt-5.6-sol";
const reasoningEffort = "xhigh";
const sessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(COURSE_STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function restoreWorkspace(progress) {
  const saved = progress.workspace;
  const branches = [COURSE.repository.defaultBranch, COURSE.repository.baseBranch, COURSE.repository.workingBranch];
  // Rename only the prepared feature branch when restoring the previous scenario.
  // Keep its source, revision, and session so saved reviews and checks remain valid.
  const savedBranch = saved?.branch === "eng-248-homepage-heading"
    ? COURSE.repository.workingBranch : saved?.branch;
  if (saved && sessionPattern.test(saved.sessionId || "")
    && branches.includes(savedBranch)
    && ["initial", "review", "final"].includes(saved.phase)
    && Number.isSafeInteger(saved.revision) && saved.revision >= 0) {
    return { sessionId: saved.sessionId, branch: savedBranch, phase: saved.phase,
      revision: saved.revision, branchCreated: saved.branchCreated === true || savedBranch === COURSE.repository.workingBranch || saved.phase !== "initial",
      branchBase: saved.branchBase || (saved.branch === "eng-248-homepage-heading" ? "main" : COURSE.repository.baseBranch) };
  }
  const completed = new Set(Array.isArray(progress.completed) ? progress.completed : []);
  const phase = ["build", "test", "pr"].some((id) => completed.has(id))
    ? "final" : progress.taskProgress?.build >= 1 ? "review" : "initial";
  const branchCreated = completed.has("ticket") || phase !== "initial";
  const revisions = [phase === "final" ? 3 : phase === "review" ? 2 : branchCreated ? 1 : 0,
    progress.verificationResult?.revision,
    ...(Array.isArray(progress.diffComments) ? progress.diffComments.map((comment) => comment?.revision) : [])]
    .filter((revision) => Number.isSafeInteger(revision) && revision >= 0);
  return { branch: branchCreated ? COURSE.repository.workingBranch : branches[0], branchCreated, phase,
    branchBase: COURSE.repository.baseBranch,
    revision: Math.max(...revisions),
    sessionId: sessionPattern.test(progress.codexSessionId || "") ? progress.codexSessionId : crypto.randomUUID() };
}

const runtime = { ...restoreWorkspace(readProgress()) };
const storedWorkspace = readProgress().workspace;
let activeLesson = STEPS.some(({ id }) => id === storedWorkspace?.lessonId)
  ? storedWorkspace.lessonId : "";
const lessonWorkspaces = Object.fromEntries(STEPS.flatMap(({ id }) => {
  const workspace = storedWorkspace?.lessons?.[id];
  return workspace && typeof workspace === "object"
    ? [[id, restoreWorkspace({ workspace })]] : [];
}));

function runtimeState() {
  return { ...runtime, lessonId: activeLesson, lessons: {
    ...lessonWorkspaces,
    ...(activeLesson ? { [activeLesson]: { ...runtime } } : {}),
  } };
}

function persistWorkspace() {
  try {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify({ ...readProgress(), workspace: runtimeState() }));
  } catch {
    // Practice still works when browser storage is unavailable.
  }
}

window.__CODEX_TRAINING_RUNTIME__ = {
  getState: runtimeState,
  // Each lesson can start independently. Save its workspace before moving to
  // another lesson, so skipping forward cannot overwrite an unfinished review.
  prepareLesson(stepId) {
    if (!STEPS.some(({ id }) => id === stepId)) return null;
    if (activeLesson !== stepId) {
      if (activeLesson) lessonWorkspaces[activeLesson] = { ...runtime };
      const existing = lessonWorkspaces[stepId];
      if (existing) Object.assign(runtime, existing);
      else {
        const completed = readProgress().completed || [];
        const phase = ["test", "pr"].includes(stepId) || stepId === "build" && completed.includes("build")
          ? "final" : "initial";
        const branchCreated = ["build", "test", "pr"].includes(stepId);
        // Reuse the active build when upgrading a pre-independent-lessons save.
        if (!(stepId === "build" && !activeLesson && runtime.phase === "review")) {
          Object.assign(runtime, {
            phase, branchCreated,
            branchBase: COURSE.repository.baseBranch,
            branch: branchCreated ? COURSE.repository.workingBranch : COURSE.repository.defaultBranch,
            revision: phase === "final" ? 3 : branchCreated ? 1 : 0,
            sessionId: crypto.randomUUID(),
          });
        }
      }
      activeLesson = stepId;
    }
    const workspace = getWorkspaceSnapshot();
    return { workspace, verification: stepId === "pr" ? getVerification(workspace) : null };
  },
  reset() {
    Object.assign(runtime, restoreWorkspace({}));
    activeLesson = "";
    for (const id of Object.keys(lessonWorkspaces)) delete lessonWorkspaces[id];
    persistWorkspace();
  },
};

function getDiffStats(patch) {
  const lines = patch.split("\n");

  return {
    additions: lines.filter(
      (line) => line.startsWith("+") && !line.startsWith("+++")
    ).length,
    deletions: lines.filter(
      (line) => line.startsWith("-") && !line.startsWith("---")
    ).length,
  };
}

function getWorkspaceSnapshot() {
  const diffs =
    runtime.phase === "final"
      ? FINAL_DIFFS
      : runtime.phase === "review"
        ? DIFFS
        : {};

  const files = Object.entries(FILES).map(([path, source]) => {
    const patch = diffs[path] ?? "";
    const content =
      runtime.phase === "final"
        ? source.updated
        : runtime.phase === "review"
          ? source.review
          : source.initial;

    return {
      path,
      status: patch ? "modified" : "unchanged",
      content,
      originalContent: source.initial,
      patch,
      ...getDiffStats(patch),
    };
  });
  const changedFiles = files.filter(({ status }) => status !== "unchanged");

  return {
    sessionId: runtime.sessionId,
    revision: runtime.revision,
    verified: true,
    branch: runtime.branch,
    branchBase: runtime.branchCreated ? runtime.branchBase : null,
    branches:
      runtime.branchCreated
        ? [COURSE.repository.defaultBranch, COURSE.repository.baseBranch, COURSE.repository.workingBranch]
        : [COURSE.repository.defaultBranch, COURSE.repository.baseBranch],
    files,
    changedFiles,
    patch: changedFiles.map(({ patch }) => patch).join(""),
    totals: changedFiles.reduce(
      (totals, file) => ({
        additions: totals.additions + file.additions,
        deletions: totals.deletions + file.deletions,
      }),
      { additions: 0, deletions: 0 }
    ),
    changed: changedFiles.length > 0,
  };
}

function createJsonResponse(url, payload, status = 200) {
  const response = new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });

  Object.defineProperty(response, "url", { value: url.href });
  return response;
}

function getRequestBody(input, init) {
  const body = init?.body ?? (input instanceof Request ? input.body : null);

  if (typeof body !== "string" || !body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function getVerification(workspace) {
  return {
    verified: true,
    sessionId: workspace.sessionId,
    revision: workspace.revision,
    passed: true,
    checks: [
      {
        id: "focused-tests",
        command: "npm test -- --run src/App.test.tsx",
        status: "completed",
        output: "Homepage-heading coverage passed.",
        exitCode: 0,
      },
      {
        id: "typecheck",
        command: "npm run typecheck",
        status: "completed",
        output: "TypeScript checks passed.",
        exitCode: 0,
      },
    ],
  };
}

function getCodexResponse(request) {
  const step = STEPS.find(({ id }) => id === request.stepId) ?? STEPS[0];
  if (request.sessionId && request.sessionId !== runtime.sessionId) {
    return { error: "This workspace session is no longer available. Resume the course to restore it." };
  }

  if (request.branchPreparationApproved === true) {
    if (step.id !== "ticket" || request.mode === "plan" || runtime.branch !== COURSE.repository.baseBranch
      || runtime.phase !== "initial" || runtime.branchCreated) {
      return { error: "Select staging and use a clean working tree before creating the feature branch." };
    }
    runtime.branch = COURSE.repository.workingBranch;
    runtime.branchCreated = true;
    runtime.branchBase = COURSE.repository.baseBranch;
    runtime.revision += 1;
  }

  if (request.executionApproved === true && request.stepId === "build") {
    const review = request.implementationPhase === "review-comment";
    if (runtime.branch !== COURSE.repository.workingBranch
      || request.implementationRevision !== runtime.revision
      || runtime.phase !== (review ? "review" : "initial")
      || (review && !(request.reviewComments || []).some((comment) => isRequiredHomepageReviewComment(comment, runtime)))) {
      return { error: "The approved change does not match the current workspace revision." };
    }
    runtime.phase =
      review ? "final" : "review";
    runtime.revision += 1;
  }

  persistWorkspace();
  const workspace = getWorkspaceSnapshot();
  let text =
    runtime.phase === "final" && request.stepId === "build"
      ? `Applied the review comment. Both src/App.tsx and src/App.test.tsx now use “${FINAL_HOMEPAGE_HEADING}”.`
      : step.assistantResponse;
  if (step.id === "ticket" && request.branchPreparationApproved !== true) {
    text = "Select staging in Environment, then ask me to create feat/eng-248-homepage-heading from staging. No branch was created.";
  }

  const response = {
    text,
    sessionId: runtime.sessionId,
    model,
    reasoningEffort,
    workspace,
  };

  if (request.verificationApproved === true) {
    if (runtime.phase !== "final") return { error: "Complete the final heading revision before running the focused checks." };
    response.verification = getVerification(workspace);
    response.text = "Homepage-heading coverage and TypeScript checks passed.";
  }

  if (request.stagedPreviewRequested === true) {
    if (runtime.phase !== "final") return { error: "The final heading is not ready to preview." };
    response.text = "Blossom Bank is ready to preview. Open it in the browser to check the updated heading.";
    response.preview = {
      kind: "staged-workspace",
      label: "Open the staged Blossom Bank preview",
      path: `${courseBasePath}/demos/blossom-bank/index.html?sessionId=${runtime.sessionId}&revision=${workspace.revision}`,
      revision: workspace.revision,
      sessionId: runtime.sessionId,
    };
  }

  return response;
}

window.__CODEX_TRAINING_EMBEDDED__ = true;

window.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
    window.location.href
  );

  if (url.origin !== window.location.origin) {
    return originalFetch(input, init);
  }

  if (url.pathname === "/api/codex/status") {
    return createJsonResponse(url, {
      available: true,
      model,
      reasoningEffort,
      runtimeMode: "hosted",
      simulated: true,
    });
  }

  if (url.pathname === "/api/codex/workspace") {
    const requestedSession = url.searchParams.get("sessionId");
    if (requestedSession && requestedSession !== runtime.sessionId) {
      return createJsonResponse(url, { error: "Workspace session expired." }, 410);
    }
    persistWorkspace();
    return createJsonResponse(url, getWorkspaceSnapshot());
  }

  if (url.pathname === "/api/codex/workspace/branches") {
    const request = getRequestBody(input, init);

    if (request.branch) {
      if (!getWorkspaceSnapshot().branches.includes(request.branch)) {
        return createJsonResponse(url, { error: "That branch is not available." }, 400);
      }
      runtime.branch = request.branch;
      runtime.revision += 1;
      persistWorkspace();
      return createJsonResponse(url, getWorkspaceSnapshot());
    }

    const workspace = getWorkspaceSnapshot();
    return createJsonResponse(url, {
      sessionId: workspace.sessionId,
      branch: workspace.branch,
      branches: workspace.branches,
    });
  }

  const manifestMatch = url.pathname.match(
    /^\/api\/codex\/workspace\/staged-preview\/([^/]+)\/manifest$/
  );

  if (manifestMatch) {
    const saved = restoreWorkspace(readProgress());
    if (saved.phase !== "final" || manifestMatch[1] !== saved.sessionId
      || Number(url.searchParams.get("revision")) !== saved.revision) {
      return createJsonResponse(url, { error: "This staged preview is no longer current." }, 404);
    }
    return createJsonResponse(url, {
      heading: FINAL_HOMEPAGE_HEADING,
      revision: saved.revision,
      sessionId: saved.sessionId,
      sourcePath: "src/App.tsx",
    });
  }

  if (url.pathname === "/api/codex") {
    const response = getCodexResponse(getRequestBody(input, init));
    return createJsonResponse(url, response, response.error ? 409 : 200);
  }

  return originalFetch(input, init);
};
