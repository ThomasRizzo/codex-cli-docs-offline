import {
  COURSE,
  DIFFS,
  FINAL_DIFFS,
  FILES,
  FINAL_HOMEPAGE_HEADING,
  FIRST_HOMEPAGE_HEADING,
  LINEAR_ISSUE,
  ORIGINAL_HOMEPAGE_HEADING,
  REQUIRED_HOMEPAGE_REVIEW_COMMENT,
  STEPS,
} from "./course-data.js?v=98f31d9e6951";
import { COURSE_LESSONS, COURSE_STORAGE_KEY } from "./course-manifest.js";
import { createHandsOnTrainingTracker, isTrainingWorkspaceInteraction } from "./analytics.js";
import { architectureHtml, architectureStyles } from "./architecture.js";
import { appIcons } from "./app-icons.js";
import { syncTrainingMiniSidebar, projectActionStyles, projectComposeIcon } from "./mini-sidebar.js";
import { pluginCatalogHtml, pluginCatalogStyles, pluginInstalledIcon } from "./plugin-catalog.js";
import {
  HOMEPAGE_REVIEW_LOCATION,
  homepageReviewCommentError,
  isHomepageReviewLocation,
  isRequiredHomepageReviewComment,
} from "./review-contract.js";

const app = document.querySelector("#app");
let trainingAnalytics = null;
const STORAGE_KEY = COURSE_STORAGE_KEY;
const REVIEW_PROGRESS_VERSION = 1;
const VERIFICATION_PROGRESS_VERSION = 2;
const HOSTED_PREVIEW_SEEN_KEY = "learn-openai-codex-hosted-preview-seen-v1";
const HOSTED_PREVIEW_COMMANDS = [
  "git clone https://github.com/openai/learn-codex-experience.git",
  "cd learn-codex-experience",
  "npm run lab:doctor",
  "npm run lab",
];
const modifiedFiles = Object.keys(DIFFS);
function fallbackReviewDiffs() {
  return typeof isComplete === "function" && isComplete("build")
    && typeof FINAL_DIFFS === "object" ? FINAL_DIFFS : DIFFS;
}
function reviewDiffStats(diffs = fallbackReviewDiffs()) {
  return Object.fromEntries(
    Object.entries(diffs).map(([path, patch]) => {
    const lines = patch.split("\n");
    return [path, {
      additions: lines.filter((line) => line.startsWith("+") && !line.startsWith("+++")).length,
      deletions: lines.filter((line) => line.startsWith("-") && !line.startsWith("---")).length,
    }];
    }),
  );
}
const diffStats = reviewDiffStats(DIFFS);
function reviewDiffTotals(diffs = fallbackReviewDiffs()) {
  return Object.values(reviewDiffStats(diffs)).reduce(
    (totals, file) => ({
      additions: totals.additions + file.additions,
      deletions: totals.deletions + file.deletions,
    }),
    { additions: 0, deletions: 0 },
  );
}
const totalDiffStats = reviewDiffTotals(DIFFS);
const defaultFile = "src/App.tsx";
const CODEX_MINI_APP_URL = "https://learn.chatgpt.com/_astro/index-BEpx8kY1.B9MaQd82.js";
const CODEX_MINI_RENDERER_URL = "https://learn.chatgpt.com/_astro/client.C28dYYSg.js";
let codexMiniModulesPromise;
let pendingCodexMiniPrompt = "";
let codexThinkingTimer = null;
let reviewCommentsAttachmentCloseTimer = null;
let codexThinkingPendingId = "";
let restoredPublishedThreadScrollCleanup = null;
let hostedPreviewInstructionsReturnFocus = null;

const stageIcons = {
  project: "folder",
  connect: "plug",
  ticket: "git-pull",
  build: "sparkle",
  test: "flask",
  pr: "git-pull",
};

const stageEvents = {
  project: "Analyzed the Blossom Bank repository · Visualized its architecture",
  connect: "Searched Linear issues with Linear",
  ticket: "Selected staging · Created feat/eng-248-homepage-heading",
  build: "Updated the homepage heading · Ready for review feedback",
  test: "Read-only source review · Staged preview link pending",
  pr: "Created pull request #184",
};

const developmentLifecycleStages = COURSE_LESSONS.map(({ id, label }) => ({ label, stepIds: [id] }));

const practiceGuides = {
  project: {
    tasks: ["Start a new project", "Select the Blossom Bank folder", "Get context on the repo"],
    prompts: [],
    details: [
      { copy: "Select Add new project beside Projects in the Codex sidebar. Keep Local selected, then select Next." },
      { copy: "Enter a project name. Add the Blossom Bank folder under Source folders, then select Create project." },
      { copy: "In the text box, ask Codex to analyze the repository and show a visualization of its architecture. Use the example prompt below to get started, then wait for the visual overview before continuing.", example: "Analyze the Blossom Bank repository to help me onboard. Show me a visualization of its architecture, the main components, and how they fit together." },
    ],
    summary: "You created a project and asked Codex for a visual overview of the repository.",
  },
  connect: {
    tasks: ["Open the Plugins menu", "Install the Linear plugin", "Ask Codex to find tickets"],
    prompts: ["Find my assigned Linear tickets", "List my in-progress Linear issues"],
    questions: ["What can this connection access?"],
    details: [
      { copy: "Select Plugins in the Codex sidebar to see which tools are available." },
      { copy: "Find Linear and select Install to search your assigned issues." },
      {
        copy: "The training connection is ready. It can search prepared Linear issues, but cannot change them. Type @ in the composer, select Linear, and ask it to find your assigned ticket.",
        example: "@Linear find my assigned, highest-priority in-progress Linear ticket and summarize the business or engineering issue.",
      },
    ],
    summary: "You connected Linear and found the business or engineering issue.",
  },
  ticket: {
    tasks: ["Open the Environment sidebar", "Inspect the available branches", "Select the staging branch", "Ask Codex to create the feature branch"],
    prompts: ["Check the working tree and create the ENG-248 feature branch from staging", "Create a feat/ branch from staging", "Create feat/eng-248-homepage-heading from staging"],
    details: [
      { copy: "Select Toggle environment sidebar at the top right to open Environment." },
      { copy: "Select main in Environment to open the branch dropdown and inspect the branches available in this repository." },
      { copy: "Select staging in the branch dropdown. Confirm Environment now shows staging before creating your feature branch." },
      {
        copy: "Ask Codex to check the working tree and create a feature branch from staging. ",
        example: "Verify that the working tree is clean, then create and switch to feat/eng-248-homepage-heading from staging.",
      },
    ],
    summary: "You selected staging and created feat/eng-248-homepage-heading from it.",
  },
  build: {
    tasks: ["Ask Codex to implement the change", "Open Review and inspect the real diff", "Comment on src/App.tsx", "Send the attached comment to Codex"],
    prompts: ["Implement the minimal homepage-heading change", "Inspect the heading diff", "Implement the requested headline revision"],
    details: [
      { copy: "Ask Codex to implement the minimal change for ENG-248: update the homepage heading and its focused test. Send the request to start editing the isolated project.", example: STEPS.find((step) => step.id === "build").prompt },
      { copy: "Open Review and inspect the real diff in src/App.tsx. Find the added right-side heading line at R353, which first reads “Banking that grows with every chapter.”." },
      { copy: "Add a comment asking Codex to shorten the headline.", exampleComment: true },
      { copy: "Select the main Send arrow. Codex receives the attached feedback and implements the requested revision." },
    ],
    summary: "You requested the first homepage-heading change, inspected its real diff, and sent the requested revision.",
  },
  test: {
    tasks: ["Create a new thread", "Review against the source branch", "Run the focused checks", "Open the staged Blossom Bank preview"],
    prompts: [],
    details: [
      { copy: "Start a separate thread in your project to verify the change." },
      { copy: "Type /review in the composer and select Code review. Under Review against a base branch, select staging, the source branch for your change." },
      { copy: "Ask Codex to run tests and report the results. Read the results before continuing.", example: "Run tests and report results." },
      { copy: "Ask Codex to run Blossom Bank locally. Once it is ready, open the preview and confirm the final homepage heading.", example: "Run Blossom Bank locally so I can preview the homepage." },
    ],
    summary: "You reviewed the change in a separate thread, checked the test results, and inspected the finished heading.",
  },
  pr: {
    tasks: ["Ask Codex to create a pull request", "Connect the Slack plugin", "Share the pull request in the team channel"],
    prompts: [],
    details: [
      { copy: "Ask Codex to create a pull request for ENG-248 from the final diff and linked ticket.", example: "Create a pull request for ENG-248. Summarize the homepage-heading change and link the ticket." },
      { copy: "Open Plugins in the sidebar, find Slack, and select Install. Then return to your conversation." },
      { copy: "Return to your previous conversation. Ask Codex to use Slack to post the pull request link in #blossom-bank-eng so the team can review it.", example: "Use Slack to post the pull request link in #blossom-bank-eng with a short summary of the change." },
    ],
    summary: "You created a pull request, connected Slack, and shared the link with your team.",
  },
};

const practiceLearnMore = {
  project: [
    {
      title: "Projects and chats",
      summary: "Projects organize related chats and source folders. A local project gives Codex access to the folders you attach, while each chat keeps its own conversation and results. Use separate chats for distinct tasks that need the same project files.",
      url: "https://learn.chatgpt.com/docs/projects",
    },
    {
      title: "Visualize",
      summary: "Visualize creates diagrams, charts, and interactive explanations inside a chat. Use project files as the source for an architecture diagram, then ask follow-up questions or request changes to the visualization.",
      url: "https://learn.chatgpt.com/docs/visualizations",
    },
  ],
  connect: [
    {
      title: "Plugins and connected tools",
      summary: "Plugins connect Codex to tools such as Linear and can also include reusable skills. Install a plugin, review its permissions, and connect your account when prompted. Type @ to choose it in a request and bring relevant information into your chat.",
      url: "https://learn.chatgpt.com/docs/plugins",
    },
  ],
  ticket: [
    {
      title: "Codex environments",
      summary: "An environment determines where Codex runs commands and changes files. Local uses your project directory, Worktree uses a separate Git checkout, and Cloud uses a configured remote environment. Check the environment before starting work.",
      url: "https://learn.chatgpt.com/docs/environments/modes",
    },
    {
      title: "Git tools and branches",
      summary: "Codex’s Git tools help you inspect working changes and prepare them for a commit. Ask Codex to check the repository before switching branches or creating a feature branch. The integrated terminal supports Git commands that are not exposed in the app.",
      url: "https://learn.chatgpt.com/docs/environments/local-environment#use-built-in-git-tools",
    },
  ],
  build: [
    {
      title: "Prompting and follow-up messages",
      summary: "A prompt tells Codex the change you want, the context it needs, and what should stay unchanged. Describe how to check the result. Continue in the same chat to add information, correct the direction, or request a focused revision.",
      url: "https://learn.chatgpt.com/docs/prompting",
    },
    {
      title: "The review pane and inline comments",
      summary: "The review pane shows the lines added and removed in your Git diff. Inline comments attach feedback to specific lines so Codex knows what to change. Send the attached feedback in chat, then inspect the revised diff.",
      url: "https://learn.chatgpt.com/docs/code-review?surface=app#inline-comments-for-feedback",
    },
  ],
  test: [
    {
      title: "Code review",
      summary: "Use /review to ask Codex to inspect uncommitted changes or compare your branch with a base branch. Codex reports prioritized findings without editing the working tree. Review the findings, then ask it to address any issues you want to fix.",
      url: "https://learn.chatgpt.com/docs/code-review?surface=app",
    },
    {
      title: "Tests and the integrated terminal",
      summary: "Codex can run your project’s tests, linters, and build commands. The integrated terminal lets you run checks and inspect their output alongside the chat. Ask what passed, what failed, and what could not be verified.",
      url: "https://learn.chatgpt.com/docs/integrated-terminal",
    },
    {
      title: "Browser previews",
      summary: "The in-app browser opens local web apps and hosted previews beside your chat. Use it to inspect the rendered page, try interactions, and leave visual feedback. Browser checks show how a change looks and behaves.",
      url: "https://learn.chatgpt.com/docs/browser?surface=app",
    },
  ],
  pr: [
    {
      title: "Pull requests and Git tools",
      summary: "A pull request proposes merging one branch into another so teammates can review the diff. With repository access configured, Codex can help commit changes, push a branch, and create a pull request. Check its target branch, summary, and validation results before merging.",
      url: "https://learn.chatgpt.com/docs/environments/local-environment#use-built-in-git-tools",
    },
    {
      title: "The Slack plugin",
      summary: "The Slack plugin connects Codex to conversations and actions in your workspace. Install it, review its permissions, and connect the intended account. To share work, specify the link, channel or thread, and message. Review the content before approving a send.",
      url: "https://learn.chatgpt.com/docs/plugins",
    },
  ],
};

const briefingNarratives = {
  project: {
    headline: "Open a local project in Codex",
    definition: "Projects give Codex the code, tools, and context it needs for a task. Local projects work with the files and tools on your computer. Remote projects use a folder on a connected machine. This training uses Local to inspect a repository, run commands, and change code.",
    foundation: "A project keeps the relevant code, Git history, tools, and conversations together. Local projects give Codex access to a selected repository on your computer; Remote projects use a connected machine. A read-only onboarding conversation helps you understand the architecture before asking for changes. Selecting a project does not edit files, run a model request, or connect external tools.",
    keyDistinction: "Local projects work with files on your computer. Remote projects work on a connected machine.",
    value: "Creating a project gives Codex the right working environment and keeps related conversations organized.",
    mechanisms: [
      { title: "Choosing a project type", copy: "Choose Local for files on your computer, or Remote for a connected machine. This training uses Local: start a project and add the repository as a source folder." },
      { title: "Seeing your project and branch", copy: "Codex shows the selected project, execution environment, and current Git branch before any work begins." },
      { title: "Getting context", copy: "Ask Codex to analyze the repository and show a visualization of how its main components fit together." },
    ],
    boundary: "The folder picker offers only the prepared Blossom Bank project. Your own folders, accounts, and original repository stay untouched.",
    scenarioTitle: "Start in the right Blossom Bank project",
    scenario: "You are joining the engineering team at Blossom Bank to improve its online-banking experience. Start a new project, keep Local selected, and choose Next. Add the Blossom Bank folder and create the project. In the open conversation, ask Codex to analyze the repository and show a visualization of its architecture. You will connect Linear and find your assignment in the next lesson.",
    next: "Create a local project and ask Codex for a visual overview of the repository in the open conversation.",
  },
  connect: {
    headline: "Connect Codex to your tools",
    definition: "Codex can work with the tools you already use through plugins. A plugin may include connected apps and reusable skills. Apps give Codex permission to use a specific service, while skills explain how to carry out a task in the way your team expects.",
    foundation: "Plugins can connect Codex to Linear, GitHub, Gmail, and other tools. A skill is a reusable set of instructions, such as how your team writes pull requests or when to update a ticket. Each app keeps its own permissions. In a prompt, @ selects a plugin and $ calls a skill. Codex can also choose relevant skills automatically.",
    keyDistinction: "Connected apps control access to external tools and data. Skills provide reusable instructions, but they cannot grant account access or change an app’s permissions.",
    value: "Plugins and skills bring the tools and habits you already use into one Codex conversation.",
    mechanisms: [
      { title: "GitHub and team standards", copy: "A GitHub plugin can access repositories, while a skill helps Codex write pull requests that follow your team’s engineering standards." },
      { title: "Gmail and your own voice", copy: "A Gmail plugin can read approved messages, while a skill helps Codex draft email in your usual voice and style." },
      { title: "Linear and project updates", copy: "A Linear plugin can find project tickets, while a skill explains when and how your team updates those tickets." },
    ],
    boundary: "Linear uses prepared, read-only course data. No real Linear account is connected, and your accounts, data, and permissions stay unchanged.",
    scenarioTitle: "Your team keeps its work in Linear",
    scenario: "Imagine you’re an engineer at Blossom Bank working on its online-banking website. Your team uses Slack to talk, Linear to track work, and GitHub to review code. You need to find your first assignment. Connect Linear, then ask Codex to search Linear for the highest-priority business or engineering issue assigned to you.",
    next: "Connect Linear, then ask Codex to find your Linear ticket.",
  },
  ticket: {
    headline: "Prepare the repo and feature branch",
    definition: "The Environment sidebar shows where Codex is working, which Git branch is active, and whether any files have changed. These details help you check the project’s starting point before asking Codex to prepare a feature branch or begin editing code.",
    foundation: "Environment shows whether the task is running locally, the current branch, and the number of changed lines. Select staging as the starting point, then create a feat/ branch to keep your change separate from that base branch.",
    keyDistinction: "Opening Environment and inspecting the branch dropdown do not change the repository. Creating a feature branch takes a separate request to Codex.",
    value: "A quick look at Environment helps you start from the right branch with a clean working tree.",
    mechanisms: [
      { title: "Where the task runs", copy: "Environment shows whether Codex is working locally so you know where the task will run." },
      { title: "Your branch and changes", copy: "The branch name and Changes count show where you are working and whether files already have edits." },
      { title: "Preparing a feature branch", copy: "Codex can check the local repository and create a feature branch when you ask." },
    ],
    boundary: "The project uses a real isolated copy of the source repository. Git and feature-branch changes stay inside that training workspace; no remote branch is published.",
    scenarioTitle: "Start ENG-248 from a clean branch",
    scenario: "You found ENG-248 and learned that Blossom Bank needs a shorter homepage heading. Open Environment and inspect the available branches. Select staging, then ask Codex to check the working tree and create feat/eng-248-homepage-heading from staging. Confirm that the new branch appears in the sidebar.",
    next: "Open Environment, select staging, then ask Codex to create a feat/ branch from it.",
  },
  build: {
    headline: "Make the code change",
    definition: "Codex can follow a focused request, make a minimal first change, and then revise it from an attached line comment. Review keeps the real Git diff beside the conversation so you can inspect the exact heading before requesting the final wording.",
    foundation: "When you send the implementation request, Codex first updates the homepage heading and its test in the isolated project. Open Review to inspect that real diff, add the required comment on the changed heading line, then send the attachment so Codex can make the final revision.",
    keyDistinction: "Sending the implementation prompt starts the first change. The attached line comment asks for a revision.",
    value: "The two-pass workflow lets you inspect a concrete change and give precise feedback before the final heading is saved.",
    mechanisms: [
      { title: "Starting the first revision", copy: `Codex first changes the #hero-title heading to “${FIRST_HOMEPAGE_HEADING}” and updates the focused test.` },
      { title: "Inspecting the real diff", copy: "Review shows the added and removed lines so you can inspect the first heading change before requesting a revision." },
      { title: "Requesting the final wording", copy: "Attach the exact line comment, then use the main Send arrow to ask Codex for the final homepage heading." },
    ],
    boundary: "When you ask it to implement the change, Codex edits a separate copy of the real Blossom Bank source. Your original checkout and external accounts stay untouched.",
    scenarioTitle: "Review the first homepage heading",
    scenario: `Your feature branch is ready. Ask Codex for the minimal heading change, then open Review to inspect the real first change to “${FIRST_HOMEPAGE_HEADING}”. Add the exact comment “${REQUIRED_HOMEPAGE_REVIEW_COMMENT}” on the changed heading line and send its attachment so Codex can make the final revision.`,
    next: "Request the minimal change, inspect the real diff, add the required comment, then send it to Codex.",
  },
  test: {
    headline: "Verify the finished experience",
    definition: "Review your change in a fresh conversation, run tests, and check the visible result.",
    foundation: "A new thread shares the project files without inheriting the implementation conversation. Use /review to compare against staging, then ask Codex to run tests and report results.",
    keyDistinction: "Code review, tests, and inspecting the preview check different parts of the result.",
    value: "Confirm both the code and the experience before sharing the change.",
    mechanisms: [
      { title: "Start fresh", copy: "Create a new thread in the same project." },
      { title: "Review against staging", copy: "Use /review and select staging under Review against a base branch." },
      { title: "Run tests", copy: "Ask Codex to run tests and report results." },
      { title: "Inspect the preview", copy: "Ask Codex to run Blossom Bank locally, then open the preview in the in-app browser and confirm the heading." },
    ],
    boundary: "The review and checks use the isolated training workspace. The staged preview shows its saved final heading.",
    scenarioTitle: "Confirm the final homepage heading",
    scenario: "Create a new thread, review the change against staging, run tests, and inspect the staged Blossom Bank preview.",
    next: "Start a new thread to verify the change.",
  },
  pr: {
    headline: "Share the change with your team",
    definition: "Create a pull request from the final diff, then share its link in Slack.",
    foundation: "Codex uses the project branch, final diff, and linked ticket to describe the change. A Slack plugin connection lets you ask it to share the result with the team.",
    keyDistinction: "You can ask Codex to create pull requests and post on your behalf through connectors.",
    value: "Give your teammates the context they need to review your change.",
    mechanisms: [
      { title: "Create a pull request", copy: "Ask Codex to summarize the change and link ENG-248." },
      { title: "Connect Slack", copy: "Open Plugins, install Slack, and return to your conversation." },
      { title: "Share the link", copy: "Ask Codex to post the pull request link in #blossom-bank-eng." },
    ],
    boundary: "This practice uses prepared GitHub and Slack results. No real pull request or Slack message is published.",
    scenarioTitle: "Send ENG-248 for review",
    scenario: "Your change is verified. Create a pull request, connect Slack, and share the link with the Blossom Bank engineering team.",
    next: "Ask Codex to create a pull request.",
  },
};

const saved = readSavedState();
const state = {
  completed: new Set(saved.completed),
  prompts: saved.prompts,
  conversations: saved.conversations,
  diffComments: saved.diffComments,
  taskProgress: saved.taskProgress,
  homepageBuildProgressVersion: saved.homepageBuildProgressVersion || 0,
  linearConnected: saved.linearConnected,
  slackConnected: saved.slackConnected === true,
  verificationThreadCreated: saved.verificationThreadCreated === true,
  selectedCodexThread: "",
  reviewCommandMenu: "",
  practiceTicketExpanded: false,
  practiceScenarioDismissed: saved.practiceScenarioDismissed === true,
  linearScenarioDismissed: saved.linearScenarioDismissed === true,
  ticketEnvironmentOpenedByLearner: saved.ticketEnvironmentOpenedByLearner === true,
  ticketBranchesInspectedByLearner: saved.ticketBranchesInspectedByLearner === true,
  ticketStagingSelectedByLearner: saved.ticketStagingSelectedByLearner === true,
  activeDiffComment: null,
  reviewCommentsAttachmentOpen: false,
  currentIndex: 0,
  phase: location.hash.endsWith("/practice") ? "practice" : "brief",
  practiceThreadScrollRoute: "",
  pendingPracticeThreadScroll: "",
  hintsOpen: false,
  learnMoreOpen: false,
  completionVisible: false,
  tasksOpen: true,
  expandedPracticeTask: null,
  stepMenuOpen: false,
  restartDialogOpen: false,
  selectedFile: defaultFile,
  sourceCitation: null,
  repoPaneTab: ["files", "review", "browser", "plan"].includes(saved.repositoryPaneTab)
    ? saved.repositoryPaneTab
    : "files",
  repoSelectedPath: defaultFile,
  repoExpandedFolders: new Set(["src", "src/features", "src/features/accounts"]),
  selectedDiff: modifiedFiles[0],
  activeTab: saved.repositoryPaneOpen === true
    ? saved.repositoryPaneTab === "review" ? "diff" : saved.repositoryPaneTab || "files"
    : "artifact",
  fallbackPluginsOpen: false,
  inspectorOpen: saved.repositoryPaneOpen === true,
  environmentOpen: false,
  branchPickerOpen: false,
  branchPickerQuery: "",
  branchSwitching: false,
  repositoryPaneOpen: saved.repositoryPaneOpen === true,
  repositoryPaneResizeRestoreTab: "",
  repositoryPaneResponsiveNarrow: null,
  mobileView: "lesson",
  planMode: false,
  planPanelOpen: false,
  planImplementationChoice: "",
  planImplementationRequestFocused: false,
  composerMode: "agent",
  modeMenuOpen: false,
  modeMenuAnchor: { x: 0, y: 0 },
  isRunning: false,
  pendingConversation: null,
  codexSessionId: saved.codexSessionId || "",
  workspaceSnapshot: null,
  activeStagedPreview: null,
  projectCreationStarted: false,
  projectCreationStage: "",
  projectType: "local",
  projectSelecting: false,
  projectName: "",
  projectNameError: "",
  projectDisplayName: saved.projectDisplayName || "Blossom Bank",
  projectSourceSelected: false,
  projectPanelPickerOpen: false,
  verificationResult: saved.verificationResult || null,
  codexModel: "",
  codexReasoningEffort: "",
  planDraftReady: saved.planDraftReady,
  planApproved: saved.planApproved,
  prPublishing: false,
  menuOpen: false,
  theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  searchOpen: false,
  searchQuery: "",
  docsAgentOpen: false,
  docsAgentMessages: [],
  docsAgentSessionId: "",
  docsAgentPending: false,
  docsAgentError: "",
  docsAgentRequestId: 0,
  hostedPreviewForced: typeof location.search === "string"
    && /(?:^\?|&)preview=1(?:&|$)/.test(location.search),
  hostedRuntimeCandidate: typeof location.hostname === "string"
    && /^[a-z0-9][a-z0-9-]*\.app\.openai\.org$/i.test(location.hostname),
  hostedPreview: window.__CODEX_TRAINING_EMBEDDED__ !== true && ((typeof location.hostname === "string"
    && Boolean(location.hostname)
    && !/^(?:localhost|127(?:\.\d{1,3}){3}|\[?::1\]?)$/i.test(location.hostname))
    || (typeof location.search === "string" && /(?:^\?|&)preview=1(?:&|$)/.test(location.search))),
  hostedPreviewReason: "Interactive practice requires the local version of this training.",
  hostedPreviewInstructionsOpen: false,
  hostedPreviewInstructionsCopied: false,
  validationMessage: "",
  courseCueSeen: new Set(),
  restoredPublishedThreadScrollPending: saved.completed.includes("pr")
    && Array.isArray(saved.conversations?.pr)
    && saved.conversations.pr.some((entry) => entry?.publicationPhase === "published"),
};

if (state.hostedPreview === true
  && (state.hostedPreviewForced === true || state.hostedRuntimeCandidate !== true)) {
  let previewInstructionsSeen = false;
  try {
    previewInstructionsSeen = localStorage.getItem(HOSTED_PREVIEW_SEEN_KEY) === "true";
  } catch {
    // Storage may be unavailable in a private or restricted browsing context.
  }
  state.hostedPreviewInstructionsOpen = !previewInstructionsSeen;
}

let codexWorkspaceBootstrap = null;
let codexCourseCueTimer = null;
let hostedRuntimeStatusPromise = null;

function applyTheme(theme, options = {}) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const root = document.documentElement;

  state.theme = nextTheme;
  root.dataset.theme = nextTheme;
  root.classList.toggle("dark", nextTheme === "dark");
  root.style.colorScheme = nextTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    nextTheme === "dark" ? "#000000" : "#ffffff",
  );

  if (options.persist !== false && window.__CODEX_TRAINING_EMBEDDED__ !== true) {
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // Theme changes still work when browser storage is unavailable.
    }
  }

  const nativeRoot = app.querySelector?.('.codex-mini-host[data-codex-mini="ready"]')?.firstElementChild;
  const nativeApp = nativeRoot?.shadowRoot?.querySelector?.(".codex-mini");
  for (const surface of [nativeRoot, nativeApp]) {
    surface?.classList.toggle("dark", nextTheme === "dark");
    surface?.classList.toggle("light", nextTheme === "light");
  }

  return nextTheme;
}

function watchSystemTheme() {
  if (typeof window.matchMedia !== "function") return;

  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  preference.addEventListener?.("change", (event) => {
    let storedTheme = null;

    try {
      storedTheme = localStorage.getItem("theme");
    } catch {
      // Follow the system when the browser cannot retain a manual preference.
    }

    if (storedTheme === "light" || storedTheme === "dark") return;
    applyTheme(event.matches ? "dark" : "light", { persist: false });
  });
}

function watchWebsiteTheme() {
  let websiteRoot = null;

  try {
    websiteRoot = window.parent.document.documentElement;
  } catch {
    return;
  }

  if (!websiteRoot || websiteRoot === document.documentElement) return;

  const updateTheme = () => applyTheme(
    websiteRoot.dataset.theme === "dark" || websiteRoot.classList.contains("dark")
      ? "dark"
      : "light",
    { persist: false },
  );

  updateTheme();

  if (typeof MutationObserver === "function") {
    const observer = new MutationObserver(updateTheme);
    observer.observe(websiteRoot, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
}

function readSavedState() {
  try {
    const currentStorage = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(currentStorage || "{}");
    const restoredPublicationResponse = () => typeof trainingPullRequestResponse === "function"
      ? trainingPullRequestResponse()
      : `Created [PR #${COURSE.pullRequest.number}](${COURSE.pullRequest.url}).`;
    const validIds = new Set(STEPS.map((step) => step.id));
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((id) => validIds.has(id))
      : [];
    const prompts = parsed.prompts && typeof parsed.prompts === "object" && !Array.isArray(parsed.prompts)
      ? Object.fromEntries(
        Object.entries(parsed.prompts).filter(([stepId, prompt]) => validIds.has(stepId) && typeof prompt === "string"),
      )
      : {};
    const storedConversations = parsed.conversations && typeof parsed.conversations === "object" && !Array.isArray(parsed.conversations)
      ? parsed.conversations
      : {};
    const completedSteps = new Set(completed);
    if (parsed.verificationProgressVersion !== VERIFICATION_PROGRESS_VERSION) {
      for (const id of ["test", "pr"]) {
        completedSteps.delete(id);
        const index = completed.indexOf(id);
        if (index >= 0) completed.splice(index, 1);
      }
    }
    if (!completedSteps.has("pr")) delete prompts.pr;
    const linearConnected = parsed.linearConnected === true || parsed.jiraConnected === true || completedSteps.has("connect");
    const taskProgress =
      parsed.taskProgress &&
      typeof parsed.taskProgress === "object" &&
      !Array.isArray(parsed.taskProgress)
        ? Object.fromEntries(
          Object.entries(parsed.taskProgress).filter(
            ([stepId, count]) =>
              validIds.has(stepId) &&
              !completedSteps.has(stepId) &&
              Number.isSafeInteger(count) &&
              count >= 1 &&
              count < (practiceGuides[stepId]?.tasks?.length || 1),
          ),
        )
        : {};

    if (!linearConnected && taskProgress.connect === 2) {
      taskProgress.connect = 1;
    } else if (linearConnected && !completedSteps.has("connect")) {
      taskProgress.connect = 2;
    }
    let ticketEnvironmentOpenedByLearner = parsed.ticketEnvironmentOpenedByLearner === true
      && (taskProgress.ticket || 0) >= 1;
    let ticketBranchesInspectedByLearner = parsed.ticketBranchesInspectedByLearner === true
      && ticketEnvironmentOpenedByLearner
      && (taskProgress.ticket || 0) >= 2;
    if (completedSteps.has("ticket")) {
      ticketEnvironmentOpenedByLearner = true;
      ticketBranchesInspectedByLearner = true;
    } else if ((taskProgress.ticket || 0) >= 2 && !ticketBranchesInspectedByLearner) {
      ticketEnvironmentOpenedByLearner = true;
      taskProgress.ticket = 1;
    } else if (taskProgress.ticket === 1 && !ticketEnvironmentOpenedByLearner) {
      delete taskProgress.ticket;
    }
    const ticketStagingSelectedByLearner = completedSteps.has("ticket")
      || (parsed.ticketStagingSelectedByLearner === true && (taskProgress.ticket || 0) >= 3);
    if (!completedSteps.has("ticket") && (taskProgress.ticket || 0) >= 3 && !ticketStagingSelectedByLearner) {
      taskProgress.ticket = 2;
    }
    const conversations = {};
    const validSession = (id) => typeof id === "string"
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const restoredWorkspaceSession = validSession(parsed.codexSessionId)
      || Object.values(parsed.workspace?.lessons || {}).some((workspace) => validSession(workspace?.sessionId));
    const diffComments = (completedSteps.has("build") || (taskProgress.build || 0) >= 2)
      && Array.isArray(parsed.diffComments)
      ? parsed.diffComments
        .slice(0, 16)
        .filter((comment) => comment && typeof comment === "object"
          && restoredWorkspaceSession
          && typeof comment.id === "string" && comment.id
          && typeof comment.path === "string"
          && (modifiedFiles.includes(comment.path)
            || (restoredWorkspaceSession
              && comment.path.length <= 512
              && !comment.path.startsWith("/")
              && !/[\\\u0000-\u001f]/.test(comment.path)
              && comment.path.split("/").every((part) =>
                part && part !== "." && part !== ".." && !part.startsWith(".") && part !== "node_modules")))
          && Number.isSafeInteger(comment.line) && comment.line > 0
          && ["new", "old"].includes(comment.side)
          && typeof comment.text === "string" && comment.text.trim() && comment.text.trim().length <= 2_000
          && (comment.startLine === undefined
            || (Number.isSafeInteger(comment.startLine) && comment.startLine > 0))
          && (comment.startSide === undefined || ["new", "old"].includes(comment.startSide))
          && (comment.diffHunk === undefined
            || (typeof comment.diffHunk === "string" && comment.diffHunk.length <= 16_000))
          && validIds.has(comment.stepId))
        .map((comment) => ({
          id: comment.id,
          path: comment.path,
          line: comment.line,
          side: comment.side,
          text: comment.text.trim(),
          stepId: comment.stepId,
          createdAt: typeof comment.createdAt === "string" ? comment.createdAt : "",
          ...(restoredWorkspaceSession
            && comment.sessionId === (parsed.workspace?.lessons?.build?.sessionId || parsed.codexSessionId)
            && Number.isSafeInteger(comment.revision)
            && comment.revision >= 0
            ? { sessionId: comment.sessionId, revision: comment.revision }
            : {}),
          ...(Number.isSafeInteger(comment.startLine) && comment.startLine > 0
            ? { startLine: comment.startLine }
            : {}),
          ...(["new", "old"].includes(comment.startSide) ? { startSide: comment.startSide } : {}),
          ...(typeof comment.diffHunk === "string" && comment.diffHunk.startsWith("@@ ")
            ? { diffHunk: comment.diffHunk }
            : {}),
        }))
      : [];

    // Refresh only known prepared Build copy, preserving other saved responses.
    const previousBuildResponse = "Implemented the first heading revision in the isolated workspace.";
    const previousBuildResponses = new Set([
      previousBuildResponse,
      `${previousBuildResponse} Open Review, add “${REQUIRED_HOMEPAGE_REVIEW_COMMENT}” to the changed heading line, and send it to Codex for the final revision.`,
    ]);
    const previousAssistantResponses = new Map([
      [
        "Here’s a visual overview of Blossom Bank’s React frontend. App.tsx brings together the homepage, navigation, account-opening flow, and shared content. App.test.tsx covers the user-facing behavior. This map is based on the prepared repository and its imports; no files were changed.",
        STEPS.find((step) => step.id === "project").assistantResponse,
      ],
      [
        "I reviewed the homepage heading change against staging. No issues found in the prepared diff.",
        STEPS.find((step) => step.id === "test").assistantResponse,
      ],
      [
        "I reviewed the homepage-heading change against staging. No issues found in the prepared diff. The final heading and its focused test agree.",
        STEPS.find((step) => step.id === "test").assistantResponse,
      ],
      [
        "Reviewed the final source and diff. Prepared homepage-heading coverage and TypeScript checks passed. Open the staged Blossom Bank preview to inspect the finished heading.",
        "Homepage-heading coverage and TypeScript checks passed.",
      ],
      [
        "Prepared homepage-heading coverage and TypeScript checks passed.",
        "Homepage-heading coverage and TypeScript checks passed.",
      ],
      [
        "Blossom Bank is ready to preview. In this exercise, the prepared preview represents the locally running app.",
        "Blossom Bank is ready to preview. Open it in the browser to check the updated heading.",
      ],
      [
        "Blossom Bank’s source files and approved edits are real. Linear and pull-request publishing use prepared course data, and the staged preview reads only the approved final heading from the workspace.",
        "I can inspect the Blossom Bank source, make the changes you request, and help you review the diff and test results. I only publish a pull request or send a message when you ask.",
      ],
    ]);
    for (const published of [false, true]) {
      const previousStatus = published
        ? "Training pull request #184 is prepared in this course; GitHub is unchanged."
        : "Ask Codex to publish the training pull request after Build and Verify are complete.";
      const status = published
        ? `Created [PR #${COURSE.pullRequest.number}](${COURSE.pullRequest.url}).`
        : "Ask me to create the pull request after implementing and verifying the change.";
      for (const verification of ["includes", "will include"]) {
        const details = ` Its title is \`${COURSE.pullRequest.title}\`. It links ENG-248, targets \`${COURSE.pullRequest.base}\` from \`${COURSE.pullRequest.branch}\`, and ${verification} the final source and diff review.`;
        previousAssistantResponses.set(previousStatus + details, status + details);
      }
    }
    const previousVerificationOutputs = new Map([
      ["Prepared homepage-heading coverage passed.", "Homepage-heading coverage passed."],
      ["Prepared TypeScript checks passed.", "TypeScript checks passed."],
    ]);
    const restoreVerificationCopy = (result) => !Array.isArray(result?.checks) ? result : {
      ...result,
      checks: result.checks.map((check) => {
        const output = previousVerificationOutputs.get(check?.output);
        return output ? { ...check, output } : check;
      }),
    };
    for (const step of STEPS) {
      const lessonSession = parsed.workspace?.lessons?.[step.id]?.sessionId || parsed.codexSessionId;
      if (step.id === "pr") {
        if (!completedSteps.has("pr") && !(taskProgress.pr >= 1)) continue;
        const published = Array.isArray(storedConversations.pr)
          ? storedConversations.pr.find((entry) => entry && typeof entry === "object"
            && entry.publicationPhase === "published"
            && typeof entry.prompt === "string"
            && typeof entry.response === "string"
            && entry.response.trim())
          : null;
        conversations.pr = [{
          id: typeof published?.id === "string" && published.id
            ? published.id
            : "pr-training-publication",
          prompt: step.prompt,
          response: restoredPublicationResponse(),
          guided: true,
          publicationPhase: "published",
        }];
        const shared = Array.isArray(storedConversations.pr)
          ? storedConversations.pr.find((entry) => entry?.publicationPhase === "shared"
            && typeof entry.prompt === "string" && typeof entry.response === "string") : null;
        if (shared && completedSteps.has("pr")) conversations.pr.push({
          id: "pr-team-share", prompt: shared.prompt.slice(0, 4000),
          response: shared.response.startsWith("Shared in #blossom-bank-eng (training):")
            && typeof trainingSlackResponse === "function"
            ? trainingSlackResponse() : shared.response.slice(0, 4000),
          guided: true, publicationPhase: "shared",
        });
        continue;
      }
      const entries = Array.isArray(storedConversations[step.id])
        ? storedConversations[step.id]
          .filter((entry) => entry && typeof entry === "object" && typeof entry.prompt === "string"
            && typeof entry.response === "string"
            && (entry.prompt.trim()
              || (Array.isArray(entry.reviewComments)
                && entry.reviewComments.some((comment) => reviewCommentSnapshot(comment))))
            && entry.publicationPhase !== "published"
            && (step.id !== "test" || typeof containsUnsafeVerificationText !== "function"
              || !containsUnsafeVerificationText(entry.response)))
          .map((entry, index) => {
            const reviewComments = Array.isArray(entry.reviewComments)
              ? entry.reviewComments.slice(0, 16).map(reviewCommentSnapshot).filter(Boolean)
              : [];
            const storedPreview = step.id === "test"
              && restoredWorkspaceSession
              && entry.stagedPreview && typeof entry.stagedPreview === "object"
              && !Array.isArray(entry.stagedPreview)
              && Object.keys(entry.stagedPreview).sort().join(",") === "kind,label,path,revision,sessionId"
              && entry.stagedPreview.kind === "staged-workspace"
              && entry.stagedPreview.sessionId === lessonSession
              && Number.isSafeInteger(entry.stagedPreview.revision)
              && entry.stagedPreview.revision >= 1
              && entry.stagedPreview.path === stagedPreviewPath(
                entry.stagedPreview.sessionId,
                entry.stagedPreview.revision,
              )
              && entry.stagedPreview.label === "Open the staged Blossom Bank preview"
              ? { ...entry.stagedPreview }
              : null;
            return {
              id: typeof entry.id === "string" && entry.id ? entry.id : `${step.id}-saved-${index}`,
              prompt: entry.prompt,
              response: step.id === "build" && entry.guided === true && previousBuildResponses.has(entry.response)
                ? step.assistantResponse
                : step.id === "pr" && entry.response.startsWith("Shared in #blossom-bank-eng (training):")
                  && typeof trainingSlackResponse === "function"
                  ? trainingSlackResponse()
                : previousAssistantResponses.get(entry.response) || entry.response,
              guided: entry.guided === true,
              ...(reviewComments.length ? {
                reviewComments,
                commentOnly: entry.commentOnly === true && !entry.prompt.trim(),
              } : {}),
              ...(Number.isSafeInteger(entry.workedSeconds)
                && entry.workedSeconds >= 1
                && entry.workedSeconds <= 3_600
                ? { workedSeconds: entry.workedSeconds }
                : {}),
              ...(typeof verifiedCodexWorkedActivities === "function"
                && verifiedCodexWorkedActivities(entry.workActivities).length
                ? { workActivities: verifiedCodexWorkedActivities(entry.workActivities) }
                : {}),
              ...(entry.verification && typeof entry.verification === "object"
                && entry.verification.sessionId === lessonSession
                && JSON.stringify(entry.verification).length <= 32_000
                ? { verification: restoreVerificationCopy(entry.verification) }
                : {}),
              ...(storedPreview ? { stagedPreview: storedPreview } : {}),
              ...(step.id === "ticket"
                && typeof verifiedCodexBranchCommandExecutions === "function"
                && verifiedCodexBranchCommandExecutions(entry.commandExecutions)
                ? { commandExecutions: verifiedCodexBranchCommandExecutions(entry.commandExecutions) }
                : {}),
            };
          })
        : [];

      if (entries.length) {
        conversations[step.id] = entries;
        continue;
      }

      if (!completedSteps.has(step.id)) continue;

      conversations[step.id] = [{
        id: `${step.id}-legacy-guided`,
        prompt: step.prompt,
        response: step.assistantResponse,
        guided: true,
      }];

      const previousPrompt = prompts[step.id]?.trim();
      if (previousPrompt && previousPrompt !== step.prompt.trim()) {
        conversations[step.id].push({
          id: `${step.id}-legacy-followup`,
          prompt: previousPrompt,
          response: getSandboxResponse(step, previousPrompt, completedSteps),
          guided: false,
        });
      }
    }

    const homepageBuildProgressVersion = parsed.homepageBuildProgressVersion === 1 ? 1 : 0;
    const planApproved = false;
    const planDraftReady = false;
    if (parsed.projectOnboardingVersion !== 1 && !completedSteps.has("project")) {
      taskProgress.project = Math.min(taskProgress.project || 0, 2);
    }
    const verificationThreadCreated = parsed.verificationThreadCreated === true
      || completedSteps.has("test")
      || (parsed.verifyThreadVersion !== 1 && (taskProgress.test || 0) > 0);
    if (parsed.verifyThreadVersion !== 1 && (taskProgress.test || 0) > 0) {
      taskProgress.test = Math.min(taskProgress.test + 1, 3);
    }
    const restored = {
      verificationThreadCreated,
      slackConnected: parsed.slackConnected === true || completedSteps.has("pr"),
      practiceScenarioDismissed: parsed.practiceScenarioDismissed === true,
      linearScenarioDismissed: parsed.linearScenarioDismissed === true,
      completed,
      currentStepId: ["understand", "plan"].includes(parsed.currentStepId) ? "build"
        : validIds.has(parsed.currentStepId) ? parsed.currentStepId : null,
      prompts,
      conversations,
      diffComments,
      taskProgress,
      homepageBuildProgressVersion,
      linearConnected,
      ticketEnvironmentOpenedByLearner,
      ticketBranchesInspectedByLearner,
      ticketStagingSelectedByLearner,
      projectDisplayName: typeof parsed.projectDisplayName === "string"
        && parsed.projectDisplayName.trim()
        && parsed.projectDisplayName.length <= 120
        && !/[\u0000-\u001f\u007f]/.test(parsed.projectDisplayName)
        ? parsed.projectDisplayName.trim()
        : "Blossom Bank",
      codexSessionId: typeof parsed.codexSessionId === "string"
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.codexSessionId)
        ? parsed.codexSessionId
        : "",
      verificationResult: parsed.verificationResult && typeof parsed.verificationResult === "object"
        && parsed.verificationResult.sessionId === parsed.codexSessionId
        && JSON.stringify(parsed.verificationResult).length <= 32_000
        ? restoreVerificationCopy(parsed.verificationResult)
        : null,
      planDraftReady,
      planApproved,
      repositoryPaneOpen: parsed.repositoryPaneOpen === true,
      repositoryPaneTab: ["files", "review", "browser", "plan"].includes(parsed.repositoryPaneTab)
        ? parsed.repositoryPaneTab
        : "files",
    };

    return restored;
  } catch {
    return {
      completed: [],
      currentStepId: null,
      prompts: {},
      conversations: {},
      diffComments: [],
      taskProgress: {},
      homepageBuildProgressVersion: 0,
      linearConnected: false,
      ticketEnvironmentOpenedByLearner: false,
      ticketBranchesInspectedByLearner: false,
      ticketStagingSelectedByLearner: false,
      projectDisplayName: "Blossom Bank",
      codexSessionId: "",
      verificationResult: null,
      planDraftReady: false,
      planApproved: false,
      repositoryPaneOpen: false,
      repositoryPaneTab: "files",
    };
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        independentLessonsVersion: 1,
        projectOnboardingVersion: 1,
        practiceScenarioDismissed: state.practiceScenarioDismissed === true,
        linearScenarioDismissed: state.linearScenarioDismissed === true,
        completed: [...state.completed],
        currentStepId: STEPS[state.currentIndex]?.id,
        ...(window.__CODEX_TRAINING_RUNTIME__?.getState
          ? { workspace: window.__CODEX_TRAINING_RUNTIME__.getState() }
          : {}),
        prompts: state.prompts,
        conversations: state.conversations,
        diffComments: state.diffComments,
        taskProgress: state.taskProgress,
        homepageBuildProgressVersion: state.homepageBuildProgressVersion === 1 ? 1 : 0,
        verificationProgressVersion: VERIFICATION_PROGRESS_VERSION,
        verifyThreadVersion: 1,
        verificationThreadCreated: state.verificationThreadCreated === true,
        slackConnected: state.slackConnected === true,
        linearConnected: state.linearConnected === true,
        ticketEnvironmentOpenedByLearner: state.ticketEnvironmentOpenedByLearner === true,
        ticketBranchesInspectedByLearner: state.ticketBranchesInspectedByLearner === true,
        ticketStagingSelectedByLearner: state.ticketStagingSelectedByLearner === true,
        projectDisplayName: typeof state.projectDisplayName === "string"
          && state.projectDisplayName.trim()
          && state.projectDisplayName.length <= 120
          && !/[\u0000-\u001f\u007f]/.test(state.projectDisplayName)
          ? state.projectDisplayName.trim()
          : "Blossom Bank",
        codexSessionId: typeof state.codexSessionId === "string"
          && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(state.codexSessionId)
          ? state.codexSessionId
          : "",
        verificationResult: state.verificationResult || null,
        planDraftReady: state.planDraftReady === true,
        planApproved: state.planApproved === true,
        repositoryPaneOpen: state.repositoryPaneOpen === true,
        repositoryPaneTab: ["files", "review", "browser", "plan"].includes(state.repoPaneTab)
          ? state.repoPaneTab
          : "files",
      }),
    );
  } catch {
    // The lesson still works when browser storage is unavailable.
  }
  trainingAnalytics?.update(trainingAnalyticsSnapshot());
}

function getSandboxResponse(step, prompt, completedSteps = state.completed) {
  const question = prompt.trim().toLowerCase();
  const workspace = typeof state !== "undefined" && typeof verifiedCodexWorkspace === "function"
    ? verifiedCodexWorkspace()
    : null;
  const changedFiles = workspace ? workspace.changedFiles : modifiedFiles.map((path) => ({ path }));
  const files = changedFiles.map(({ path }) => `\`${path}\``).join(", ");

  if (question === step.prompt.trim().toLowerCase()) return step.assistantResponse;

  if (/\b(accessib(?:ility|le)?|a11y|screen.?readers?|keyboard|aria|role=|polite|assertive)\b/.test(question)) {
    return `Keep the existing #hero-title structure and navigation behavior intact. The focused heading change belongs in \`src/App.tsx\`, with its final text covered in \`src/App.test.tsx\`.`;
  }

  const asksAboutPullRequest = /\b(pull request|\bpr\b|publish|ship|draft)\b/.test(question);
  if (!asksAboutPullRequest && /\b(git(?:hub)?|origin(?:\/main)?|fetch|pull|refresh|sync|checkout|check out|switch|branch|working tree)\b/.test(question)) {
    if (completedSteps.has("ticket")) {
      return `The working tree is clean, and the current local feature branch is \`${COURSE.repository.workingBranch}\`.`;
    }
    return `The repository is on local \`${COURSE.repository.defaultBranch}\`. Check the working tree, then create and switch to \`${COURSE.repository.workingBranch}\`.`;
  }

  if (/\b(linear|ticket|issue|eng-248|acceptance|user story|customer)\b/.test(question)) {
    return `ENG-248 asks us to shorten the Blossom Bank homepage heading. Update \`#hero-title\` in \`src/App.tsx\` to \`${FINAL_HOMEPAGE_HEADING}\`, update \`src/App.test.tsx\`, and preserve the existing homepage structure and navigation.`;
  }

  if (/\b(tests?|testing|vitest|verify|verification|type.?check|coverage|boundary|edge cases?)\b/.test(question)) {
    return completedSteps.has("test")
      ? "Codex reviewed the final source and diff without editing files or running project commands. Open the staged Blossom Bank preview from its response to confirm the finished heading."
      : "Ask Codex to review the final source and diff without editing files or running project commands.";
  }

  if (/\b(diff|changed|changes|scope|review)\b/.test(question)) {
    if (!completedSteps.has("build")) return "There are no code changes yet. Ask Codex to implement the approved homepage-heading change, then inspect the Git diff.";
    const totals = workspace ? workspace.totals : reviewDiffTotals();
    return `The Git diff changes ${changedFiles.length} ${changedFiles.length === 1 ? "file" : "files"}: ${files}. It contains +${totals.additions} additions and −${totals.deletions} deletions.`;
  }

  if (/\b(pull request|\bpr\b|branch|github|publish|ship|draft)\b/.test(question)) {
    const status = completedSteps.has("pr")
      ? `Created [PR #${COURSE.pullRequest.number}](${COURSE.pullRequest.url}).`
      : "Ask me to create the pull request after implementing and verifying the change.";
    const verification = completedSteps.has("test")
      ? "includes the final source and diff review"
      : "will include the final source and diff review";
    return `${status} Its title is \`${COURSE.pullRequest.title}\`. It links ENG-248, targets \`${COURSE.pullRequest.base}\` from \`${COURSE.pullRequest.branch}\`, and ${verification}.`;
  }

  if (/\b(plan|approach|strategy|outline|steps?)\b/.test(question)) {
    return `The plan is to inspect \`src/App.tsx\` and \`src/App.test.tsx\`, make the first heading revision, review the real diff, apply the attached comment, and leave the final heading in place. Planning leaves the code unchanged.`;
  }

  if (/\b(repo|repository|codebase|project|stack|architecture|files?|component)\b/.test(question)) {
    const actualFiles = workspace
      ? workspace.files
        .map(({ path }) => path)
        .filter((path) => ["src/components/HeroVisual.tsx", "src/App.tsx", "src/App.test.tsx", "src/styles.css"].includes(path))
        .map((path) => `\`${path}\``)
        .join(", ")
      : files;
    return `Blossom Bank’s \`${COURSE.repo}\` repository uses React and TypeScript. Relevant files include ${actualFiles}. I can inspect them and make changes when you ask.`;
  }

  if (/\b(real|simulat(?:e|ed|ion)?|sandbox|permissions?|external|actual)\b/.test(question)) {
    return "I can inspect the Blossom Bank source, make the changes you request, and help you review the diff and test results. I only publish a pull request or send a message when you ask.";
  }

  if (/\b(heading|headline|hero|homepage|copy|shorten)\b/.test(question)) {
    return `The first heading revision is “${FIRST_HOMEPAGE_HEADING}”. After the exact review comment, the final heading is “${FINAL_HOMEPAGE_HEADING}”.`;
  }

  return `Ask me about ENG-248, the Blossom Bank code, the plan, accessibility, test results, or the pull request.`;
}

function getLiveCodexRequest(step, prompt, options = {}) {
  const history = [];

  for (const lesson of codexConversationSteps(step)) {
    for (const exchange of courseConversations(lesson.id)) {
      const response = lesson.id === "connect" && typeof normalizeLinearIssueMarkdown === "function"
        ? normalizeLinearIssueMarkdown(exchange.response)
        : exchange.response;
      history.push({ role: "user", content: exchange.prompt.slice(0, 4_000) });
      history.push({ role: "assistant", content: response.slice(0, 4_000) });
    }
  }

  const request = {
    prompt: prompt === "/review staging"
      ? "Review the code changes against the base branch staging. Inspect the final source and diff and report any issues."
      : prompt,
    lessonId: state.currentIndex + 1,
    stepId: step.id,
    stage: step.stage,
    mode: state.planMode ? "plan" : state.composerMode || "agent",
    completed: [...state.completed],
    history: history.slice(-16),
  };

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(state.codexSessionId || "")) {
    request.sessionId = state.codexSessionId;
  }

  if (
    options.executionApproved === true
    && step.id === "build"
    && request.mode !== "plan"
    && lessonContextReady("ticket")
  ) {
    request.executionApproved = true;
    if (["initial", "review-comment"].includes(options.implementationPhase)
      && Number.isSafeInteger(options.implementationRevision)
      && options.implementationRevision >= 0) {
      request.implementationPhase = options.implementationPhase;
      request.implementationRevision = options.implementationRevision;
    }
  }
  if (
    options.verificationApproved === true
    && step.id === "test"
    && request.mode !== "plan"
    && lessonContextReady("build")
  ) {
    request.verificationApproved = true;
  }
  if (
    options.branchPreparationApproved === true
    && step.id === "ticket"
    && request.mode !== "plan"
    && state.ticketEnvironmentOpenedByLearner === true
    && state.ticketBranchesInspectedByLearner === true
    && state.ticketStagingSelectedByLearner === true
    && activeCourseBranch() === COURSE.repository.baseBranch
  ) {
    request.branchPreparationApproved = true;
    request.environmentOpenedByLearner = true;
  }
  if (options.stagedPreviewRequested === true
    && step.id === "test"
    && request.mode !== "plan"
    && lessonContextReady("build")) {
    request.stagedPreviewRequested = true;
  }
  if (options.reviewComment) request.reviewComment = options.reviewComment;
  if (Array.isArray(options.reviewComments)) {
    const reviewComments = options.reviewComments.slice(0, 16).flatMap((comment) => {
      if (!comment || typeof comment !== "object"
        || typeof comment.path !== "string" || !comment.path || comment.path.length > 512
        || !Number.isSafeInteger(comment.line) || comment.line < 1
        || !["new", "old"].includes(comment.side)
        || typeof comment.comment !== "string" || !comment.comment.trim()
        || comment.comment.trim().length > 2_000) return [];
      return [{
        path: comment.path,
        line: comment.line,
        side: comment.side,
        comment: comment.comment.trim(),
        ...(Number.isSafeInteger(comment.startLine) && comment.startLine > 0
          ? { startLine: comment.startLine }
          : {}),
        ...(["new", "old"].includes(comment.startSide) ? { startSide: comment.startSide } : {}),
        ...(typeof comment.diffHunk === "string"
          && comment.diffHunk.startsWith("@@ ")
          && comment.diffHunk.length <= 16_000
          ? { diffHunk: comment.diffHunk }
          : {}),
        ...(typeof comment.sessionId === "string"
          && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(comment.sessionId)
          && Number.isSafeInteger(comment.revision) && comment.revision >= 0
          ? { sessionId: comment.sessionId, revision: comment.revision }
          : {}),
      }];
    });
    if (reviewComments.length) request.reviewComments = reviewComments;
  }
  return request;
}

function homepageHeadingPhase(workspace) {
  const source = workspace?.files?.find((file) => file?.path === "src/App.tsx")?.content;
  if (typeof source !== "string") return "invalid";
  if ((source.match(/<h1\b[^>]*\bid=\x22hero-title\x22/g) || []).length !== 1) return "invalid";
  const matches = [...source.matchAll(/<h1 id="hero-title">\s*([\s\S]*?)\s*<\/h1>/g)];
  if (matches.length !== 1) return "invalid";
  const heading = matches[0][1].replace(/\s+/g, " ").trim();
  if (heading === "Banking that sees <span>the bigger picture.</span>") return "original";
  if (heading === FIRST_HOMEPAGE_HEADING) return "first";
  if (heading === FINAL_HOMEPAGE_HEADING) return "final";
  return "invalid";
}

function reconcileHomepageImplementation(pending, workspace = typeof verifiedCodexWorkspace === "function"
  ? verifiedCodexWorkspace()
  : null) {
  if (pending?.stepId !== "build" || pending.executionApproved !== true
    || !["initial", "review-comment"].includes(pending.implementationPhase)
    || !Number.isSafeInteger(pending.implementationRevision)
    || workspace?.sessionId !== state.codexSessionId
    || !Number.isSafeInteger(workspace?.revision)
    || workspace.revision <= pending.implementationRevision) return false;
  const target = pending.implementationPhase === "initial" ? "first" : "final";
  if (homepageHeadingPhase(workspace) !== target) return false;
  if (pending.implementationPhase === "initial") {
    (state.taskProgress ||= {}).build = Math.max(1,
      Number.isSafeInteger(state.taskProgress?.build) ? state.taskProgress.build : 0);
    state.homepageBuildProgressVersion = 1;
    state.expandedPracticeTask = null;
    state.tasksOpen = true;
  } else {
    state.completed.add("build");
    delete state.taskProgress?.build;
    state.diffComments = [];
    state.reviewCommentsAttachmentOpen = false;
  }
  return true;
}

function verifiedCodexWorkspace(snapshot = typeof state === "undefined" ? null : state.workspaceSnapshot) {
  if (!snapshot || typeof snapshot !== "object" || snapshot.verified !== true) return null;
  if (typeof snapshot.sessionId !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(snapshot.sessionId)) return null;
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) return null;
  if (!Array.isArray(snapshot.files) || snapshot.files.length > 256) return null;
  if (!Array.isArray(snapshot.changedFiles) || snapshot.changedFiles.length > snapshot.files.length) return null;
  if (typeof snapshot.patch !== "string" || typeof snapshot.changed !== "boolean") return null;
  if (!snapshot.totals || !Number.isSafeInteger(snapshot.totals.additions)
    || !Number.isSafeInteger(snapshot.totals.deletions)
    || snapshot.totals.additions < 0 || snapshot.totals.deletions < 0) return null;
  if (snapshot.branch !== undefined || snapshot.branches !== undefined) {
    const safeBranch = (branch) => typeof branch === "string"
      && /^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/.test(branch)
      && !branch.includes("..") && !branch.includes("//") && !branch.includes("@{")
      && !branch.endsWith(".") && !branch.endsWith(".lock")
      && branch.split("/").every((segment) => segment && !segment.startsWith("."));
    if (!safeBranch(snapshot.branch)
      || !Array.isArray(snapshot.branches)
      || snapshot.branches.length < 1
      || snapshot.branches.length > 32
      || snapshot.branches.some((branch) => !safeBranch(branch))
      || new Set(snapshot.branches).size !== snapshot.branches.length
      || !snapshot.branches.includes(snapshot.branch)) return null;
  }

  let contentLength = snapshot.patch.length;
  const paths = new Map();
  const validateFile = (file, changed = false) => {
    if (!file || typeof file !== "object" || typeof file.path !== "string"
      || !file.path || file.path.length > 512 || file.path.startsWith("/")
      || /^[A-Za-z]:/.test(file.path) || /[\\\u0000-\u001f]/.test(file.path)) return false;
    const segments = file.path.split("/");
    if (segments.some((segment) => !segment || segment === "." || segment === ".."
      || [".git", ".codex", ".ssh", "node_modules"].includes(segment)
      || segment === ".env" || segment.startsWith(".env."))) return false;
    if (!["unchanged", "modified", "added", "deleted"].includes(file.status)) return false;
    if (changed && file.status === "unchanged") return false;

    for (const key of ["content", "originalContent", "patch"]) {
      if (file[key] === undefined) continue;
      if (typeof file[key] !== "string" || file[key].length > 256_000) return false;
      contentLength += file[key].length;
    }
    for (const key of ["additions", "deletions"]) {
      if (file[key] === undefined) continue;
      if (!Number.isSafeInteger(file[key]) || file[key] < 0 || file[key] > 1_000_000) return false;
    }
    return contentLength <= 768_000;
  };

  for (const file of snapshot.files) {
    if (!validateFile(file) || paths.has(file.path)) return null;
    paths.set(file.path, file);
  }
  const changedPaths = new Set();
  let additions = 0;
  let deletions = 0;
  for (const file of snapshot.changedFiles) {
    if (!validateFile(file, true) || !paths.has(file.path) || changedPaths.has(file.path)) return null;
    const source = paths.get(file.path);
    for (const field of ["status", "content", "originalContent", "patch", "additions", "deletions"]) {
      if (source[field] !== file[field]) return null;
    }
    changedPaths.add(file.path);
    additions += file.additions || 0;
    deletions += file.deletions || 0;
  }
  if (snapshot.files.some((file) => (file.status !== "unchanged") !== changedPaths.has(file.path))) return null;
  if (snapshot.totals.additions !== additions || snapshot.totals.deletions !== deletions) return null;
  const exactPatch = snapshot.changedFiles.map((file) => file.patch || "").join("");
  const separatedPatch = snapshot.changedFiles.map((file) => file.patch || "").join("\n");
  if (snapshot.patch !== exactPatch && snapshot.patch !== separatedPatch) return null;
  if (snapshot.changed !== Boolean(snapshot.changedFiles.length)) return null;
  return snapshot;
}

function verifiedCodexVerification(
  result = typeof state === "undefined" ? null : state.verificationResult,
  { allowFailed = false } = {},
) {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (!workspace || !result || typeof result !== "object" || result.verified !== true
    || result.sessionId !== workspace.sessionId || result.revision !== workspace.revision
    || !Array.isArray(result.checks) || result.checks.length !== 2
    || typeof result.passed !== "boolean") return null;

  const commands = new Map([
    ["focused-tests", "npm test -- --run src/App.test.tsx"],
    ["typecheck", "npm run typecheck"],
  ]);
  const observed = new Set();
  for (const check of result.checks) {
    if (!check || typeof check !== "object" || !commands.has(check.id)
      || observed.has(check.id) || check.command !== commands.get(check.id)
      || !["completed", "failed"].includes(check.status)
      || typeof check.output !== "string" || check.output.length > 12_000
      || check.output.includes("\u0000")
      || containsUnsafeVerificationText(check.output)
      || /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b)/.test(check.output)
      || !Number.isSafeInteger(check.exitCode) || check.exitCode < 0
      || (check.status === "completed") !== (check.exitCode === 0)) return null;
    observed.add(check.id);
  }

  const passed = result.checks.every((check) => check.exitCode === 0);
  if (result.passed !== passed || (!allowFailed && !passed)) return null;
  return result;
}

function codexWorkspaceBrowserPath() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const preview = typeof verifiedStagedPreview === "function"
    ? verifiedStagedPreview(state.activeStagedPreview, workspace)
    : null;
  if (preview) return preview.path;
  return "/training/codex-lab/demos/blossom-bank/index.html";
}

function stagedPreviewPath(sessionId, revision) {
  if (typeof sessionId !== "string"
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
    || !Number.isSafeInteger(revision) || revision < 1) return "";
  return `/training/codex-lab/demos/blossom-bank/index.html?sessionId=${sessionId}&revision=${revision}`;
}

function verifiedStagedPreview(candidate, workspace = typeof verifiedCodexWorkspace === "function"
  ? verifiedCodexWorkspace()
  : null) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)
    || !workspace || workspace.verified !== true
    || candidate.kind !== "staged-workspace"
    || candidate.sessionId !== workspace.sessionId
    || candidate.revision !== workspace.revision
    || candidate.label !== "Open the staged Blossom Bank preview") return null;
  const keys = Object.keys(candidate).sort();
  if (keys.join(",") !== "kind,label,path,revision,sessionId") return null;
  const path = stagedPreviewPath(candidate.sessionId, candidate.revision);
  if (!path || candidate.path !== path) return null;
  if (typeof homepageHeadingPhase === "function" && homepageHeadingPhase(workspace) !== "final") return null;
  const application = Array.isArray(workspace.files)
    ? workspace.files.find((file) => file?.path === "src/App.tsx")?.content
    : "";
  if (typeof application !== "string" || !application.includes(FINAL_HOMEPAGE_HEADING)) return null;
  return {
    kind: "staged-workspace",
    sessionId: candidate.sessionId,
    revision: candidate.revision,
    path,
    label: candidate.label,
  };
}

function invalidateStagedPreviews() {
  state.activeStagedPreview = null;
  for (const exchanges of Object.values(state.conversations || {})) {
    if (!Array.isArray(exchanges)) continue;
    for (const exchange of exchanges) delete exchange.stagedPreview;
  }
}

function renderStagedPreviewAction(candidate, workspace, exchangeId = "") {
  const preview = verifiedStagedPreview(candidate, workspace);
  if (!preview || typeof exchangeId !== "string"
    || !/^[a-z0-9][a-z0-9-]{0,127}$/i.test(exchangeId)) return "";
  return '<p class="codex-staged-preview-action">'
    + '<a class="codex-staged-preview-link" data-action="open-staged-preview"'
    + ' data-codex-staged-preview="' + escapeHtml(exchangeId) + '"'
    + ' href="' + escapeHtml(preview.path) + '">'
    + escapeHtml(preview.label) + "</a></p>";
}

function openStagedPreviewAction(exchangeId, control = null, shadow = null) {
  if (typeof exchangeId !== "string" || !exchangeId) return false;
  const exchange = Object.values(state.conversations || {})
    .flatMap((entries) => Array.isArray(entries) ? entries : [])
    .find((entry) => entry?.id === exchangeId);
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const preview = verifiedStagedPreview(exchange?.stagedPreview, workspace);
  if (!preview) return false;
  const alreadyOpen = state.repositoryPaneOpen === true
    && state.inspectorOpen === true
    && state.repoPaneTab === "browser"
    && verifiedStagedPreview(state.activeStagedPreview, workspace)?.path === preview.path;
  state.activeStagedPreview = preview;
  state.repositoryPaneOpen = true;
  state.inspectorOpen = true;
  state.repoPaneTab = "browser";
  state.activeTab = "browser";
  state.environmentOpen = false;
  state.branchPickerOpen = false;
  state.branchPickerQuery = "";
  const fallbackThread = typeof document !== "undefined"
    ? document.querySelector?.(".codex-mini-fallback .codex-messages")
    : null;
  const fallbackScrollTop = fallbackThread?.scrollTop;
  if (!alreadyOpen) {
    if (shadow && typeof syncNativeRepositoryPane === "function") {
      syncNativeRepositoryPane(shadow);
      if (typeof syncNativeCodexEnvironment === "function") syncNativeCodexEnvironment(shadow);
    } else if (typeof refreshCurrentLab === "function") {
      refreshCurrentLab();
      const nextThread = document.querySelector?.(".codex-mini-fallback .codex-messages");
      if (nextThread && Number.isFinite(fallbackScrollTop)) nextThread.scrollTop = fallbackScrollTop;
    }
    if (typeof saveState === "function") saveState();
  }
  const focusTarget = control?.isConnected === false && typeof document !== "undefined"
    ? document.querySelector?.(`[data-codex-staged-preview="${exchangeId}"]`)
    : control;
  focusTarget?.focus?.({ preventScroll: true });
  return true;
}

function completeStagedPreviewInspection(frame) {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const preview = verifiedStagedPreview(state.activeStagedPreview, workspace);
  const step = typeof STEPS !== "undefined" ? STEPS[state.currentIndex] : null;
  if (!preview || !frame?.contentDocument || step?.id !== "test") return false;
  let current;
  try {
    current = new URL(frame.contentWindow?.location?.href || frame.src, location.href);
  } catch {
    return false;
  }
  const expected = new URL(preview.path, location.href);
  if (current.origin !== location.origin
    || current.pathname !== expected.pathname || current.search !== expected.search) return false;
  const root = frame.contentDocument.documentElement;
  const heading = frame.contentDocument.querySelector?.("#hero-title");
  const disclosure = frame.contentDocument.querySelector?.("[data-staged-heading-disclosure]");
  if (root?.dataset?.stagedPreviewSession !== preview.sessionId
    || root?.dataset?.stagedPreviewRevision !== String(preview.revision)
    || heading?.textContent?.trim() !== FINAL_HOMEPAGE_HEADING
    || disclosure?.textContent?.trim()
      !== "Staged preview — Blossom Bank using the heading saved in your workspace.") return false;
  if (typeof isComplete === "function" && isComplete("test")) return true;
  if ((state.taskProgress?.test || 0) < 3 || !verifiedCodexVerification()) return false;
  state.completed.add("test");
  delete state.taskProgress?.test;
  state.validationMessage = "";
  state.expandedPracticeTask = null;
  if (typeof saveState === "function") saveState();
  if (typeof refreshCurrentLab === "function") refreshCurrentLab();
  return true;
}

function observeStagedPreviewInspection(frame) {
  frame?.__codexStagedPreviewObserver?.disconnect?.();
  delete frame?.__codexStagedPreviewObserver;
  if (completeStagedPreviewInspection(frame)) return true;
  if (!frame?.contentDocument?.documentElement || typeof MutationObserver !== "function"
    || !verifiedStagedPreview(state.activeStagedPreview)) return false;
  const observer = new MutationObserver(() => {
    if (!completeStagedPreviewInspection(frame)) return;
    observer.disconnect();
    if (frame.__codexStagedPreviewObserver === observer) delete frame.__codexStagedPreviewObserver;
  });
  observer.observe(frame.contentDocument.documentElement, {
    attributes: true,
    attributeFilter: ["data-staged-preview-session", "data-staged-preview-revision"],
  });
  frame.__codexStagedPreviewObserver = observer;
  return false;
}

function handleFallbackStagedPreviewKeydown(event) {
  const control = event?.target?.closest?.("[data-codex-staged-preview]");
  if (!control || event.key !== "Enter") return false;
  event.preventDefault?.();
  event.stopImmediatePropagation?.();
  return openStagedPreviewAction(control.dataset.codexStagedPreview, control);
}


function containsUnsafeVerificationText(value) {
  return typeof value !== "string"
    || /(?:\/Users\/[^\s]+|\/(?:private\/)?(?:var\/folders|tmp)\/[^\s]+|\/private\[workspace\]|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b|\bBearer\s+(?!\[redacted\])[A-Za-z0-9._~+/-]+=*)/i.test(value);
}

function verificationResultSummary(result = typeof state === "undefined" ? null : state.verificationResult) {
  const verification = typeof verifiedCodexVerification === "function"
    ? verifiedCodexVerification(result, { allowFailed: true })
    : null;
  if (!verification) return "Checks have not run";

  const focusedTests = verification.checks.find((check) => check.id === "focused-tests");
  const passedTests = focusedTests?.output.match(/\bTests\s+(\d+)\s+passed\b/i)
    || focusedTests?.output.match(/\b(\d+)\s+tests?\s+passed\b/i);
  const testSummary = focusedTests?.exitCode !== 0
    ? "Focused tests failed"
    : passedTests
    ? `${passedTests[1]} tests passed`
    : "Focused tests passed";
  const typecheck = verification.checks.find((check) => check.id === "typecheck");
  return `${testSummary} · TypeScript ${typecheck?.exitCode === 0 ? "passed" : "failed"}`;
}

function trainingPullRequestResponse() {
  const pullRequest = COURSE.pullRequest;
  return `Created [PR #${pullRequest.number}](${pullRequest.url}) to shorten the Blossom Bank homepage heading. It links to ${pullRequest.linkedIssue}.`;
}

function normalizeTrainingPullRequestResponse(message) {
  const canonicalUrl = COURSE.pullRequest.url;
  const withoutLinks = String(message ?? "")
    .replace(/\[([^\]\n]+)\]\(<?https?:\/\/[^\s)>]+>?\)/gi, "$1")
    .replace(/<?https?:\/\/[^\s<>"')\]]+>?/gi, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const label = `PR #${COURSE.pullRequest.number}`;
  const link = `[${label}](${canonicalUrl})`;
  return withoutLinks.includes(label)
    ? withoutLinks.replace(label, link)
    : [withoutLinks, link].filter(Boolean).join("\n\n");
}

function renderTrainingPullRequestResponse(message) {
  return renderCodexMarkdown(normalizeTrainingPullRequestResponse(message));
}

function applyVerifiedCodexWorkspace(snapshot, options = {}) {
  const workspace = typeof verifiedCodexWorkspace === "function"
    ? verifiedCodexWorkspace(snapshot)
    : null;
  if (!workspace) return false;

  const previousSession = state.codexSessionId || "";
  if (previousSession && previousSession !== workspace.sessionId && options.replaceSession !== true) {
    return false;
  }
  if (state.workspaceSnapshot?.sessionId === workspace.sessionId
    && state.workspaceSnapshot.revision > workspace.revision) {
    return false;
  }
  delete state["pr" + "DraftReady"];

  const previousWorkspace = state.workspaceSnapshot;
  const workspaceRevisionChanged = Boolean(previousWorkspace
    && (previousWorkspace.sessionId !== workspace.sessionId
      || previousWorkspace.revision !== workspace.revision
      || previousWorkspace.patch !== workspace.patch));
  const hasInvalidStoredPreview = Object.values(state.conversations || {})
    .some((entries) => Array.isArray(entries) && entries.some((entry) =>
      entry?.stagedPreview && !verifiedStagedPreview(entry.stagedPreview, workspace)));
  if (((previousWorkspace
    && (previousWorkspace.sessionId !== workspace.sessionId
      || previousWorkspace.revision !== workspace.revision
      || previousWorkspace.patch !== workspace.patch))
    || hasInvalidStoredPreview)
    && typeof invalidateStagedPreviews === "function") {
    invalidateStagedPreviews();
  }
  state.codexSessionId = workspace.sessionId;
  state.workspaceSnapshot = workspace;

  if (workspaceRevisionChanged) {
    state.verificationResult = null;
    for (const stepId of ["test", "pr"]) {
      state.completed.delete(stepId);
      if (state.conversations && typeof state.conversations === "object") delete state.conversations[stepId];
      if (state.prompts && typeof state.prompts === "object") delete state.prompts[stepId];
      if (state.taskProgress && typeof state.taskProgress === "object") delete state.taskProgress[stepId];
    }
    state.prPublishing = false;
    state.restoredPublishedThreadScrollPending = false;
  }


  if (typeof STEPS !== "undefined" && STEPS[state.currentIndex]?.id === "project"
    && !state.completed.has("project") && typeof markPracticeTask === "function"
    && (state.projectSelecting === true
      || (options.replaceSession === true && previousSession === workspace.sessionId))) {
    state.projectCreationStarted = false;
    state.projectCreationStage = "";
    state.projectType = "local";
    state.repoPaneTab = "files";
    state.activeTab = "files";
    state.repositoryPaneOpen = state.repositoryPaneOpen === true;
    state.inspectorOpen = state.repositoryPaneOpen;
    state.environmentOpen = false;
    state.projectPanelPickerOpen = false;
    state.selectedFile = "";
    state.repoSelectedPath = "";
    if ((state.taskProgress?.project || 0) < 1) markPracticeTask("project", 1);
    if ((state.taskProgress?.project || 0) < 2) markPracticeTask("project", 2);
  }



  const availablePaths = new Set(workspace.files.map((file) => file.path));
  const defaultPath = ["src/components/HeroVisual.tsx", "src/App.tsx"]
    .find((path) => availablePaths.has(path)) || workspace.files[0]?.path || "";
  const awaitingProjectFile = typeof STEPS !== "undefined"
    && STEPS[state.currentIndex]?.id === "project"
    && !state.completed.has("project");
  if (!availablePaths.has(state.selectedFile)) state.selectedFile = awaitingProjectFile ? "" : defaultPath;
  if (!availablePaths.has(state.repoSelectedPath)) state.repoSelectedPath = awaitingProjectFile ? "" : defaultPath;
  if (!workspace.changedFiles.some((file) => file.path === state.selectedDiff)) {
    state.selectedDiff = workspace.changedFiles[0]?.path || defaultPath;
  }

  if (state.repoExpandedFolders instanceof Set) {
    state.repoExpandedFolders.add("src");
    if (defaultPath.startsWith("src/components/")) state.repoExpandedFolders.add("src/components");
  }

  const hasLostBuildProgress = STEPS[state.currentIndex]?.id === "build" && !workspace.changed && (
    state.completed.has("build")
    || (Number.isSafeInteger(state.taskProgress?.build) && state.taskProgress.build > 0)
    || state.homepageBuildProgressVersion === 1
    || (Array.isArray(state.diffComments) && state.diffComments.length > 0)
  );
  if (hasLostBuildProgress) {
    for (const stepId of ["build", "test", "pr"]) {
      state.completed.delete(stepId);
      if (state.conversations && typeof state.conversations === "object") delete state.conversations[stepId];
      if (state.prompts && typeof state.prompts === "object") delete state.prompts[stepId];
      if (state.taskProgress && typeof state.taskProgress === "object") delete state.taskProgress[stepId];
    }
    state.homepageBuildProgressVersion = 0;
    state.diffComments = [];
    state.activeDiffComment = null;
    state.reviewSelection = null;
    state.reviewSelectionDrag = null;
    state.reviewCommentsAttachmentOpen = false;
    state.prPublishing = false;
    state.verificationResult = null;
  }

  if (options.persist !== false && typeof saveState === "function") saveState();
  if (options.refresh !== false && typeof refreshCurrentLab === "function") refreshCurrentLab();
  return workspace;
}

function showHostedPreviewInstructions(trigger = null) {
  if (state.hostedPreview !== true) return false;

  state.validationMessage = "";
  if (typeof openHostedPreviewInstructions === "function") {
    openHostedPreviewInstructions(trigger);
  } else if (typeof app !== "undefined" && typeof CustomEvent === "function") {
    app.dispatchEvent?.(new CustomEvent("learn-codex:open-local-instructions", {
      bubbles: true,
      detail: { trigger },
    }));
  }
  return true;
}

function initializeCodexWorkspace(options = {}) {
  if (state.hostedPreview === true) return Promise.resolve(null);
  if (typeof fetch !== "function") return Promise.resolve(null);
  const current = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (current) return Promise.resolve(current);
  if (codexWorkspaceBootstrap) return codexWorkspaceBootstrap;

  const previousSession = state.codexSessionId;
  const openWorkspace = (sessionId = "") => fetch(
    sessionId
      ? `/api/codex/workspace?sessionId=${encodeURIComponent(sessionId)}`
      : "/api/codex/workspace",
    sessionId
      ? { headers: { Accept: "application/json" } }
      : {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(
          previousSession
            && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(previousSession)
            && state.completed.has("connect")
            && state.completed.has("ticket")
            ? {
              restorePreparedBranch: true,
              previousSessionId: previousSession,
              completed: ["connect", "ticket"],
            }
            : {},
        ),
      },
  ).then(async (response) => {
    const payload = await response.json().catch(() => null);
    if (response.ok) return payload;
    if (sessionId && [404, 410].includes(response.status)) {
      state.codexSessionId = "";
      return openWorkspace();
    }
    throw new Error(payload?.error || "The isolated Blossom Bank workspace could not be opened.");
  });

  codexWorkspaceBootstrap = openWorkspace(previousSession)
    .then((snapshot) => {
      const workspace = applyVerifiedCodexWorkspace(snapshot, {
        replaceSession: Boolean(previousSession),
        ...(options.refresh === false ? { refresh: false } : {}),
      });
      if (!workspace) throw new Error("The isolated Blossom Bank workspace returned invalid source data.");
      return workspace;
    })
    .catch((error) => {
      state.validationMessage = error?.message || "The isolated Blossom Bank workspace is unavailable.";
      if (typeof refreshCurrentLab === "function") refreshCurrentLab();
      return null;
    })
    .finally(() => { codexWorkspaceBootstrap = null; });

  return codexWorkspaceBootstrap;
}

function startCodexProject() {
  if (STEPS[state.currentIndex]?.id !== "project" || state.projectSelecting === true
    || (typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
    return false;
  }

  if (state.projectCreationStarted === true) return true;

  const shadow = typeof nativeCodexShadow === "function" ? nativeCodexShadow() : null;
  if (shadow?.host?.getBoundingClientRect().width <= 520) {
    shadow.querySelector('button[aria-label="Toggle sidebar"]')?.click();
  }

  state.projectCreationStarted = true;
  state.projectCreationStage = "type";
  state.projectType = "local";
  state.projectName = "";
  state.projectNameError = "";
  state.projectSourceSelected = false;
  state.projectPanelPickerOpen = false;
  state.validationMessage = "";
  if (typeof refreshCurrentLab === "function") refreshCurrentLab();
  if (typeof app !== "undefined") {
    app.querySelector?.('[data-codex-project-stage="type"] [data-project-type="local"]')?.focus?.();
  }
  return true;
}

function selectCodexProjectType(type) {
  if (STEPS[state.currentIndex]?.id !== "project"
    || state.projectCreationStarted !== true
    || state.projectCreationStage !== "type"
    || state.projectSelecting === true
    || !["local", "remote"].includes(type)
    || (typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
    return false;
  }

  state.projectType = type;
  state.validationMessage = "";
  const roots = [
    typeof app !== "undefined" ? app : null,
    typeof nativeCodexShadow === "function" ? nativeCodexShadow() : null,
  ].filter(Boolean);
  for (const root of roots) {
    for (const dialog of root.querySelectorAll('[data-codex-project-stage="type"]')) {
      for (const option of dialog.querySelectorAll("[data-project-type]")) {
        const selected = option.dataset.projectType === type;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-checked", String(selected));
        option.tabIndex = selected ? 0 : -1;
      }
      dialog.querySelector('[data-action="continue-project-creation"]').disabled = type !== "local";
      dialog.querySelector(".codex-project-type-hint").hidden = type === "local";
    }
  }
  if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
  return true;
}

function handleCodexProjectTypeKeydown(event) {
  const option = event.target.closest?.('[data-action="select-project-type"]');
  if (!option || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return false;
  const type = event.key === "Home" ? "local" : event.key === "End" ? "remote"
    : option.dataset.projectType === "local" ? "remote" : "local";
  event.preventDefault();
  event.stopImmediatePropagation();
  if (selectCodexProjectType(type)) {
    option.closest('[role="radiogroup"]')?.querySelector(`[data-project-type="${type}"]`)?.focus();
  }
  return true;
}

function continueCodexProjectCreation() {
  if (STEPS[state.currentIndex]?.id !== "project"
    || state.projectCreationStarted !== true
    || state.projectCreationStage !== "type"
    || state.projectType !== "local"
    || state.projectSelecting === true
    || (typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
    return false;
  }

  state.projectCreationStage = "local";
  state.projectNameError = "";
  state.validationMessage = "";
  if (typeof refreshCurrentLab === "function") refreshCurrentLab();
  if (typeof app !== "undefined") {
    app.querySelector?.('[data-codex-project-picker] .codex-project-name-input')?.focus?.();
  }
  return true;
}

function selectCodexProjectDirectory() {
  if (STEPS[state.currentIndex]?.id !== "project"
    || state.projectCreationStarted !== true
    || state.projectCreationStage !== "local"
    || state.projectSelecting === true
    || (typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
    return false;
  }

  if (state.projectSourceSelected === true) return true;

  state.projectSourceSelected = true;
  state.validationMessage = "";
  if (typeof refreshCurrentLab === "function") refreshCurrentLab();
  if (typeof app !== "undefined") {
    app.querySelector?.('[data-codex-project-picker] [data-action="create-project"]')?.focus?.();
  }
  return true;
}

function removeCodexProjectDirectory() {
  if (STEPS[state.currentIndex]?.id !== "project"
    || state.projectCreationStarted !== true
    || state.projectCreationStage !== "local"
    || state.projectSelecting === true
    || state.projectSourceSelected !== true
    || (typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
    return false;
  }

  state.projectSourceSelected = false;
  state.validationMessage = "";
  if (typeof refreshCurrentLab === "function") refreshCurrentLab();
  if (typeof app !== "undefined") {
    app.querySelector?.('[data-codex-project-picker] [data-action="select-project-directory"]')?.focus?.();
  }
  return true;
}

function connectCodexProject() {
  if (STEPS[state.currentIndex]?.id !== "project" || state.projectSelecting === true) {
    return Promise.resolve(false);
  }

  const existing = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (existing) {
    state.projectCreationStarted = false;
    state.projectCreationStage = "";
    state.projectType = "local";
    state.repoPaneTab = "files";
    state.activeTab = "files";
    state.repositoryPaneOpen = state.repositoryPaneOpen === true;
    state.inspectorOpen = state.repositoryPaneOpen;
    state.environmentOpen = false;
    state.projectPanelPickerOpen = false;
    state.selectedFile = "";
    state.repoSelectedPath = "";
    if ((state.taskProgress?.project || 0) < 1) markPracticeTask("project", 1);
    if ((state.taskProgress?.project || 0) < 2) markPracticeTask("project", 2);
    return Promise.resolve(existing);
  }
  if (state.projectCreationStarted !== true
    || state.projectCreationStage !== "local") {
    return Promise.resolve(false);
  }

  const projectName = typeof state.projectName === "string"
    ? state.projectName.trim()
    : "";
  if (!projectName || state.projectName.length > 120
    || /[\u0000-\u001f\u007f]/.test(state.projectName)) {
    state.projectNameError = !projectName
      ? "Enter a project name."
      : "Enter a valid project name.";
    state.validationMessage = "";
    if (typeof refreshCurrentLab === "function") refreshCurrentLab();
    if (typeof app !== "undefined") {
      app.querySelector?.('[data-codex-project-picker] .codex-project-name-input')?.focus?.();
    }
    return Promise.resolve(false);
  }
  state.projectNameError = "";
  if (state.projectSourceSelected !== true) {
    if (typeof app !== "undefined") {
      app.querySelector?.('[data-codex-project-picker] [data-action="select-project-directory"]')?.focus?.();
    }
    return Promise.resolve(false);
  }

  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return Promise.resolve(false);
  }

  state.projectDisplayName = projectName;

  state.projectSelecting = true;
  state.validationMessage = "";
  if (typeof nativeCodexShadow === "function" && typeof syncNativeProjectSelection === "function") {
    syncNativeProjectSelection(nativeCodexShadow());
  }

  return Promise.resolve(initializeCodexWorkspace({ refresh: false }))
    .then((workspace) => {
      const verified = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
      if (!workspace || !verified || verified.sessionId !== workspace.sessionId) {
        return false;
      }

      state.projectSelecting = false;
      state.projectCreationStarted = false;
      state.projectCreationStage = "";
      state.projectType = "local";
      state.validationMessage = "";
      state.repoPaneTab = "files";
      state.activeTab = "files";
      state.repositoryPaneOpen = state.repositoryPaneOpen === true;
      state.inspectorOpen = state.repositoryPaneOpen;
      state.environmentOpen = false;
      state.projectPanelPickerOpen = false;
      state.selectedFile = "";
      state.repoSelectedPath = "";
      if ((state.taskProgress?.project || 0) < 1) markPracticeTask("project", 1);
      if ((state.taskProgress?.project || 0) < 2) markPracticeTask("project", 2);
      saveState();
      refreshCurrentLab();
      return verified;
    })
    .catch((error) => {
      state.validationMessage = error?.message || "The Blossom Bank project could not be opened.";
      return false;
    })
    .finally(() => {
      state.projectSelecting = false;
      if (typeof nativeCodexShadow === "function" && typeof syncNativeProjectSelection === "function") {
        syncNativeProjectSelection(nativeCodexShadow());
      }
      if (state.validationMessage && typeof refreshCurrentLab === "function") refreshCurrentLab();
    });
}

function completeBuildFileInspection(path) {
  const step = STEPS[state.currentIndex];
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (step?.id === "build" && workspace?.changed
    && Array.isArray(workspace.files)
    && workspace.files.some((file) => file.path === path)) {
    state.selectedFile = path;
    state.repoSelectedPath = path;
  }
  return false;
}

function nativeWorkspaceFileChangeParts(workspace) {
  return (workspace?.changedFiles || []).map((file) => ({
    type: "fileChange",
    changeType: file.status === "added" ? "created" : file.status === "deleted" ? "deleted" : "edited",
    fileName: file.path,
    fileKey: file.path,
    additions: file.additions || 0,
    deletions: file.deletions || 0,
  }));
}

function verifiedCodexCommandExecution(event) {
  if (!event || typeof event !== "object" || event.type !== "command_execution") return null;
  const expectedCommand = event.id === "focused-tests"
    ? "npm test -- --run src/App.test.tsx"
    : event.id === "typecheck"
    ? "npm run typecheck"
    : "";
  if (!expectedCommand || event.command !== expectedCommand
    || !["in_progress", "completed", "failed"].includes(event.status)) return null;

  if (event.status === "in_progress") {
    if (event.output !== undefined || event.exitCode !== undefined) return null;
  } else {
    if (typeof event.output !== "string" || event.output.length > 12_000
      || event.output.includes("\u0000")
      || containsUnsafeVerificationText(event.output)
      || /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b)/.test(event.output)
      || !Number.isSafeInteger(event.exitCode) || event.exitCode < 0
      || (event.status === "completed") !== (event.exitCode === 0)) return null;
  }

  return {
    id: event.id,
    command: expectedCommand,
    status: event.status,
    ...(event.output === undefined ? {} : { output: event.output }),
    ...(event.exitCode === undefined ? {} : { exitCode: event.exitCode }),
  };
}

function verifiedCodexBranchCommandExecution(event) {
  if (!event || typeof event !== "object" || event.type !== "command_execution") return null;
  const featureBranch = COURSE?.repository?.workingBranch;
  if (typeof featureBranch !== "string" || !featureBranch) return null;
  const expectedCommand = event.id === "branch-status-before" || event.id === "branch-status-after"
    ? "git status --short --branch"
    : event.id === "branch-switch"
    && [
      `git switch --no-guess --create ${featureBranch} ${COURSE.repository.baseBranch}`,
      `git switch --no-guess ${featureBranch}`,
    ].includes(event.command)
    ? event.command
    : "";
  if (!expectedCommand || event.command !== expectedCommand
    || !["in_progress", "completed"].includes(event.status)) return null;

  if (event.status === "in_progress") {
    if (event.output !== undefined || event.exitCode !== undefined) return null;
  } else {
    if (typeof event.output !== "string" || event.output.length > 12_000
      || event.output.includes("\u0000")
      || (typeof containsUnsafeVerificationText === "function"
        && containsUnsafeVerificationText(event.output))
      || event.exitCode !== 0) return null;
    if (event.id === "branch-switch" && event.output !== "") return null;
    if (event.id === "branch-status-before"
      && event.output !== `## ${COURSE.repository.baseBranch}` && event.output !== `## ${featureBranch}`) return null;
    if (event.id === "branch-status-after" && event.output !== `## ${featureBranch}`) return null;
  }

  return {
    id: event.id,
    command: expectedCommand,
    status: event.status,
    ...(event.output === undefined ? {} : { output: event.output }),
    ...(event.exitCode === undefined ? {} : { exitCode: event.exitCode }),
  };
}

function verifiedCodexBranchCommandExecutions(commands) {
  if (!Array.isArray(commands) || commands.length !== 3) return null;
  const verified = commands.map((command) => verifiedCodexBranchCommandExecution({
    type: "command_execution",
    ...command,
  }));
  if (verified.some((command) => !command || command.status !== "completed")) return null;
  if (verified.map(({ id }) => id).join("|")
    !== "branch-status-before|branch-switch|branch-status-after") return null;
  return verified;
}

function codexStreamPublicActivity(pending) {
  if (!pending || typeof pending !== "object") return null;

  const activities = Array.isArray(pending.streamActivities) ? pending.streamActivities : [];
  const current = [...activities].reverse().find((activity) =>
    activity && typeof activity.text === "string" && activity.text.trim());
  const heartbeat = typeof pending.progressHeartbeat?.message === "string"
    && pending.progressHeartbeat.message.trim()
    ? pending.progressHeartbeat.message
    : "";
  const source = heartbeat || current?.text || pending.streamSummary || pending.streamStatus || "";
  if (typeof source !== "string" || !source.trim()) return null;

  const normalized = source.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const first = lines.find((line) => line.trim()) || "";
  const paragraphs = normalized.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const markedHeadings = paragraphs.filter((paragraph) =>
    /^\s*(?:#{1,6}\s+|(?:\*\*|__)[^\n]+(?:\*\*|__)\s*$)/.test(paragraph.split("\n")[0]));
  const latestParagraph = markedHeadings.at(-1)
    || (paragraphs.length > 1 && paragraphs.every((paragraph) =>
      !paragraph.includes("\n") && paragraph.length <= 120 && !/[.!?]$/.test(paragraph))
      ? paragraphs.at(-1)
      : first);
  const headings = current
    ? []
    : lines.filter((line) => /^\s*(?:#{1,6}\s+|(?:\*\*|__)[^\n]+(?:\*\*|__))/.test(line));
  const heading = (headings.at(-1) || latestParagraph)
    .split("\n")[0]
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/^\s*(?:\*\*|__)([\s\S]*?)(?:\*\*|__)\s*$/, "$1")
    .replace(/(?:\*\*|__|`)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  if (!heading) return null;

  return {
    kind: !heartbeat && (current || pending.streamSummary) ? "thought" : "status",
    label: heading,
    status: !heartbeat && current?.status === "completed" ? "completed" : "in_progress",
  };
}

function codexWorkedDurationLabel(seconds) {
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 3_600) return "";
  if (seconds === 3_600) return "1h";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m${remainder ? ` ${remainder}s` : ""}`;
}

function verifiedCodexWorkedActivities(activities) {
  if (!Array.isArray(activities)) return [];
  const verified = [];

  for (const activity of activities) {
    if (!activity || typeof activity !== "object"
      || typeof activity.id !== "string"
      || !/^reasoning-[a-z0-9][a-z0-9-]{0,63}$/i.test(activity.id)
      || typeof activity.text !== "string"
      || !activity.text.trim()
      || activity.text.length > 12_000
      || activity.text.includes("\u0000")
      || !["in_progress", "completed"].includes(activity.status)) continue;

    verified.push({
      id: activity.id,
      text: activity.text.trim(),
      status: activity.status,
    });
    if (verified.length === 12) break;
  }

  return verified;
}

function renderCodexWorkedActivity(exchange, options = {}) {
  if (!exchange || typeof escapeHtml !== "function") return "";
  const duration = typeof codexWorkedDurationLabel === "function"
    ? codexWorkedDurationLabel(exchange.workedSeconds)
    : "";
  if (!duration) return "";

  const activities = typeof verifiedCodexWorkedActivities === "function"
    ? verifiedCodexWorkedActivities(exchange.workActivities)
    : [];
  const candidates = Array.isArray(exchange.workCommands)
    ? exchange.workCommands
    : Array.isArray(exchange.commandExecutions)
    ? exchange.commandExecutions
    : Array.isArray(exchange.verification?.checks)
    ? exchange.verification.checks
    : [];
  const commands = candidates.filter((command) => command
    && typeof command.command === "string"
    && command.command.trim()
    && command.command.length <= 1_024
    && ["completed", "failed"].includes(command.status));
  if (!activities.length && !commands.length) return "";

  const chevron = '<svg class="codex-worked-chevron" viewBox="0 0 20 20" fill="none"'
    + ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round"'
    + ' stroke-linejoin="round" aria-hidden="true"><path d="m7 5 5 5-5 5"/></svg>';
  const rows = activities.map((activity) => '<div class="codex-worked-row"'
    + ' data-codex-worked-kind="reasoning">' + escapeHtml(activity.text) + "</div>")
    .concat(commands.map((command) => '<div class="codex-worked-row"'
      + ' data-codex-worked-kind="command">'
      + (command.status === "failed" || command.exitCode > 0 ? "Failed " : "Ran ")
      + escapeHtml(command.command.trim()) + "</div>"))
    .join("");
  const existingActivity = typeof options.content === "string" ? options.content : "";

  return '<details class="codex-worked-activity" data-codex-worked-activity="complete">'
    + '<summary class="codex-worked-summary"><span>Worked for '
    + escapeHtml(duration) + "</span>" + chevron + "</summary>"
    + '<div class="codex-worked-details">' + rows + existingActivity + "</div></details>";
}

function renderCodexStreamActivity(pending) {
  if (!pending?.progressHeartbeat
    && (pending?.stepId === "ticket" || pending?.stepId === "test")
    && Array.isArray(pending.commandExecutions)
    && pending.commandExecutions.length
    && typeof renderCodexCommandActivity === "function") {
    return renderCodexCommandActivity(pending.commandExecutions, { running: true });
  }

  const activity = typeof codexStreamPublicActivity === "function"
    ? codexStreamPublicActivity(pending)
    : null;
  if (!activity || typeof escapeHtml !== "function") return "";

  return '<div data-codex-stream-activity="true" class="codex-stream-activity">'
    + '<div class="codex-stream-activity-row" data-codex-stream-activity-kind="'
    + escapeHtml(activity.kind) + '">'
    + '<span class="codex-stream-activity-label">' + escapeHtml(activity.label) + "</span>"
    + "</div></div>";
}

function applyLiveCodexStreamEvent(event, pendingId) {
  const pending = state.pendingConversation;
  if (
    !state.isRunning ||
    !pending ||
    pending.id !== pendingId ||
    !event ||
    typeof event !== "object"
  ) {
    return false;
  }

  if (event.type === "command_execution") {
    const verificationCommand = pending.stepId === "test"
      && pending.verificationApproved === true
      && typeof verifiedCodexCommandExecution === "function";
    const branchCommand = pending.stepId === "ticket"
      && pending.branchPreparationApproved === true
      && typeof verifiedCodexBranchCommandExecution === "function";
    if (!verificationCommand && !branchCommand) return false;
    const command = verificationCommand
      ? verifiedCodexCommandExecution(event)
      : verifiedCodexBranchCommandExecution(event);
    if (!command) return false;

    const commands = pending.commandExecutions ||= [];
    const index = commands.findIndex((entry) => entry.id === command.id);
    if (index !== -1 && commands[index].status !== "in_progress"
      && (commands[index].status !== command.status
        || commands[index].exitCode !== command.exitCode
        || commands[index].output !== command.output)) return false;
    if (index === -1) {
      if (commands.length >= (verificationCommand ? 2 : 3)) return false;
      commands.push(command);
    } else {
      commands[index] = command;
    }
    pending.streamStatus = command.status === "in_progress"
      ? `Running ${command.command}`
      : command.status === "completed"
      ? `Ran ${command.command}`
      : `${command.command} failed with exit code ${command.exitCode}`;
  } else if (event.type === "workspace_snapshot") {
    if (typeof verifiedCodexWorkspace !== "function") return false;
    const workspace = verifiedCodexWorkspace(event.workspace);
    if (!workspace) return false;
    const activeSession = state.codexSessionId || state.workspaceSnapshot?.sessionId || "";
    if (activeSession && activeSession !== workspace.sessionId) return false;
    if (pending.verificationApproved === true && state.workspaceSnapshot
      && (workspace.revision !== state.workspaceSnapshot.revision
        || workspace.patch !== state.workspaceSnapshot.patch)) return false;
    const previousRevision = state.workspaceSnapshot?.revision;
    state.workspaceSnapshot = workspace;
    pending.workspaceChanges = workspace.changedFiles;

    if (typeof nativeCodexShadow === "function" && typeof syncNativeRepositoryPane === "function") {
      const shadow = nativeCodexShadow();
      if (shadow) syncNativeRepositoryPane(shadow);
    }
    if (workspace.changed && workspace.revision !== previousRevision && typeof refreshCurrentLab === "function") {
      refreshCurrentLab();
    }
  } else if (event.type === "status") {
    if (!["starting", "thinking", "editing", "responding"].includes(event.stage)) return false;
    if (typeof event.message !== "string" || !event.message.trim()) return false;
    if (pending.verificationApproved === true && containsUnsafeVerificationText(event.message)) return false;
    const heartbeat = event.heartbeat !== undefined
      || event.source !== undefined
      || event.sequence !== undefined
      || event.elapsedMs !== undefined;
    if (heartbeat) {
      if (event.heartbeat !== true
        || event.source !== "system"
        || !Number.isSafeInteger(event.sequence)
        || event.sequence < 1
        || event.sequence <= (pending.progressHeartbeatSequence || 0)
        || !Number.isSafeInteger(event.elapsedMs)
        || event.elapsedMs < 0
        || event.message.length > 240
        || event.message.includes("\u0000")) return false;
      pending.progressHeartbeatSequence = event.sequence;
      pending.progressHeartbeat = {
        source: "system",
        elapsedMs: event.elapsedMs,
        message: typeof codexProgressHeartbeatMessage === "function"
          ? codexProgressHeartbeatMessage(pending, event.elapsedMs, event.message)
          : event.message.trim(),
      };
    } else {
      pending.streamStatus = event.message.trim();
    }
  } else if (event.type === "reasoning_summary") {
    if (typeof event.text !== "string" || event.text.length > 12_000) return false;
    const summary = event.text ? `${pending.streamSummary || ""}${event.text}` : pending.streamSummary || "";
    if (event.text && pending.verificationApproved === true && containsUnsafeVerificationText(summary)) {
      return false;
    }

    if (event.activityId !== undefined) {
      if (typeof event.activityId !== "string"
        || !/^reasoning-[a-z0-9][a-z0-9-]{0,63}$/i.test(event.activityId)
        || !["in_progress", "completed"].includes(event.status)
        || (event.replace !== undefined && event.replace !== true)) {
        return false;
      }

      const activities = pending.streamActivities ||= [];
      if (!Array.isArray(activities)) return false;
      const current = activities.find((activity) => activity.id === event.activityId);
      if (!event.text && (!current || current.status !== "in_progress"
        || event.status !== "completed" || event.replace === true)) {
        return false;
      }
      if (event.replace === true && !current) return false;
      const next = event.replace === true
        ? event.text
        : `${current?.text || ""}${event.text}`;
      if (next.length > 12_000) return false;
      if (pending.verificationApproved === true && containsUnsafeVerificationText(next)) return false;

      if (current) {
        current.text = next;
        current.status = event.status;
      } else {
        activities.push({ id: event.activityId, text: next, status: event.status });
        if (activities.length > 12) activities.splice(0, activities.length - 12);
      }
    } else if (!event.text || event.status !== undefined || event.replace !== undefined) {
      return false;
    }

    if (event.text) pending.streamSummary = summary;
  } else if (event.type === "assistant_delta") {
    if (typeof event.text !== "string" || !event.text) return false;
    if ((event.messageId !== undefined
      && (typeof event.messageId !== "string" || !/^assistant-[1-9]\d{0,3}$/.test(event.messageId)))
      || (event.replace !== undefined && event.replace !== true)
      || (event.replace === true && (!event.messageId || event.messageId !== pending.streamMessageId))) {
      return false;
    }
    if (event.messageId && pending.streamMessageId
      && Number(event.messageId.slice("assistant-".length))
        < Number(pending.streamMessageId.slice("assistant-".length))) {
      return false;
    }
    const replacesMessage = event.replace === true
      || (event.messageId && event.messageId !== pending.streamMessageId);
    const response = replacesMessage ? event.text : (pending.streamResponse || "") + event.text;
    if (pending.verificationApproved === true && containsUnsafeVerificationText(response)) return false;
    pending.streamResponse = response;
    if (event.messageId) pending.streamMessageId = event.messageId;
  } else {
    return false;
  }

  if (event.type !== "workspace_snapshot") {
    if (event.type !== "status" || event.heartbeat !== true) {
      delete pending.progressHeartbeat;
    }
    const genericLifecycleStatus = event.type === "status"
      && event.heartbeat !== true
      && /^(?:starting\s+codex|codex\s+is\s+(?:starting|thinking|responding)|working|thinking)$/i
        .test(event.message.trim());
    if (!genericLifecycleStatus) {
      pending.lastProgressUpdateAt = Date.now();
      if (event.type !== "status" || event.heartbeat !== true) {
        pending.lastObservedCodexActivityAt = pending.lastProgressUpdateAt;
      }
    }
  }
  syncLiveCodexStreamDisplay(pendingId);
  return true;
}

function readLiveCodexStream(response, pendingId) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";

  const processLine = (line) => {
    if (!line.trim()) return null;

    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error("The live Codex service returned an invalid streaming response.");
    }

    if (event?.type === "error") {
      throw new Error(
        typeof event.error === "string" && event.error.trim()
          ? event.error
          : "The live Codex service could not answer this request.",
      );
    }
    if (event?.type === "final") return event;
    applyLiveCodexStreamEvent(event, pendingId);
    return null;
  };

  return (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (pendingId && state.pendingConversation?.id !== pendingId) {
        reader.cancel?.();
        throw new Error("The Codex request was canceled.");
      }

      buffered += decoder.decode(value, { stream: !done });
      let newline = buffered.indexOf("\n");
      while (newline !== -1) {
        if (newline > 512_000) {
          throw new Error("The live Codex service returned an oversized streaming response.");
        }
        const result = processLine(buffered.slice(0, newline));
        buffered = buffered.slice(newline + 1);
        if (result) return result;
        newline = buffered.indexOf("\n");
      }

      if (buffered.length > 512_000) {
        throw new Error("The live Codex service returned an oversized streaming response.");
      }

      if (done) {
        const result = processLine(buffered);
        if (result) return result;
        throw new Error("The live Codex service ended before returning a response.");
      }
    }
  })().finally(() => reader.releaseLock?.());
}

function requestLiveCodexResponse(step, prompt, options = {}) {
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return Promise.reject(new Error(state.hostedPreviewReason));
  }

  const pending = state.pendingConversation;
  const pendingId = pending?.id || "";
  const controller = pending && typeof AbortController === "function"
    ? new AbortController()
    : null;
  if (controller) pending.streamController = controller;

  const request = {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
    body: JSON.stringify(getLiveCodexRequest(step, prompt, options)),
  };
  if (controller) request.signal = controller.signal;

  return fetch("/api/codex", request).then((response) => {
    if (response.ok && typeof options.onAccepted === "function") {
      options.onAccepted({ pendingId });
    }
    const contentType = response.headers?.get?.("content-type") || "";
    const result = response.ok
      && /^application\/x-ndjson(?:\s*;|$)/i.test(contentType)
      && response.body?.getReader
      ? readLiveCodexStream(response, pendingId)
      : response.json().catch(() => null);

    return result.then((payload) => {
      if (!response.ok) {
        throw new Error(payload?.error || "The live Codex service could not answer this request.");
      }

      const text = typeof payload?.text === "string" ? payload.text.trim() : "";
      if (!text) throw new Error("The live Codex service returned an empty response.");
      if (options.verificationApproved === true && containsUnsafeVerificationText(text)) {
        throw new Error("Codex returned private details while reporting test results.");
      }

      const reportedSession = typeof payload.sessionId === "string"
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sessionId)
        ? payload.sessionId
        : "";
      const activeSession = state.codexSessionId || state.workspaceSnapshot?.sessionId || "";
      if (reportedSession && activeSession && reportedSession !== activeSession) {
        throw new Error("Codex returned a repository from a different workspace session.");
      }
      if (options.verificationApproved === true) {
        const previousWorkspace = typeof verifiedCodexWorkspace === "function"
          ? verifiedCodexWorkspace()
          : null;
        const returnedWorkspace = typeof verifiedCodexWorkspace === "function"
          ? verifiedCodexWorkspace(payload.workspace)
          : null;
        if (!previousWorkspace || !returnedWorkspace
          || returnedWorkspace.sessionId !== previousWorkspace.sessionId
          || returnedWorkspace.revision !== previousWorkspace.revision
          || returnedWorkspace.patch !== previousWorkspace.patch) {
          throw new Error("The project changed while tests were running, so their results may be unreliable.");
        }
        const verification = typeof verifiedCodexVerification === "function"
          ? verifiedCodexVerification(payload.verification ?? null, { allowFailed: true })
          : null;
        if (!verification || (reportedSession && verification.sessionId !== reportedSession)) {
          throw new Error("Codex did not return valid results for both requested checks.");
        }
      }
      if (payload.workspace !== undefined) {
        if (reportedSession && payload.workspace?.sessionId !== reportedSession) {
          throw new Error("Codex returned mismatched repository session details.");
        }
        const workspace = typeof applyVerifiedCodexWorkspace === "function"
          ? applyVerifiedCodexWorkspace(payload.workspace, { refresh: false })
          : null;
        if (!workspace) {
          throw new Error("Codex returned an invalid project workspace.");
        }
        if (pending && state.pendingConversation?.id === pendingId) {
          pending.workspaceChanges = workspace.changedFiles;
          pending.verifiedWorkspace = workspace;
        }
      } else if (options.executionApproved === true || options.verificationApproved === true) {
        throw new Error("Codex did not return valid project changes.");
      }
      if (payload.preview !== undefined) {
        const currentWorkspace = typeof verifiedCodexWorkspace === "function"
          ? verifiedCodexWorkspace()
          : null;
        const preview = options.stagedPreviewRequested === true
          && pending?.stepId === "test" && typeof verifiedStagedPreview === "function"
          ? verifiedStagedPreview(payload.preview, currentWorkspace)
          : null;
        if (!preview || !pending || state.pendingConversation?.id !== pendingId) {
          throw new Error("Codex returned an invalid staged preview.");
        }
        pending.stagedPreview = preview;
      } else if (options.stagedPreviewRequested === true) {
        throw new Error("Codex did not return the staged Blossom Bank preview.");
      }
      if (options.verificationApproved === true) {
        const verification = typeof verifiedCodexVerification === "function"
          ? verifiedCodexVerification(payload.verification ?? null, { allowFailed: true })
          : null;
        if (!verification || (reportedSession && verification.sessionId !== reportedSession)) {
          throw new Error("Codex did not return valid results for both requested checks.");
        }
        state.verificationResult = verification;
        if (pending && state.pendingConversation?.id === pendingId) pending.verification = verification;
      } else if (payload.verification !== undefined) {
        throw new Error("Codex returned test results that were not requested.");
      }
      if (reportedSession) state.codexSessionId = reportedSession;
      if (typeof payload.model === "string") state.codexModel = payload.model;
      if (typeof payload.reasoningEffort === "string" && payload.reasoningEffort.trim()) {
        state.codexReasoningEffort = payload.reasoningEffort;
      }

      return text;
    });
  });
}

function recordConversation(step, prompt, response, options = {}) {
  const history = state.conversations[step.id] ||= [];
  const id = options.id || `${step.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = { id, prompt, response, guided: options.guided === true };
  if (step.id === "pr" && ["published", "shared"].includes(options.publicationPhase)) {
    entry.publicationPhase = options.publicationPhase;
  }
  const reviewComments = Array.isArray(options.reviewComments)
    ? options.reviewComments.slice(0, 16).map(reviewCommentSnapshot).filter(Boolean)
    : [];
  if (reviewComments.length) {
    entry.reviewComments = reviewComments;
    entry.commentOnly = options.commentOnly === true && !prompt.trim();
  }
  if (Number.isSafeInteger(options.workedSeconds)
    && options.workedSeconds >= 1
    && options.workedSeconds <= 3_600) {
    entry.workedSeconds = options.workedSeconds;
  }
  if (typeof verifiedCodexWorkedActivities === "function") {
    const activities = verifiedCodexWorkedActivities(options.workActivities);
    if (activities.length) entry.workActivities = activities;
  }
  if (Array.isArray(options.workspaceChanges)) {
    entry.workspaceChanges = options.workspaceChanges.map(({ path, status, additions, deletions }) => ({
      path,
      status,
      additions: additions || 0,
      deletions: deletions || 0,
    }));
  }
  if (options.verification && typeof verifiedCodexVerification === "function") {
    const verification = verifiedCodexVerification(options.verification, { allowFailed: true });
    if (verification) entry.verification = verification;
  }
  if (options.stagedPreview && typeof verifiedStagedPreview === "function") {
    const preview = verifiedStagedPreview(options.stagedPreview);
    if (preview) entry.stagedPreview = preview;
  }
  if (step.id === "ticket" && typeof verifiedCodexBranchCommandExecutions === "function") {
    const commands = verifiedCodexBranchCommandExecutions(options.commandExecutions);
    if (commands) entry.commandExecutions = commands;
  }
  history.push(entry);
  return entry;
}

function acceptPendingCodexTurn(pendingId) {
  const pending = state.pendingConversation;
  if (!pending || pending.id !== pendingId) return false;
  if (pending.accepted === true) return true;

  pending.accepted = true;
  const capturedIds = new Set(
    (Array.isArray(pending.reviewComments) ? pending.reviewComments : [])
      .map((comment) => comment?.id)
      .filter((id) => typeof id === "string" && id),
  );
  if (capturedIds.size && Array.isArray(state.diffComments)) {
    state.diffComments = state.diffComments.filter((comment) => !capturedIds.has(comment?.id));
    if (state.reviewCommentsAttachmentOpen === "pending"
      && pendingDiffCommentAttachment().snapshots.length === 0) {
      state.reviewCommentsAttachmentOpen = false;
    }
  }

  saveState();
  refreshCurrentLab();
  scrollNativeThreadToBottom();
  return true;
}

function persistAcceptedPendingTurn(pending = state.pendingConversation) {
  const reviewComments = Array.isArray(pending?.reviewComments)
    ? pending.reviewComments.map(reviewCommentSnapshot).filter(Boolean)
    : [];
  if (!pending || pending.accepted !== true || typeof pending.stepId !== "string"
    || reviewComments.length === 0) return false;
  const step = STEPS.find((candidate) => candidate.id === pending.stepId);
  if (!step) return false;
  const history = state.conversations[step.id] ||= [];
  let recorded = false;
  if (!history.some((entry) => entry?.id === pending.id)) {
    recordConversation(step, typeof pending.prompt === "string" ? pending.prompt : "", "", {
      id: pending.id,
      guided: false,
      reviewComments,
      commentOnly: pending.commentOnly === true,
    });
    recorded = true;
  }
  if (pending.stepId === "build" && !isComplete("build")
    && !pendingDiffCommentAttachment().snapshots.some((comment) => comment.stepId === "build")
    && (state.taskProgress?.build || 0) >= 3) {
    state.taskProgress.build = 2;
    state.expandedPracticeTask = null;
  }
  return recorded;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function icon(name, className = "") {
  return `<svg aria-hidden="true"${className ? ` class="${escapeHtml(className)}"` : ""}><use href="#icon-${escapeHtml(name)}"></use></svg>`;
}

function codexHomeLogo() {
  return `
    <svg class="conversation-home-logo" viewBox="0 0 500 500" fill="currentColor" aria-hidden="true">
      <path d="M330.34 313.62H262.5c-7.65 0-13.85-6.2-13.85-13.85s6.2-13.85 13.85-13.85h67.84c7.65 0 13.85 6.2 13.85 13.85s-6.2 13.85-13.85 13.85Z" />
      <path d="M169.65 313.38c-2.36 0-4.74-.6-6.93-1.87-6.62-3.83-8.88-12.31-5.05-18.93l23.78-41.08-23.91-43.21c-3.7-6.69-1.28-15.12 5.41-18.82 6.69-3.71 15.12-1.28 18.82 5.41l31.51 56.94-31.64 54.65c-2.57 4.43-7.22 6.91-12 6.91Z" />
      <path d="M144.61 144.5c1.42-41.82 35.79-75.27 77.95-75.25 27.89.02 52.35 14.68 66.11 36.71 10.93-5.82 23.41-9.12 36.65-9.11 43.05.02 77.94 34.94 77.91 78 0 13.24-3.32 25.72-9.16 36.64 22.02 13.79 36.66 38.26 36.64 66.15-.02 42.16-33.52 76.48-75.34 77.86-1.42 41.82-35.78 75.28-77.94 75.25-27.89-.02-52.35-14.68-66.11-36.72-10.93 5.82-23.4 9.13-36.65 9.12-43.05-.02-77.94-34.94-77.91-78 0-13.24 3.32-25.72 9.16-36.64-22.02-13.79-36.65-38.26-36.64-66.15.02-42.16 33.51-76.48 75.33-77.86Zm153.16-72.51c-19.24-19.26-45.83-31.17-75.2-31.19-49.23-.03-90.67 33.39-102.84 78.79-45.41 12.12-78.87 53.52-78.9 102.76-.02 29.37 11.87 55.97 31.1 75.23-2.35 8.79-3.62 18.03-3.63 27.56-.03 58.77 47.58 106.44 106.35 106.47 9.53 0 18.77-1.25 27.55-3.6 19.24 19.26 45.84 31.18 75.21 31.2 49.24.03 90.67-33.39 102.84-78.8 45.42-12.11 78.88-53.51 78.91-102.75.02-29.37-11.87-55.98-31.11-75.24 2.35-8.78 3.62-18.02 3.63-27.55.03-58.77-47.58-106.44-106.35-106.47-9.53 0-18.77 1.25-27.56 3.59Z" />
    </svg>`;
}

function isComplete(stepId) {
  return state.completed.has(stepId);
}

// Prepared context is separate from learner progress. Never mark skipped lessons
// complete or persist their example conversations as learner-authored work.
function lessonContextReady(stepId) {
  return isComplete(stepId) || state.preparedSteps?.includes(stepId) === true;
}

function courseConversations(stepId) {
  const conversations = state.conversations?.[stepId] || [];
  return conversations.length ? conversations : state.preparedConversations?.[stepId] || [];
}

function prepareCodexLessonContext(stepId) {
  const index = STEPS.findIndex((step) => step.id === stepId);
  state.preparedSteps = STEPS.slice(0, index).map((step) => step.id);
  state.preparedConversations = Object.fromEntries(STEPS.slice(1, index).map((step) => [step.id, [{
    id: `prepared-${step.id}`, prompt: step.prompt, response: step.assistantResponse,
    guided: false, prepared: true,
  }]]));
  const context = window.__CODEX_TRAINING_RUNTIME__?.prepareLesson?.(stepId);
  if (!context) return;
  const createdProject = isComplete("project") || (state.taskProgress?.project || 0) >= 2;
  state.workspaceSnapshot = stepId !== "project" || createdProject ? context.workspace : null;
  state.codexSessionId = state.workspaceSnapshot?.sessionId || "";
  if (context.verification) state.verificationResult = context.verification;
  else if (stepId === "test") {
    state.verificationResult = [...(state.conversations?.test || [])].reverse()
      .find((entry) => entry.verification?.sessionId === context.workspace.sessionId)?.verification || null;
  }
  state.planDraftReady = false;
  state.planApproved = false;
  state.planImplementationChoice = "";
  state.planMode = false;
  state.composerMode = "agent";
}

function trainingPageWindow() {
  try {
    return window.parent !== window && window.parent.location.origin === window.location.origin
      ? window.parent : window;
  } catch { return window; }
}

function trainingAnalyticsSnapshot() {
  return {
    lessonId: state.phase === "practice" && trainingRouteParams().get("step") !== "end"
      ? STEPS[state.currentIndex]?.id : null,
    completedLessonIds: [...state.completed],
    completedTasks: Object.fromEntries(STEPS.map((step) => {
      // Use earned checkpoints only, never the prepared context for skipped lessons.
      const count = state.completed.has(step.id) ? practiceGuides[step.id].tasks.length
        : state.taskProgress[step.id] || 0;
      return [step.id, practiceGuides[step.id].tasks.slice(0, count).map((_, index) => `task_${index + 1}`)];
    })),
    preview: state.hostedPreview || ["complete", "in-progress"].includes(trainingRouteParams().get("preview")),
  };
}

function trainingRouteParams() {
  return new URLSearchParams(trainingPageWindow().location.search);
}

function updateTrainingRoute(step) {
  const page = trainingPageWindow();
  const url = new URL(page.location.href);
  url.searchParams.set("step", step);
  if (step !== "end") url.searchParams.delete("preview");
  if (url.hash === "#resume") url.hash = "";
  page.history.replaceState(page.history.state, "", url.href);
}

function navigateTraining(path) {
  const page = trainingPageWindow();
  const url = new URL(path, page.location.href);
  const variant = trainingRouteParams().get("site_variant");
  if (variant) url.searchParams.set("site_variant", variant);
  page.location.assign(url.href);
}

function finishEmbeddedTraining() {
  if (window.__CODEX_TRAINING_EMBEDDED__ !== true) return false;
  saveState();
  updateTrainingRoute("end");
  location.hash = "/summary";
  render();
  return true;
}

function resumeEmbeddedTraining() {
  if (window.__CODEX_TRAINING_EMBEDDED__ !== true) return false;
  const requestedStep = trainingRouteParams().get("step");
  const requested = ["understand", "plan"].includes(requestedStep) ? "build" : requestedStep;
  if (requested === "end") {
    location.hash = "/summary";
    render();
    return true;
  }
  const requestedIndex = STEPS.findIndex((step) => step.id === requested);
  const savedIndex = STEPS.findIndex((step) => step.id === saved.currentStepId);
  const resume = trainingPageWindow().location.hash === "#resume";
  goToStep(resume ? firstIncompleteStepIndex()
    : requestedIndex >= 0 ? requestedIndex : requested ? 0 : Math.max(0, savedIndex), "practice");
  return true;
}

function renderEmbeddedTrainingEnd() {
  state.phase = "practice";
  app.querySelector(".codex-mini-host")?.dispatchEvent(new Event("astro:unmount"));
  for (const overlay of document.querySelectorAll("[data-codex-mini-overlay-host]")) overlay.remove();
  dismissCodexCourseCue();
  document.body.classList.add("lab-open");
  document.title = "Your Codex training progress | ChatGPT Learn";
  const preview = trainingRouteParams().get("preview");
  const query = new URLSearchParams({ path: "codex" });
  if (["complete", "in-progress"].includes(preview)) query.set("preview", preview);
  app.innerHTML = `<main class="lab-shell phase-practice hands-on-course codex-course" data-course-finish>
    ${renderJourneyHeader({ id: "end" }, STEPS.length)}
    <iframe class="course-finish-frame" title="Codex training progress" src="/training/course-finish?${query}"></iframe>
    ${state.restartDialogOpen ? renderJourneyRestartDialog() : ""}
  </main>`;
}

function activeCourseBranch() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (typeof workspace?.branch === "string" && workspace.branch) return workspace.branch;
  return isComplete("ticket")
    ? COURSE.repository.workingBranch
    : COURSE.repository.defaultBranch;
}

function firstIncompleteStepIndex() {
  const index = STEPS.findIndex((step) => !isComplete(step.id));
  return index === -1 ? STEPS.length - 1 : index;
}

function stepNumber(value) {
  return String(value).padStart(2, "0");
}

function progressPercent() {
  return Math.round((state.completed.size / STEPS.length) * 100);
}

function defaultInspectorState() {
  return false;
}

function isNarrowCodexWorkspace(width) {
  const frameWidth = typeof document !== "undefined"
    ? document.querySelector?.(".practice-codex-frame")?.getBoundingClientRect?.().width
    : undefined;
  const measured = Number.isFinite(width)
    ? width
    : Number.isFinite(frameWidth) && frameWidth > 0
      ? frameWidth
    : typeof window !== "undefined" && Number.isFinite(window.innerWidth)
      ? window.innerWidth
      : Infinity;
  return measured <= 720;
}

function getRouteIndex() {
  if (window.__CODEX_TRAINING_EMBEDDED__ === true) {
    const step = trainingRouteParams().get("step");
    if (step === "end") return null;
    const index = STEPS.findIndex((candidate) => candidate.id === step);
    if (index >= 0) return index;
  }
  const match = location.hash.match(/^#\/lab\/(\d+)/);
  if (!match) return null;

  return Math.max(0, Math.min(Number(match[1]) - 1, STEPS.length - 1));
}

function goToStep(index, phase = window.__CODEX_TRAINING_EMBEDDED__ === true ? "practice" : "brief") {
  if (state.pendingConversation) {
    const persistedAcceptedTurn = typeof persistAcceptedPendingTurn === "function"
      && persistAcceptedPendingTurn(state.pendingConversation);
    stopCodexThinkingTimer(state.pendingConversation.id);
    state.pendingConversation = null;
    state.isRunning = false;
    if (persistedAcceptedTurn) saveState();
  }
  const bounded = Math.max(0, Math.min(index, STEPS.length - 1));
  const lessonChanged = STEPS[state.currentIndex]?.id !== STEPS[bounded]?.id;
  state.currentIndex = bounded;
  state.phase = "brief";
  if (lessonChanged) {
    state.selectedCodexThread = "";
    closeReviewCommandMenu();
    state.repositoryPaneOpen = false;
    state.inspectorOpen = false;
    state.repoPaneTab = "files";
    state.activeTab = "artifact";
  }
  if (phase === "practice") state.phase = "practice";
  state.hintsOpen = false;
  state.learnMoreOpen = false;
  state.completionVisible = false;
  state.tasksOpen = true;
  state.expandedPracticeTask = null;
  state.stepMenuOpen = false;
  state.restartDialogOpen = false;
  state.activeTab = state.repositoryPaneOpen === true
    ? state.repoPaneTab === "review" ? "diff" : state.repoPaneTab || "files"
    : "artifact";
  state.fallbackPluginsOpen = false;
  if (!["files", "review", "browser", "plan"].includes(state.repoPaneTab)) {
    state.repoPaneTab = "files";
  }
  const narrowWorkspace = typeof isNarrowCodexWorkspace === "function"
    && isNarrowCodexWorkspace();
  state.inspectorOpen = state.repositoryPaneOpen === true;
  state.environmentOpen = false;
  state.branchPickerOpen = false;
  state.branchPickerQuery = "";
  state.repositoryPaneOpen = state.repositoryPaneOpen === true;
  state.repositoryPaneResizeRestoreTab = "";
  state.repositoryPaneResponsiveNarrow = narrowWorkspace;
  state.projectPanelPickerOpen = false;
  state.practiceTicketExpanded = false;
  state.mobileView = state.phase === "practice" ? "workspace" : "lesson";
  state.planMode = STEPS[bounded].mode === "plan"
    && (isComplete("plan") || state.planDraftReady);
  state.composerMode = state.planMode ? "plan" : state.composerMode === "goal" ? "goal" : "agent";
  state.modeMenuOpen = false;
  state.validationMessage = "";
  if (window.__CODEX_TRAINING_EMBEDDED__ === true) {
    updateTrainingRoute(STEPS[bounded].id);
    prepareCodexLessonContext(STEPS[bounded].id);
  }
  location.hash = `/lab/${bounded + 1}${state.phase === "practice" ? "/practice" : ""}`;
  saveState();
  render();
}

function render(options = {}) {
  const routeIndex = getRouteIndex();

  if (routeIndex !== null
    && window.__CODEX_TRAINING_EMBEDDED__ === true
    && !location.hash.endsWith("/practice")) {
    location.hash = `/lab/${routeIndex + 1}/practice`;
    return;
  }

  if (state.pendingConversation && (
    routeIndex === null
    || routeIndex !== state.currentIndex
    || !location.hash.endsWith("/practice")
  )) {
    const persistedAcceptedTurn = typeof persistAcceptedPendingTurn === "function"
      && persistAcceptedPendingTurn(state.pendingConversation);
    stopCodexThinkingTimer(state.pendingConversation.id);
    state.pendingConversation = null;
    state.isRunning = false;
    if (persistedAcceptedTurn) saveState();
  }

  if (routeIndex === null) {
    state.practiceThreadScrollRoute = location.hash;
    state.pendingPracticeThreadScroll = "";
    if (typeof dismissCodexCourseCue === "function") dismissCodexCourseCue();
    if (typeof disconnectRepositoryTabLabelOverflow === "function") {
      disconnectRepositoryTabLabelOverflow(app);
    }
    const isCourseIntro = location.hash === "#/intro";
    const isCourseSummary = location.hash === "#/summary" || trainingRouteParams().get("step") === "end";
    if (isCourseSummary && window.__CODEX_TRAINING_EMBEDDED__ === true) {
      renderEmbeddedTrainingEnd();
      return;
    }
    app.querySelector(".codex-mini-host")?.dispatchEvent(new Event("astro:unmount"));
    for (const overlay of document.querySelectorAll("[data-codex-mini-overlay-host]")) {
      overlay.remove();
    }
    document.body.classList.toggle("lab-open", isCourseIntro || isCourseSummary);
    if (isCourseSummary) state.phase = "summary";
    document.title = isCourseSummary
      ? "Your Codex course summary | ChatGPT Learn"
      : isCourseIntro ? "Welcome to Codex | ChatGPT Learn" : "Try Codex | ChatGPT Learn";
    app.innerHTML = (isCourseSummary
      ? renderCourseSummary()
      : isCourseIntro ? renderCourseIntro() : renderLanding())
      + (typeof renderGlobalChrome === "function" ? renderGlobalChrome() : "");
    if (typeof syncHostedPreviewInstructions === "function") {
      syncHostedPreviewInstructions({
        focus: state.hostedPreviewInstructionsOpen === true,
        restoreFocus: false,
      });
    }
    return;
  }

  if (state.currentIndex !== routeIndex) {
    state.currentIndex = routeIndex;
    state.selectedCodexThread = "";
    closeReviewCommandMenu();
    state.repositoryPaneOpen = false;
    state.inspectorOpen = false;
    state.repoPaneTab = "files";
    state.activeTab = "artifact";
    state.activeTab = state.repositoryPaneOpen === true
      ? state.repoPaneTab === "review" ? "diff" : state.repoPaneTab || "files"
      : "artifact";
    if (!["files", "review", "browser", "plan"].includes(state.repoPaneTab)) {
      state.repoPaneTab = "files";
    }
    state.fallbackPluginsOpen = false;
    const narrowWorkspace = typeof isNarrowCodexWorkspace === "function"
      && isNarrowCodexWorkspace();
    state.inspectorOpen = state.repositoryPaneOpen === true;
    state.environmentOpen = false;
    state.branchPickerOpen = false;
    state.branchPickerQuery = "";
    state.repositoryPaneOpen = state.repositoryPaneOpen === true;
    state.repositoryPaneResizeRestoreTab = "";
    state.repositoryPaneResponsiveNarrow = narrowWorkspace;
    state.projectPanelPickerOpen = false;
    state.practiceTicketExpanded = false;
    state.completionVisible = false;
    state.hintsOpen = false;
    state.learnMoreOpen = false;
    state.expandedPracticeTask = null;
    state.planMode = STEPS[routeIndex].mode === "plan"
      && (isComplete("plan") || state.planDraftReady);
    state.composerMode = state.planMode
      ? "plan"
      : state.composerMode === "goal" ? "goal" : "agent";
    state.modeMenuOpen = false;
  }
  const routePhase = location.hash.endsWith("/practice") ? "practice" : "brief";
  if (state.phase !== routePhase) {
    state.learnMoreOpen = false;
    state.inspectorOpen = state.repositoryPaneOpen === true;
    state.environmentOpen = false;
    state.branchPickerOpen = false;
    state.branchPickerQuery = "";
    state.repositoryPaneOpen = state.repositoryPaneOpen === true;
    state.repositoryPaneResizeRestoreTab = "";
    state.projectPanelPickerOpen = false;
    state.practiceTicketExpanded = false;
  }
  state.phase = routePhase;
  if (state.savedRouteIndex !== routeIndex) {
    state.savedRouteIndex = routeIndex;
    saveState();
  }
  const step = STEPS[routeIndex];
  const practiceThreadRoute = location.hash;
  if (state.practiceThreadScrollRoute !== practiceThreadRoute) {
    state.practiceThreadScrollRoute = practiceThreadRoute;
    state.pendingPracticeThreadScroll = routePhase === "practice"
      && typeof practiceThreadScrollAllowed === "function"
      && practiceThreadScrollAllowed(step)
      ? step.id
      : "";
  }
  const mountedHost = app.querySelector(".codex-mini-host");
  const currentHost = app.querySelector('.codex-mini-host[data-codex-mini="ready"]');
  const retainedMiniStage = options.resetMini !== true && state.phase === "practice"
    && currentHost?.closest(".codex-mini-live")?.dataset.codexMiniState === "ready"
    ? currentHost.closest(".codex-mini-live-stage")
    : null;
  if (mountedHost && !retainedMiniStage) {
    mountedHost.dispatchEvent(new Event("astro:unmount"));
    for (const overlay of document.querySelectorAll("[data-codex-mini-overlay-host]")) overlay.remove();
  }
  if (retainedMiniStage) retainedMiniStage.remove();
  document.body.classList.add("lab-open");
  document.title = `${step.title} | Codex | ChatGPT Learn`;
  app.innerHTML = renderLab(step, routeIndex)
    + (typeof renderGlobalChrome === "function" ? renderGlobalChrome() : "");
  if (typeof syncHostedPreviewInstructions === "function") {
    syncHostedPreviewInstructions({
      focus: state.hostedPreviewInstructionsOpen === true,
      restoreFocus: false,
    });
  }

  if (retainedMiniStage) {
    const nextMiniStage = app.querySelector(".codex-mini-live-stage");
    const nextOverlay = nextMiniStage?.querySelector(".codex-mini-course-overlay");
    const previousOverlay = retainedMiniStage.querySelector(".codex-mini-course-overlay");
    if (nextOverlay && previousOverlay) previousOverlay.replaceWith(nextOverlay);
    nextMiniStage?.replaceWith(retainedMiniStage);
    const workspace = app.querySelector(".codex-mini-live");
    if (workspace) workspace.dataset.codexMiniState = "ready";
  }

  syncTrainingPluginCatalogState(app);
  if (state.phase === "practice") {
    void mountCodexMini(step);
    if (state.hostedPreview !== true
      && typeof initializeCodexWorkspace === "function"
      && (step.id !== "project" || Boolean(state.codexSessionId))) {
      void initializeCodexWorkspace();
    }
  }

  if (typeof syncRepositoryTabLabelOverflow === "function") syncRepositoryTabLabelOverflow(app, true);
  if (typeof syncRepositoryTabLabelOverflow === "function"
    && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => syncRepositoryTabLabelOverflow(app, true));
  }

}

function refreshCurrentLab() {
  const routeIndex = getRouteIndex();
  const host = app.querySelector('.codex-mini-host[data-codex-mini="ready"]');
  const shell = app.querySelector(".lab-shell");

  if (routeIndex === null || !host || !shell) {
    render();
    return;
  }

  const step = STEPS[routeIndex];
  const template = document.createElement("template");
  template.innerHTML = renderLab(step, routeIndex).trim();
  const nextShell = template.content.firstElementChild;
  if (!nextShell) return;

  const previousLessonScroll = shell.querySelector(".lesson-scroll")?.scrollTop || 0;
  shell.className = nextShell.className;
  shell.dataset.phase = state.phase;
  shell.dataset.mobileView = state.mobileView;
  const currentMain = shell.querySelector(".lab-main");
  if (currentMain) currentMain.dataset.mobileView = state.mobileView;

  for (const selector of [
    ".lab-header",
    ".journey-footer",
    ".mobile-switcher",
    ".lesson-panel",
    ".practice-task-card",
    ".practice-assignment-overlay",
    ".course-skip-lesson",
    "[data-course-hint-slot]",
    ".practice-learn-more",
    ".codex-mini-fallback",
  ]) {
    const current = shell.querySelector(selector);
    const replacement = nextShell.querySelector(selector);
    if (current && replacement) current.replaceWith(replacement);
  }

  const currentPracticeTicket = shell.querySelector(".practice-linear-card");
  const nextPracticeTicket = nextShell.querySelector(".practice-linear-card");
  currentPracticeTicket?.remove();
  if (nextPracticeTicket) {
    shell.querySelector(".practice-learn-more")?.before(nextPracticeTicket);
  }

  shell.querySelector(".completion-overlay")?.remove();

  const currentModeMenu = shell.querySelector(".codex-mode-menu");
  const nextModeMenu = nextShell.querySelector(".codex-mode-menu");
  if (currentModeMenu && nextModeMenu) currentModeMenu.replaceWith(nextModeMenu);
  else if (currentModeMenu) currentModeMenu.remove();
  else if (nextModeMenu) shell.querySelector(".practice-screen")?.append(nextModeMenu);

  const currentRestartDialog = shell.querySelector(".journey-restart-dialog");
  const nextRestartDialog = nextShell.querySelector(".journey-restart-dialog");
  if (currentRestartDialog && nextRestartDialog) currentRestartDialog.replaceWith(nextRestartDialog);
  else if (currentRestartDialog) currentRestartDialog.remove();
  else if (nextRestartDialog) shell.append(nextRestartDialog);

  const currentProjectPicker = shell.querySelector("[data-codex-project-picker]");
  const nextProjectPicker = nextShell.querySelector("[data-codex-project-picker]");
  if (currentProjectPicker && nextProjectPicker) currentProjectPicker.replaceWith(nextProjectPicker);
  else if (currentProjectPicker) currentProjectPicker.remove();
  else if (nextProjectPicker) shell.querySelector(".codex-mini-live")?.append(nextProjectPicker);

  const lessonScroll = shell.querySelector(".lesson-scroll");
  if (lessonScroll) lessonScroll.scrollTop = previousLessonScroll;
  document.title = `${step.title} | Codex | ChatGPT Learn`;
  void mountCodexMini(step);
}

function renderHeader() {
  const inDocs = typeof location !== "undefined" && location.hash === "#/intro";

  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="https://learn.chatgpt.com/" aria-label="ChatGPT Learn home">
          ${icon("openai")}
          <span class="brand-label">ChatGPT Learn</span>
        </a>

        <nav class="top-nav${state.menuOpen ? " is-open" : ""}" aria-label="Main navigation">
          <a href="#"${inDocs ? "" : ' aria-current="page"'}>Home</a>
          <a href="https://learn.chatgpt.com/docs">Docs</a>
          <a href="https://learn.chatgpt.com/use-cases">Use cases</a>
          <a href="https://learn.chatgpt.com/resources">Resources</a>
          <button class="mobile-nav-search" type="button" data-action="open-search" aria-controls="header-search-overlay" aria-expanded="${state.searchOpen === true}">${icon("search")} Start searching</button>
        </nav>

        <div class="header-actions">
          <button class="ghost-button header-search" type="button" data-action="open-search" aria-label="Search the docs" aria-controls="header-search-overlay" aria-expanded="${state.searchOpen === true}">
            <span class="header-search-label">Start searching</span>
            ${icon("search", "header-search-icon")}
          </button>
          <a class="primary-button header-cta" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" aria-label="Try ChatGPT"><span class="header-cta-label">Try ChatGPT</span>${icon("arrow-up-right")}</a>
          <button class="menu-toggle" type="button" aria-label="Toggle navigation" data-action="toggle-menu" aria-expanded="${state.menuOpen}">
            ${icon(state.menuOpen ? "close" : "list")}
          </button>
        </div>
      </div>
    </header>`;
}

function findLearnSearchResults(query = state.searchQuery || "") {
  const entries = [
    {
      title: "Welcome to Codex",
      description: COURSE.description,
      category: "Course introduction",
      href: "#/intro",
      index: -1,
      keywords: "overview getting started course introduction beginner",
    },
    ...STEPS.map((step, index) => ({
      title: step.title,
      description: step.description,
      category: `Lesson ${index + 1} · ${step.stage}`,
      href: `#/lab/${index + 1}`,
      index,
      keywords: [step.id, step.concept, step.instruction, ...(step.checklist || [])].join(" "),
    })),
  ];
  const terms = String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return entries.slice(0, 5);

  return entries.filter((entry) => {
    const searchable = [entry.title, entry.description, entry.category, entry.keywords]
      .join(" ")
      .toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

function renderLearnSearchResults(query = state.searchQuery || "") {
  const normalized = String(query).trim();
  const matches = findLearnSearchResults(normalized);
  const suggestions = ["Connect Codex", "Implement a change", "Review changes", "Run tests"];

  return `${normalized ? "" : `<div class="learn-search-suggestions">
    <p class="learn-search-label">Suggested</p>
    <div class="learn-search-chips">
      ${suggestions.map((suggestion) => `<button class="learn-search-chip" type="button" data-action="use-search-suggestion" data-query="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`).join("")}
    </div>
  </div>`}
  ${normalized && matches.length ? `<p class="learn-search-label">Results</p>
    <div class="learn-search-list">
      ${matches.map((result) => `<a class="learn-search-result" href="${escapeHtml(result.href)}" data-action="open-search-result" data-step-index="${result.index}">
        <span class="learn-search-result-title">${escapeHtml(result.title)}</span>
        <span class="learn-search-result-description">${escapeHtml(result.description)}</span>
        <span class="learn-search-result-category">${escapeHtml(result.category)}</span>
      </a>`).join("")}
    </div>` : normalized
      ? '<p class="learn-search-empty" role="status">No matches yet. Try a different keyword.</p>'
      : ""}`;
}

function renderDocsAgentBody() {
  const messages = Array.isArray(state.docsAgentMessages) ? state.docsAgentMessages : [];
  const suggestions = [
    { label: "Ask a question", iconName: "lightbulb", prompt: "What will I learn in this Codex course?" },
    { label: "Find a page", iconName: "search", prompt: "Which lesson explains how to connect Codex to my tools?" },
    {
      label: "Build a custom guide",
      iconName: "terminal",
      prompt: "Build a short guide through this Codex course, from opening a project to reviewing the pull request.",
    },
  ];

  if (!messages.length && !state.docsAgentPending && !state.docsAgentError) {
    return `<h2 class="ask-ai-greeting">What can I help you with?</h2>
      <p class="ask-ai-scope">Ask about this course, its lessons, or Blossom Bank.</p>
      <div class="ask-ai-suggestions">
        ${suggestions.map(({ label, prompt, iconName }) => `<button class="ask-ai-suggestion" type="button" data-action="ask-ai-suggestion" data-prompt="${escapeHtml(prompt)}">${icon(iconName)}<span>${escapeHtml(label)}</span></button>`).join("")}
      </div>`;
  }

  const conversation = messages.map(({ role, content }) => `<div class="ask-ai-message ask-ai-message-${role === "assistant" ? "assistant" : "user"}">
    <p>${escapeHtml(content).replace(/\n/g, "<br />")}</p>
  </div>`).join("");
  const pending = state.docsAgentPending
    ? '<p class="ask-ai-loading" role="status">Asking Codex…</p>'
    : "";
  const failure = state.docsAgentError
    ? `<p class="ask-ai-error" role="alert">${escapeHtml(state.docsAgentError)}</p>`
    : "";

  return `<div class="ask-ai-messages" role="log" aria-live="polite">${conversation}${pending}${failure}</div>`;
}

function renderHostedPreviewInstructions() {
  if (state.hostedPreview !== true) return "";

  const open = state.hostedPreviewInstructionsOpen === true;
  const copied = state.hostedPreviewInstructionsCopied === true;
  const commands = HOSTED_PREVIEW_COMMANDS.map((command) => escapeHtml(command)).join("\n");

  return `
    <button class="hosted-preview-launcher" type="button" data-action="open-hosted-preview-instructions" aria-haspopup="dialog" aria-controls="hosted-preview-dialog" aria-expanded="${open}"${open ? " hidden" : ""}>${icon("terminal")}<span>Run locally</span></button>
    <div class="hosted-preview-overlay"${open ? "" : " hidden"}>
      <div class="hosted-preview-backdrop" data-action="close-hosted-preview-instructions" aria-hidden="true"></div>
      <section class="hosted-preview-dialog" id="hosted-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="hosted-preview-title" aria-describedby="hosted-preview-summary hosted-preview-prerequisites" tabindex="-1">
        <header class="hosted-preview-header">
          <div>
            <p class="hosted-preview-eyebrow">Hosted preview</p>
            <h2 id="hosted-preview-title">Run this course with Codex</h2>
          </div>
          <button class="icon-button hosted-preview-close" type="button" data-action="close-hosted-preview-instructions" aria-label="Close local setup instructions">${icon("close")}</button>
        </header>
        <div class="hosted-preview-body">
          <p class="hosted-preview-summary" id="hosted-preview-summary">You can explore every lesson in this hosted preview. Live Codex, repository edits, commands, tests, and pull requests run only from the local version.</p>
          <p>Open a regular Terminal window and make sure the Codex desktop app is open and signed in. The local launcher uses your existing Codex sign-in and prepares an isolated copy of the Blossom Bank project. Your original checkout stays untouched.</p>
          <p class="hosted-preview-repository"><a href="https://github.com/openai/learn-codex-experience" target="_blank" rel="noopener noreferrer">Open the training repository${icon("external")}</a></p>
          <div class="hosted-preview-command-panel">
            <div class="hosted-preview-command-header">
              <span>Terminal</span>
              <button class="hosted-preview-copy" type="button" data-action="copy-hosted-preview-instructions" aria-describedby="hosted-preview-copy-status">${copied ? icon("check") : ""}<span>${copied ? "Copied" : "Copy commands"}</span></button>
            </div>
            <pre class="hosted-preview-commands" id="hosted-preview-commands" tabindex="0" aria-label="Local launch commands"><code>${commands}</code></pre>
            <p class="hosted-preview-copy-status" id="hosted-preview-copy-status" role="status" aria-live="polite">${copied ? "Commands copied to the clipboard." : ""}</p>
          </div>
          <p>Open the URL printed by <code>npm run lab</code>. If port 4173 is already in use, the launcher chooses another port; do not reuse an existing course tab.</p>
          <p class="hosted-preview-prerequisites" id="hosted-preview-prerequisites"><strong>Before you start:</strong> Install Node.js 20.19+ (22.12+ or 24+ recommended) and Git. Sign in to the Codex desktop app or CLI, and confirm that you can access the private Blossom Bank source.</p>
        </div>
        <footer class="hosted-preview-actions">
          <button class="primary-button hosted-preview-continue" type="button" data-action="close-hosted-preview-instructions">Continue preview</button>
        </footer>
      </section>
    </div>`;
}

function renderGlobalChrome() {
  const searchOpen = state.searchOpen === true;
  const agentOpen = state.docsAgentOpen === true;
  const pending = state.docsAgentPending === true;

  return `<div class="learn-global-chrome">
    <div class="learn-search-overlay" id="header-search-overlay"${searchOpen ? "" : " hidden"}>
      <button class="learn-search-backdrop" type="button" data-action="close-search" aria-label="Close search"></button>
      <section class="learn-search-dialog" role="dialog" aria-modal="true" aria-labelledby="learn-search-title">
        <h2 class="sr-only" id="learn-search-title">Search the docs</h2>
        <div class="learn-search-field">
          ${icon("search")}
          <input class="learn-search-input" id="learn-search-input" type="search" aria-label="Search docs" placeholder="Start searching" autocomplete="off" value="${escapeHtml(state.searchQuery || "")}" />
          <button class="icon-button learn-search-close" type="button" data-action="close-search" aria-label="Close search">${icon("close")}</button>
        </div>
        <div class="learn-search-results">${renderLearnSearchResults()}</div>
      </section>
    </div>

    ${renderHostedPreviewInstructions()}
  </div>`;
}

function syncHostedPreviewInstructions(options = {}) {
  const overlay = app.querySelector(".hosted-preview-overlay");
  const launcher = app.querySelector(".hosted-preview-launcher");
  if (!overlay || !launcher) return;

  const open = state.hostedPreview === true
    && state.hostedPreviewInstructionsOpen === true;
  overlay.hidden = !open;
  launcher.hidden = open;
  launcher.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("hosted-preview-open", open);

  if (open) {
    try {
      localStorage.setItem(HOSTED_PREVIEW_SEEN_KEY, "true");
    } catch {
      // The disclosure remains usable when storage is unavailable.
    }
    if (options.focus !== false) {
      overlay.querySelector(".hosted-preview-close")?.focus?.();
    }
    return;
  }

  if (options.restoreFocus !== false) {
    const returnTarget = hostedPreviewInstructionsReturnFocus;
    hostedPreviewInstructionsReturnFocus = null;
    if (returnTarget && returnTarget.isConnected !== false) returnTarget.focus?.();
  }
}

function openHostedPreviewInstructions(trigger = null) {
  if (state.hostedPreview !== true) return false;

  if (state.searchOpen === true) {
    state.searchOpen = false;
    state.searchQuery = "";
    syncLearnSearch({ restoreFocus: false });
  }
  if (state.docsAgentOpen === true) {
    state.docsAgentOpen = false;
    syncDocsAgent({ restoreFocus: false });
  }

  hostedPreviewInstructionsReturnFocus = trigger
    || (document.activeElement !== document.body ? document.activeElement : null);
  state.hostedPreviewInstructionsOpen = true;
  state.hostedPreviewInstructionsCopied = false;
  syncHostedPreviewInstructions({ focus: true });
  return true;
}

function closeHostedPreviewInstructions(options = {}) {
  if (state.hostedPreviewInstructionsOpen !== true) return false;
  state.hostedPreviewInstructionsOpen = false;
  state.hostedPreviewInstructionsCopied = false;
  syncHostedPreviewInstructions({ restoreFocus: options.restoreFocus !== false });
  return true;
}

async function copyHostedPreviewInstructions() {
  if (state.hostedPreview !== true || state.hostedPreviewInstructionsOpen !== true) return false;

  try {
    await navigator.clipboard.writeText(HOSTED_PREVIEW_COMMANDS.join("\n"));
    state.hostedPreviewInstructionsCopied = true;
    const button = app.querySelector('[data-action="copy-hosted-preview-instructions"]');
    if (button) button.innerHTML = `${icon("check")}<span>Copied</span>`;
    const status = app.querySelector(".hosted-preview-copy-status");
    if (status) status.textContent = "Commands copied to the clipboard.";
    return true;
  } catch {
    state.hostedPreviewInstructionsCopied = false;
    const status = app.querySelector(".hosted-preview-copy-status");
    if (status) status.textContent = "Copy failed. Select the commands and copy them manually.";
    return false;
  }
}

function trapHostedPreviewFocus(event) {
  const dialog = app.querySelector(".hosted-preview-dialog");
  if (!dialog || event.key !== "Tab") return false;

  const focusable = [...dialog.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => element.hidden !== true && element.getAttribute?.("aria-hidden") !== "true");
  if (!focusable.length) {
    event.preventDefault();
    dialog.focus?.();
    return true;
  }

  const first = focusable[0];
  const last = focusable.at(-1);
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus?.();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus?.();
  }
  return true;
}

function syncLearnSearch(options = {}) {
  const overlay = app.querySelector(".learn-search-overlay");
  if (!overlay) return;

  const open = state.searchOpen === true;
  overlay.hidden = !open;
  for (const trigger of app.querySelectorAll('[data-action="open-search"]')) {
    trigger.setAttribute("aria-expanded", String(open));
  }
  document.body.classList.toggle("learn-search-open", open);

  const results = overlay.querySelector(".learn-search-results");
  if (results) results.innerHTML = renderLearnSearchResults();

  const input = overlay.querySelector(".learn-search-input");
  if (input && input.value !== state.searchQuery) input.value = state.searchQuery || "";
  if (open && options.focus !== false) input?.focus();
  if (!open && options.restoreFocus !== false) {
    (state.searchReturnFocus || app.querySelector(".header-search"))?.focus?.();
    state.searchReturnFocus = null;
  }
}

function syncDocsAgent(options = {}) {
  const launcher = app.querySelector(".ask-ai-launcher");
  const drawer = app.querySelector(".ask-ai-drawer");
  if (!launcher || !drawer) return;

  const open = state.docsAgentOpen === true;
  launcher.hidden = open;
  launcher.setAttribute("aria-expanded", String(open));
  drawer.hidden = !open;
  document.body.classList.toggle("ask-ai-open", open);

  const body = drawer.querySelector(".ask-ai-body");
  if (body) {
    body.innerHTML = renderDocsAgentBody();
    body.scrollTop = body.scrollHeight;
  }

  const input = drawer.querySelector(".ask-ai-input");
  const submit = drawer.querySelector(".ask-ai-send");
  if (input) input.disabled = state.docsAgentPending === true;
  if (submit) submit.disabled = state.docsAgentPending === true || !input?.value.trim();
  if (open && options.focus === true) input?.focus();
  if (!open && options.restoreFocus !== false) launcher.focus?.();
}

function toggleLearnSearch(open, trigger = null) {
  if (open && state.docsAgentOpen) {
    state.docsAgentOpen = false;
    syncDocsAgent({ restoreFocus: false });
  }

  if (open) {
    state.searchReturnFocus = trigger || app.querySelector(".header-search");
    if (state.menuOpen) {
      state.menuOpen = false;
      app.querySelector(".top-nav")?.classList.remove("is-open");
      const menuToggle = app.querySelector(".menu-toggle");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.querySelector("use")?.setAttribute("href", "#icon-list");
    }
  } else {
    state.searchQuery = "";
  }

  state.searchOpen = open === true;
  syncLearnSearch();
}

function toggleDocsAgent(open, options = {}) {
  if (open && state.searchOpen) {
    state.searchOpen = false;
    state.searchQuery = "";
    syncLearnSearch({ restoreFocus: false });
  }

  state.docsAgentOpen = open === true;
  syncDocsAgent({ focus: open === true, restoreFocus: options.restoreFocus !== false });
}

async function askDocsAgent(question) {
  const prompt = typeof question === "string" ? question.trim().slice(0, 4_000) : "";
  if (!prompt || state.docsAgentPending) return false;
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return false;
  }

  const previous = Array.isArray(state.docsAgentMessages) ? state.docsAgentMessages : [];
  const history = previous.slice(-16).map(({ role, content }) => ({
    role: role === "assistant" ? "assistant" : "user",
    content: String(content).slice(0, 4_000),
  }));

  state.docsAgentMessages = [...previous, { role: "user", content: prompt }];
  state.docsAgentPending = true;
  state.docsAgentError = "";
  state.docsAgentRequestId = (state.docsAgentRequestId || 0) + 1;
  const requestId = state.docsAgentRequestId;

  const input = app.querySelector(".ask-ai-input");
  if (input) input.value = "";
  syncDocsAgent({ focus: false });

  const courseLessons = STEPS.map((step, index) => `${index + 1}. ${step.title}`).join("; ");
  const request = {
    prompt: [
      "You are the ChatGPT Learn assistant for this interactive Codex course.",
      "Answer the learner’s question naturally using the supplied course and Blossom Bank context.",
      `Course lessons: ${courseLessons}.`,
      "Use the prepared course information naturally. If asked how the course works, accurately distinguish the local project from its prepared Linear, GitHub, and banking data.",
      "This help request is read-only. Never edit files, execute commands, call tools, or claim to have searched documentation.",
      `Learner question: ${prompt}`,
    ].join("\n"),
    stage: "Course help",
    mode: "agent",
    completed: [],
    history,
    executionApproved: false,
    verificationApproved: false,
  };

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(state.docsAgentSessionId || "")
    && state.docsAgentSessionId !== state.codexSessionId) {
    request.sessionId = state.docsAgentSessionId;
  }

  try {
    const response = await fetch("/api/codex", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || "Codex couldn’t answer right now. Please try again.");
    }

    const reply = typeof result?.text === "string" ? result.text.trim() : "";
    if (!reply) throw new Error("Codex returned an empty answer. Please try again.");

    const sessionId = typeof result?.sessionId === "string" ? result.sessionId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
      || sessionId === state.codexSessionId
      || (state.docsAgentSessionId && sessionId !== state.docsAgentSessionId)) {
      throw new Error("The docs agent returned an invalid or shared course session.");
    }
    if (state.docsAgentRequestId !== requestId) return false;

    state.docsAgentSessionId = sessionId;
    state.docsAgentMessages = [...state.docsAgentMessages, { role: "assistant", content: reply }];
    state.docsAgentPending = false;
    syncDocsAgent({ focus: false });
    return true;
  } catch (error) {
    if (state.docsAgentRequestId !== requestId) return false;
    state.docsAgentPending = false;
    state.docsAgentError = error instanceof Error
      ? error.message
      : "Codex couldn’t answer right now. Please try again.";
    syncDocsAgent({ focus: false });
    return false;
  }
}

function resetDocsAgent() {
  state.docsAgentRequestId = (state.docsAgentRequestId || 0) + 1;
  state.docsAgentMessages = [];
  state.docsAgentSessionId = "";
  state.docsAgentPending = false;
  state.docsAgentError = "";
  const input = app.querySelector(".ask-ai-input");
  if (input) input.value = "";
  syncDocsAgent({ focus: true });
}

function renderCourseIntro() {
  const introduction = { id: "intro", title: "Introduction" };

  return `
    <main class="lab-shell phase-intro" data-phase="intro" data-mobile-view="lesson">
      ${renderJourneyHeader(introduction, -1)}
      <section class="course-intro intro-screen" aria-labelledby="intro-title">
        <div class="course-intro-shell intro-screen-shell">
          <header class="intro-heading">
            <h1 class="intro-eyebrow" id="intro-title">${icon("code")} Introduction</h1>
            <div class="intro-meta" aria-label="Course details">
              <span class="intro-meta-item">${icon("list")} ${STEPS.length} guided steps</span>
              <span class="intro-meta-item">${icon("clock")} ${escapeHtml(COURSE.duration)}</span>
              <span class="intro-meta-item">${icon("shield")} Hands-on practice</span>
            </div>
          </header>

          <figure class="intro-video-frame">
            <div class="intro-video-stage" data-video-slot="devex-welcome" data-video-placeholder="true" role="img" aria-label="Placeholder for a welcome video from Developer Experience; video coming soon">
              <div class="intro-video-backdrop" aria-hidden="true"></div>
              <span class="intro-video-placeholder">Welcome video coming soon</span>
              <div class="intro-video-content">
                <img class="intro-video-mark" src="./codex-mark.png" alt="" aria-hidden="true" />
                <span class="intro-video-eyebrow">Developer Experience</span>
                <h2 class="intro-video-title">Welcome to Codex</h2>
                <p class="intro-video-subtitle">Learn what Codex does and what you will build in this course.</p>
              </div>
              <div class="intro-video-controls" aria-hidden="true">
                <span class="intro-video-play" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 5.5v9l7-4.5-7-4.5Z" /></svg></span>
                <span class="intro-video-timeline"><span class="intro-video-progress"></span></span>
                <span class="intro-video-time">Coming soon</span>
              </div>
            </div>
          </figure>
        </div>
      </section>
      ${state.restartDialogOpen ? renderJourneyRestartDialog() : ""}
    </main>`;
}

function renderCourseSummary() {
  const summary = { id: "summary", title: "Course summary" };
  const completedLessons = STEPS.reduce((count, step) => count + Number(isComplete(step.id)), 0);
  const courseComplete = completedLessons === STEPS.length;
  const documentation = {
    project: { label: "Projects and source folders", url: "https://learn.chatgpt.com/docs/projects" },
    connect: { label: "Plugins and connected tools", url: "https://learn.chatgpt.com/docs/plugins" },
    ticket: { label: "Branches and Git worktrees", url: "https://learn.chatgpt.com/docs/environments/git-worktrees" },
    plan: { label: "Plan mode and Codex features", url: "https://learn.chatgpt.com/docs/features" },
    build: { label: "Approvals and Codex features", url: "https://learn.chatgpt.com/docs/features" },
    test: { label: "Verification and Codex features", url: "https://learn.chatgpt.com/docs/features" },
    pr: { label: "Pull requests and Git worktrees", url: "https://learn.chatgpt.com/docs/environments/git-worktrees" },
  };
  const milestones = [
    {
      title: "Set up the project",
      steps: ["project", "connect", "ticket"],
      complete: "Opened Blossom Bank, connected the prepared Linear integration, and created a feature branch for ENG-248.",
    },
    {
      title: "Build and review",
      steps: ["build"],
      complete: "Requested a minimal change, inspected the first heading diff, and sent the requested revision.",
    },
    {
      title: "Verify and prepare a pull request",
      steps: ["test", "pr"],
      complete: "Reviewed the final source, opened the staged preview, and published a training pull request without changing GitHub.",
    },
  ];
  const renderLesson = (stepId) => {
    const step = STEPS.find((candidate) => candidate.id === stepId);
    if (!step) return "";

    const guide = typeof practiceGuides === "object" ? practiceGuides[step.id] : null;
    const tasks = Array.isArray(guide?.tasks)
      ? guide.tasks
      : Array.isArray(step.checklist) ? step.checklist : [];
    const completed = isComplete(step.id);
    const recordedProgress = Number.isSafeInteger(state.taskProgress?.[step.id])
      ? state.taskProgress[step.id]
      : 0;
    const completedActions = completed
      ? tasks.length
      : Math.max(0, Math.min(recordedProgress, tasks.length));
    const visibleActions = completedActions > 0 ? tasks.slice(0, completedActions) : tasks;
    const history = Array.isArray(state.conversations?.[step.id])
      ? state.conversations[step.id]
      : [];
    const actualPrompt = [...history].reverse().find((entry) =>
      typeof entry?.prompt === "string" && entry.prompt.trim())?.prompt.trim() || "";
    const recordedComments = [...history].reverse()
      .flatMap((entry) => Array.isArray(entry?.reviewComments) ? entry.reviewComments : []);
    const savedComments = step.id === "build" && Array.isArray(state.diffComments)
      ? [...state.diffComments].reverse().filter((comment) => comment?.stepId === "build")
      : [];
    const actualComment = [...recordedComments, ...savedComments]
      .find((comment) => typeof comment?.text === "string" && comment.text.trim())?.text.trim() || "";
    const samplePrompt = guide?.details?.find((detail) =>
      typeof detail?.example === "string" && detail.example.trim())?.example.trim()
      || guide?.prompts?.find((prompt) => typeof prompt === "string" && prompt.trim())?.trim()
      || (!guide && step.id !== "project"
        && typeof step.prompt === "string" ? step.prompt.trim() : "");
    const prompt = actualPrompt || actualComment || samplePrompt;
    const promptLabel = actualPrompt
      ? "Prompt you used"
      : actualComment ? "Review comment you added" : "Sample prompt";
    const status = completed
      ? "Completed"
      : completedActions > 0 ? `${completedActions} / ${tasks.length} actions` : "Not started";
    const details = documentation[step.id];
    const stepIndex = STEPS.findIndex((candidate) => candidate.id === step.id) + 1;
    const workspace = completed && step.id === "build"
      && typeof verifiedCodexWorkspace === "function"
      ? verifiedCodexWorkspace()
      : null;
    const changedFiles = Array.isArray(workspace?.changedFiles)
      ? workspace.changedFiles.slice(0, 6).map((file) => file.path).filter(Boolean)
      : [];
    const verification = completed && step.id === "test"
      && typeof verifiedCodexVerification === "function"
      ? verifiedCodexVerification(state.verificationResult, { allowFailed: true })
      : null;

    return `<li class="course-summary-lesson${completed ? " is-complete" : ""}">
      <details class="course-summary-lesson-disclosure" data-summary-step="${escapeHtml(step.id)}"${completed || completedActions > 0 ? " open" : ""}>
        <summary class="course-summary-lesson-toggle">
          <span class="course-summary-lesson-number">${String(stepIndex).padStart(2, "0")}</span>
          <span class="course-summary-lesson-title">${escapeHtml(step.title)}</span>
          <span class="course-summary-lesson-status">${escapeHtml(status)}</span>
          <span class="course-summary-lesson-chevron" aria-hidden="true">${icon("chevron-down")}</span>
        </summary>
        <div class="course-summary-lesson-details">
          <p class="course-summary-lesson-description">${escapeHtml(completed
            ? guide?.summary || step.success || step.description
            : step.description)}</p>
          ${visibleActions.length ? `<section class="course-summary-actions" aria-label="${completedActions > 0 ? "Completed actions" : "Upcoming actions"}">
            <h3 class="course-summary-detail-heading">${completedActions > 0 ? "Actions you took" : "What you’ll practice"}</h3>
            <ul class="course-summary-action-list">${visibleActions.map((action) =>
              `<li>${escapeHtml(action)}</li>`).join("")}</ul>
          </section>` : ""}
          ${changedFiles.length ? `<section class="course-summary-observations">
            <h3 class="course-summary-detail-heading">Files you changed</h3>
            <ul class="course-summary-observation-list">${changedFiles.map((path) =>
              `<li><code>${escapeHtml(path)}</code></li>`).join("")}</ul>
          </section>` : ""}
          ${prompt ? `<section class="course-summary-prompt">
            <h3 class="course-summary-detail-heading">${promptLabel}</h3>
            <pre class="course-summary-prompt-example"><code>${escapeHtml(prompt)}</code></pre>
          </section>` : ""}
          <div class="course-summary-lesson-links">
            <a class="course-summary-lesson-revisit" href="#/lab/${stepIndex}">${completed ? "Revisit lesson" : "Open lesson"}</a>
            ${details ? `<a class="course-summary-lesson-link" href="${escapeHtml(details.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(details.label)} ${icon("arrow-up-right")}</a>` : ""}
          </div>
        </div>
      </details>
    </li>`;
  };

  return `
    <main class="lab-shell phase-intro phase-summary" data-phase="summary" data-mobile-view="lesson">
      ${renderJourneyHeader(summary, STEPS.length)}
      <section class="course-summary" aria-labelledby="course-summary-title">
        <div class="course-summary-shell">
          <header class="course-summary-heading">
            <span class="course-summary-icon" aria-hidden="true">${icon(courseComplete ? "check" : "code")}</span>
            <p class="course-summary-eyebrow">${courseComplete ? "Course complete" : "Your progress"}</p>
            <h1 class="course-summary-title" id="course-summary-title">${courseComplete
              ? "From ticket to tested code."
              : "Your Codex learning journey."}</h1>
            <p class="course-summary-introduction">${courseComplete
              ? "You guided Codex through a real development workflow while keeping every important decision in your hands."
              : `You have completed ${completedLessons} of ${STEPS.length} lessons. Your recap updates only when you complete each step.`}</p>
          </header>

          <ol class="course-summary-milestones" aria-label="Your completed development workflow">
            ${milestones.map((milestone, index) => {
              const count = milestone.steps.filter((stepId) => isComplete(stepId)).length;
              const finished = count === milestone.steps.length;
              return `<li class="course-summary-milestone${finished ? " is-complete" : ""}">
                <span class="course-summary-milestone-marker" aria-hidden="true">${finished ? icon("check") : String(index + 1).padStart(2, "0")}</span>
                <div class="course-summary-milestone-copy">
                  <h2 class="course-summary-milestone-title">${escapeHtml(milestone.title)}</h2>
                  <p class="course-summary-milestone-description">${finished
                    ? escapeHtml(milestone.complete)
                    : `${count} of ${milestone.steps.length} lessons completed.`}</p>
                  <ol class="course-summary-lessons" aria-label="${escapeHtml(milestone.title)} lessons">${milestone.steps.map(renderLesson).join("")}</ol>
                </div>
                <span class="course-summary-milestone-status">${finished ? "Completed" : `${count} / ${milestone.steps.length}`}</span>
              </li>`;
            }).join("")}
          </ol>

          <p class="course-summary-boundary">Linear and pull-request publishing use prepared course data. Your external accounts and original repository remain unchanged.</p>
          <a class="course-summary-docs" href="https://learn.chatgpt.com/docs/features" target="_blank" rel="noopener noreferrer">Explore the Codex documentation ${icon("arrow-up-right")}</a>
        </div>
      </section>
      ${state.restartDialogOpen ? renderJourneyRestartDialog() : ""}
    </main>`;
}

function renderLanding() {
  return `
    ${renderHeader()}
    <main class="landing">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">${icon("code")} Interactive Codex course</p>
            <h1 class="hero-title" id="hero-title">Learn how to<br />use Codex</h1>
            <p class="hero-description">
              Open a local project, connect Linear, and follow a homepage-heading change from implementation to review.
              Finish by opening a pull request.
            </p>
            <div class="hero-actions">
              <button class="primary-button" type="button" data-action="start-course">
                ${state.completed.size ? "Continue the course" : "Start the course"}
                ${icon("arrow-right")}
              </button>
              <a class="secondary-button" href="#curriculum">See the course steps</a>
            </div>
            <div class="course-stats" aria-label="Course details">
              <span class="stats-item">${icon("clock")} ${escapeHtml(COURSE.duration)}</span>
              <span class="stats-item">${icon("list")} ${STEPS.length} guided steps</span>
              <span class="stats-item">${icon("shield")} Hands-on practice</span>
            </div>
          </div>
          ${renderProductDemo()}
        </div>
      </section>

      <section class="tracks-section" aria-labelledby="outcomes-heading">
        <div class="section-heading">
          <h2 id="outcomes-heading">What you’ll learn</h2>
          <p>Learn how to move from a Linear ticket to tested code and a pull request.</p>
        </div>
        <div class="track-grid">
          <article class="track-card featured">
            <div class="track-icon">${icon("search")}</div>
            <h3>Find your ticket and prepare the repo</h3>
            <p>Connect Linear, find your issue, and create a feat/ branch from staging.</p>
          </article>
          <article class="track-card">
            <div class="track-icon">${icon("list")}</div>
            <h3>Ask for a focused change</h3>
            <p>Give Codex a clear implementation request, then inspect the changed files in Review.</p>
          </article>
          <article class="track-card">
            <div class="track-icon">${icon("git-pull")}</div>
            <h3>Review the code and verify the experience</h3>
            <p>Inspect the changed heading, confirm the staged homepage, and publish a training pull request linked to the Linear ticket.</p>
          </article>
        </div>
      </section>

      <section class="course-section" id="curriculum" aria-labelledby="curriculum-heading">
        <div class="section-heading">
          <p class="eyebrow">Course overview</p>
          <h2 id="curriculum-heading">The eight course steps</h2>
          <p>You are joining the engineering team at Blossom Bank. Your first assignment is to shorten the homepage heading.</p>
        </div>
        <div class="curriculum-grid">
          ${STEPS.map((step, index) => `
            <article class="curriculum-card">
              <span class="curriculum-number">${stepNumber(index + 1)} / ${stepNumber(STEPS.length)}</span>
              <div class="curriculum-icon">${icon(stageIcons[step.id])}</div>
              <h3>${escapeHtml(step.title)}</h3>
              <p>${escapeHtml(step.description)}</p>
              <span class="tag">${escapeHtml(step.duration)}</span>
            </article>`).join("")}
        </div>
      </section>

      <section class="work-banner" aria-labelledby="work-heading">
        <div>
          <p class="eyebrow">More courses</p>
          <h2 id="work-heading">Learn how to use ChatGPT at work</h2>
          <p>Future courses will cover research, analysis, documents, and presentations.</p>
        </div>
        <span class="pill">More courses coming soon</span>
      </section>

      <footer class="site-footer">
        <span>${icon("openai", "footer-mark")} OpenAI Learn</span>
        <nav aria-label="Footer navigation">
          <a href="https://learn.chatgpt.com/docs">Codex docs</a>
          <a href="https://learn.chatgpt.com/codex/use-cases">Use cases</a>
          <a href="https://chatgpt.com/codex/">Try Codex</a>
        </nav>
      </footer>
    </main>`;
}

function renderProductDemo() {
  return `
    <div class="product-demo" aria-label="Preview of the interactive Codex workspace">
      <div class="demo-topbar">
        <span class="traffic-lights" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>Blossom Bank workspace</span>
        <span class="demo-topbar-status">Blossom Bank</span>
      </div>
      <div class="demo-body">
        <aside class="demo-sidebar">
          <h3>ChatGPT</h3>
          <span class="demo-sidebar-item">${icon("sparkle")} New task</span>
          <span class="demo-sidebar-item">${icon("plug")} Plugins</span>
          <span class="demo-sidebar-label">Projects</span>
          <span class="demo-sidebar-item active">${icon("code")} Codex</span>
          <span class="demo-sidebar-item demo-issue">ENG-248</span>
        </aside>
        <div class="demo-conversation">
          <div class="demo-message user">Shorten the Blossom Bank homepage heading and update its focused test.</div>
          <div class="demo-message assistant">
            <div class="demo-assistant-label">${icon("openai")} Codex</div>
            <p>I found the Blossom Bank account preview and its existing tests.</p>
            <div class="demo-file-change"><span>HeroVisual.tsx</span><span>source</span></div>
            <div class="demo-file-change"><span>App.test.tsx</span><span>tests</span></div>
            <div class="demo-check">${icon("check")} Tests checked by Codex</div>
          </div>
          <div class="demo-composer"><span>Ask Codex to build something…</span>${icon("arrow-up")}</div>
        </div>
      </div>
    </div>`;
}

function renderLab(step, index) {
  return `
    <main class="lab-shell phase-${state.phase} hands-on-course codex-course" data-phase="${state.phase}" data-mobile-view="${state.mobileView}">
      ${renderJourneyHeader(step, index)}
      ${state.phase === "practice" ? renderPractice(step, index) : renderBriefing(step, index)}
      ${state.restartDialogOpen ? renderJourneyRestartDialog() : ""}
    </main>`;
}

function renderJourneyStageNav(step) {
  const stages = typeof developmentLifecycleStages !== "undefined"
    ? developmentLifecycleStages
    : [];
  const currentStage = stages.find((stage) => stage.stepIds.includes(step.id));
  const lessonIndex = STEPS.findIndex((candidate) => candidate.id === step.id);

  return `
    <nav class="journey-stage-nav" aria-label="Course progress" style="--course-step-count: ${stages.length}">
      <ol class="journey-stage-list">
        ${stages.map((stage, index) => {
          const current = stage === currentStage;
          const complete = trainingRouteParams().get("step") === "end" && trainingRouteParams().get("preview") === "complete"
            || stage.stepIds.every((stepId) => isComplete(stepId));
          const targetIndex = STEPS.findIndex((candidate) => candidate.id === stage.stepIds[0]);
          const label = escapeHtml(stage.label);
          const content = `<span class="journey-stage-marker" aria-hidden="true">${complete ? icon("check") : index + 1}</span><span class="journey-stage-label">${label}</span>`;
          return `<li class="journey-stage-item${current ? " is-current" : ""}${complete ? " is-complete" : ""}">${current
            ? `<span class="journey-stage-current" aria-current="step" aria-label="${label}${complete ? ", completed" : ""}">${content}</span>`
            : `<button class="journey-stage-link" type="button" data-action="jump-to-step" data-step-index="${targetIndex}" aria-label="${label}${complete ? ", completed" : ""}">${content}</button>`}${index < stages.length - 1 ? '<span class="journey-stage-connector" aria-hidden="true"></span>' : ""}</li>`;
        }).join("")}
      </ol>
      ${lessonIndex >= 0 ? `<span class="journey-current-lesson">Lesson ${lessonIndex + 1} of ${STEPS.length} · ${escapeHtml(currentStage?.label || step.stage)}</span>` : ""}
    </nav>`;
}

function renderJourneyHeader(step, index) {
  return `
    <header class="journey-header lab-header" aria-label="Course navigation">
      <button class="journey-nav-button journey-header-back" type="button" data-action="exit-training" aria-label="Return to training home">${icon("arrow-left")}<span class="journey-nav-label">Back</span></button>
      ${renderJourneyStageNav(step)}
      <div class="journey-header-actions">
        <button class="journey-nav-button course-tooltip-trigger" type="button" data-action="go-to-walkthroughs" aria-label="Go to walkthroughs" aria-describedby="walkthrough-tooltip"><span class="course-walkthrough-icon" aria-hidden="true"></span><span id="walkthrough-tooltip" role="tooltip">Go to walkthroughs</span></button>
        <button class="journey-nav-button journey-restart course-tooltip-trigger" type="button" data-action="confirm-restart" aria-label="Reset training" aria-describedby="reset-tooltip">${icon("rotate-ccw")}<span id="reset-tooltip" role="tooltip">Reset training</span></button>
      </div>
    </header>`;
}

function renderJourneyRestartDialog() {
  return `
    <section class="journey-restart-dialog" role="dialog" aria-modal="true" aria-labelledby="journey-restart-title" aria-describedby="journey-restart-copy">
      <div class="journey-restart-card">
        <h2 class="journey-restart-title" id="journey-restart-title">Reset training?</h2>
        <p class="journey-restart-copy" id="journey-restart-copy">Your completed lessons and practice progress will be cleared. You’ll return to the first lesson.</p>
        <div class="journey-restart-actions">
          <button class="journey-restart-cancel" type="button" data-action="cancel-restart">Cancel</button>
          <button class="primary-button journey-restart-confirm" type="button" data-action="restart">Reset training</button>
        </div>
      </div>
    </section>`;
}

function renderBriefHeroIllustration(step) {
  const verification = typeof verifiedCodexVerification === "function" ? verifiedCodexVerification() : null;
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const actualChangedCount = workspace?.changedFiles.length || 0;
  const pullRequestOpened = typeof isComplete === "function" && isComplete("pr");
  const illustrations = {
    project: `
      <g class="hero-line">
        <rect x="48" y="38" width="463" height="218" rx="12"/>
        <path d="M48 79h463M221 79v177"/>
        <text x="69" y="64" class="hero-text hero-label" stroke="none">Blossom Bank</text>
        <text x="489" y="64" text-anchor="end" class="hero-text hero-caption" stroke="none">LOCAL · MAIN</text>
        <text x="70" y="108" class="hero-text hero-label" stroke="none">Files</text>
        <path d="M79 125v89m0-71h14m-14 29h14m-14 29h14" class="hero-muted"/>
        <text x="103" y="147" class="hero-text hero-mono" stroke="none">src/components</text>
        <text x="103" y="176" class="hero-text hero-mono hero-caption" stroke="none">HeroVisual.tsx</text>
        <text x="103" y="205" class="hero-text hero-mono hero-caption" stroke="none">App.tsx</text>
        <text x="244" y="110" class="hero-text hero-mono hero-label" stroke="none">HeroVisual.tsx</text>
        <path d="M242 130h246"/>
        <text x="247" y="154" class="hero-text hero-mono hero-caption" stroke="none">export function HeroVisual()</text>
        <text x="247" y="182" class="hero-text hero-mono hero-caption" stroke="none">const personalAccounts = [...]</text>
        <text x="247" y="228" class="hero-text hero-caption" stroke="none">Actual isolated source · No changes</text>
      </g>
    `,
    connect: `
      <g class="hero-line">
        <rect x="82" y="36" width="392" height="153" rx="12"/>
        <path d="M82 76h392"/>
        <text x="103" y="62" class="hero-text hero-label" stroke="none">Plugins</text>
        <text x="451" y="61" text-anchor="end" class="hero-text hero-caption" stroke="none">READ-ONLY</text>
        <rect x="102" y="92" width="350" height="74" rx="9"/>
        <rect x="117" y="109" width="39" height="39" rx="8"/>
        <path d="m127 128 9-9 9 9-9 9-9-9Zm9-9 5 5m-14 4 5 5"/>
        <text x="171" y="125" class="hero-text hero-label" stroke="none">Linear</text>
        <text x="171" y="146" class="hero-text hero-caption" stroke="none">Linear</text>
        <rect x="369" y="113" width="72" height="31" rx="15"/>
        <text x="399" y="133" text-anchor="middle" class="hero-text" stroke="none">Connect</text>
      </g>
      <g class="hero-pulse brief-network-node"><circle cx="43" cy="127" r="14"/><path d="M38 124v5m10-5v5m-11 0h12m-6 0v5"/></g>
      <path d="M57 127h25m392 0h17" class="hero-flow brief-network-link"/>
      <g class="brief-network-core"><circle cx="506" cy="127" r="15"/><path d="m500 127 4 4 8-9"/></g>
      <g class="hero-line">
        <rect x="111" y="202" width="344" height="58" rx="9"/>
        <text x="128" y="225" class="hero-text hero-label" stroke="none">Skills</text>
        <text x="128" y="247" class="hero-text hero-caption" stroke="none">Review changes</text>
        <path d="M411 218h23m-23 11h18m-18 11h12"/>
      </g>
      <path d="M455 231h18q13 0 17-12l14-76" class="hero-flow brief-network-link"/>
      <path class="hero-cursor" d="m429 122 4 4-4 4" fill="none"/>
    `,
    ticket: `
      <g class="hero-line">
        <rect x="48" y="34" width="463" height="225" rx="12"/>
        <path d="M48 77h463"/>
        <text x="69" y="61" class="hero-text hero-mono hero-label" stroke="none">Codex activity</text>
        <rect x="391" y="47" width="100" height="20" rx="10"/>
        <text x="441" y="61" text-anchor="middle" class="hero-text hero-caption" stroke="none">LOCAL</text>
        <text x="72" y="108" class="hero-text hero-mono" stroke="none">$ git status --short --branch</text>
        <text x="88" y="130" class="hero-text hero-mono hero-caption" stroke="none">staging · working tree clean</text>
        <text x="72" y="162" class="hero-text hero-mono" stroke="none">$ git switch --no-guess --create …</text>
        <text x="88" y="184" class="hero-text hero-mono hero-caption" stroke="none">Created feat/eng-248-homepage-heading</text>
        <text x="72" y="216" class="hero-text hero-mono" stroke="none">$ git status --short --branch</text>
        <text x="88" y="238" class="hero-text hero-mono hero-caption" stroke="none">feat/eng-248-homepage-heading · clean</text>
      </g>
    `,
    plan: `
      <g class="hero-line">
        <rect x="44" y="37" width="353" height="219" rx="12"/>
        <path d="M44 79h353"/>
        <text x="64" y="63" class="hero-text hero-label" stroke="none">Plan mode</text>
        <text x="376" y="62" text-anchor="end" class="hero-text hero-mono hero-caption" stroke="none">ENG-248</text>
        <text x="67" y="111" class="hero-text hero-mono hero-caption" stroke="none">01</text>
        <text x="99" y="111" class="hero-text" stroke="none">Find the homepage heading and test</text>
        <text x="67" y="147" class="hero-text hero-mono hero-caption" stroke="none">02</text>
        <text x="99" y="147" class="hero-text" stroke="none">Make the first heading revision</text>
        <text x="67" y="183" class="hero-text hero-mono hero-caption" stroke="none">03</text>
        <text x="99" y="183" class="hero-text" stroke="none">Review feedback and final coverage</text>
        <path d="M64 203h312"/>
        <text x="66" y="229" class="hero-text hero-caption" stroke="none">READ-ONLY UNTIL APPROVED</text>
      </g>
      <path d="M397 145h25" class="hero-flow brief-network-link"/>
      <g class="hero-line">
        <rect x="421" y="96" width="103" height="101" rx="10"/>
        <rect x="459" y="116" width="26" height="23" rx="5"/>
        <path d="M465 116v-7a7 7 0 0 1 14 0v7m-7 8v6"/>
        <text x="472" y="163" text-anchor="middle" class="hero-text hero-label" stroke="none">Approve</text>
        <text x="472" y="181" text-anchor="middle" class="hero-text hero-caption" stroke="none">before edits</text>
      </g>
    `,
    build: `
      <g class="hero-line">
        <rect x="58" y="38" width="444" height="222" rx="12"/>
        <path d="M58 77h444M108 91v93M80 195h398"/>
        <rect x="416" y="48" width="66" height="21" rx="10.5"/>
        <rect x="81" y="210" width="177" height="32" rx="8"/>
        <rect x="272" y="210" width="177" height="32" rx="8"/>
        <text x="80" y="63" class="hero-text hero-label" stroke="none">App.tsx</text>
        <text x="449" y="63" text-anchor="middle" class="hero-text hero-caption" stroke="none">${actualChangedCount ? `${actualChangedCount} ${actualChangedCount === 1 ? "file" : "files"}` : "No edits"}</text>
        <text x="83" y="109" class="hero-text hero-mono hero-muted" stroke="none">01</text>
        <text x="83" y="132" class="hero-text hero-mono hero-muted" stroke="none">02</text>
        <text x="83" y="155" class="hero-text hero-mono hero-muted" stroke="none">03</text>
        <text x="83" y="178" class="hero-text hero-mono hero-muted" stroke="none">04</text>
        <text x="126" y="109" class="hero-text hero-mono" stroke="none">Inspect the #hero-title source</text>
        <text x="126" y="132" class="hero-text hero-mono" stroke="none">Apply the first heading revision</text>
        <text x="126" y="155" class="hero-text hero-mono" stroke="none">Open the real Review diff</text>
        <text x="126" y="178" class="hero-text hero-mono" stroke="none">Send the requested revision</text>
        <text x="97" y="231" class="hero-text hero-label" stroke="none">First revision</text>
        <text x="288" y="231" class="hero-text hero-label" stroke="none">Final heading</text>
      </g>
    `,
    review: `
      <g class="hero-line">
        <rect x="58" y="38" width="444" height="224" rx="12"/>
        <path d="M58 77h444M80 112h400M399 157v27"/>
        <rect x="416" y="48" width="66" height="21" rx="10.5"/>
        <rect x="183" y="184" width="296" height="59" rx="8"/>
        <text x="79" y="63" class="hero-text hero-label" stroke="none">Review</text>
        <text x="449" y="63" text-anchor="middle" class="hero-text hero-caption" stroke="none">${actualChangedCount ? `${actualChangedCount} ${actualChangedCount === 1 ? "file" : "files"}` : "No edits"}</text>
        <text x="81" y="101" class="hero-text hero-mono" stroke="none">HeroVisual.tsx</text>
        <text x="414" y="101" class="hero-text hero-mono hero-muted" stroke="none">+${workspace?.totals.additions || 0} -${workspace?.totals.deletions || 0}</text>
        <text x="82" y="138" class="hero-text hero-mono" stroke="none">${actualChangedCount ? "+" : "·"}</text>
        <text x="105" y="138" class="hero-text hero-mono" stroke="none">${actualChangedCount ? "Inspect the changed source" : "No source changes yet"}</text>
        <text x="82" y="161" class="hero-text hero-mono" stroke="none">${actualChangedCount ? "+" : "·"}</text>
        <text x="105" y="161" class="hero-text hero-mono" stroke="none">${actualChangedCount ? "Check accessibility" : "Waiting for approved changes"}</text>
        <text x="199" y="207" class="hero-text hero-label" stroke="none">Review comment</text>
        <text x="199" y="227" class="hero-text hero-caption" stroke="none">Preserve existing account controls.</text>
      </g>
    `,
    test: `
      <g class="hero-line">
        <rect x="59" y="37" width="443" height="226" rx="12"/>
        <path d="M59 76h443M80 156h401M80 230h401"/>
        <rect x="382" y="47" width="99" height="21" rx="10.5"/>
        <text x="80" y="62" class="hero-text hero-label" stroke="none">Final source review</text>
        <text x="431" y="62" text-anchor="middle" class="hero-text hero-caption" stroke="none">READ-ONLY</text>
        <text x="82" y="105" class="hero-text hero-label" stroke="none">src/App.tsx</text>
        <text x="82" y="130" class="hero-text hero-mono hero-caption" stroke="none">Banking that grows with you.</text>
        <text x="82" y="184" class="hero-text hero-label" stroke="none">src/App.test.tsx</text>
        <text x="82" y="208" class="hero-text hero-mono hero-caption" stroke="none">Focused heading coverage</text>
        <text x="82" y="251" class="hero-text hero-caption" stroke="none">Open the staged preview from Codex’s response</text>
      </g>
    `,
    pr: `
      <g class="hero-line">
        <rect x="58" y="38" width="444" height="225" rx="12"/>
        <path d="M58 77h444M80 172h400M80 226h400"/>
        <rect x="357" y="47" width="124" height="21" rx="10.5"/>
        <rect x="80" y="121" width="399" height="37" rx="8"/>
        <rect x="334" y="233" width="145" height="20" rx="10"/>
        <path d="M331 140h30m-7-6 7 6-7 6"/>
        <text x="80" y="63" class="hero-text hero-label" stroke="none">${pullRequestOpened ? "Pull request #184" : "Training pull request"}</text>
        <text x="370" y="62" class="hero-text hero-caption" stroke="none">${pullRequestOpened ? "Ready for review" : "Ready to publish"}</text>
        <text x="81" y="104" class="hero-text hero-mono" stroke="none">ENG-248</text>
        <text x="153" y="104" class="hero-text hero-label" stroke="none">Homepage heading</text>
        <text x="92" y="145" class="hero-text hero-mono hero-caption" stroke="none">feat/eng-248-homepage-heading</text>
        <text x="388" y="145" class="hero-text hero-mono" stroke="none">main</text>
        <text x="84" y="192" class="hero-text hero-caption" stroke="none">Files changed</text>
        <text x="425" y="192" class="hero-text hero-mono" stroke="none">${actualChangedCount} ${actualChangedCount === 1 ? "file" : "files"}</text>
        <text x="84" y="216" class="hero-text hero-caption" stroke="none">Source review</text>
        <text x="414" y="216" class="hero-text hero-mono" stroke="none">${isComplete("test") ? "Complete" : "Pending"}</text>
        <text x="83" y="248" class="hero-text hero-caption" stroke="none">Publish action</text>
        <text x="347" y="247" class="hero-text hero-caption" stroke="none">${pullRequestOpened ? "Prepared" : "Ready to publish"}</text>
      </g>
    `,
  };
  const variant = illustrations[step.id] ? step.id : "connect";
  const viewBox = "24 20 512 260";

  return `
    <svg class="brief-hero-svg brief-network-svg hero-${variant}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      ${illustrations[variant]}
    </svg>`;
}

function renderBriefing(step, index) {
  const narrative = briefingNarratives[step.id];

  return `
    <section class="brief-screen" aria-labelledby="brief-title">
      <div class="brief-inner">
        <div class="brief-editorial">
          <header class="brief-main brief-hero-header">
            <div class="brief-hero-copy">
              <p class="brief-eyebrow">${icon(stageIcons[step.id])} ${escapeHtml(step.stage)}</p>
              <h1 class="brief-title" id="brief-title">${escapeHtml(narrative.headline)}</h1>
              <p class="brief-definition">${escapeHtml(narrative.definition)}</p>
            </div>
            <div class="brief-hero-visual brief-hero-art" aria-hidden="true">${renderBriefHeroIllustration(step)}</div>
          </header>

          <section class="brief-lesson-band brief-understand" aria-labelledby="brief-understand-label">
            <div class="brief-band-rail">
              <span class="brief-band-index" aria-hidden="true">01</span>
              <h2 class="brief-band-label" id="brief-understand-label">Understand</h2>
            </div>
            <div class="brief-band-content">
              <p class="brief-foundation">${escapeHtml(narrative.foundation)}</p>
              <p class="brief-key-distinction">${escapeHtml(narrative.keyDistinction)}</p>
              <section class="brief-understand-value" aria-labelledby="brief-why-label">
                <h3 class="brief-note-label" id="brief-why-label">Why this matters</h3>
                <p class="brief-note-copy">${escapeHtml(narrative.value)}</p>
              </section>
              <section class="brief-understand-workflow" aria-labelledby="brief-how-label">
                <h3 class="brief-workflow-label" id="brief-how-label">How it works in Codex</h3>
                <ol class="brief-mechanism-list">
                  ${narrative.mechanisms.map((mechanism, mechanismIndex) => `
                    <li class="brief-mechanism">
                      <span class="brief-mechanism-number" aria-hidden="true">${stepNumber(mechanismIndex + 1)}</span>
                      <h4 class="brief-mechanism-title">${escapeHtml(mechanism.title)}</h4>
                      <p class="brief-mechanism-copy">${escapeHtml(mechanism.copy)}</p>
                    </li>`).join("")}
                </ol>
              </section>
            </div>
          </section>

          <section class="brief-lesson-band brief-scenario-band" aria-labelledby="brief-scenario-label">
            <div class="brief-band-rail">
              <span class="brief-band-index" aria-hidden="true">02</span>
              <h2 class="brief-band-label" id="brief-scenario-label">The scenario</h2>
            </div>
            <div class="brief-band-content">
              <p class="brief-note-title">${escapeHtml(narrative.scenarioTitle)}</p>
              <p class="brief-note-copy">${escapeHtml(narrative.scenario)}</p>
            </div>
          </section>

          <section class="brief-lesson-band brief-practice-band" aria-labelledby="brief-practice-label">
            <div class="brief-band-rail">
              <span class="brief-band-index" aria-hidden="true">03</span>
              <h2 class="brief-band-label" id="brief-practice-label">Your turn</h2>
            </div>
            <div class="brief-band-content">
              <p class="brief-next-copy">${escapeHtml(narrative.next)}</p>
              ${step.id === "project"
                ? '<button class="brief-example-prompt" type="button" data-action="start-practice">Start a new project</button>'
                : `<button class="brief-example-prompt" type="button" data-action="practice-with-prompt" data-prompt="${escapeHtml(step.prompt)}">${escapeHtml(step.prompt)}</button>`}
            </div>
          </section>
        </div>
      </div>
    </section>`;
}

function practiceScenarioContext(step) {
  if (step.id === "project") return {
    title: "Welcome to Blossom Bank",
    copy: "You’re a new engineer onboarding on Blossom Bank’s web project. First, explore the existing project and understand how its main components fit together.",
  };
  if (step.id === "connect") return {
    title: "Your first task in Linear",
    copy: "You’ve been assigned your first task in Linear. Connect the Linear plugin so Codex can find your assigned ticket and explain what needs to change.",
  };
  return null;
}

function renderPractice(step, index) {
  const narrative = briefingNarratives[step.id];

  return `
    <section class="practice-screen" aria-label="Practice ${escapeHtml(step.title)} in Codex">
      <div class="practice-guidance-stack" role="group" aria-label="Guided practice support">
        <section class="practice-lesson-overview" aria-labelledby="practice-lesson-title">
          <p class="practice-lesson-eyebrow">${escapeHtml(step.stage)} <span aria-hidden="true">·</span> ${escapeHtml(step.duration)}</p>
          <h1 class="practice-lesson-title" id="practice-lesson-title">${escapeHtml(narrative.headline)}</h1>
          <p class="practice-lesson-copy">${escapeHtml(narrative.value)}</p>
          ${step.id === "project" ? '<p class="practice-lesson-notice">Guided practice uses prepared responses and checks, try the suggested prompts and controls.</p>' : ""}
          <details class="practice-lesson-concept">
            <summary>What to know</summary>
            <p>${escapeHtml(narrative.keyDistinction)}</p>
          </details>
        </section>
        ${renderPracticeTasks(step)}
        ${renderHintDock(step)}
        ${renderPracticeTicket(step)}
        ${renderLearnMoreDock(step)}
        <p class="course-storage">This exercise uses prepared data. It does not connect your accounts.</p>
        <button class="course-skip-lesson" type="button" data-action="next-step" ${state.isRunning ? "disabled" : ""}>${index === STEPS.length - 1 ? "Skip to finish" : "Skip lesson"} ${icon("arrow-right")}</button>
      </div>
      <div class="practice-workspace-pane">
        <div class="practice-codex-frame">
          ${renderCodexWorkspace(step, index)}
          <div class="practice-assignment-overlay">${renderPracticeScenario(step)}</div>
        </div>
      </div>
      ${state.modeMenuOpen ? renderCodexModeMenu() : ""}
      <nav class="mobile-switcher" aria-label="Course panels" hidden>
        <button type="button" data-action="switch-mobile" data-view="workspace">Workspace</button>
      </nav>
    </section>`;
}

function renderPracticeScenario(step) {
  const scenario = practiceScenarioContext(step);
  if (!scenario) return "";
  const dismissed = step.id === "connect"
    ? state.linearScenarioDismissed
    : state.practiceScenarioDismissed;
  if (dismissed || isComplete(step.id)) return "";
  return `<aside class="practice-scenario-note" aria-label="Your Blossom Bank scenario">
    <span class="practice-scenario-icon" aria-hidden="true">${icon("target")}</span>
    <div class="practice-scenario-content">
      <p class="practice-scenario-title">${escapeHtml(scenario.title)}</p>
      <p class="practice-scenario-copy">${escapeHtml(scenario.copy)}</p>
    </div>
    <button class="practice-scenario-dismiss" type="button" data-action="dismiss-practice-scenario" aria-label="Dismiss assignment">${icon("close")}</button>
  </aside>`;
}

function syncPracticeScenarioOverlay(shadow) {
  const frame = app.querySelector(".practice-codex-frame");
  const overlay = frame?.querySelector(".practice-assignment-overlay");
  if (!overlay) return;
  const body = shadow?.querySelector("section") || frame.querySelector(".codex-messages");
  const heading = body?.querySelector("[data-product-mode-icon]")?.nextElementSibling
    || body?.querySelector(".conversation-task-heading");
  overlay.hidden = !heading
    || Boolean(shadow?.querySelector('[data-codex-mini-plugins="true"]'));
  if (overlay.hidden) return;
  const bounds = frame.getBoundingClientRect();
  const bodyBounds = body.getBoundingClientRect();
  const top = heading.getBoundingClientRect().bottom - bounds.top + 16;
  overlay.style.top = `${top}px`;
  overlay.style.left = `${bodyBounds.left - bounds.left + bodyBounds.width / 2}px`;
  overlay.style.width = `${Math.max(0, Math.min(460, bodyBounds.width - 32))}px`;
  overlay.style.maxHeight = `${Math.max(0, bodyBounds.bottom - bounds.top - top - 16)}px`;
}

function renderCodexModeMenu() {
  return `
    <div class="codex-mode-menu" role="menu" aria-label="Actions" style="--codex-mode-x:${state.modeMenuAnchor.x}px;--codex-mode-y:${state.modeMenuAnchor.y}px">
      <button class="codex-mode-menu-item codex-action-row" type="button" role="menuitem" data-action="toggle-goal-mode">
        <span class="codex-action-icon">${icon("target")}</span><span class="codex-action-label">Goal</span><span class="codex-action-description">Set a goal to keep pursuing</span>
      </button>
      <button class="codex-mode-menu-item codex-action-row" type="button" role="menuitemcheckbox" aria-checked="${state.planMode}" data-action="toggle-plan-mode">
        <span class="codex-action-icon">${icon("lightbulb")}</span><span class="codex-action-label">Plan mode</span><span class="codex-action-description">Turn plan mode ${state.planMode ? "off" : "on"}</span>
      </button>
    </div>`;
}

function codexEnvironmentIcon(name) {
  const panelPaths = {
    "panel-closed": 'M16.835 8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H7.83301C6.88885 3.99504 6.22065 3.99533 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.22065 15.9947 6.88885 15.995 7.83301 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301ZM5.00195 13.3329V6.66692C5.00195 6.29965 5.29972 6.00188 5.66699 6.00188C6.03412 6.00204 6.33203 6.29975 6.33203 6.66692V13.3329C6.33203 13.7001 6.03412 13.9978 5.66699 13.998C5.29972 13.998 5.00195 13.7002 5.00195 13.3329ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271Z',
    "panel-open": 'M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z',
  };
  if (panelPaths[name]) {
    return `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="${panelPaths[name]}" fill="currentColor"/></svg>`;
  }
  const paths = {
    environment: '<circle cx="4.2" cy="5" r="1.15"/><circle cx="4.2" cy="10" r="1.15"/><circle cx="4.2" cy="15" r="1.15"/><path d="M8 5h8.5m-8.5 5h8.5M8 15h8.5"/>',
    panel: '<rect x="3" y="3.5" width="14" height="13" rx="2"/><path d="M12.2 3.5v13"/>',
    changes: '<rect x="3.5" y="3.5" width="13" height="13" rx="2"/><path d="M10 6.5v5m-2.5-2.5h5m-5 4.5h5"/>',
    local: '<rect x="4" y="5" width="12" height="8.5" rx="1.2"/><path d="M2.8 15.5h14.4"/>',
    branch: '<circle cx="6" cy="4.5" r="1.7"/><circle cx="6" cy="15.5" r="1.7"/><circle cx="14.5" cy="5" r="1.7"/><path d="M6 6.2v7.6m0-4.3h4.8a3.7 3.7 0 0 0 3.7-3"/>',
  };

  return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.panel}</svg>`;
}

function codexPanelPickerIcon(name) {
  const icons = {
    "files": {
      viewBox: "0 0 20 20",
      paths: [
        "M1.418 13.667V9.25c0-.514 0-.94.028-1.285.029-.354.092-.683.25-.993l.097-.175a2.54 2.54 0 0 1 1.012-.935l.117-.055c.276-.118.566-.169.875-.194.346-.028.772-.028 1.286-.028h.988c.396 0 .696-.004.986.061l.18.047c.178.054.35.127.512.219l.189.12c.185.13.364.295.585.494l.14.126.357.314c.08.066.129.102.18.13l.16.076c.055.02.112.037.17.05l.092.016c.105.012.262.014.603.014h.941c.514 0 .94-.001 1.287.027.353.029.682.092.992.25l.175.098c.397.244.722.593.935 1.011l.055.118c.118.275.169.565.194.875.028.346.027.772.027 1.286v2.75c0 .514.001.94-.027 1.286-.025.31-.076.6-.194.875l-.055.117a2.54 2.54 0 0 1-.935 1.012l-.175.097c-.31.158-.639.221-.992.25-.346.029-.772.028-1.287.028H5.083c-.514 0-.94 0-1.286-.028a2.74 2.74 0 0 1-.875-.194l-.117-.056a2.54 2.54 0 0 1-1.012-.934l-.097-.175c-.158-.31-.221-.639-.25-.992-.029-.346-.028-.772-.028-1.286Zm15.833-3.333v-2.75c0-.536 0-.899-.023-1.178a1.652 1.652 0 0 0-.075-.419l-.034-.078a1.21 1.21 0 0 0-.445-.483l-.083-.045c-.091-.047-.226-.087-.497-.109a16.13 16.13 0 0 0-1.178-.023h-.941c-.297 0-.54.002-.765-.025l-.22-.037a2.541 2.541 0 0 1-.528-.18l-.165-.085a2.59 2.59 0 0 1-.374-.263l-.4-.352-.14-.126a6.46 6.46 0 0 0-.458-.393l-.079-.051a1.211 1.211 0 0 0-.16-.075l-.169-.051c-.114-.025-.241-.03-.696-.03h-.988c-.536 0-.898.001-1.177.024-.204.017-.33.043-.42.075l-.077.034a1.21 1.21 0 0 0-.211.136l-.113.074a.666.666 0 0 1-.723-1.108l.214-.155a2.54 2.54 0 0 1 .23-.132l.116-.056c.275-.118.566-.169.875-.194.346-.028.772-.027 1.286-.027h.988c.396 0 .696-.004.986.061l.18.047c.178.054.35.127.512.219l.189.12c.185.13.364.294.585.493l.14.127.357.314c.08.066.129.1.18.13l.16.075c.055.02.112.038.17.051l.092.016c.105.012.262.014.603.014h.941c.514 0 .94-.001 1.287.027.353.029.682.091.992.249l.174.099c.398.244.723.593.936 1.011l.055.118c.118.275.169.565.194.875.028.346.027.772.027 1.286v2.75c0 .514.001.939-.027 1.285-.025.31-.076.6-.194.876l-.055.116a2.542 2.542 0 0 1-.852.959.664.664 0 1 1-.739-1.106 1.21 1.21 0 0 0 .405-.457l.034-.078c.032-.089.058-.215.075-.419.023-.279.023-.64.023-1.176ZM2.748 13.667c0 .536.001.898.024 1.177.022.272.062.406.108.498l.047.082c.116.19.283.344.482.446l.078.033c.089.032.215.058.419.075.279.023.641.024 1.177.024h6.083c.536 0 .899-.001 1.178-.024.272-.022.406-.062.497-.108l.083-.047a1.21 1.21 0 0 0 .446-.482l.034-.078c.031-.089.057-.215.074-.419.023-.279.023-.641.023-1.177v-2.75c0-.536 0-.899-.023-1.178a1.668 1.668 0 0 0-.074-.419l-.034-.078a1.21 1.21 0 0 0-.446-.482l-.083-.046c-.091-.047-.225-.087-.497-.109-.28-.023-.642-.023-1.178-.023h-.941c-.297 0-.54.002-.765-.025l-.22-.037a2.54 2.54 0 0 1-.528-.18l-.165-.085a2.56 2.56 0 0 1-.374-.262l-.4-.352-.14-.127a6.455 6.455 0 0 0-.457-.392l-.079-.051a1.217 1.217 0 0 0-.161-.075l-.169-.052c-.114-.025-.241-.03-.696-.03h-.988c-.536 0-.898.001-1.177.024-.204.017-.33.043-.42.075l-.077.034a1.21 1.21 0 0 0-.482.445l-.047.084c-.046.091-.086.226-.108.497-.023.28-.024.641-.024 1.177v4.417Z",
      ],
    },
    "side-chat": {
      viewBox: "0 0 20 20",
      paths: [
        "M3.165 10c0-3.51 3.024-6.418 6.835-6.418S16.835 6.49 16.835 10a6.138 6.138 0 0 1-1.388 3.877.667.667 0 0 0-.136.54c.095.508.23 1.003.384 1.487a12.883 12.883 0 0 1-1.823-.376l-.126-.022a.664.664 0 0 0-.369.076 7.145 7.145 0 0 1-3.377.837c-3.811 0-6.835-2.91-6.835-6.42Zm-1.33 0c0 4.314 3.692 7.749 8.165 7.749a8.487 8.487 0 0 0 3.766-.873c.92.242 1.865.393 2.86.455a.665.665 0 0 0 .661-.903l-.207-.565c-.162-.468-.3-.933-.402-1.402A7.45 7.45 0 0 0 18.165 10c0-4.315-3.692-7.748-8.165-7.748-4.473 0-8.165 3.433-8.165 7.748Z",
        "M10 6.335A.665.665 0 0 0 9.335 7v2.335L7 9.349l-.134.013a.665.665 0 0 0 0 1.303L7 10.68l2.335-.014V13a.665.665 0 0 0 1.33 0v-2.335L13 10.68a.665.665 0 0 0 0-1.33l-2.335-.014V7A.665.665 0 0 0 10 6.335Z",
      ],
    },
    "browser": {
      viewBox: "0 0 20 20",
      paths: [
        "M10 2.125C14.3492 2.125 17.875 5.65076 17.875 10C17.875 14.3492 14.3492 17.875 10 17.875C5.65076 17.875 2.125 14.3492 2.125 10C2.125 5.65076 5.65076 2.125 10 2.125ZM7.88672 10.625C7.94334 12.3161 8.22547 13.8134 8.63965 14.9053C8.87263 15.5194 9.1351 15.9733 9.39453 16.2627C9.65437 16.5524 9.86039 16.625 10 16.625C10.1396 16.625 10.3456 16.5524 10.6055 16.2627C10.8649 15.9733 11.1274 15.5194 11.3604 14.9053C11.7745 13.8134 12.0567 12.3161 12.1133 10.625H7.88672ZM3.40527 10.625C3.65313 13.2734 5.45957 15.4667 7.89844 16.2822C7.7409 15.997 7.5977 15.6834 7.4707 15.3486C6.99415 14.0923 6.69362 12.439 6.63672 10.625H3.40527ZM13.3633 10.625C13.3064 12.439 13.0059 14.0923 12.5293 15.3486C12.4022 15.6836 12.2582 15.9969 12.1006 16.2822C14.5399 15.467 16.3468 13.2737 16.5947 10.625H13.3633ZM12.1006 3.7168C12.2584 4.00235 12.4021 4.31613 12.5293 4.65137C13.0059 5.90775 13.3064 7.56102 13.3633 9.375H16.5947C16.3468 6.72615 14.54 4.53199 12.1006 3.7168ZM10 3.375C9.86039 3.375 9.65437 3.44756 9.39453 3.7373C9.1351 4.02672 8.87263 4.48057 8.63965 5.09473C8.22547 6.18664 7.94334 7.68388 7.88672 9.375H12.1133C12.0567 7.68388 11.7745 6.18664 11.3604 5.09473C11.1274 4.48057 10.8649 4.02672 10.6055 3.7373C10.3456 3.44756 10.1396 3.375 10 3.375ZM7.89844 3.7168C5.45942 4.53222 3.65314 6.72647 3.40527 9.375H6.63672C6.69362 7.56102 6.99415 5.90775 7.4707 4.65137C7.59781 4.31629 7.74073 4.00224 7.89844 3.7168Z",
      ],
    },
    "terminal": {
      viewBox: "0 0 20 20",
      paths: [
        "M6.19629 7.86231C6.42357 7.63534 6.7752 7.60692 7.0332 7.77734L7.1377 7.86231L8.80371 9.5293C9.06329 9.78889 9.06307 10.21 8.80371 10.4697L7.1377 12.1367C6.878 12.3964 6.45599 12.3964 6.19629 12.1367C5.93686 11.8771 5.93697 11.456 6.19629 11.1963L7.39258 9.99902L6.19629 8.80371L6.11133 8.69922C5.94087 8.4411 5.96904 8.08955 6.19629 7.86231Z",
        "M13.4668 11.0156C13.7699 11.0776 13.998 11.3456 13.998 11.667C13.9979 11.9883 13.7698 12.2564 13.4668 12.3184L13.333 12.332H10.833C10.466 12.3319 10.1682 12.034 10.168 11.667C10.168 11.2998 10.4659 11.0021 10.833 11.002H13.333L13.4668 11.0156Z",
        "M12.6602 2.66504C13.3492 2.66504 13.9062 2.66439 14.3564 2.70117C14.8142 2.73859 15.2201 2.81796 15.5967 3.00977C16.1922 3.31321 16.677 3.79805 16.9805 4.39356C17.1722 4.77014 17.2517 5.17604 17.2891 5.63379C17.3258 6.08402 17.3252 6.64102 17.3252 7.33008V12.6602C17.3252 13.3492 17.3258 13.9062 17.2891 14.3564C17.2516 14.8142 17.1723 15.2201 16.9805 15.5967C16.677 16.1922 16.1922 16.677 15.5967 16.9805C15.2201 17.1723 14.8142 17.2516 14.3564 17.2891C13.9062 17.3258 13.3492 17.3252 12.6602 17.3252H7.33008C6.64102 17.3252 6.08402 17.3258 5.63379 17.2891C5.17604 17.2517 4.77014 17.1722 4.39356 16.9805C3.79805 16.677 3.31321 16.1922 3.00977 15.5967C2.81796 15.2201 2.73859 14.8142 2.70117 14.3564C2.66439 13.9062 2.66504 13.3492 2.66504 12.6602V7.33008C2.66504 6.64101 2.66439 6.08402 2.70117 5.63379C2.73858 5.17601 2.81797 4.77016 3.00977 4.39356C3.31321 3.79802 3.79802 3.31321 4.39356 3.00977C4.77016 2.81797 5.17601 2.73858 5.63379 2.70117C6.08402 2.66439 6.64101 2.66504 7.33008 2.66504H12.6602ZM7.33008 3.99512C6.61907 3.99512 6.1257 3.99601 5.74219 4.02734C5.3665 4.05804 5.15508 4.11481 4.99707 4.19531C4.65183 4.37124 4.37124 4.65183 4.19531 4.99707C4.11481 5.15508 4.05805 5.3665 4.02734 5.74219C3.99601 6.1257 3.99512 6.61908 3.99512 7.33008V12.6602C3.99512 13.3711 3.99601 13.8646 4.02734 14.248C4.05805 14.6237 4.11481 14.8352 4.19531 14.9932C4.37124 15.3384 4.65186 15.619 4.99707 15.7949C5.15507 15.8754 5.36654 15.9322 5.74219 15.9629C6.1257 15.9942 6.61908 15.9951 7.33008 15.9951H12.6602C13.3711 15.9951 13.8646 15.9942 14.248 15.9629C14.6237 15.9322 14.8352 15.8754 14.9932 15.7949C15.3384 15.619 15.619 15.3384 15.7949 14.9932C15.8754 14.8352 15.9322 14.6237 15.9629 14.248C15.9942 13.8646 15.9951 13.3711 15.9951 12.6602V7.33008C15.9951 6.61908 15.9942 6.1257 15.9629 5.74219C15.9322 5.36654 15.8754 5.15507 15.7949 4.99707C15.619 4.65186 15.3384 4.37124 14.9932 4.19531C14.8352 4.11481 14.6237 4.05805 14.248 4.02734C13.8646 3.99601 13.3711 3.99512 12.6602 3.99512H7.33008Z",
      ],
    },
    "digest": {
      viewBox: "0 0 24 24",
      paths: [
        "M13 9.50004L20 9.5",
        "M13 14.5L17 14.5",
        "M6.23999 4V9",
        "M6.23999 15V20",
        "M3.74009 16.5L6.24009 14L8.74009 16.5",
        "M8.74009 7.5L6.24009 10L3.74009 7.5",
      ],
    },
  };
  const glyph = icons[name];
  if (!glyph) return "";

  const paths = glyph.paths.map((path, index) => {
    if (name === "digest") {
      const joins = index >= 2 ? ' stroke-linejoin="round"' : "";
      const strokeWidth = index === 2 || index === 3 ? "1.8" : "2";
      return `<path d="${path}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round"${joins}/>`;
    }
    if (name === "terminal") {
      const fillRule = index === 2 ? ' fill-rule="evenodd" clip-rule="evenodd"' : "";
      return `<path${fillRule} d="${path}" fill="currentColor"/>`;
    }
    return `<path d="${path}"/>`;
  }).join("");
  const size = name === "digest" ? "24" : "20";
  const fill = name === "terminal" || name === "digest" ? "none" : "currentColor";
  return `<svg width="${size}" height="${size}" viewBox="${glyph.viewBox}" fill="${fill}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`;
}

function codexRepositoryTabIcon(name) {
  if (name === "files") return codexPanelPickerIcon(name);
  if (name === "plan") {
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 3.52051C9.07134 3.52056 10.0951 3.86574 10.8574 4.54785C11.6273 5.23672 12.0976 6.24043 12.0977 7.48047C12.0977 8.72922 11.6209 9.58857 11.1914 10.2686C10.9702 10.6188 10.7891 10.8819 10.6494 11.1572C10.5171 11.4183 10.4482 11.6441 10.4482 11.877V12.4268C10.4482 13.1158 10.1861 13.7075 9.72559 14.1221C9.27069 14.5315 8.65733 14.7373 8 14.7373C7.34282 14.7373 6.73026 14.5313 6.27539 14.1221C5.81475 13.7075 5.55182 13.1159 5.55176 12.4268V11.877C5.55175 11.6441 5.48294 11.4183 5.35059 11.1572C5.21093 10.8818 5.02985 10.6189 4.80859 10.2686C4.37912 9.58855 3.90332 8.72928 3.90332 7.48047C3.90335 6.24047 4.37279 5.23672 5.14258 4.54785C5.90494 3.86581 6.9287 3.52055 8 3.52051ZM6.60156 12.4268C6.60162 12.8365 6.75133 13.1382 6.97754 13.3418C7.2095 13.5504 7.55861 13.6875 8 13.6875C8.44132 13.6874 8.79051 13.5504 9.02246 13.3418C9.24859 13.1382 9.39838 12.8364 9.39844 12.4268V12.2656H6.60156V12.4268ZM8 4.57129C7.14816 4.57133 6.38548 4.84457 5.84277 5.33008C5.30758 5.80896 4.95315 6.52253 4.95312 7.48047C4.95312 8.42985 5.30144 9.08283 5.69629 9.70801C5.88705 10.01 6.11776 10.3486 6.28711 10.6826C6.37163 10.8493 6.44704 11.0262 6.50293 11.2148H9.49707C9.55297 11.0262 9.62839 10.8493 9.71289 10.6826C9.88222 10.3487 10.113 10.01 10.3037 9.70801C10.6985 9.08286 11.0469 8.4298 11.0469 7.48047C11.0468 6.52258 10.6924 5.80896 10.1572 5.33008C9.61453 4.84459 8.8518 4.57134 8 4.57129Z" fill="currentColor"/><path d="M2 6.85449C2.28995 6.85449 2.52539 7.08993 2.52539 7.37988C2.52539 7.66983 2.28995 7.90527 2 7.90527H0.833008C0.543208 7.9051 0.308594 7.66972 0.308594 7.37988C0.308594 7.09004 0.543208 6.85467 0.833008 6.85449H2Z" fill="currentColor"/><path d="M15.167 6.85449C15.4568 6.85462 15.6924 7.09001 15.6924 7.37988C15.6924 7.66975 15.4568 7.90514 15.167 7.90527H14C13.7102 7.9051 13.4756 7.66972 13.4756 7.37988C13.4756 7.09004 13.7102 6.85467 14 6.85449H15.167Z" fill="currentColor"/><path d="M2.56348 1.94141C2.7685 1.73639 3.10161 1.7364 3.30664 1.94141L4.08203 2.71777C4.28706 2.9228 4.28706 3.25494 4.08203 3.45996C3.877 3.66497 3.54486 3.66498 3.33984 3.45996L2.56348 2.68457C2.35847 2.47955 2.35847 2.14643 2.56348 1.94141Z" fill="currentColor"/><path d="M12.6934 1.94141C12.8984 1.7364 13.2315 1.73643 13.4365 1.94141C13.6415 2.14643 13.6415 2.47955 13.4365 2.68457L12.6602 3.46094C12.4552 3.66539 12.1229 3.66538 11.918 3.46094C11.7129 3.25592 11.713 2.9228 11.918 2.71777L12.6934 1.94141Z" fill="currentColor"/><path d="M8 0.1875C8.28995 0.1875 8.52539 0.422941 8.52539 0.712891V1.87988C8.52521 2.16968 8.28984 2.4043 8 2.4043C7.71016 2.4043 7.47479 2.16968 7.47461 1.87988V0.712891C7.47461 0.422941 7.71005 0.1875 8 0.1875Z" fill="currentColor"/></svg>';
  }
  if (name === "browser") {
    return '<img src="/training/codex-lab/assets/brand/blossom-favicon.svg" alt="">';
  }
  if (name === "open-file") {
    return '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M5.62988 1.12599C5.9198 1.12599 6.11903 1.12407 6.31006 1.16993L6.42969 1.20362C6.54783 1.24203 6.66141 1.29433 6.76758 1.35939L6.8291 1.39943C6.97079 1.49824 7.09992 1.62972 7.2793 1.80909L7.77442 2.30421L7.91651 2.44728C8.04775 2.58071 8.14716 2.69039 8.22412 2.81593L8.28516 2.92482C8.34146 3.0354 8.38453 3.1525 8.41358 3.27345L8.42871 3.34571C8.459 3.51573 8.45752 3.70002 8.45752 3.95362V6.542C8.45752 6.88641 8.45784 7.16509 8.43945 7.39015C8.42307 7.59041 8.39048 7.77088 8.31836 7.93898L8.28516 8.01027C8.15244 8.27068 7.95039 8.48862 7.70264 8.64064L7.59326 8.70167C7.40494 8.7976 7.20206 8.83726 6.97315 8.85597C6.74803 8.87436 6.46954 8.87452 6.125 8.87452H3.875C3.53046 8.87452 3.25197 8.87436 3.02686 8.85597C2.82659 8.8396 2.64613 8.80745 2.47803 8.73536L2.40674 8.70167C2.14617 8.56891 1.92793 8.36707 1.77588 8.11915L1.71484 8.01027C1.61894 7.822 1.57927 7.61897 1.56055 7.39015C1.54216 7.16509 1.54248 6.88641 1.54248 6.542V3.45851C1.54248 3.11403 1.54217 2.83546 1.56055 2.61036C1.57925 2.38151 1.61898 2.17852 1.71484 1.99025C1.86655 1.6925 2.109 1.45007 2.40674 1.29835C2.59504 1.20245 2.79796 1.16276 3.02686 1.14405C3.25198 1.12566 3.53045 1.12599 3.875 1.12599H5.62988ZM3.875 1.79103C3.51948 1.79103 3.27281 1.79147 3.08106 1.80714C2.89321 1.82249 2.7875 1.85087 2.7085 1.89112C2.5359 1.97909 2.39557 2.1194 2.30762 2.292C2.26739 2.37099 2.23898 2.4768 2.22363 2.66456C2.20798 2.8563 2.20752 3.10308 2.20752 3.45851V6.542C2.20752 6.89736 2.20797 7.14424 2.22363 7.33595C2.23899 7.52361 2.26738 7.62955 2.30762 7.70851L2.34277 7.7715C2.43093 7.91522 2.55744 8.03242 2.7085 8.10939L2.77344 8.13722C2.84532 8.16295 2.94008 8.18185 3.08106 8.19337C3.27281 8.20904 3.51949 8.20948 3.875 8.20948H6.125C6.48051 8.20948 6.72719 8.20904 6.91895 8.19337C7.10673 8.17803 7.21251 8.14961 7.29151 8.10939L7.35449 8.07374C7.49817 7.98564 7.6154 7.85948 7.69238 7.70851L7.7207 7.64308C7.74635 7.57129 7.76487 7.47652 7.77637 7.33595C7.79203 7.14424 7.79248 6.89736 7.79248 6.542V4.27882L6.67529 4.1548C6.12859 4.09405 5.69878 3.65917 5.64404 3.11183L5.51172 1.79103H3.875ZM6.30567 3.04591C6.32918 3.281 6.51374 3.46752 6.74854 3.49366L7.78809 3.60939C7.78635 3.56879 7.7843 3.53557 7.78076 3.50636L7.76709 3.42872C7.75025 3.35858 7.72504 3.29071 7.69238 3.22657L7.65723 3.16359C7.63125 3.1212 7.59976 3.0807 7.54639 3.02247L7.3042 2.77443L6.80908 2.27931C6.63847 2.1087 6.55244 2.02455 6.48438 1.9712L6.41992 1.92628C6.35836 1.88856 6.29263 1.85821 6.22412 1.83595L6.18359 1.82423L6.30567 3.04591Z"/></svg>';
  }
  if (name !== "review") return "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.084 12.668a.666.666 0 0 1 0 1.33H7.917a.665.665 0 1 1 0-1.33h4.167ZM10 5.585c.367 0 .665.298.665.665v1.418h1.419a.666.666 0 0 1 0 1.33h-1.419v1.419a.666.666 0 0 1-1.33 0V8.998H7.917a.665.665 0 0 1 0-1.33h1.418V6.25c0-.367.298-.665.665-.665Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12.667 2.668c.689 0 1.246 0 1.696.036.458.038.865.117 1.242.309a3.163 3.163 0 0 1 1.382 1.383c.192.377.272.783.309 1.24.037.45.036 1.008.036 1.697v5.333c0 .689 0 1.246-.036 1.696-.037.458-.117.865-.309 1.242a3.166 3.166 0 0 1-1.382 1.382c-.377.192-.784.271-1.242.309-.45.037-1.007.036-1.696.036H7.334c-.689 0-1.246 0-1.696-.036-.458-.038-.864-.117-1.24-.309a3.166 3.166 0 0 1-1.384-1.383c-.192-.376-.271-.783-.309-1.24-.037-.45-.036-1.008-.036-1.697V7.333c0-.689 0-1.246.036-1.696.038-.458.117-.864.309-1.24a3.17 3.17 0 0 1 1.383-1.384c.377-.192.783-.272 1.24-.309.45-.037 1.008-.036 1.697-.036h5.333Zm-5.333 1.33c-.71 0-1.204.001-1.588.032-.375.03-.587.088-.745.168A1.836 1.836 0 0 0 4.199 5c-.08.158-.137.37-.168.745C4 6.13 4 6.622 4 7.333v5.333c0 .71.001 1.204.032 1.588.03.375.088.587.168.745.176.345.457.627.802.803.158.08.37.137.745.168.384.031.877.031 1.588.031h5.333c.71 0 1.204 0 1.588-.031.375-.031.587-.088.745-.168a1.84 1.84 0 0 0 .803-.803c.08-.158.137-.37.168-.745.031-.383.031-.877.031-1.588V7.333c0-.71 0-1.204-.031-1.588-.031-.375-.088-.587-.168-.745A1.838 1.838 0 0 0 15 4.198c-.158-.08-.37-.137-.745-.168-.384-.031-.877-.032-1.588-.032H7.334Z"/></svg>`;
}

function codexRepositoryTabContent(name, label) {
  return `<span class="codex-repo-tab-icon">${codexRepositoryTabIcon(name)}</span><span class="codex-repo-tab-label"><span dir="auto">${label}</span></span>`;
}

function syncRepositoryTabLabelOverflow(root, observe = false) {
  const labels = Array.from(root?.querySelectorAll?.(".codex-repo-tab-label") || []);
  const measure = (label) => {
    const text = label.firstElementChild;
    label.dataset.overflow = String(Boolean(text && text.scrollWidth > label.clientWidth));
  };
  for (const label of labels) measure(label);

  if (!observe || typeof ResizeObserver !== "function") return;
  let binding = root.__codexTabLabelOverflow;
  if (!binding) {
    binding = {
      targets: new Set(),
      observer: new ResizeObserver((entries) => {
        for (const entry of entries) {
          const label = entry.target.parentElement;
          if (label?.classList?.contains?.("codex-repo-tab-label")) measure(label);
        }
      }),
    };
    root.__codexTabLabelOverflow = binding;
  }
  const nextTargets = new Set(labels.map((label) => label.firstElementChild).filter(Boolean));
  for (const target of binding.targets) {
    if (!nextTargets.has(target)) binding.observer.unobserve(target);
  }
  for (const target of nextTargets) {
    if (!binding.targets.has(target)) binding.observer.observe(target);
  }
  binding.targets = nextTargets;
}

function disconnectRepositoryTabLabelOverflow(root) {
  root?.__codexTabLabelOverflow?.observer?.disconnect?.();
  if (root) delete root.__codexTabLabelOverflow;
}

function renderCodexPanelPicker() {
  if (STEPS[state.currentIndex]?.id !== "project"
    || state.projectPanelPickerOpen !== true
    || state.repositoryPaneOpen === true
    || !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
    return "";
  }

  const options = [
    { id: "files", label: "Files", shortcut: "⌘P", available: true },
    { id: "side-chat", label: "Side chat", shortcut: "⌥⌘S" },
    { id: "browser", label: "Browser", shortcut: "⌘T" },
    { id: "terminal", label: "Terminal" },
    { id: "digest", label: "Digest" },
  ];

  return `
    <aside class="codex-panel-picker" data-codex-panel-picker="true" aria-label="Side panel">
      <div class="codex-panel-picker-options">
        ${options.map(({ id, label, shortcut, available }) => {
          const button = `
            <button class="codex-panel-picker-option" type="button" data-codex-panel-option="${id}" aria-label="${label}"${available ? ' data-action="open-project-files" data-codex-repo-action="open-project-files" title="Open file viewer"' : ' disabled aria-disabled="true" tabindex="-1"'}>
              <span class="codex-panel-picker-icon" aria-hidden="true">${typeof codexPanelPickerIcon === "function" ? codexPanelPickerIcon(id) : '<svg aria-hidden="true"></svg>'}</span>
              <span class="codex-panel-picker-label">${label}</span>
              ${shortcut ? `<kbd class="codex-panel-picker-shortcut" aria-hidden="true">${shortcut}</kbd>` : ""}
            </button>`;
          return available
            ? button
            : `<div class="codex-disabled-reason-wrap" data-codex-disabled-reason="This panel isn’t used in this lesson. Open Files to inspect the project.">${button}</div>`;
        }).join("")}
      </div>
    </aside>`;
}

function renderCodexEnvironmentPanel() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const additions = workspace?.totals.additions || 0;
  const deletions = workspace?.totals.deletions || 0;
  const branch = typeof activeCourseBranch === "function"
    ? activeCourseBranch()
    : COURSE.repository.defaultBranch;

  return `
    <aside class="codex-environment-panel" id="codex-environment-panel" data-codex-environment-panel="true" aria-label="Environment" ${state.environmentOpen === true ? "" : "hidden"}>
      <h2 class="codex-environment-heading">Environment</h2>
      <button class="codex-environment-row codex-environment-changes" type="button" data-action="inspect-environment" data-codex-environment-action="inspect-changes" aria-label="Inspect current changes: +${additions} −${deletions}">
        ${codexEnvironmentIcon("changes")}
        <span class="codex-environment-label">Changes</span>
        <span class="codex-environment-counts" aria-hidden="true"><span class="codex-environment-additions">+${additions}</span><span class="codex-environment-deletions">−${deletions}</span></span>
      </button>
      <div class="codex-environment-row" data-codex-environment-local="true">
        ${codexEnvironmentIcon("local")}
        <span class="codex-environment-label">Local</span>
      </div>
      <button class="codex-environment-row codex-environment-branch-trigger" type="button" data-action="toggle-branch-picker" data-codex-environment-action="toggle-branch-picker" data-codex-branch-trigger="true" aria-label="Switch branch" title="Switch branch" aria-haspopup="listbox" aria-expanded="${state.branchPickerOpen === true}">
        ${codexEnvironmentIcon("branch")}
        <span class="codex-environment-label codex-environment-branch" data-codex-environment-branch="true" title="${escapeHtml(branch)}">${escapeHtml(branch)}</span>
        <svg class="codex-branch-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 8 3 3 3-3"/></svg>
      </button>
      ${state.branchPickerOpen === true && typeof renderCodexBranchPicker === "function" ? renderCodexBranchPicker() : ""}
    </aside>`;
}

function renderCodexBranchOptions() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const branches = Array.isArray(workspace?.branches) ? workspace.branches : [];
  const query = typeof state.branchPickerQuery === "string" ? state.branchPickerQuery.trim().toLowerCase() : "";
  const visibleBranches = branches.filter((branch) => branch.toLowerCase().includes(query));

  if (!visibleBranches.length) {
    return '<p class="codex-branch-empty">No branches found</p>';
  }

  return visibleBranches.map((branch) => {
    const selected = branch === workspace.branch;
    return `<button class="codex-branch-option" type="button" role="option" data-action="switch-branch" data-codex-environment-action="switch-branch" data-branch="${escapeHtml(branch)}" aria-selected="${selected}" ${state.branchSwitching === true ? "disabled" : ""}>
      ${codexEnvironmentIcon("branch")}
      <span class="codex-branch-name">${escapeHtml(branch)}</span>
      ${selected ? '<svg class="codex-branch-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 10 3.2 3.2L15 6.5"/></svg>' : ""}
    </button>`;
  }).join("");
}

function renderCodexBranchPicker() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (!workspace || !Array.isArray(workspace.branches)) return "";

  return `<section class="codex-branch-picker" data-codex-branch-picker="true" aria-label="Switch branch">
    <label class="codex-branch-search-wrap">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8.4" cy="8.4" r="4.8"/><path d="m12 12 4 4"/></svg>
      <input class="codex-branch-search" data-codex-branch-search="true" type="search" placeholder="Search branches" aria-label="Search branches" autocomplete="off" value="${escapeHtml(state.branchPickerQuery || "")}" />
    </label>
    <p class="codex-branch-section">Branches</p>
    <div class="codex-branch-list" data-codex-branch-list="true" role="listbox" aria-label="Branches">${renderCodexBranchOptions()}</div>
  </section>`;
}

function syncCodexBranchPicker(panel, options = {}) {
  if (!panel?.querySelector) return false;

  const trigger = panel.querySelector("[data-codex-branch-trigger]");
  if (trigger) {
    trigger.setAttribute("aria-expanded", String(state.branchPickerOpen === true));
    trigger.disabled = state.branchSwitching === true;
  }

  let picker = panel.querySelector("[data-codex-branch-picker]");
  if (state.branchPickerOpen !== true || !verifiedCodexWorkspace()) {
    picker?.remove?.();
    return false;
  }

  if (!picker) {
    const template = document.createElement("template");
    template.innerHTML = renderCodexBranchPicker().trim();
    picker = template.content?.firstElementChild;
    if (!picker) return false;
    panel.append(picker);
    const list = picker.querySelector("[data-codex-branch-list]");
    if (list) list.__codexBranchMarkup = renderCodexBranchOptions();
  } else {
    const list = picker.querySelector("[data-codex-branch-list]");
    if (list) {
      const markup = renderCodexBranchOptions();
      if (list.__codexBranchMarkup !== markup) {
        list.innerHTML = markup;
        list.__codexBranchMarkup = markup;
      }
    }
  }

  if (options.focus === true) picker.querySelector("[data-codex-branch-search]")?.focus?.();
  return true;
}

function toggleCodexBranchPicker(shadow = null) {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (!workspace || !Array.isArray(workspace.branches) || state.isRunning || state.branchSwitching) return false;

  state.branchPickerOpen = state.branchPickerOpen !== true;
  state.branchPickerQuery = "";
  const panel = shadow?.querySelector?.("[data-codex-environment-panel]")
    || app.querySelector?.(".codex-mini-fallback [data-codex-environment-panel]");
  const pickerVisible = syncCodexBranchPicker(panel, { focus: state.branchPickerOpen });
  if (state.branchPickerOpen === true
    && pickerVisible === true
    && typeof STEPS !== "undefined"
    && STEPS[state.currentIndex]?.id === "ticket"
    && state.environmentOpen === true
    && state.ticketEnvironmentOpenedByLearner === true
    && Number.isSafeInteger(state.taskProgress?.ticket)
    && state.taskProgress.ticket >= 1
    && typeof markPracticeTask === "function") {
    state.ticketBranchesInspectedByLearner = true;
    markPracticeTask("ticket", 2);
  }
  if (!state.branchPickerOpen) panel?.querySelector?.("[data-codex-branch-trigger]")?.focus?.();
  return true;
}

function filterCodexBranchPicker(input) {
  if (!input || state.branchPickerOpen !== true) return false;
  state.branchPickerQuery = input.value || "";
  const picker = input.closest?.("[data-codex-branch-picker]");
  const list = picker?.querySelector?.("[data-codex-branch-list]");
  if (list) {
    const markup = renderCodexBranchOptions();
    if (list.__codexBranchMarkup !== markup) {
      list.innerHTML = markup;
      list.__codexBranchMarkup = markup;
    }
  }
  return true;
}

function completeTicketStagingSelection(branch) {
  const step = STEPS[state.currentIndex];
  if (step?.id !== "ticket" || branch !== COURSE.repository.baseBranch
    || verifiedCodexWorkspace()?.branch !== branch || practiceTaskCount(step) !== 2
    || !state.ticketEnvironmentOpenedByLearner || !state.ticketBranchesInspectedByLearner) return false;
  state.ticketStagingSelectedByLearner = true;
  return markPracticeTask("ticket", 3);
}

function switchCodexBranch(branch, shadow = null) {
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return Promise.resolve(false);
  }

  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (!workspace || !Array.isArray(workspace.branches) || !workspace.branches.includes(branch)
    || state.isRunning || state.branchSwitching === true) return Promise.resolve(false);

  if (branch === workspace.branch) {
    completeTicketStagingSelection(branch);
    state.branchPickerOpen = false;
    state.branchPickerQuery = "";
    const panel = shadow?.querySelector?.("[data-codex-environment-panel]")
      || app.querySelector?.(".codex-mini-fallback [data-codex-environment-panel]");
    syncCodexBranchPicker(panel);
    panel?.querySelector?.("[data-codex-branch-trigger]")?.focus?.();
    return Promise.resolve(true);
  }

  state.branchSwitching = true;
  const panel = shadow?.querySelector?.("[data-codex-environment-panel]")
    || app.querySelector?.(".codex-mini-fallback [data-codex-environment-panel]");
  syncCodexBranchPicker(panel);

  return fetch("/api/codex/workspace/branches", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sessionId: workspace.sessionId, branch }),
  }).then(async (response) => {
    const snapshot = await response.json().catch(() => null);
    if (!response.ok) throw new Error(snapshot?.error || "The project branch could not be changed.");
    const updated = typeof applyVerifiedCodexWorkspace === "function"
      ? applyVerifiedCodexWorkspace(snapshot, { refresh: false })
      : null;
    if (!updated || updated.sessionId !== workspace.sessionId || updated.branch !== branch) {
      throw new Error("The project returned an invalid branch.");
    }

    state.branchPickerOpen = false;
    state.branchPickerQuery = "";
    state.validationMessage = "";
    completeTicketStagingSelection(branch);
    return true;
  }).catch((error) => {
    state.validationMessage = `Failed to switch branch: ${error?.message || "The project branch could not be changed."}`;
    return false;
  }).finally(() => {
    state.branchSwitching = false;
    if (typeof refreshCurrentLab === "function") refreshCurrentLab();
    const activeShadow = typeof nativeCodexShadow === "function" ? nativeCodexShadow() : null;
    activeShadow?.querySelector?.("[data-codex-branch-trigger]")?.focus?.();
    if (!activeShadow) app.querySelector?.(".codex-mini-fallback [data-codex-branch-trigger]")?.focus?.();
  });
}

function renderProjectDirectoryPicker() {
  if (state.projectCreationStarted !== true
    || (typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) return "";

  if (state.projectCreationStage === "type") {
    const localSelected = state.projectType === "local";
    return `
      <section class="codex-project-picker" data-codex-project-picker="true">
        <div class="codex-project-picker-dialog codex-project-type-dialog" data-codex-project-stage="type" role="dialog" aria-modal="true" aria-labelledby="codex-project-picker-title" aria-describedby="codex-project-picker-description">
          <div class="codex-project-create-header">
            <h2 class="codex-project-picker-title" id="codex-project-picker-title">Create project</h2>
            <button class="codex-project-create-close" type="button" data-action="cancel-project-creation" aria-label="Close">${icon("close")}</button>
          </div>
          <p class="sr-only" id="codex-project-picker-description">Choose the type of project to create</p>
          <div class="codex-project-type-content">
            <h3 class="codex-project-type-heading" id="codex-project-type-heading">Project type</h3>
            <div class="codex-project-type-options" role="radiogroup" aria-labelledby="codex-project-type-heading">
              <button class="codex-project-type-option${localSelected ? " is-selected" : ""}" type="button" role="radio" data-project-type="local" data-action="select-project-type" data-codex-project-action="select-project-type" aria-checked="${localSelected}" tabindex="${localSelected ? 0 : -1}">
                <span class="codex-project-type-top"><span class="codex-project-type-icon" aria-hidden="true">${icon("project-local")}</span><span class="codex-project-type-indicator" aria-hidden="true"><span class="codex-project-type-indicator-dot"></span></span></span>
                <span class="codex-project-type-copy"><span class="codex-project-type-label">Local</span><span class="codex-project-type-description">Edit, run, and test files on your computer</span></span>
              </button>
              <button class="codex-project-type-option${!localSelected ? " is-selected" : ""}" type="button" role="radio" data-project-type="remote" data-action="select-project-type" data-codex-project-action="select-project-type" aria-checked="${!localSelected}" tabindex="${!localSelected ? 0 : -1}">
                <span class="codex-project-type-top"><span class="codex-project-type-icon codex-project-remote-icon" aria-hidden="true"></span><span class="codex-project-type-indicator" aria-hidden="true"><span class="codex-project-type-indicator-dot"></span></span></span>
                <span class="codex-project-type-copy"><span class="codex-project-type-label">Remote</span><span class="codex-project-type-description">Choose a folder on a connected machine</span></span>
              </button>
            </div>
            <p class="codex-project-type-hint" role="status"${localSelected ? " hidden" : ""}>This training uses a local project. Choose Local to continue.</p>
          </div>
          <div class="codex-project-picker-actions"><button class="codex-project-create-submit codex-project-type-next" type="button" data-action="continue-project-creation" data-codex-project-action="continue-project-creation"${localSelected ? "" : " disabled"}>Next</button></div>
        </div>
      </section>`;
  }

  const selecting = state.projectSelecting === true;
  const sourceSelected = state.projectSourceSelected === true;
  const projectName = typeof state.projectName === "string" ? state.projectName : "";
  const projectNameError = typeof state.projectNameError === "string"
    ? state.projectNameError
    : "";
  const addFolderAccessibility = sourceSelected
    ? ' aria-label="Add folder" aria-disabled="true" disabled'
    : ' aria-label="Choose source folders"';
  const addFolderBusy = selecting ? ` aria-busy="true"${sourceSelected ? "" : " disabled"}` : "";
  return `
    <section class="codex-project-picker" data-codex-project-picker="true">
      <div class="codex-project-picker-dialog" data-codex-project-stage="local" role="dialog" aria-modal="true" aria-labelledby="codex-project-picker-title">
        <div class="codex-project-create-header">
          <h2 class="codex-project-picker-title" id="codex-project-picker-title">Create project</h2>
          <button class="codex-project-create-close" type="button" data-action="cancel-project-creation" aria-label="Close"${selecting ? " disabled" : ""}>${icon("close")}</button>
        </div>
        <div class="codex-project-name-control">
          <label class="codex-project-name-field${projectNameError ? " has-error" : ""}" for="codex-project-name">
            ${icon("folder")}
            <input class="codex-project-name-input" id="codex-project-name" name="project-name" type="text" placeholder="Project name" aria-label="Project name" value="${escapeHtml(projectName)}" maxlength="120" autocomplete="off" required aria-invalid="${projectNameError ? "true" : "false"}"${projectNameError ? ' aria-describedby="codex-project-name-error"' : ""}${selecting ? " disabled" : ""}>
          </label>
          ${projectNameError ? `<p id="codex-project-name-error" class="codex-project-name-error" role="alert">${escapeHtml(projectNameError)}</p>` : ""}
        </div>
        <h3 class="codex-project-source-heading">Source folders</h3>
        <div class="codex-project-source-list${sourceSelected ? " has-source" : ""}" data-codex-project-source-list="true">
          ${sourceSelected ? `<div class="codex-project-source-row" data-codex-project-source-row="true">
            <span class="codex-project-source-icon" aria-hidden="true">${icon("project-source-folder")}</span>
            <span class="codex-project-source-name">Blossom Bank</span>
            <button class="codex-project-source-remove" type="button" data-action="remove-project-directory" data-codex-project-action="remove-project-directory" aria-label="Remove Blossom Bank"${selecting ? " disabled" : ""}>${icon("project-source-remove")}</button>
          </div>` : ""}
          ${sourceSelected ? '<div class="codex-disabled-reason-wrap" data-codex-disabled-reason="This guided practice provides one isolated source folder.">' : ""}
            <button class="codex-project-source-add${sourceSelected ? "" : " is-empty"}" type="button" data-action="select-project-directory" data-codex-project-action="select-project-directory"${addFolderAccessibility}${addFolderBusy}>
              <span class="codex-project-source-icon" aria-hidden="true">${icon("project-source-add")}</span>
              <span class="${sourceSelected ? "codex-project-source-add-label" : "codex-project-source-copy"}">${sourceSelected ? "Add folder" : "Add folders Codex can read and edit"}</span>
            </button>
          ${sourceSelected ? "</div>" : ""}
        </div>
        <div class="codex-project-picker-actions">
          <button class="codex-project-picker-cancel" type="button" data-action="cancel-project-creation"${selecting ? " disabled" : ""}>Cancel</button>
          <button class="codex-project-create-submit" type="button" data-action="create-project"${selecting ? ' aria-busy="true" disabled' : ""}>Create project</button>
        </div>
      </div>
    </section>`;
}

function renderCodexWorkspace(step, index) {
  const pluginsOpen = step.id === "connect" && state.fallbackPluginsOpen === true;
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const projectSelected = Boolean(workspace);
  const browserAvailable = [ "plan", "build", "test", "pr"].includes(step.id);
  const planAvailable = state.planPanelOpen === true
    && courseConversations("plan").some((exchange) =>
      typeof exchange?.response === "string"
      && /^\s*<proposed_plan>[\t ]*(?:\n|$)/.test(exchange.response)
      && /(?:^|\n)[\t ]*<\/proposed_plan>[\t ]*$/.test(exchange.response));
  const browserSelected = browserAvailable && state.activeTab === "browser";
  const selectedView = state.activeTab === "plan" && planAvailable
    ? "Plan"
    : browserSelected ? "Blossom Bank" : state.activeTab === "diff" ? "Review" : "Files";
  const workspaceBody = pluginsOpen
    ? renderFallbackPlugins()
    : `
      <section class="codex-panel desktop-thread-panel" aria-label="Codex conversation">
        ${renderThreadHeader(step)}
        <div class="codex-messages thread-timeline" aria-live="polite">${renderConversation(step)}</div>
        ${renderComposer(step)}
        ${state.validationMessage ? `<p class="composer-validation" role="status">${escapeHtml(state.validationMessage)}</p>` : ""}
      </section>
      ${state.inspectorOpen === true || (projectSelected && step.id !== "project") ? `<aside class="inspector-pane" id="codex-inspector" aria-label="Repository views">
        ${!projectSelected ? '<div class="codex-repo-empty-state"><h3 class="codex-repo-empty-title">Nothing here yet</h3></div>' : `
        <div class="workspace-tabs inspector-tabs" role="tablist" aria-label="Repository views">
          <div class="codex-repo-tab-group" style="--codex-repo-tab-count:${step.id === "project" ? 1 : (browserAvailable ? 3 : 2) + Number(planAvailable)}">
            ${renderWorkspaceTab("files", "files", "Files", !browserSelected && !["diff", "plan"].includes(state.activeTab))}
            ${step.id === "project" ? "" : renderWorkspaceTab("diff", "review", "Review", state.activeTab === "diff")}
            ${browserAvailable ? renderWorkspaceTab("browser", "browser", "Blossom Bank", browserSelected) : ""}
            ${planAvailable ? renderWorkspaceTab("plan", "plan", "Plan", state.activeTab === "plan") : ""}
          </div>
        </div>
        <div class="workspace-content inspector-content" role="tabpanel" aria-label="${selectedView}">${renderWorkspaceContent(step, browserSelected)}</div>`}
      </aside>` : ""}`;

  return `
    <section class="workspace-panel codex-desktop-window codex-mini-live" data-codex-mini-state="loading" aria-label="Interactive Codex workspace">
      <div class="codex-mini-live-stage">
        <div class="codex-mini-host" data-codex-mini="loading" aria-label="Official Codex Mini interactive experience"></div>
        <div class="codex-mini-course-overlay" aria-hidden="true"></div>
        <div class="codex-mini-loading" role="status">Loading Codex…</div>
      </div>

      <div class="codex-mini-fallback">
        ${renderProjectRail(step)}
        <div class="desktop-main">
          ${renderDesktopWindowbar(step)}
          ${typeof renderCodexPanelPicker === "function" ? renderCodexPanelPicker() : ""}
          <div class="workspace-body desktop-workspace-body" data-inspector-open="${pluginsOpen ? false : state.inspectorOpen}">
            ${workspaceBody}
          </div>
          ${!pluginsOpen && typeof renderCodexEnvironmentPanel === "function"
            && (step.id !== "project" || (typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace()))
            ? renderCodexEnvironmentPanel()
            : ""}
        </div>
      </div>
      ${step.id === "project" && typeof renderProjectDirectoryPicker === "function"
        ? renderProjectDirectoryPicker()
        : ""}
    </section>`;
}

function practiceTaskCount(step) {
  const guide = practiceGuides[step.id];
  if (!guide) return 0;
  if (state.hostedPreview === true) return 0;
  if (isComplete(step.id)) return guide.tasks.length;

  const savedCount = Number.isSafeInteger(state.taskProgress?.[step.id])
    ? state.taskProgress[step.id]
    : 0;
  const verifiedCount =
    step.id === "project" && typeof verifiedCodexWorkspace === "function" && !verifiedCodexWorkspace()
      ? 0
      : step.id === "connect" && state.linearConnected !== true
      ? Math.min(savedCount, 1)
      : step.id === "pr" && savedCount >= 1 && state.slackConnected === true
      ? Math.max(savedCount, 2)
      : savedCount;
  const contextualCount =
    step.id === "plan" && state.planDraftReady
      ? 2
      : step.id === "plan" && state.planMode
        ? 1
        : 0;

  return Math.min(
    guide.tasks.length - 1,
    Math.max(0, verifiedCount, contextualCount),
  );
}

function syncPracticeTaskProgress(stepId) {
  const step = STEPS.find((candidate) => candidate.id === stepId);
  const guide = practiceGuides[stepId];
  const card = app.querySelector(".practice-task-card");
  if (!step || !guide || !card || STEPS[state.currentIndex]?.id !== stepId) {
    return false;
  }

  const count = practiceTaskCount(step);
  card.dataset.open = String(state.tasksOpen);
  card.querySelector(".practice-task-toggle")?.setAttribute("aria-expanded", String(state.tasksOpen));
  const content = card.querySelector(".practice-task-content");
  if (content) content.hidden = !state.tasksOpen;
  const expandedTask = Number.isSafeInteger(state.expandedPracticeTask)
    && state.expandedPracticeTask <= count
    ? state.expandedPracticeTask
    : isComplete(stepId)
      ? -1
      : count;
  const progress = card.querySelector(".practice-task-progress");
  if (progress) progress.textContent = count + " / " + guide.tasks.length;

  const items = card.querySelectorAll(".practice-task-item");
  for (let index = 0; index < items.length; index += 1) {
    const finished = index < count;
    const item = items[index];
    item.classList.toggle("is-complete", finished);
    item.classList.toggle("is-active", !isComplete(stepId) && index === count);
    const trigger = item.querySelector(".practice-task-trigger");
    if (trigger) {
      trigger.disabled = index > count;
      trigger.setAttribute("aria-expanded", String(index === expandedTask));
    }
    const detail = item.querySelector(".practice-task-detail");
    if (detail) detail.hidden = index !== expandedTask;
    const example = item.querySelector('[data-action="use-practice-example"]');
    if (example) example.disabled = index !== count || isComplete(stepId);
    const exampleComment = item.querySelector('[data-action="use-practice-comment"]');
    if (exampleComment) exampleComment.disabled = finished || count < 2;
    const check = item.querySelector(".practice-task-check");
    if (!check) continue;
    check.setAttribute("aria-label", finished ? "Completed" : "Not completed");
    check.innerHTML = finished ? icon("check") : "";
  }
  if (typeof syncLearnMoreDock === "function") syncLearnMoreDock(step);
  const hintSlot = app.querySelector?.("[data-course-hint-slot]");
  if (hintSlot) hintSlot.outerHTML = renderHintDock(STEPS[state.currentIndex]);
  if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
  return true;
}

function markPracticeTask(stepId, completedCount) {
  const guide = practiceGuides[stepId];
  if (
    state.hostedPreview === true ||
    !guide ||
    STEPS[state.currentIndex]?.id !== stepId ||
    isComplete(stepId) ||
    !Number.isSafeInteger(completedCount) ||
    completedCount < 1 ||
    (stepId === "project" && typeof verifiedCodexWorkspace === "function" && !verifiedCodexWorkspace()) ||
    (stepId === "ticket"
      && (state.environmentOpen !== true
        || state.ticketEnvironmentOpenedByLearner !== true
        || (completedCount >= 2 && state.ticketBranchesInspectedByLearner !== true)
        || (completedCount >= 3 && state.ticketStagingSelectedByLearner !== true))) ||
    (stepId === "connect" && completedCount >= 2 && state.linearConnected !== true)
  ) {
    return false;
  }

  const boundedCount = Math.min(completedCount, guide.tasks.length - 1);
  const previousCount = Number.isSafeInteger(state.taskProgress?.[stepId])
    ? state.taskProgress[stepId]
    : 0;
  if (boundedCount > previousCount + 1) return false;
  if (boundedCount <= previousCount) return false;

  (state.taskProgress ||= {})[stepId] = boundedCount;
  state.expandedPracticeTask = null;
  state.tasksOpen = true;
  state.hintsOpen = false;
  if (
    stepId === "connect" &&
    boundedCount >= 2 &&
    state.validationMessage ===
      "Open Plugins and install the Linear plugin before asking Codex to find tickets."
  ) {
    state.validationMessage = "";
    app.querySelector(".practice-task-card .practice-stage-validation")?.remove();
  }
  saveState();
  syncPracticeTaskProgress(stepId);
  return true;
}

function renderPracticeTasks(step) {
  const guide = practiceGuides[step.id];
  const finished = isComplete(step.id);
  const count = practiceTaskCount(step);
  const expandedTask = Number.isSafeInteger(state.expandedPracticeTask)
    && state.expandedPracticeTask <= count
    ? state.expandedPracticeTask
    : finished
      ? -1
      : count;
  const courseComplete = STEPS.every((candidate) => isComplete(candidate.id));
  const successTitle = step.id === "pr" && courseComplete
    ? "Course complete."
    : "Nicely done.";
  const successCopy = step.id === "pr" && finished && !courseComplete
    ? "Your training pull request is ready. Finish training or return to any lesson you skipped."
    : guide.summary;

  return `
    <aside class="practice-task-card" data-open="${state.tasksOpen}" aria-label="Your practice tasks">
      <button class="practice-task-toggle" type="button" data-action="toggle-tasks" aria-expanded="${state.tasksOpen}" aria-controls="practice-task-content">
        <span class="practice-task-heading">Try these steps</span>
        <span class="practice-task-progress">${count} / ${guide.tasks.length}</span>
        ${icon("chevron-down")}
      </button>
      <div class="practice-task-content" id="practice-task-content" ${state.tasksOpen ? "" : "hidden"}>
        <ol class="practice-task-list">
          ${guide.tasks.map((task, taskIndex) => {
            const complete = taskIndex < count;
            const active = !finished && taskIndex === count;
            const expanded = taskIndex === expandedTask;
            const detail = guide.details?.[taskIndex];
            const detailId = `practice-task-detail-${step.id}-${taskIndex}`;
            return `<li class="practice-task-item${complete ? " is-complete" : active ? " is-active" : ""}">
              <button class="practice-task-trigger" type="button" data-action="toggle-practice-task" data-task-index="${taskIndex}" aria-expanded="${expanded}" aria-controls="${escapeHtml(detailId)}"${taskIndex > count ? ' disabled title="Complete the previous steps first"' : ""}>
                <span class="practice-task-check" aria-label="${complete ? "Completed" : "Not completed"}">${complete ? icon("check") : ""}</span>
                <span class="practice-task-label">${escapeHtml(task)}</span>
                ${icon("chevron-down", "practice-task-chevron")}
              </button>
              <div class="practice-task-detail" id="${escapeHtml(detailId)}" ${expanded ? "" : "hidden"}>
                ${detail?.copy ? `<p class="practice-task-guidance">${escapeHtml(detail.copy)}</p>` : ""}
                ${detail?.steps?.length ? `<ol class="practice-task-substeps">${detail.steps.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join("")}</ol>` : ""}
                ${detail?.checks?.length ? `${detail.checksLabel ? `<p class="practice-task-guidance practice-task-guidance-label">${escapeHtml(detail.checksLabel)}</p>` : ""}<ul class="practice-task-checks">${detail.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("")}</ul>` : ""}
                ${detail?.note ? `<p class="practice-task-guidance practice-task-guidance-note">${escapeHtml(detail.note)}</p>` : ""}
                ${detail?.example ? `<p class="practice-task-guidance"><code>${escapeHtml(detail.example)}</code></p><button class="practice-task-example" type="button" data-action="use-practice-example" data-task-index="${taskIndex}" data-prompt="${escapeHtml(detail.example)}"${taskIndex !== count || finished ? " disabled" : ""}>Use example prompt</button>` : ""}
                ${detail?.exampleComment ? `<button class="practice-task-example" type="button" data-action="use-practice-comment" ${finished || count < 2 ? "disabled" : ""}>Use example comment</button>` : ""}
              </div>
            </li>`;
          }).join("")}
        </ol>
        ${finished && count === guide.tasks.length
          ? `<section class="practice-task-success" role="status" aria-live="polite" aria-atomic="true">
              <p class="practice-task-success-title">${icon("check")}<span>${escapeHtml(successTitle)}</span></p>
              <p class="practice-task-success-copy">${escapeHtml(successCopy)}</p>
            </section>`
          : ""}
        <div class="practice-stage-actions">${renderLessonActions(step, finished)}${state.validationMessage ? `<p class="practice-stage-validation" role="status">${escapeHtml(state.validationMessage)}</p>` : ""}</div>
      </div>
    </aside>`;
}

function codexStepHint(step) {
  if (!step || isComplete(step.id)) return null;
  const task = practiceTaskCount(step);
  if (step.id === "test" && task === 0) return "Hover on the project name in the sidebar, then select the new thread icon to start a new thread.";
  if (step.id === "test" && task === 1) return "Type /review and select Code review. Under Review against a base branch, select staging to review your changes against their source branch.";
  return null;
}

function renderHintDock(step) {
  const hint = codexStepHint(step);
  return `<div data-course-hint-slot>${hint ? `
    <aside class="hint-dock" data-open="${state.hintsOpen}" aria-label="Optional practice hints">
      <button class="hint-toggle" type="button" data-action="toggle-hints" aria-expanded="${state.hintsOpen}" aria-controls="hint-content">${icon("sparkle")} <span>Need a hint?</span> ${icon("chevron-down")}</button>
      <div class="hint-content" id="hint-content" ${state.hintsOpen ? "" : "hidden"}>
        <p class="hint-prompt-label">${escapeHtml(hint)}</p>
      </div>
    </aside>` : ""}</div>`;
}

function renderLearnMoreDock(step) {
  const features = practiceLearnMore[step.id];
  if (!features?.length) return "";

  const contentId = `learn-more-content-${step.id}`;
  const label = `Learn more about ${step.title}`;
  return `
    <aside class="practice-learn-more" data-open="${state.learnMoreOpen}" aria-label="${escapeHtml(label)}">
      <button class="hint-toggle practice-learn-more-toggle" type="button" data-action="toggle-learn-more" aria-label="${escapeHtml(label)}" aria-expanded="${state.learnMoreOpen}" aria-controls="${escapeHtml(contentId)}"><span>Learn more</span>${icon("chevron-down")}</button>
      <div class="hint-content practice-learn-more-content" id="${escapeHtml(contentId)}" ${state.learnMoreOpen ? "" : "hidden"}>
        ${features.map((feature) => `
          <h3 class="practice-learn-more-title">${escapeHtml(feature.title)}</h3>
          <p class="practice-learn-more-summary">${escapeHtml(feature.summary)}</p>
          <a class="practice-learn-more-link" href="${escapeHtml(feature.url)}" target="_blank" rel="noopener noreferrer" aria-label="Read the docs about ${escapeHtml(feature.title)}">Read the docs</a>
        `).join("")}
      </div>
    </aside>`;
}

function syncLearnMoreDock(step) {
  const current = app.querySelector(".practice-learn-more");
  if (!current) return false;

  const markup = renderLearnMoreDock(step);
  if (!markup) return false;

  const focused = document.activeElement;
  const restoreFocus = current.contains(focused);
  const focusSelector = focused?.matches?.(".practice-learn-more-link")
    ? ".practice-learn-more-link"
    : ".practice-learn-more-toggle";
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const replacement = template.content.firstElementChild;
  if (!replacement) return false;

  current.replaceWith(replacement);
  if (restoreFocus) replacement.querySelector(focusSelector)?.focus?.();
  return true;
}

function renderPracticeTicket(step) {
  const connectIndex = STEPS.findIndex((candidate) => candidate.id === "connect");
  const currentIndex = STEPS.findIndex((candidate) => candidate.id === step?.id);
  const ticketFound = state.linearConnected === true
    && isComplete("connect")
    && (state.conversations?.connect || []).some((exchange) =>
      exchange?.guided === true
      && typeof exchange.response === "string"
      && exchange.response.toLowerCase().includes(LINEAR_ISSUE.id.toLowerCase()));
  if (!ticketFound || connectIndex < 0 || currentIndex < connectIndex || ["test", "pr"].includes(step.id)) return "";

  const expanded = state.practiceTicketExpanded === true;
  const contentId = `practice-linear-content-${String(LINEAR_ISSUE.id)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 80) || "ticket"}`;

  return `
    <aside class="practice-linear-card" data-open="${expanded}" aria-label="Linear ticket ${escapeHtml(LINEAR_ISSUE.id)}">
      <button class="practice-linear-toggle" type="button" data-action="toggle-practice-ticket" aria-expanded="${expanded}" aria-controls="${escapeHtml(contentId)}">
        <span class="practice-linear-toggle-copy">
          <span class="practice-linear-header">
            <span class="practice-linear-brand"><img src="/images/codex/work-plugins/linear.svg" alt="" aria-hidden="true" /> Linear</span>
            <span class="practice-linear-key">${escapeHtml(LINEAR_ISSUE.id)}</span>
          </span>
          <span class="practice-linear-title">${escapeHtml(LINEAR_ISSUE.title)}</span>
        </span>
        ${icon("chevron-right", "practice-linear-chevron")}
      </button>
      <div class="practice-linear-content" id="${escapeHtml(contentId)}" ${expanded ? "" : "hidden"}>
        <div class="practice-linear-badges">
          <span class="practice-linear-status">${escapeHtml(LINEAR_ISSUE.status)}</span>
          <span class="practice-linear-priority">${escapeHtml(LINEAR_ISSUE.priority)} priority</span>
        </div>
        <dl class="practice-linear-fields">
          <div><dt>Cycle</dt><dd>${escapeHtml(LINEAR_ISSUE.cycle)}</dd></div>
          <div><dt>Estimate</dt><dd>${escapeHtml(LINEAR_ISSUE.estimate)}</dd></div>
        </dl>
        <section class="practice-linear-section">
          <h3>Description</h3>
          <p>${escapeHtml(LINEAR_ISSUE.description)}</p>
        </section>
        <section class="practice-linear-section">
          <h3>Acceptance criteria</h3>
          <ul class="practice-linear-criteria">${LINEAR_ISSUE.acceptanceCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("")}</ul>
        </section>
      </div>
    </aside>`;
}

function renderLessonActions(step, finished) {
  if (!finished) return "";
  return `<button class="primary-button" data-training-next-highlight type="button" data-action="next-step">${step.id === STEPS.at(-1).id ? "Finish training" : "Next lesson"} ${icon("arrow-right")}</button>`;
}

function nativeStepParts(step, response = step.assistantResponse, changes, verification, commandExecutions) {
  const parts = [];
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;

  if (workspace) {
    if (step.id === "connect" && state.linearConnected === true) {
      parts.push({
        type: "appUsed",
        appName: "Linear",
        label: "Search",
        status: "completed",
      }, {
        type: "appUsed",
        appName: "Linear",
        label: "Search issues",
        status: "completed",
      });
    }
    if (step.id === "build" && typeof nativeWorkspaceFileChangeParts === "function") {
      const authenticatedChanges = Array.isArray(changes)
        ? [...new Map(changes
          .map((file) => workspace.changedFiles.find((entry) => entry.path === file?.path))
          .filter(Boolean)
          .map((file) => [file.path, file])).values()]
        : workspace.changedFiles;
      parts.push(...nativeWorkspaceFileChangeParts({ changedFiles: authenticatedChanges }));
    }
    if (step.id === "test" && typeof verifiedCodexVerification === "function"
      && typeof nativeCommandExecutionTranscript === "function") {
      const result = verification && verifiedCodexVerification(verification, { allowFailed: true });
      if (result) {
        const transcript = nativeCommandExecutionTranscript(result.checks);
        if (transcript) parts.push({
          type: "assistant",
          text: "Ran commands",
          commandExecutions: result.checks,
        });
      }
    }
    if (step.id === "ticket" && typeof verifiedCodexBranchCommandExecutions === "function"
      && typeof nativeCommandExecutionTranscript === "function") {
      const commands = verifiedCodexBranchCommandExecutions(commandExecutions);
      const transcript = nativeCommandExecutionTranscript(commands);
      if (transcript) parts.push({
        type: "assistant",
        text: "Ran commands",
        commandExecutions: commands,
      });
    }
    parts.push({ type: "assistant", text: response });
    return parts;
  }

  if (step.id === "connect") {
    parts.push({
      type: "appUsed",
      appName: "Linear",
      label: "Search",
      status: "completed",
    }, {
      type: "appUsed",
      appName: "Linear",
      label: "Search issues",
      status: "completed",
    });
  }

  if (step.id === "ticket") {
    parts.push({ type: "searching", query: "local branches", corpus: "repo" });
  }

  if (step.id === "plan") {
    parts.push({ type: "searching", query: "homepage heading", corpus: "repo" });
    parts.push({ type: "reading", fileName: defaultFile });
    parts.push({ type: "reading", fileName: "src/App.test.tsx" });
  }

  if (step.id === "build") {
    for (const fileName of modifiedFiles) {
      parts.push({
        type: "fileChange",
        changeType: "edited",
        fileName,
        fileKey: fileName,
        additions: diffStats[fileName].additions,
        deletions: diffStats[fileName].deletions,
      });
    }
  }

  parts.push({ type: "assistant", text: response });
  return parts;
}

function isVerificationLesson(step = STEPS[state.currentIndex]) {
  return ["test", "pr"].includes(step?.id);
}

function activeCodexThreadId(step = STEPS[state.currentIndex]) {
  if (!isVerificationLesson(step)) return "eng-248";
  return state.selectedCodexThread || (state.verificationThreadCreated || step.id === "pr"
    ? "eng-248-verify" : "eng-248");
}

function codexConversationSteps(step, threadId = activeCodexThreadId(step)) {
  if (step.id === "project") return [step];
  const index = STEPS.findIndex((candidate) => candidate.id === step.id);
  return STEPS.slice(0, index + 1).filter((candidate) => candidate.id !== "project"
    && (threadId === "eng-248-verify" ? isVerificationLesson(candidate) : !isVerificationLesson(candidate)));
}

function verificationComposerBlocked(step = STEPS[state.currentIndex]) {
  return isVerificationLesson(step) && ((step.id === "test" && !state.verificationThreadCreated)
    || activeCodexThreadId(step) !== "eng-248-verify");
}

function startVerificationThread() {
  const step = STEPS[state.currentIndex];
  if (!isVerificationLesson(step) || state.isRunning) return false;
  const wasInCatalog = typeof nativeCodexShadow === "function"
    && nativeCodexShadow()?.querySelector?.("[data-codex-mini-plugins]");
  state.verificationThreadCreated = true;
  state.selectedCodexThread = "eng-248-verify";
  if (step.id === "test" && !isComplete("test")) markPracticeTask("test", 1);
  state.validationMessage = "";
  state.fallbackPluginsOpen = false;
  state.activeTab = "artifact";
  state.hintsOpen = false;
  clearNativeCodexPrompt();
  saveState();
  if (wasInCatalog) render({ resetMini: true });
  else refreshCurrentLab();
  return true;
}

function hasStartedCodexTask(currentStep = STEPS[state.currentIndex], threadId = activeCodexThreadId(currentStep)) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep?.id);
  if (currentIndex < 0) return false;

  const availableSteps = codexConversationSteps(currentStep, threadId);
  const pending = state.pendingConversation;
  if (state.isRunning && typeof pending?.prompt === "string" && pending.prompt.trim()
    && availableSteps.some((step) => step.id === pending.stepId)) {
    return true;
  }

  return availableSteps.some((step) => (courseConversations(step.id)).some((exchange) =>
    typeof exchange?.prompt === "string" && Boolean(exchange.prompt.trim())
    && typeof exchange.response === "string"));
}

function codexTaskTitle(currentStep = STEPS[state.currentIndex]) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep?.id);
  if (currentIndex < 0) return "New chat";
  if (activeCodexThreadId(currentStep) === "eng-248-verify") return "Verify the homepage change";
  if (currentStep.id === "project") return hasStartedCodexTask(currentStep) ? "Blossom Bank architecture" : "New chat";

  let firstPrompt = "";
  let ticketDiscovered = false;
  for (const step of STEPS.slice(0, currentIndex + 1).filter((candidate) => candidate.id !== "project")) {
    for (const exchange of courseConversations(step.id)) {
      if (!firstPrompt && typeof exchange?.prompt === "string") firstPrompt = exchange.prompt.trim();
      if (step.id === "connect" && typeof exchange?.response === "string"
        && /\bENG-248\b/i.test(exchange.response)) {
        ticketDiscovered = true;
      }
    }
  }

  if (ticketDiscovered) return "Shorten the homepage heading";
  if (!firstPrompt && state.isRunning && state.pendingConversation?.stepId !== "project"
    && typeof state.pendingConversation?.prompt === "string") {
    firstPrompt = state.pendingConversation.prompt.trim();
  }
  return firstPrompt || "New chat";
}

function visibleCodexUserMessage(turn) {
  const prompt = typeof turn?.prompt === "string" ? turn.prompt : "";
  if (prompt === "/review staging") return `Please review changes on ${COURSE.repository.workingBranch} against ${COURSE.repository.baseBranch}`;
  if (prompt.trim()) return prompt;
  if (!Array.isArray(turn?.reviewComments)) return "";

  return turn.reviewComments
    .map((comment) => typeof comment?.text === "string" ? comment.text.trim() : "")
    .filter(Boolean)
    .join("\n\n");
}

function createCodexMiniThread(currentStep, threadId = activeCodexThreadId(currentStep)) {
  const messages = [];
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;

  const threadSteps = codexConversationSteps(currentStep, threadId);
  const threadRunning = state.isRunning && state.pendingConversation
    && threadSteps.some((lesson) => lesson.id === state.pendingConversation.stepId);
  for (const step of threadSteps) {
    for (const exchange of courseConversations(step.id)) {
      const userMessage = typeof visibleCodexUserMessage === "function"
        ? visibleCodexUserMessage(exchange)
        : exchange.prompt;
      if (userMessage.trim()) {
        messages.push({
          id: `user-${exchange.id}`,
          role: "user",
          text: userMessage,
        });
      }
      if (exchange.response.trim()) {
        const parts = exchange.guided
          ? nativeStepParts(
            step,
            exchange.response,
            exchange.workspaceChanges || exchange.workspace?.changedFiles,
            exchange.verification,
            exchange.commandExecutions,
          )
          : [{ type: "assistant", text: exchange.response }];
        const final = parts.at(-1);
        if (final?.type === "assistant" && step.id === "project" && exchange.guided) final.architecture = true;
        if (final?.type === "assistant" && exchange.stagedPreview && requestsLocalPreview(exchange.prompt)) {
          final.stagedPreview = exchange.stagedPreview;
          final.exchangeId = exchange.id;
        }
        if (final?.type === "assistant"
          && !(step.id === "connect" && exchange.guided)
          && Number.isSafeInteger(exchange.workedSeconds)
          && exchange.workedSeconds >= 1
          && exchange.workedSeconds <= 3_600
          && typeof verifiedCodexWorkedActivities === "function") {
          const activities = verifiedCodexWorkedActivities(exchange.workActivities);
          const commands = Array.isArray(exchange.commandExecutions)
            ? exchange.commandExecutions
            : Array.isArray(exchange.verification?.checks)
            ? exchange.verification.checks
            : [];
          if (activities.length || commands.length) {
            Object.assign(final, {
              workedSeconds: exchange.workedSeconds,
              ...(activities.length ? { workActivities: activities } : {}),
              ...(commands.length ? { workCommands: commands } : {}),
            });
          }
        }
        messages.push({
          id: `assistant-${exchange.id}`,
          role: "assistant",
          parts,
        });
      }
    }
  }

  if (threadRunning) {
    if (state.pendingConversation.accepted !== false) {
      const userMessage = typeof visibleCodexUserMessage === "function"
        ? visibleCodexUserMessage(state.pendingConversation)
        : state.pendingConversation.prompt;
      messages.push({
        id: `user-${state.pendingConversation.id}`,
        role: "user",
        text: userMessage,
      });
    }
    messages.push({
      id: `assistant-${state.pendingConversation.id}`,
      role: "assistant",
      parts: [{
        type: "thinking",
        seconds: Math.max(1, Math.floor((Date.now() - (state.pendingConversation.startedAt || Date.now())) / 1_000)),
      }, ...(state.pendingConversation.stepId === "connect" && state.linearConnected === true
        ? [{ type: "appUsed", appName: "Linear", label: "Search", status: "active" },
          { type: "appUsed", appName: "Linear", label: "Search issues", status: "active" }]
        : []), ...(workspace && state.pendingConversation.stepId === "build"
        && typeof nativeWorkspaceFileChangeParts === "function"
        ? nativeWorkspaceFileChangeParts(workspace)
        : [])],
    });
  }

  return {
    id: threadId,
    title: threadId === "eng-248-verify" ? "Verify the homepage change"
      : isVerificationLesson(currentStep) ? "Shorten the homepage heading" : typeof codexTaskTitle === "function" ? codexTaskTitle(currentStep) : "New chat",
    meta: threadRunning ? "Working" : "Now",
    status: threadRunning ? "inProgress" : "normal",
    patch: workspace ? workspace.patch : isComplete("build") ? Object.values(fallbackReviewDiffs()).join("\n") : "",
    messages,
  };
}

function codexMiniProps(step) {
  const selectingProject = step.id === "project"
    && !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace());
  const taskStarted = typeof hasStartedCodexTask === "function"
    ? hasStartedCodexTask(step)
    : Boolean((state.isRunning && state.pendingConversation?.prompt?.trim())
      || (state.conversations?.[step.id] || []).length);
  const isNewTask = !taskStarted;
  const props = {
    variant: isNewTask ? "home" : "thread",
    showProductModeSelector: false,
    initialProductMode: "codex",
    ...(selectingProject ? {} : {
      workspace: {
        id: "blossom-bank",
        name: typeof state.projectDisplayName === "string" && state.projectDisplayName.trim()
          ? state.projectDisplayName.trim()
          : "Blossom Bank",
        path: COURSE.repo,
      },
    }),
    threads: isVerificationLesson(step)
      ? [createCodexMiniThread(step, "eng-248"),
        ...(hasStartedCodexTask(step, "eng-248-verify") ? [createCodexMiniThread(step, "eng-248-verify")] : [])]
      : taskStarted ? [createCodexMiniThread(step)] : [],
    composerResponseText: step.assistantResponse,
    animate: false,
    className: state.theme || "light",
    style: { height: "100%", width: "100%" },
  };

  if (!isNewTask && taskStarted) {
    props.thread_id = activeCodexThreadId(step);
  }
  return props;
}

function codexMiniExpectedReviewPaths(props) {
  // A new chat has no review pane yet, even when the project has other threads.
  if (!props?.thread_id) return [];
  const patch = props.threads?.find((thread) => thread.id === props.thread_id)?.patch;
  if (typeof patch !== "string" || !patch.trim()) return [];
  const workspace = typeof verifiedCodexWorkspace === "function"
    ? verifiedCodexWorkspace()
    : null;
  return Array.isArray(workspace?.changedFiles)
    ? [...new Set(workspace.changedFiles
      .filter((file) => typeof file?.path === "string" && file.path && file.patch)
      .map((file) => file.path))]
    : [];
}

function settleCodexMiniSurface(host, step, expectedReviewPaths = []) {
  if (!host?.isConnected || STEPS[state.currentIndex] !== step) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    let completed = false;
    let frame = 0;
    let frameUsesAnimation = false;
    let observedShadow = null;
    let observer = null;

    const finish = (ready, error = null) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeout);
      observer?.disconnect();
      if (frame) {
        if (frameUsesAnimation && typeof window.cancelAnimationFrame === "function") {
          window.cancelAnimationFrame(frame);
        } else {
          window.clearTimeout(frame);
        }
      }
      if (error) reject(error);
      else resolve(ready);
    };

    const schedule = (callback) => {
      if (completed || frame) return;
      frameUsesAnimation = typeof window.requestAnimationFrame === "function";
      frame = frameUsesAnimation
        ? window.requestAnimationFrame(() => {
          frame = 0;
          callback();
        })
        : window.setTimeout(() => {
          frame = 0;
          callback();
        }, 16);
    };

    const inspect = () => {
      if (completed) return;
      if (!host.isConnected || STEPS[state.currentIndex] !== step) {
        finish(false);
        return;
      }

      const shadow = host.firstElementChild?.shadowRoot;
      if (shadow && shadow !== observedShadow) {
        observedShadow = shadow;
        observer?.observe(shadow, { childList: true, subtree: true });
      }
      // Plugins and Scheduled are complete pages without a chat composer or
      // review panel. A course refresh must keep those native pages mounted.
      const navigationPage = shadow?.querySelector?.(
        '[data-codex-mini-plugins], input[aria-label="Search scheduled tasks"]',
      );
      if (!navigationPage && !shadow?.querySelector?.("textarea")) {
        schedule(inspect);
        return;
      }
      if (!navigationPage && expectedReviewPaths.length) {
        const reviewCards = Array.from(
          shadow.querySelectorAll?.(
            "[data-codex-mini-file-cache-key][data-codex-mini-file-name]",
          ) || [],
        );
        const hasExpectedReviewCards = expectedReviewPaths.every((path) => reviewCards.some((card) =>
          card.dataset?.codexMiniFileName === path
          && card.dataset?.codexMiniFileCacheKey === path));
        const hasRenderedReviewRow = reviewCards.some((card) =>
          nativeReviewRenderedRows(card).length > 0);
        if (!hasExpectedReviewCards || !hasRenderedReviewRow) {
          schedule(inspect);
          return;
        }
      }

      try {
        attachCodexMiniBridge(host);
      } catch (error) {
        finish(false, error);
        return;
      }

      if (!shadow.__learnCodexBridge) {
        schedule(inspect);
        return;
      }

      observer?.disconnect();
      schedule(() => finish(host.isConnected && STEPS[state.currentIndex] === step));
    };

    const timeout = window.setTimeout(() => {
      finish(false, new Error("The official Codex Mini surface did not finish loading."));
    }, 1_500);

    if (typeof MutationObserver === "function") {
      observer = new MutationObserver(inspect);
      observer.observe(host, { childList: true, subtree: true });
    }
    inspect();
  });
}

async function mountCodexMini(step) {
  const host = app.querySelector(".codex-mini-host");
  const workspace = host?.closest(".codex-mini-live");
  if (!host || !workspace) return;

  // The breakpoint belongs to the Codex shell, including the offline fallback.
  // Attaching before the native import keeps both renderers on the same resize path.
  attachCodexMiniResponsiveBridge(host);
  attachCodexSidePanelTooltip(workspace);

  try {
    codexMiniModulesPromise ||= Promise.all([
      import(CODEX_MINI_APP_URL),
      import(CODEX_MINI_RENDERER_URL),
    ]);
    const [{ B: CodexMiniApp }, { default: renderReact }] = await codexMiniModulesPromise;
    if (!host.isConnected || STEPS[state.currentIndex] !== step) return;

    const props = codexMiniProps(step);
    const expectedReviewPaths = codexMiniExpectedReviewPaths(props);
    host.setAttribute("ssr", "");
    await renderReact(host)(CodexMiniApp, props, {}, { client: "only" });
    if (!host.isConnected || STEPS[state.currentIndex] !== step) return;

    host.dataset.codexMini = "ready";
    if (!await settleCodexMiniSurface(host, step, expectedReviewPaths)) {
      return;
    }
    if (!host.isConnected || STEPS[state.currentIndex] !== step) return;
    workspace.dataset.codexMiniState = "ready";
    const settledPracticeEntry = typeof settlePracticeThreadAtBottom === "function"
      && settlePracticeThreadAtBottom(step, workspace);
    if (!settledPracticeEntry && state.pendingConversation) {
      scrollNativeThreadToBottom();
    }
    if (state.restoredPublishedThreadScrollPending && step.id === "pr") {
      settleRestoredPublishedThreadAtBottom(step);
    }
  } catch (error) {
    if (!host.isConnected) return;
    host.dataset.codexMini = "fallback";
    workspace.dataset.codexMiniState = "fallback";
    const request = workspace.querySelector?.(
      '.codex-mini-fallback [data-codex-composer-request-navigation]',
    );
    if (request && state.planImplementationRequestFocused !== true) {
      state.planImplementationRequestFocused = true;
      request.focus?.({ preventScroll: true });
    }
    console.warn("The official Codex Mini surface could not be loaded; using the local course fallback.", error);
    if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
    if (typeof settlePracticeThreadAtBottom === "function") {
      settlePracticeThreadAtBottom(step, workspace);
    }
    if (state.restoredPublishedThreadScrollPending && step.id === "pr") {
      settleRestoredPublishedThreadAtBottom(step);
    }
  }
}

function nativeCodexShadow(host = app.querySelector('.codex-mini-host[data-codex-mini="ready"]')) {
  return host?.firstElementChild?.shadowRoot || null;
}

let codexSidePanelTooltipId = 0;
function attachCodexSidePanelTooltip(root) {
  if (!root?.querySelector) return;

  const bindings = root.__learnCodexTooltips ||= new Set();
  for (const binding of [...bindings]) {
    if (binding.trigger?.isConnected !== false) continue;
    binding.cleanup();
    bindings.delete(binding);
  }

  const attach = ({ trigger, describedControl = trigger, html = "", text = "", delay = 700, focusable = true }) => {
    if (!trigger || !describedControl || trigger.__learnCodexSidePanelTooltip) return;

    const ownerDocument = trigger.ownerDocument || document;
    const ownerWindow = ownerDocument.defaultView || window;
    const tooltip = ownerDocument.createElement("div");
    const tooltipId = `codex-side-panel-tooltip-${++codexSidePanelTooltipId}`;
    tooltip.id = tooltipId;
    tooltip.className = "codex-side-panel-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    if (html) tooltip.innerHTML = html;
    else tooltip.textContent = text;
    Object.assign(tooltip.style, {
      position: "fixed",
      zIndex: "100",
      maxWidth: "min(320px, calc(100vw - 16px))",
      maxHeight: "calc(100vh - 16px)",
      alignItems: "center",
      boxSizing: "border-box",
      padding: "4px 8px",
      border: "1px solid var(--codex-line, rgb(26 28 31 / 8%))",
      borderRadius: "10px",
      background: "var(--codex-paper, #fff)",
      color: "var(--codex-ink, #1a1c1f)",
      font: "400 13px/19px var(--codex-product-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
      overflowWrap: "anywhere",
      whiteSpace: "normal",
      pointerEvents: "none",
      userSelect: "none",
    });
    (trigger.hasAttribute?.("data-codex-disabled-reason") ? trigger : root).append?.(tooltip);

    let hoverTimer = 0;
    const clearHoverTimer = () => {
      if (!hoverTimer) return;
      ownerWindow.clearTimeout(hoverTimer);
      hoverTimer = 0;
    };
    const show = () => {
      clearHoverTimer();
      if (trigger.isConnected === false || describedControl.isConnected === false) return;
      tooltip.hidden = false;
      tooltip.style.display = "flex";
      describedControl.setAttribute("aria-describedby", tooltipId);
      const controlBounds = describedControl.getBoundingClientRect();
      const tooltipBounds = tooltip.getBoundingClientRect();
      const viewportWidth = ownerWindow.innerWidth || ownerDocument.documentElement?.clientWidth || 0;
      const centeredLeft = controlBounds.left + (controlBounds.width - tooltipBounds.width) / 2;
      tooltip.style.left = `${Math.round(Math.max(8, Math.min(centeredLeft, viewportWidth - tooltipBounds.width - 8)))}px`;
      const above = controlBounds.top - tooltipBounds.height - 2;
      tooltip.style.top = `${Math.round(above >= 8 ? above : controlBounds.bottom + 2)}px`;
    };
    const hide = () => {
      clearHoverTimer();
      tooltip.style.display = "none";
      tooltip.hidden = true;
      if (describedControl.getAttribute("aria-describedby") === tooltipId) {
        describedControl.removeAttribute("aria-describedby");
      }
    };
    const scheduleHover = (event) => {
      if (event?.pointerType === "touch") return;
      clearHoverTimer();
      hoverTimer = ownerWindow.setTimeout(show, delay);
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") hide();
    };
    const handleFocus = () => {
      if (focusable && trigger.matches?.(":focus-visible")) show();
    };
    trigger.addEventListener("pointerenter", scheduleHover);
    trigger.addEventListener("pointerleave", hide);
    trigger.addEventListener("contextmenu", hide);
    if (focusable) {
      trigger.addEventListener("focus", handleFocus);
      trigger.addEventListener("blur", hide);
    }
    ownerWindow.addEventListener?.("blur", hide);
    ownerWindow.addEventListener?.("keydown", handleKeydown);

    const cleanup = () => {
      hide();
      trigger.removeEventListener?.("pointerenter", scheduleHover);
      trigger.removeEventListener?.("pointerleave", hide);
      trigger.removeEventListener?.("contextmenu", hide);
      if (focusable) {
        trigger.removeEventListener?.("focus", handleFocus);
        trigger.removeEventListener?.("blur", hide);
      }
      ownerWindow.removeEventListener?.("blur", hide);
      ownerWindow.removeEventListener?.("keydown", handleKeydown);
      tooltip.remove?.();
      delete trigger.__learnCodexSidePanelTooltip;
    };
    const binding = { trigger, tooltip, show, hide, cleanup };
    bindings.add(binding);
    trigger.__learnCodexSidePanelTooltip = binding;
  };

  const button = root.querySelector("[data-codex-files-toggle]");
  if (button) {
    const ownerWindow = (button.ownerDocument || document).defaultView || window;
    const isMac = /Mac|iPhone|iPad|iPod/.test(ownerWindow.navigator?.platform || ownerWindow.navigator?.userAgent || "");
    attach({
      trigger: button,
      html: `<span>Toggle side panel</span><kbd>${isMac ? "⌥⌘B" : "Ctrl+Alt+B"}</kbd>`,
    });
  }

  for (const trigger of root.querySelectorAll?.('[data-codex-project-action="new-thread"]') || []) {
    attach({ trigger, text: "New thread" });
  }

  for (const wrapper of root.querySelectorAll?.("[data-codex-disabled-reason]") || []) {
    const disabledControl = wrapper.querySelector?.(":disabled, [aria-disabled=\"true\"]");
    attach({
      trigger: wrapper,
      describedControl: disabledControl,
      text: wrapper.dataset.codexDisabledReason || "",
      delay: 700,
      focusable: false,
    });
  }

  const mountHost = root.host?.closest?.(".codex-mini-host")
    || root.closest?.(".codex-mini-live")?.querySelector?.(".codex-mini-host");
  if (mountHost && !root.__learnCodexTooltipCleanup) {
    root.__learnCodexTooltipCleanup = true;
    mountHost.addEventListener?.("astro:unmount", () => {
      for (const binding of bindings) binding.cleanup();
      bindings.clear();
      delete root.__learnCodexTooltipCleanup;
    }, { once: true });
  }
}

function currentCodexCourseTarget() {
  const step = typeof STEPS !== "undefined" ? STEPS[state.currentIndex] : null;
  if (!step || state.phase !== "practice" || state.isRunning === true
    || state.pendingConversation || state.projectSelecting === true
    || state.searchOpen === true || state.docsAgentOpen === true
    || state.restartDialogOpen === true
    || (step.id === "project" && state.practiceScenarioDismissed === false)
    || (typeof isComplete === "function" && isComplete(step.id))) {
    return null;
  }

  const frame = app.querySelector?.(".practice-codex-frame");
  const screen = app.querySelector?.(".practice-screen");
  const frameBounds = frame?.getBoundingClientRect?.();
  const screenBounds = screen?.getBoundingClientRect?.();
  if (!frame || !screen || !frameBounds || !screenBounds
    || frameBounds.width <= 0 || screenBounds.width <= 0 || screenBounds.height <= 0) {
    return null;
  }

  const shadow = typeof nativeCodexShadow === "function" ? nativeCodexShadow() : null;
  if (shadow?.querySelector('input[aria-label="Search scheduled tasks"]')) return null;
  const roots = shadow ? [shadow, frame, app] : [frame, app];
  const supported = (element) => {
    if (!element || element.isConnected === false || element.disabled === true || element.hidden === true
      || element.inert === true
      || element.getAttribute?.("aria-disabled") === "true"
      || element.closest?.('[hidden], [inert], [aria-hidden="true"]')) {
      return false;
    }

    const bounds = element.getBoundingClientRect?.();
    if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)
      || bounds.width <= 0 || bounds.height <= 0
      || bounds.right <= screenBounds.left || bounds.left >= screenBounds.right
      || bounds.bottom <= screenBounds.top || bounds.top >= screenBounds.bottom) {
      return false;
    }

    const style = typeof window?.getComputedStyle === "function"
      ? window.getComputedStyle(element)
      : null;
    if (style?.display === "none" || style?.visibility === "hidden") return false;

    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (parent.isConnected === false || parent.hidden === true || parent.inert === true
        || parent.getAttribute?.("aria-hidden") === "true") return false;
      const parentStyle = typeof window?.getComputedStyle === "function"
        ? window.getComputedStyle(parent)
        : null;
      if (parentStyle?.display === "none" || parentStyle?.visibility === "hidden") return false;
      const parentBounds = parent.getBoundingClientRect?.();
      if (parentBounds && (
        /^(auto|scroll|hidden|clip)$/.test(parentStyle?.overflowY || "")
          && (bounds.top < parentBounds.top || bounds.bottom > parentBounds.bottom)
        || /^(auto|scroll|hidden|clip)$/.test(parentStyle?.overflowX || "")
          && (bounds.left < parentBounds.left || bounds.right > parentBounds.right)
      )) return false;
    }
    return true;
  };
  const find = (selectors, condition = () => true, scopedRoots = roots) => {
    for (const root of scopedRoots) {
      if (!root) continue;
      for (const selector of selectors) {
        const matches = typeof root.querySelectorAll === "function"
          ? Array.from(root.querySelectorAll(selector))
          : [root.querySelector?.(selector)].filter(Boolean);
        const element = matches.find((candidate) => supported(candidate) && condition(candidate));
        if (element) return element;
      }
    }
    return null;
  };
  const target = (key, label, selectors, condition, scopedRoots) => {
    const element = find(selectors, condition, scopedRoots);
    return element ? { element, key, label } : null;
  };
  const repositoryPane = shadow?.querySelector?.('[data-codex-repo-pane]')
    || frame.querySelector?.('.inspector-pane, #codex-inspector')
    || null;
  const activeRepositoryTab = repositoryPane?.dataset?.codexRepoActiveTab
    || (repositoryPane?.getAttribute?.("aria-label") === "Review" ? "review" : "");
  const activePanel = (tab) => {
    if (!repositoryPane?.querySelectorAll || (activeRepositoryTab && activeRepositoryTab !== tab)) {
      return null;
    }
    const panels = Array.from(repositoryPane.querySelectorAll('[role="tabpanel"]'));
    return panels.find((panel) => {
      const id = typeof panel.id === "string" ? panel.id : "";
      const label = panel.getAttribute?.("aria-label")?.toLowerCase() || "";
      const matches = tab === "files"
        ? panel.dataset?.codexRepoExplorer === "true" || id === "codex-repo-panel-files" || label === "files"
        : tab === "review"
          ? panel.dataset?.codexRepoNativePanel === "true" || id === "codex-repo-panel-review" || label === "review"
          : tab === "browser"
            ? panel.dataset?.codexBrowserPanel === "true" || id === "codex-repo-panel-browser" || label === "blossom bank"
            : false;
      return matches && supported(panel);
    }) || null;
  };
  const repositoryTabReady = (tab) => {
    if (!repositoryPane) return true;
    if (activeRepositoryTab && activeRepositoryTab !== tab) return false;
    if (typeof repositoryPane.querySelectorAll !== "function") return true;
    const panels = repositoryPane.querySelectorAll('[role="tabpanel"]');
    if (!panels.length) return true;
    return Boolean(activePanel(tab));
  };
  const messageTarget = (key, label) => {
    const mention = step.id === "connect"
      ? target("connect:mention", "Choose Linear", [
        '[data-codex-mention-option="linear"]',
      ])
      : null;
    if (mention) return mention;

    const composer = find(["textarea", "#composer-input"]);
    if (composer?.value?.trim()) {
      const send = target(`${key}:send`, "Send your message", [
        'button[aria-label="Send"]',
        'button[aria-label="Send message"]',
        'button[type="submit"]',
      ]);
      if (send) return send;
    }
    return composer ? { element: composer, key, label } : null;
  };
  const progress = typeof practiceTaskCount === "function"
    ? practiceTaskCount(step)
    : Number.isSafeInteger(state.taskProgress?.[step.id]) ? state.taskProgress[step.id] : 0;

  if (step.id === "project") {
    const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
    if (!workspace) {
      if (state.projectCreationStarted === true) {
        if (state.projectCreationStage === "type") {
          if (state.projectType === "remote") return target("project:local", "Choose Local", ['[data-project-type="local"]']);
          return target("project:type", "Choose Next", ['[data-action="continue-project-creation"]']);
        }
        return state.projectSourceSelected === true
          ? target("project:create", "Create the project", ['[data-action="create-project"]'])
          : target("project:source", "Choose the Blossom Bank folder", [
            '[data-action="select-project-directory"]',
          ]);
      }

      const composerProject = target("project:start", "Choose a project", [
        '[data-action="choose-project"]',
        '[data-slot="composer-project-utility-bar"] button',
      ], (element) => element.textContent?.trim() === "Choose project");
      return target("project:start", "Add a project", [
        '[data-codex-project-action="start-project"]',
        '[data-action="start-project"]',
      ]) || composerProject;
    }

    return messageTarget("project:context", "Ask Codex to visualize the architecture");
  }

  if (step.id === "connect") {
    if (progress < 1) {
      return target("connect:plugins", "Open Plugins", [
        'aside button[data-kind="sidebar"]',
        '[data-action="switch-tab"][title="Plugins"]',
      ], (element) => element.textContent?.trim() === "Plugins")
        || target("connect:sidebar", "Open sidebar", ['button[aria-label="Open sidebar"]']);
    }
    if (progress < 2 || state.linearConnected !== true) {
      return target("connect:linear", "Install Linear", [
        '[data-plugin-install="linear"]',
        '[data-action="connect-linear"]',
      ]);
    }
    return messageTarget("connect:message", "Ask Codex to find your ticket");
  }

  if (step.id === "ticket") {
    if (progress < 1 || (progress < 2 && state.environmentOpen !== true)) {
      return target("ticket:environment", "Open Environment", ["[data-codex-environment-toggle]"]);
    }
    if (progress < 2) {
      return target("ticket:branches", "Inspect available branches", [
        '[data-codex-branch-trigger="true"]',
        '[data-codex-environment-action="toggle-branch-picker"]',
        '[data-action="toggle-branch-picker"]',
      ]);
    }
    if (progress < 3 || activeCourseBranch() !== COURSE.repository.baseBranch) {
      return target("ticket:staging", "Select staging", ['[data-codex-environment-action="switch-branch"][data-branch="staging"]'])
        || target("ticket:branches", "Open the branch dropdown", [
          '[data-codex-branch-trigger="true"]',
          '[data-codex-environment-action="toggle-branch-picker"]',
        ]) || target("ticket:environment", "Open Environment", ["[data-codex-environment-toggle]"]);
    }
    return messageTarget("ticket:message", "Ask Codex to create the feature branch");
  }
  if (step.id === "build") {
    if (progress === 0) return messageTarget("build:message", "Ask Codex to implement the change");
    if (progress < 2) {
      if (state.repositoryPaneOpen !== true || state.inspectorOpen !== true) {
        return target("build:panel", "Open the side panel", ["[data-codex-files-toggle]"]);
      }
      return target("build:changes", "Open Review", [
        '[data-codex-repo-action="show-review"]',
        '[data-action="switch-tab"][data-tab="diff"]',
      ]);
    }
    if (progress < 3) {
      if (state.repositoryPaneOpen !== true || state.inspectorOpen !== true) {
        return target("build:panel", "Open the side panel", ["[data-codex-files-toggle]"]);
      }
      if ((state.repoPaneTab !== "review" && state.activeTab !== "diff")
        || !repositoryTabReady("review")) {
        return target("build:changes", "Open Review", [
          '[data-codex-repo-action="show-review"]',
          '[data-action="switch-tab"][data-tab="diff"]',
        ]);
      }
      const requiredComment = HOMEPAGE_REVIEW_LOCATION;
      if (state.activeDiffComment) {
        const matchingComposer = !requiredComment || (
          state.activeDiffComment.path === requiredComment.path
          && state.activeDiffComment.line === requiredComment.line
          && state.activeDiffComment.side === "new"
        );
        if (!matchingComposer) {
          return target("build:comment", "Select + beside the required changed line", [
            '[data-codex-review-action="open-comment"]',
            '[data-action="open-review-comment"]',
          ], (element) => element.dataset?.path === requiredComment.path
            && element.dataset?.line === String(requiredComment.line)
            && element.dataset?.side === "new", activePanel("review") ? [activePanel("review")] : undefined);
        }
        const commentInput = find(['[data-codex-review-input="true"]'], undefined, activePanel("review") ? [activePanel("review")] : roots);
        if (commentInput && !commentInput.value?.trim()) {
          return { element: commentInput, key: "build:comment-text", label: "Enter the requested headline comment" };
        }
        return target("build:comment-save", "Save the comment", [
          '[data-codex-review-action="submit-comment"]',
          '[data-action="submit-review-comment"]',
        ], undefined, activePanel("review") ? [activePanel("review")] : undefined);
      }
      return target("build:comment", "Select + beside the required changed line", [
        '[data-codex-review-action="open-comment"]',
        '[data-action="open-review-comment"]',
      ], requiredComment
        ? (element) => element.dataset?.path === requiredComment.path
          && element.dataset?.line === String(requiredComment.line)
          && element.dataset?.side === "new"
        : undefined, activePanel("review") ? [activePanel("review")] : undefined);
    }
    if (frameBounds.width <= 720
      && state.repositoryPaneOpen === true && state.inspectorOpen === true) {
      return target("build:close", "Close the side panel to send", ["[data-codex-files-toggle]"]);
    }
    return target("build:send", "Send the comment to Codex", [
      'button[aria-label="Send"]',
      '#codex-composer button[aria-label="Send message"]',
    ]);
  }

  if (step.id === "test" && progress === 0 && state.hintsOpen) {
    return target("test:new-thread", "Create a new thread", ['[data-codex-project-action="new-thread"]'])
      || target("test:sidebar", "Open sidebar", ['button[aria-label="Open sidebar"]']);
  }
  if (step.id === "test" && progress === 2) {
    return messageTarget("test:checks", "Ask Codex to run the focused checks");
  }
  if (step.id === "test" && progress === 3) {
    return target("test:preview", "Open the preview", ["[data-codex-staged-preview]"]);
  }
  if (step.id === "test") return null;
  if (step.id === "pr") {
    if (progress === 1) return target("pr:slack", "Install Slack", ['[data-plugin-install="slack"]'])
      || target("pr:plugins", "Open Plugins", ['aside button[data-kind="sidebar"]', '[data-action="switch-tab"][title="Plugins"]'], (element) => element.textContent?.trim() === "Plugins")
      || target("pr:sidebar", "Open sidebar", ['button[aria-label="Open sidebar"]']);
    return messageTarget("pr:message", progress === 0 ? "Ask Codex to create a pull request" : "Share the pull request in Slack");
  }
  return null;
}

function dismissCodexCourseCue() {
  if (typeof codexCourseCueTimer !== "undefined" && codexCourseCueTimer !== null) {
    if (typeof window?.clearTimeout === "function") window.clearTimeout(codexCourseCueTimer);
    codexCourseCueTimer = null;
  }
  const cues = typeof app?.querySelectorAll === "function"
    ? app.querySelectorAll("[data-codex-course-cue]")
    : [app?.querySelector?.("[data-codex-course-cue]")].filter(Boolean);
  for (const cue of cues) cue.remove?.();
  return cues.length > 0;
}

function showCodexCourseCue(reason = "orientation") {
  if (!["orientation", "wrong-click"].includes(reason)) return false;
  const step = STEPS[state.currentIndex];
  const optionalHint = typeof codexStepHint === "function" ? codexStepHint(step) : null;
  const target = typeof currentCodexCourseTarget === "function" ? currentCodexCourseTarget() : null;
  if (!target || optionalHint && !state.hintsOpen) {
    dismissCodexCourseCue();
    return false;
  }
  const frame = app.querySelector?.(".practice-screen");
  const bounds = target.element.getBoundingClientRect?.();
  const frameBounds = frame?.getBoundingClientRect?.();
  if (!frame || !bounds || !frameBounds || typeof document?.createElement !== "function") return false;
  let cue = app.querySelector?.("[data-codex-course-cue]");
  if (cue?.dataset.cueTarget !== target.key) {
    dismissCodexCourseCue();
    cue = document.createElement("div");
    cue.className = "codex-course-cue";
    cue.dataset.codexCourseCue = "true";
    cue.dataset.cueReason = reason;
    cue.dataset.cueTarget = target.key;
    const halo = document.createElement("span");
    halo.className = "codex-course-cue-halo";
    halo.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "codex-course-cue-label";
    label.setAttribute("role", "status");
    label.textContent = target.label;
    cue.append(halo, label);
    frame.append(cue);
  }
  // Keep the ring attached to the control through scrolling and resizing.
  const x = Math.max(2, bounds.left - frameBounds.left - 3);
  const y = Math.max(2, bounds.top - frameBounds.top - 3);
  const width = Math.min(bounds.width + 6, frameBounds.width - x - 2);
  const height = Math.min(bounds.height + 6, frameBounds.height - y - 2);
  cue.hidden = width <= 0 || height <= 0 || bounds.bottom < frameBounds.top || bounds.right < frameBounds.left;
  for (const [name, value] of Object.entries({
    x: x + (frame.scrollLeft || 0),
    y: y + (frame.scrollTop || 0),
    width,
    height,
  })) {
    cue.style.setProperty(`--codex-cue-${name}`, `${Math.round(value)}px`);
  }
  return true;
}

function syncCodexCourseCue() {
  return showCodexCourseCue("orientation");
}

function observeCodexCourseClick(event) {
  if (!event || event.isPrimary === false || (typeof event.button === "number" && event.button !== 0)) {
    return false;
  }

  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  const origin = path[0] || event.target;
  const frame = app.querySelector?.(".practice-codex-frame");
  if (!frame || (!path.includes(frame) && !frame.contains?.(origin))) return false;
  if (path.some((element) => element?.dataset?.codexFilesToggle === "true"
    || element?.dataset?.action === "toggle-inspector")) {
    return false;
  }
  const target = typeof currentCodexCourseTarget === "function" ? currentCodexCourseTarget() : null;
  if (!target) return false;
  if (path.includes(target.element) || origin === target.element || target.element.contains?.(origin)) {
    if (typeof dismissCodexCourseCue === "function") dismissCodexCourseCue();
    return true;
  }

  if (/^(INPUT|TEXTAREA|SELECT)$/i.test(origin?.tagName || "") || origin?.isContentEditable) {
    return false;
  }

  const index = state.currentIndex;
  const key = target.key;
  if (typeof window?.setTimeout !== "function") return false;
  window.setTimeout(() => {
    const next = typeof currentCodexCourseTarget === "function" ? currentCodexCourseTarget() : null;
    if (state.currentIndex !== index || next?.key !== key) return;
    if (typeof showCodexCourseCue === "function") showCodexCourseCue("wrong-click");
  }, 0);
  return true;
}

function renderCodexSourceCitation(destination, label = "") {
  if (typeof state === "undefined" || typeof STEPS === "undefined"
    || !["project", "plan", "build", "test", "pr"].includes(STEPS[state.currentIndex]?.id)
    || typeof verifiedCodexWorkspace !== "function") return "";

  const workspace = verifiedCodexWorkspace();
  if (!workspace) return "";

  let target = String(destination ?? "").trim();
  if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1).trim();
  if (!target || target.includes("\u0000") || target.includes("\\")
    || /^[a-z][a-z\d+.-]*:/i.test(target)) return "";

  try {
    target = decodeURIComponent(target);
  } catch {
    return "";
  }
  if (target.split("/").includes("..")) return "";

  const location = target.match(/(?::|#L)(\d+)(?:-(?:L)?\d+)?$/);
  const requestedLine = location ? Number(location[1]) : 0;
  if (location) target = target.slice(0, location.index);
  target = target.replace(/^\.\//, "");

  const matches = workspace.files.filter((file) =>
    file.path === target
    || file.path.split("/").at(-1) === target
    || target.endsWith("/" + file.path));
  if (matches.length !== 1) return "";

  const file = matches[0];
  const lines = typeof file.content === "string" ? file.content.split("\n") : [];
  if (requestedLine && (!Number.isSafeInteger(requestedLine)
    || requestedLine < 1 || (lines.length && requestedLine > lines.length))) return "";

  const anchors = file.path === "src/components/HeroVisual.tsx"
    ? [/\bpersonalAccounts\b/, /\bPersonalSnapshot\b/]
    : file.path === "src/App.tsx"
      ? [/<h1\b[^>]*\bid="hero-title"/]
      : file.path === "src/App.test.tsx"
        ? [/\bconst\s+homepageHeading\s*=/]
        : file.path === "src/styles.css"
          ? [/\.visual-stat\b/, /\.visual-/]
          : [];
  const discoveredLine = anchors.flatMap((pattern) => {
    const index = lines.findIndex((line) => pattern.test(line));
    return index < 0 ? [] : [index + 1];
  })[0] || 0;
  const line = requestedLine || discoveredLine;
  const fileName = file.path.split("/").at(-1);
  const text = fileName + (line ? ` (line ${line})` : "");
  const icon = typeof repositoryFileIcon === "function" ? repositoryFileIcon(file.path) : "";
  const href = "#codex-source-" + encodeURIComponent(file.path) + (line ? `:${line}` : "");

  return '<a class="codex-source-citation" href="' + escapeHtml(href)
    + '" data-action="open-source-citation" data-codex-repo-action="open-file"'
    + ' data-codex-source-citation="true" data-path="' + escapeHtml(file.path) + '"'
    + (line ? ' data-line="' + line + '"' : "")
    + ' aria-label="' + escapeHtml(text) + '" title="' + escapeHtml(file.path) + '">'
    + icon + '<span class="codex-source-citation-label">' + escapeHtml(text) + "</span></a>";
}

function renderCodexMarkdownInline(text) {
  const source = String(text ?? "");
  const tick = String.fromCharCode(96);
  const token = new RegExp(
    "(?<!" + tick + ")(" + tick + "+)(?!" + tick + ")([^\\n]+?)(?<!" + tick + ")\\1(?!" + tick + ")"
      + "|\\[([^\\]]+)\\]\\((<[^>\\n]+>|[^\\s)]+)\\)"
      + "|\\*\\*([^\\n]+?)\\*\\*"
      + "|__([^\\n]+?)__"
      + "|\\*([^*\\n]+)\\*"
      + "|_([^_\\n]+)_",
    "g",
  );
  let result = "";
  let cursor = 0;

  for (const match of source.matchAll(token)) {
    result += escapeHtml(source.slice(cursor, match.index));

    if (match[1] !== undefined) {
      const inner = match[2];
      const code = inner.startsWith(" ") && inner.endsWith(" ") && inner.trim()
        ? inner.slice(1, -1)
        : inner;
      const citation = typeof renderCodexSourceCitation === "function"
        ? renderCodexSourceCitation(code, code)
        : "";
      result += citation || '<code class="codex-markdown-inline-code">' + escapeHtml(code) + "</code>";
    } else if (match[3] !== undefined) {
      const label = escapeHtml(match[3]);
      const destination = match[4];
      if (destination === COURSE.pullRequest.url && /^PR #\d+$/.test(match[3])) {
        result += '<a class="codex-github-link" href="#practice-pull-request">' + appIcons.github + label + "</a>";
      } else if (destination === "#practice-slack-thread") {
        result += '<a class="codex-slack-link" href="#practice-slack-thread">' + label + "</a>";
      } else if (/^https?:\/\/[^\s<>"']+$/i.test(destination)) {
        result += '<a href="' + escapeHtml(destination)
          + '" target="_blank" rel="noopener noreferrer">' + label + "</a>";
      } else {
        const citation = typeof renderCodexSourceCitation === "function"
          ? renderCodexSourceCitation(destination, match[3])
          : "";
        result += citation || label;
      }
    } else if (match[5] !== undefined || match[6] !== undefined) {
      result += "<strong>" + renderCodexMarkdownInline(match[5] ?? match[6]) + "</strong>";
    } else {
      result += "<em>" + renderCodexMarkdownInline(match[7] ?? match[8]) + "</em>";
    }

    cursor = match.index + match[0].length;
  }

  return result + escapeHtml(source.slice(cursor));
}

function normalizeLinearIssueMarkdown(markdown) {
  const source = String(markdown ?? "");
  if (!/\bENG-248\b/i.test(source)) return source;

  const lines = source.split("\n");
  const parentPattern = /^(\s*)(?:([-+*])\s+)?((?:\*\*|__)?\s*ENG-248(?![\w-])(?:\*\*|__)?(?=[\s:—–-])[\s\S]+?)\s*$/i;
  const fieldPattern = /^\s*(?:[-+*]\s+)?(?:\*\*|__)?(project|assignee|reporter|status|priority|sprint|estimate|type|summary)(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*(\S(?:.*\S)?)\s*$/i;
  const factPattern = /^\s*[-+*]\s+(.+)$/;
  const ticketFact = /homepage|heading|headline|hero-title|src\/(?:App|components)|accessib(?:ility|le)|test/i;
  const output = [];
  let fence = "";
  let changed = false;
  let inTicketSummary = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = "";
      output.push(line);
      continue;
    }
    if (fence) {
      output.push(line);
      continue;
    }

    const parent = line.match(parentPattern);
    if (parent && (parent[2] || /^(?:\*\*|__)/.test(parent[3].trim()))) {
      let heading = parent[3].trim();
      heading = heading.replace(/^(\*\*|__)([\s\S]+)\1$/, "$2");
      heading = heading.replace(/^(\*\*|__)(ENG-248)\1/i, "$2");
      const title = heading.replace(/^ENG-248(?:\*\*|__)?\s*(?::|—|–|-(?=\s))\s*/i, "").trim();
      if (!title || title === heading) {
        output.push(line);
        continue;
      }

      let cursor = index + 1;
      const fields = new Map();
      while (cursor < lines.length) {
        if (!lines[cursor].trim()) {
          cursor += 1;
          continue;
        }

        const field = lines[cursor].match(fieldPattern);
        if (!field) break;
        const key = field[1].toLowerCase();
        const value = field[2]
          .replace(/^(\*\*|__)([\s\S]+)\1$/, "$2")
          .trim();
        if (!fields.has(key)) fields.set(key, value);
        cursor += 1;
      }

      if (!fields.size) {
        output.push(line);
        continue;
      }

      const metadata = ["project", "status", "priority", "sprint", "estimate"]
        .flatMap((key) => {
          const value = fields.get(key);
          if (!value) return [];
          return [key === "priority" && !/\bpriority\s*$/i.test(value)
            ? `${value} priority`
            : value];
        });
      if (output.length && output[output.length - 1].trim()) output.push("");
      output.push(`**ENG-248 — ${title}**`);
      if (metadata.length) output.push("", metadata.join(" · "));
      if (fields.get("summary")) output.push("", fields.get("summary"));
      if (cursor < lines.length && lines[cursor].trim()) output.push("");
      index = cursor - 1;
      inTicketSummary = true;
      changed = true;
      continue;
    }

    if (inTicketSummary) {
      const fact = line.match(factPattern);
      if (fact && ticketFact.test(fact[1])) {
        const facts = [];
        let cursor = index;
        while (cursor < lines.length) {
          const next = lines[cursor].match(factPattern);
          if (!next || !ticketFact.test(next[1])) break;
          const sentence = next[1].trim();
          facts.push(/[.!?]$/.test(sentence) ? sentence : `${sentence}.`);
          cursor += 1;
        }
        if (output.length && output[output.length - 1].trim()) output.push("");
        output.push(facts.join(" "));
        if (cursor < lines.length && lines[cursor].trim()) output.push("");
        index = cursor - 1;
        changed = true;
        continue;
      }
    }

    output.push(line);
  }

  return changed ? output.join("\n") : source;
}

function renderCodexMarkdown(markdown) {
  const original = String(markdown ?? "").replace(/\r\n?/g, "\n");
  const normalized = typeof normalizeLinearIssueMarkdown === "function"
    ? normalizeLinearIssueMarkdown(original)
    : original;
  const source = normalized;
  if (!source.trim()) return "";

  const lines = source.split("\n");
  const listPattern = /^(\s*)([-+*]|\d+[.)])\s+(.+)$/;
  const headingPattern = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
  const fencePattern = new RegExp(
    "^\\s{0,3}(" + String.fromCharCode(96) + "{3,}|~{3,})\\s*([\\w+-]*)\\s*$",
  );
  let index = 0;

  function parseList(start) {
    const first = lines[start].match(listPattern);
    const indentation = first[1].replace(/\t/g, "  ").length;
    const ordered = /^\d/.test(first[2]);
    const tag = ordered ? "ol" : "ul";
    const startNumber = ordered ? Number.parseInt(first[2], 10) : 1;
    let html = "<" + tag + (ordered && startNumber !== 1 ? ' start="' + startNumber + '"' : "") + ">";
    let cursor = start;

    while (cursor < lines.length) {
      const item = lines[cursor].match(listPattern);
      if (!item) break;

      const depth = item[1].replace(/\t/g, "  ").length;
      if (depth !== indentation || /^\d/.test(item[2]) !== ordered) break;

      html += "<li>" + renderCodexMarkdownInline(item[3].trim());
      cursor += 1;

      while (cursor < lines.length) {
        const continuation = lines[cursor];
        if (!continuation.trim()) {
          const next = lines[cursor + 1];
          const nextItem = next?.match(listPattern);
          if (!nextItem) break;
          const nextDepth = nextItem[1].replace(/\t/g, "  ").length;
          if (nextDepth < indentation) break;
          cursor += 1;
          if (nextDepth === indentation) break;
          continue;
        }

        const nested = continuation.match(listPattern);
        if (nested) {
          const nestedDepth = nested[1].replace(/\t/g, "  ").length;
          if (nestedDepth <= indentation) break;
          const child = parseList(cursor);
          html += child.html;
          cursor = child.next;
          continue;
        }

        const continuationIndent = (continuation.match(/^\s*/) || [""])[0]
          .replace(/\t/g, "  ").length;
        if (continuationIndent <= indentation) break;
        html += "<br>" + renderCodexMarkdownInline(continuation.trim());
        cursor += 1;
      }

      html += "</li>";
    }

    return { html: html + "</" + tag + ">", next: cursor };
  }

  const blocks = [];
  while (index < lines.length) {
    const current = lines[index];
    if (!current.trim()) {
      index += 1;
      continue;
    }

    const fence = current.match(fencePattern);
    if (fence) {
      const marker = fence[1][0];
      const minimumLength = fence[1].length;
      const language = fence[2];
      const content = [];
      index += 1;
      while (index < lines.length) {
        const closing = lines[index].trim();
        if (closing.length >= minimumLength && closing.split("").every((character) => character === marker)) {
          index += 1;
          break;
        }
        content.push(lines[index]);
        index += 1;
      }
      blocks.push(
        '<pre class="codex-markdown-code-block"><code'
          + (language ? ' class="language-' + escapeHtml(language) + '"' : "")
          + ">" + escapeHtml(content.join("\n")) + "</code></pre>",
      );
      continue;
    }

    const heading = current.match(headingPattern);
    if (heading) {
      const level = Math.min(6, heading[1].length);
      blocks.push("<h" + level + ">" + renderCodexMarkdownInline(heading[2]) + "</h" + level + ">");
      index += 1;
      continue;
    }

    if (/^\s{0,3}>\s?/.test(current)) {
      const quote = [];
      while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s{0,3}>\s?/, ""));
        index += 1;
      }
      blocks.push("<blockquote>" + renderCodexMarkdown(quote.join("\n")) + "</blockquote>");
      continue;
    }

    if (/^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(current)) {
      blocks.push("<hr>");
      index += 1;
      continue;
    }

    if (listPattern.test(current)) {
      const list = parseList(index);
      blocks.push(list.html);
      index = list.next;
      continue;
    }

    const paragraph = [];
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim() || headingPattern.test(line) || fencePattern.test(line)
        || listPattern.test(line) || /^\s{0,3}>\s?/.test(line)) break;
      paragraph.push(line.trim());
      index += 1;
    }
    blocks.push("<p>" + renderCodexMarkdownInline(paragraph.join(" ")) + "</p>");
  }

  return blocks.join("");
}

function renderCodexAssistantContent(message, options = {}) {
  const source = String(message ?? "").replace(/\r\n?/g, "\n");
  const opening = source.match(/^\s*<proposed_plan>[\t ]*(?:\n|$)/);
  if (!opening) return renderCodexMarkdown(message);

  const body = source.slice(opening[0].length);
  const closing = body.match(/(?:^|\n)[\t ]*<\/proposed_plan>[\t ]*$/);
  if (!closing && options.streaming !== true) return renderCodexMarkdown(message);

  const content = (closing ? body.slice(0, closing.index) : body).trim();
  const streaming = options.streaming === true && !closing;
  const title = streaming ? "Writing plan" : "Plan";
  const cardStyle = "position:relative;max-height:200px;overflow:hidden;"
    + "border:1px solid var(--border,var(--token-border,rgba(26,28,31,.12)));"
    + "border-radius:8px;background:color-mix(in srgb,var(--background,#fff) 95%,var(--foreground,#1a1c1f));";
  const icon = '<svg data-codex-plan-icon="true" width="16" height="16" viewBox="0 0 16 16"'
    + ' fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<path fill-rule="evenodd" clip-rule="evenodd" d="M8 3.52051C9.07134 3.52056 10.0951 3.86574 10.8574 4.54785C11.6273 5.23672 12.0976 6.24043 12.0977 7.48047C12.0977 8.72922 11.6209 9.58857 11.1914 10.2686C10.9702 10.6188 10.7891 10.8819 10.6494 11.1572C10.5171 11.4183 10.4482 11.6441 10.4482 11.877V12.4268C10.4482 13.1158 10.1861 13.7075 9.72559 14.1221C9.27069 14.5315 8.65733 14.7373 8 14.7373C7.34282 14.7373 6.73026 14.5313 6.27539 14.1221C5.81475 13.7075 5.55182 13.1159 5.55176 12.4268V11.877C5.55175 11.6441 5.48294 11.4183 5.35059 11.1572C5.21093 10.8818 5.02985 10.6189 4.80859 10.2686C4.37912 9.58855 3.90332 8.72928 3.90332 7.48047C3.90335 6.24047 4.37279 5.23672 5.14258 4.54785C5.90494 3.86581 6.9287 3.52055 8 3.52051ZM6.60156 12.4268C6.60162 12.8365 6.75133 13.1382 6.97754 13.3418C7.2095 13.5504 7.55861 13.6875 8 13.6875C8.44132 13.6874 8.79051 13.5504 9.02246 13.3418C9.24859 13.1382 9.39838 12.8364 9.39844 12.4268V12.2656H6.60156V12.4268ZM8 4.57129C7.14816 4.57133 6.38548 4.84457 5.84277 5.33008C5.30758 5.80896 4.95315 6.52253 4.95312 7.48047C4.95312 8.42985 5.30144 9.08283 5.69629 9.70801C5.88705 10.01 6.11776 10.3486 6.28711 10.6826C6.37163 10.8493 6.44704 11.0262 6.50293 11.2148H9.49707C9.55297 11.0262 9.62839 10.8493 9.71289 10.6826C9.88222 10.3487 10.113 10.01 10.3037 9.70801C10.6985 9.08286 11.0469 8.4298 11.0469 7.48047C11.0468 6.52258 10.6924 5.80896 10.1572 5.33008C9.61453 4.84459 8.8518 4.57134 8 4.57129Z" fill="currentColor"/>'
    + '<path d="M2 6.85449C2.28995 6.85449 2.52539 7.08993 2.52539 7.37988C2.52539 7.66983 2.28995 7.90527 2 7.90527H0.833008C0.543208 7.9051 0.308594 7.66972 0.308594 7.37988C0.308594 7.09004 0.543208 6.85467 0.833008 6.85449H2Z" fill="currentColor"/>'
    + '<path d="M15.167 6.85449C15.4568 6.85462 15.6924 7.09001 15.6924 7.37988C15.6924 7.66975 15.4568 7.90514 15.167 7.90527H14C13.7102 7.9051 13.4756 7.66972 13.4756 7.37988C13.4756 7.09004 13.7102 6.85467 14 6.85449H15.167Z" fill="currentColor"/>'
    + '<path d="M2.56348 1.94141C2.7685 1.73639 3.10161 1.7364 3.30664 1.94141L4.08203 2.71777C4.28706 2.9228 4.28706 3.25494 4.08203 3.45996C3.877 3.66497 3.54486 3.66498 3.33984 3.45996L2.56348 2.68457C2.35847 2.47955 2.35847 2.14643 2.56348 1.94141Z" fill="currentColor"/>'
    + '<path d="M12.6934 1.94141C12.8984 1.7364 13.2315 1.73643 13.4365 1.94141C13.6415 2.14643 13.6415 2.47955 13.4365 2.68457L12.6602 3.46094C12.4552 3.66539 12.1229 3.66538 11.918 3.46094C11.7129 3.25592 11.713 2.9228 11.918 2.71777L12.6934 1.94141Z" fill="currentColor"/>'
    + '<path d="M8 0.1875C8.28995 0.1875 8.52539 0.422941 8.52539 0.712891V1.87988C8.52521 2.16968 8.28984 2.4043 8 2.4043C7.71016 2.4043 7.47479 2.16968 7.47461 1.87988V0.712891C7.47461 0.422941 7.71005 0.1875 8 0.1875Z" fill="currentColor"/>'
    + "</svg>";
  const openIcon = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none"'
    + ' xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.33496 11C4.33496 10.6327 4.63273 10.335 5 10.335C5.36727 10.335 5.66504 10.6327 5.66504 11V14.335H9L9.13379 14.3486C9.43692 14.4106 9.66504 14.6786 9.66504 15C9.66504 15.3214 9.43692 15.5894 9.13379 15.6514L9 15.665H5C4.63273 15.665 4.33496 15.3673 4.33496 15V11ZM14.335 9V5.66504H11C10.6327 5.66504 10.335 5.36727 10.335 5C10.335 4.63273 10.6327 4.33496 11 4.33496H15L15.1338 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V9C15.665 9.36727 15.3673 9.66504 15 9.66504C14.6327 9.66504 14.335 9.36727 14.335 9Z" fill="currentColor"/></svg>';

  return '<section data-codex-proposed-plan="true" aria-label="' + title
    + '" class="relative max-h-[200px] border border-token-border bg-token-dropdown-background/50" style="' + cardStyle + '">'
    + '<div data-codex-plan-header class="relative flex h-10 flex-wrap items-center justify-between gap-2 px-3 py-2"'
    + ' style="box-sizing:border-box;display:flex;height:40px;min-height:40px;align-items:center;justify-content:space-between;padding:8px 12px;">'
    + '<span class="text-base leading-tight inline-flex items-center gap-2 font-normal text-token-text-tertiary"'
    + ' style="display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:400;">'
    + icon + title + '</span>'
    + (streaming ? "" : '<button type="button" data-action="open-plan" data-codex-plan-action="open-plan"'
      + ' aria-label="Open plan in side panel" class="codex-plan-open-button">' + openIcon + '</button>')
    + '</div><div data-codex-plan-content class="relative overflow-hidden"'
    + ' style="max-height:160px;overflow:hidden;mask-image:linear-gradient(to bottom,black calc(100% - 4rem),transparent);">'
    + '<div data-codex-plan-markdown="true" style="padding:12px 16px;">'
    + renderCodexMarkdown(content) + "</div></div></section>";
}

function renderCodexPlanPanel() {
  const exchange = [...courseConversations("plan")].reverse().find((candidate) =>
    typeof candidate?.response === "string"
    && /^\s*<proposed_plan>[\t ]*(?:\n|$)/.test(candidate.response)
    && /(?:^|\n)[\t ]*<\/proposed_plan>[\t ]*$/.test(candidate.response));
  if (!exchange) return "";

  const content = exchange.response
    .replace(/^\s*<proposed_plan>[\t ]*(?:\n|$)/, "")
    .replace(/(?:^|\n)[\t ]*<\/proposed_plan>[\t ]*$/, "")
    .trim();
  return '<section data-codex-plan-panel="true" role="tabpanel" aria-label="Plan">'
    + '<article data-codex-plan-full="true">'
    + '<div data-codex-plan-full-header="true">Plan</div>'
    + '<div data-codex-plan-markdown="true">' + renderCodexMarkdown(content)
    + "</div></article></section>";
}

function openCodexPlanSidePanel(shadow = null) {
  const planIndex = STEPS.findIndex((step) => step.id === "plan");
  if (!STEPS[state.currentIndex] || planIndex < 0 || state.currentIndex < planIndex) return false;
  const completedPlan = state.planDraftReady === true
    || courseConversations("plan").some((exchange) =>
      typeof exchange?.response === "string"
      && /^\s*<proposed_plan>[\t ]*(?:\n|$)/.test(exchange.response)
      && /(?:^|\n)[\t ]*<\/proposed_plan>[\t ]*$/.test(exchange.response));
  if (!completedPlan) return false;

  state.planPanelOpen = true;
  state.repositoryPaneOpen = true;
  state.inspectorOpen = true;
  state.repoPaneTab = "plan";
  state.activeTab = "plan";
  state.repositoryPaneResizeRestoreTab = "";
  state.environmentOpen = false;
  state.branchPickerOpen = false;
  state.branchPickerQuery = "";
  if (shadow) {
    if (typeof syncNativeRepositoryPane === "function") syncNativeRepositoryPane(shadow);
    if (typeof syncNativeCodexEnvironment === "function") syncNativeCodexEnvironment(shadow);
  } else if (typeof refreshCurrentLab === "function") {
    refreshCurrentLab();
  }
  return true;
}

function planImplementationRequestPending(step = STEPS[state.currentIndex]) {
  const planFeedbackPending = step?.id === "plan" && !lessonContextReady("plan");
  const buildApprovalPending = step?.id === "build"
    && lessonContextReady("plan")
    && !isComplete("build");
  return (planFeedbackPending || buildApprovalPending)
    && state.planDraftReady === true
    && state.planApproved !== true
    && state.isRunning !== true
    && state.planImplementationChoice !== "dismissed"
    && state.planImplementationChoice !== "feedback"
    && state.planImplementationChoice !== "implement"
    && courseConversations("plan").some((exchange) =>
      typeof exchange?.response === "string"
      && /^\s*<proposed_plan>[\t ]*(?:\n|$)/.test(exchange.response)
      && /(?:^|\n)[\t ]*<\/proposed_plan>[\t ]*$/.test(exchange.response));
}

function renderCodexPlanImplementationRequest(step = STEPS[state.currentIndex]) {
  if (!planImplementationRequestPending(step)) return "";

  const feedbackOnly = step?.id === "plan";

  return '<section class="codex-plan-request" tabindex="0" data-codex-composer-request-navigation="true"'
    + ' aria-label="Implement this plan?">'
    + '<div class="codex-plan-request-heading"><div class="codex-plan-request-question">Implement this plan?</div>'
    + '<button class="codex-plan-request-close" type="button" aria-label="Dismiss implementation request"'
    + ' data-action="dismiss-plan-request" data-codex-plan-action="dismiss-request">'
    + '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"'
    + ' stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg>'
    + '</button></div>'
    + '<div class="codex-plan-request-options" role="radiogroup" aria-label="Implement this plan?">'
      + `<button type="button" role="radio" aria-checked="${feedbackOnly ? "false" : "true"}"`
      + (feedbackOnly ? ' aria-disabled="true"' : "")
      + ' aria-label="Yes, implement this plan"'
      + (feedbackOnly ? " disabled" : "")
      + ' class="codex-plan-request-option" data-action="choose-plan-implementation"'
      + ' data-codex-plan-action="choose-implement">'
      + '<span class="codex-plan-request-option-number" aria-hidden="true">1</span>'
      + '<span class="codex-plan-request-option-label">Yes, implement this plan</span>'
      + '<span class="codex-plan-request-option-arrow" aria-hidden="true">'
      + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"'
      + ' stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M2.75 8h10.5m-4-4 4 4-4 4"/></svg></span></button></div>'
    + '<div class="codex-plan-request-other" data-request-input-other-row="true">'
    + '<span class="codex-plan-request-pencil-circle" aria-hidden="true">'
    + '<svg class="codex-plan-request-pencil" width="16" height="16" viewBox="0 0 16 16" fill="none"'
    + ' stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="m10.3 3.05 2.65 2.65M2.8 13.2l2.9-.63 7.48-7.48a1.45 1.45 0 0 0-2.05-2.05L3.65 10.52z"/></svg></span>'
    + '<textarea class="codex-plan-request-input" data-codex-plan-feedback="true" rows="1"'
    + ' aria-label="Tell ChatGPT what to do differently"'
    + ' placeholder="No, and tell ChatGPT what to do differently"></textarea>'
    + '<button class="codex-plan-request-next" type="button" data-action="submit-plan-feedback"'
    + ' data-codex-plan-action="submit-feedback">Skip</button></div></section>';
}

function updateCodexPlanRequestInput(input) {
  const request = input?.closest?.("[data-codex-composer-request-navigation]");
  if (!request || input?.dataset?.codexPlanFeedback !== "true") return false;

  const hasFeedback = Boolean(input.value?.trim());
  const submit = request.querySelector?.('[data-codex-plan-action="submit-feedback"]');
  if (submit && submit.textContent !== (hasFeedback ? "Next" : "Skip")) {
    submit.textContent = hasFeedback ? "Next" : "Skip";
  }
  const option = request.querySelector?.('[data-codex-plan-action="choose-implement"]');
  if (option?.disabled !== true) {
    option?.setAttribute?.("aria-checked", String(!hasFeedback));
  }
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight || 24, 112)}px`;
  return true;
}

function syncNativePlanImplementationRequest(shadow = nativeCodexShadow()) {
  if (!shadow?.querySelector) return false;

  const composer = shadow.querySelector("[data-codex-native-thread-composer]")
    || shadow.querySelector("textarea")?.closest?.(".shrink-0.p-2\\.5")
    || shadow.querySelector("textarea")?.closest?.(".shrink-0");
  const existing = shadow.querySelector("[data-codex-composer-request-navigation]");
  if (!planImplementationRequestPending()) {
    if (existing) existing.remove();
    if (composer?.dataset?.codexPlanOriginalComposer === "true") {
      composer.hidden = false;
      composer.style?.removeProperty?.("display");
      delete composer.dataset.codexPlanOriginalComposer;
    }
    return false;
  }
  if (existing) {
    const option = existing.querySelector?.('[data-codex-plan-action="choose-implement"]');
    const feedbackOnly = STEPS[state.currentIndex]?.id === "plan";
    const valid = existing.querySelector?.(".codex-plan-request-question")
      && existing.querySelector?.('[data-codex-plan-action="dismiss-request"]')
      && existing.querySelector?.('[role="radiogroup"]')
      && option
      && option.getAttribute?.("aria-label") === "Yes, implement this plan"
      && option.textContent?.includes("Yes, implement this plan")
      && option.querySelector?.(".codex-plan-request-option-arrow")
      && option.disabled === feedbackOnly
      && option.getAttribute?.("aria-disabled") === (feedbackOnly ? "true" : null)
      && existing.querySelector?.(".codex-plan-request-pencil-circle")
      && existing.querySelector?.('[data-codex-plan-feedback="true"]')?.getAttribute?.("placeholder")
        === "No, and tell ChatGPT what to do differently";
    if (valid) return true;

    const input = existing.querySelector?.('[data-codex-plan-feedback="true"]');
    const feedback = typeof input?.value === "string" ? input.value : "";
    const selectionStart = Number.isSafeInteger(input?.selectionStart) ? input.selectionStart : null;
    const selectionEnd = Number.isSafeInteger(input?.selectionEnd) ? input.selectionEnd : null;
    const focused = shadow.activeElement === input;
    const container = document.createElement("div");
    container.innerHTML = renderCodexPlanImplementationRequest().trim();
    const replacement = container.firstElementChild;
    if (!replacement) return false;
    existing.replaceWith(replacement);
    const nextInput = replacement.querySelector('[data-codex-plan-feedback="true"]');
    if (nextInput) {
      nextInput.value = feedback;
      updateCodexPlanRequestInput(nextInput);
      if (selectionStart !== null && selectionEnd !== null) {
        nextInput.setSelectionRange?.(selectionStart, selectionEnd);
      }
      if (focused) nextInput.focus?.({ preventScroll: true });
    }
    return true;
  }
  if (!composer) return false;

  if (!shadow.querySelector("[data-codex-plan-request-style]")) {
    const style = document.createElement("style");
    style.dataset.codexPlanRequestStyle = "true";
    style.textContent = [
      ".codex-plan-request{box-sizing:border-box;flex:0 0 auto;min-width:0;margin:0 10px 10px;border:1px solid var(--border,rgba(26,28,31,.12));border-radius:20px;background:var(--background,#fff);padding:13px 10px 9px;color:var(--foreground,#1a1c1f);font:400 13px/1.45 system-ui,-apple-system,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.045);}",
      ".codex-plan-request:focus-visible,.codex-plan-request-option:focus-visible,.codex-plan-request-close:focus-visible,.codex-plan-request-next:focus-visible,.codex-plan-request-input:focus-visible{outline:2px solid #339cff;outline-offset:2px;}",
      ".codex-plan-request-heading{display:flex;min-height:32px;align-items:center;justify-content:space-between;padding:0 4px 8px 8px;}",
      ".codex-plan-request-question{font-size:14px;font-weight:600;}",
      ".codex-plan-request-close{display:inline-flex;width:26px;height:26px;align-items:center;justify-content:center;border:0;border-radius:50%;background:transparent;color:var(--muted-foreground,rgba(26,28,31,.55));cursor:pointer;}",
      ".codex-plan-request-options{display:flex;min-width:0;flex-direction:column;gap:4px;}",
      ".codex-plan-request-option{display:flex;width:100%;min-height:42px;align-items:center;gap:9px;border:0;border-radius:9999px;background:color-mix(in srgb,var(--foreground,#1a1c1f) 6%,transparent);padding:6px 10px 6px 7px;text-align:left;color:inherit;font:inherit;cursor:pointer;}",
      ".codex-plan-request-option:hover{background:color-mix(in srgb,var(--foreground,#1a1c1f) 9%,transparent);}",
      ".codex-plan-request-option:disabled{opacity:1;cursor:default;}",
      ".codex-plan-request-option:disabled:hover{background:color-mix(in srgb,var(--foreground,#1a1c1f) 6%,transparent);}",
      ".codex-plan-request-option-number,.codex-plan-request-pencil-circle{box-sizing:border-box;display:inline-flex;width:30px;height:30px;flex:0 0 30px;align-items:center;justify-content:center;border:1px solid color-mix(in srgb,currentColor 17%,transparent);border-radius:50%;background:color-mix(in srgb,currentColor 4%,transparent);color:var(--muted-foreground,rgba(26,28,31,.55));font-size:12px;}",
      ".codex-plan-request-option-label{min-width:0;flex:1 1 auto;font-weight:550;}",
      ".codex-plan-request-option-arrow{display:inline-flex;flex:0 0 16px;color:var(--muted-foreground,rgba(26,28,31,.55));}",
      ".codex-plan-request-other{display:flex;min-width:0;align-items:center;gap:8px;padding:8px 4px 0;}",
      ".codex-plan-request-pencil{flex:0 0 16px;}",
      ".codex-plan-request-input{box-sizing:border-box;min-width:0;flex:1 1 auto;resize:none;border:0;background:transparent;padding:5px 0;color:inherit;font:inherit;line-height:20px;}",
      ".codex-plan-request-input::placeholder{color:var(--muted-foreground,rgba(26,28,31,.53));}",
      ".codex-plan-request-next{flex:0 0 auto;min-height:30px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:9999px;background:transparent;padding:5px 10px;color:inherit;font:inherit;cursor:pointer;}",
      ".codex-plan-request-next:hover{background:color-mix(in srgb,currentColor 8%,transparent);}",
      "@media(max-width:420px){.codex-plan-request{margin-inline:7px;padding-inline:7px}.codex-plan-request-other{gap:5px;padding-inline:4px}.codex-plan-request-next{padding-inline:5px}}",
    ].join("\n");
    shadow.append(style);
  }

  const container = document.createElement("div");
  container.innerHTML = renderCodexPlanImplementationRequest().trim();
  const request = container.firstElementChild;
  if (!request) return false;
  composer.dataset.codexPlanOriginalComposer = "true";
  composer.hidden = true;
  composer.style?.setProperty?.("display", "none", "important");
  composer.insertAdjacentElement("afterend", request);
  if (state.planImplementationRequestFocused !== true) {
    state.planImplementationRequestFocused = true;
    request.focus?.({ preventScroll: true });
  }
  return true;
}

function dismissCodexPlanImplementationRequest(shadow = null) {
  if (!planImplementationRequestPending()) return false;
  state.planImplementationChoice = "dismissed";
  if (shadow) {
    syncNativePlanImplementationRequest(shadow);
    shadow.querySelector?.("textarea")?.focus?.({ preventScroll: true });
  } else if (typeof refreshCurrentLab === "function") {
    refreshCurrentLab();
    app.querySelector?.("#composer-input")?.focus?.({ preventScroll: true });
  }
  return true;
}

function chooseCodexPlanImplementation() {
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return false;
  }
  const step = STEPS[state.currentIndex];
  if (step?.id !== "build" || !planImplementationRequestPending()
    || typeof runStep !== "function") return false;

  state.planImplementationChoice = "implement";
  state.planDraftReady = false;
  state.planApproved = true;
  state.planMode = false;
  state.composerMode = "agent";
  state.validationMessage = "";
  saveState();
  refreshCurrentLab();
  const request = runStep(step.prompt);
  if (!request || typeof request.then !== "function") {
    state.planImplementationChoice = "";
    state.planDraftReady = true;
    state.planApproved = false;
    delete state.taskProgress?.build;
    saveState();
    refreshCurrentLab();
    return false;
  }

  return request.then((completed) => {
    if (completed === false && STEPS[state.currentIndex]?.id === "build"
      && state.planImplementationChoice === "implement"
      && state.planApproved === true && !isComplete("build")) {
      state.planImplementationChoice = "";
      state.planDraftReady = true;
      state.planApproved = false;
      delete state.taskProgress?.build;
      saveState();
      refreshCurrentLab();
    }
    return completed;
  });
}

function submitCodexPlanFeedback(input, shadow = null) {
  if (!planImplementationRequestPending()) return false;
  const feedback = String(input?.value || "").trim();
  if (!feedback) return dismissCodexPlanImplementationRequest(shadow);
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return false;
  }

  state.planImplementationChoice = "feedback";
  if (STEPS[state.currentIndex]?.id === "build") {
    const planIndex = STEPS.findIndex((step) => step.id === "plan");
    if (planIndex < 0) return false;
    goToStep(planIndex, "practice");
    state.planImplementationChoice = "";
  }
  return runStep(feedback);
}

function handleCodexPlanRequestKeydown(event, shadow = null) {
  const request = event.target.closest?.("[data-codex-composer-request-navigation]");
  if (!request || event.isComposing) return false;

  const input = request.querySelector?.('[data-codex-plan-feedback="true"]');
  const option = request.querySelector?.('[data-codex-plan-action="choose-implement"]');
  if (option?.disabled === true && event.target === option
    && (event.key === "Enter" || event.key === "1")) return false;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation?.();
    dismissCodexPlanImplementationRequest(shadow);
    return true;
  }
  if (event.key === "ArrowDown" && event.target !== input) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
    input?.focus?.();
    return true;
  }
  if (event.key === "ArrowUp" && event.target === input && option?.disabled !== true) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
    option?.focus?.();
    return true;
  }
  if (event.key === "1" && option && option.disabled !== true && event.target !== input) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
    chooseCodexPlanImplementation();
    return true;
  }
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
    if (event.target === input
      || event.target === request.querySelector?.('[data-codex-plan-action="submit-feedback"]')) {
      submitCodexPlanFeedback(input, shadow);
    } else if (option && option.disabled !== true) {
      chooseCodexPlanImplementation();
    } else {
      input?.focus?.();
    }
    return true;
  }
  return false;
}

function nativeAssistantMarkdownSource(element, source = "") {
  if (typeof source === "string" && source) return source;
  const tick = String.fromCharCode(96);

  return Array.from(element?.childNodes || []).map((node) => {
    if (node.nodeType === 3) return node.nodeValue || "";
    if (node.tagName?.toLowerCase() === "code") return tick + node.textContent + tick;
    if (node.tagName?.toLowerCase() === "a") {
      return "[" + node.textContent + "](" + (node.getAttribute("href") || "") + ")";
    }
    return node.textContent || "";
  }).join("");
}

function syncNativeAssistantMarkdown(shadow = nativeCodexShadow()) {
  if (!shadow) return false;
  syncNativeReviewModeMessages(shadow);

  const selector = ".flex.justify-start > .w-full.text-sm.text-foreground"
    + " .space-y-1 > div > .text-foreground > span.whitespace-pre-wrap";
  const original = Array.from(shadow.querySelectorAll(selector));
  if (!original.length) return false;

  const step = STEPS[state.currentIndex];
  if (!step) return false;
  const sources = createCodexMiniThread(step).messages.flatMap((message) => message.role === "assistant"
    ? (message.parts || []).filter((part) => part.type === "assistant")
    : []);
  if (original.length !== sources.length) return false;

  if (!shadow.querySelector("[data-codex-markdown-style]")) {
    const style = document.createElement("style");
    style.dataset.codexMarkdownStyle = "true";
    style.textContent = [
      "[data-codex-course-markdown]{display:block;min-width:0;max-width:100%;color:inherit;font:inherit;font-size:inherit;line-height:1.6;white-space:normal;overflow-wrap:anywhere;}",
      "[data-codex-course-markdown] p{margin:0 0 .7em;}",
      "[data-codex-course-markdown] p:last-child{margin-bottom:0;}",
      "[data-codex-course-markdown] h1,[data-codex-course-markdown] h2,[data-codex-course-markdown] h3,[data-codex-course-markdown] h4,[data-codex-course-markdown] h5,[data-codex-course-markdown] h6{margin:1em 0 .35em;font-size:1em;font-weight:600;line-height:1.45;}",
      "[data-codex-course-markdown]>:first-child{margin-top:0;}",
      "[data-codex-course-markdown] ul,[data-codex-course-markdown] ol{margin:.35em 0 .8em;padding-inline-start:1.35em;}",
      "[data-codex-course-markdown] ul{list-style:disc;}",
      "[data-codex-course-markdown] ol{list-style:decimal;}",
      "[data-codex-course-markdown] li{margin:.2em 0;padding-inline-start:.1em;}",
      "[data-codex-course-markdown] li>ul,[data-codex-course-markdown] li>ol{margin:.2em 0 .35em;}",
      "[data-codex-course-markdown] strong{font-weight:600;}",
      "[data-codex-course-markdown] a{color:#2563eb;text-decoration:none;}",
      "[data-codex-course-markdown] a:hover{text-decoration:underline;}",
      "[data-codex-course-markdown] .codex-github-link{display:inline-flex;align-items:baseline;gap:4px;}",
      "[data-codex-course-markdown] .codex-github-link svg{width:14px;height:14px;align-self:center;}",
      "[data-codex-course-markdown] .codex-slack-link{white-space:nowrap;}",
      "[data-codex-course-markdown] .codex-slack-link::before{content:'';display:inline-block;width:14px;height:14px;margin-right:4px;vertical-align:-2px;background:url('/images/codex/apps/slack.svg') center/contain no-repeat;}",
      "[data-codex-course-markdown] .codex-staged-preview-action{margin:.7em 0 0;}",
      "[data-codex-course-markdown] .codex-staged-preview-link:focus-visible{border-radius:3px;outline:2px solid #339cff;outline-offset:2px;}",
      "[data-codex-course-markdown] .codex-source-citation{display:inline-flex;max-width:100%;align-items:center;gap:4px;vertical-align:baseline;}",
      "[data-codex-course-markdown] .codex-source-citation .codex-repo-file-icon{display:inline-flex;width:14px;height:14px;flex:0 0 14px;align-items:center;justify-content:center;}",
      "[data-codex-course-markdown] .codex-source-citation .codex-repo-type-glyph{width:14px;height:14px;}",
      "[data-codex-course-markdown] .codex-source-citation-label{overflow-wrap:anywhere;}",
      "[data-codex-course-markdown] .codex-markdown-inline-code{border-radius:5px;background:rgba(26,28,31,.055);padding:0 .1em;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:.94em;line-height:inherit;vertical-align:baseline;}",
      "[data-codex-course-markdown] pre{max-width:100%;overflow-x:auto;margin:.55em 0 .85em;border:1px solid rgba(26,28,31,.08);border-radius:8px;background:rgba(26,28,31,.035);padding:.75em .9em;white-space:pre;}",
      "[data-codex-course-markdown] pre code{background:none;padding:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:.89em;}",
      "[data-codex-course-markdown] blockquote{margin:.55em 0;padding:.05em 0 .05em .8em;border-left:2px solid rgba(26,28,31,.18);color:rgba(26,28,31,.75);}",
      "[data-codex-course-markdown] hr{margin:.8em 0;border:0;border-top:1px solid rgba(26,28,31,.12);}",
      "[data-codex-proposed-plan]{box-sizing:border-box;width:100%;max-height:200px;margin:.15em 0;color:inherit;}",
      "[data-codex-plan-header]{box-sizing:border-box;color:var(--muted-foreground,rgba(26,28,31,.58));}",
      "[data-codex-plan-icon]{width:16px;height:16px;flex:0 0 16px;}",
      ".codex-plan-open-button{display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border:0;border-radius:7px;background:transparent;color:inherit;cursor:pointer;}",
      ".codex-plan-open-button:hover{background:color-mix(in srgb,currentColor 8%,transparent);}",
      ".codex-plan-open-button:focus-visible{outline:2px solid #339cff;outline-offset:-2px;}",
      "[data-codex-plan-markdown]{min-width:0;color:var(--foreground,inherit);font-size:13px;line-height:21px;overflow-wrap:anywhere;}",
      "[data-codex-plan-markdown] h1,[data-codex-plan-markdown] h2,[data-codex-plan-markdown] h3{margin:20px 0 10px;font-weight:600;line-height:1.25;}",
      "[data-codex-plan-markdown] h1{font-size:24px;}",
      "[data-codex-plan-markdown] h2{font-size:20px;}",
      "[data-codex-plan-markdown] h3{font-size:17px;line-height:22px;}",
      "[data-codex-plan-markdown]>:first-child{margin-top:0;}",
      "[data-codex-plan-markdown]>:last-child{margin-bottom:0;}",
      "[data-codex-plan-markdown] p{margin:0 0 11px;}",
      "[data-codex-plan-markdown] ul,[data-codex-plan-markdown] ol{margin:0 0 11px;padding-inline-start:21px;}",
      "[data-codex-plan-markdown] li+li{margin-top:8px;}",
    ].join("\n");
    shadow.append(style);
  }

  const previewScrollers = new Set();
  for (let index = 0; index < original.length; index += 1) {
    const element = original[index];
    const source = nativeAssistantMarkdownSource(element, sources[index].text);
    const stagedAction = sources[index].architecture ? `<style>${architectureStyles}</style>${architectureHtml}` : typeof renderStagedPreviewAction === "function"
      ? renderStagedPreviewAction(
        sources[index].stagedPreview,
        typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null,
        sources[index].exchangeId || "",
      )
      : "";
    const commandActivity = Array.isArray(sources[index].commandExecutions)
      && typeof renderCodexCommandActivity === "function"
      ? renderCodexCommandActivity(sources[index].commandExecutions)
      : "";
    const workedActivity = typeof renderCodexWorkedActivity === "function"
      ? renderCodexWorkedActivity(sources[index])
      : "";
    const next = element.nextElementSibling;
    let rendered = next?.hasAttribute?.("data-codex-course-markdown") ? next : null;
    // The preview link is added after Mini positions the plain-text response.
    // Keep it in view when already following the reply, without moving a reader
    // who scrolled back to an earlier message.
    const scroller = sources[index].stagedPreview && rendered?.__codexStagedAction !== stagedAction
      ? element.closest(".overflow-auto") : null;
    if (scroller && scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 48) {
      previewScrollers.add(scroller);
    }

    if (!rendered) {
      rendered = document.createElement("div");
      rendered.dataset.codexCourseMarkdown = "true";
      rendered.innerHTML = (commandActivity || workedActivity + (/^\s*<proposed_plan>/.test(source)
        ? renderCodexAssistantContent(source)
        : renderCodexMarkdown(source))) + stagedAction;
      rendered.__codexMarkdownSource = source;
      rendered.__codexWorkedActivity = workedActivity;
      rendered.__codexStagedAction = stagedAction;
      element.insertAdjacentElement("afterend", rendered);
    } else if (rendered.__codexMarkdownSource !== source
      || rendered.__codexWorkedActivity !== workedActivity
      || rendered.__codexStagedAction !== stagedAction) {
      rendered.innerHTML = (commandActivity || workedActivity + (/^\s*<proposed_plan>/.test(source)
        ? renderCodexAssistantContent(source)
        : renderCodexMarkdown(source))) + stagedAction;
      rendered.__codexMarkdownSource = source;
      rendered.__codexWorkedActivity = workedActivity;
      rendered.__codexStagedAction = stagedAction;
    }

    element.dataset.codexMarkdownOriginal = "true";
    element.hidden = true;
    element.setAttribute("aria-hidden", "true");
  }

  for (const scroller of previewScrollers) scroller.scrollTop = scroller.scrollHeight;
  if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
  return true;
}

function attachNativeAssistantMarkdownBridge(host, shadow) {
  if (host.__learnAssistantMarkdownBridge) {
    syncNativeAssistantMarkdown(shadow);
    return;
  }

  let pendingFrame = 0;
  const observer = new MutationObserver((changes) => {
    if (!host.isConnected || pendingFrame) return;

    if (changes?.length && changes.every((change) => {
      if (change.target?.closest?.("[data-codex-course-markdown]")) return true;
      const added = Array.from(change.addedNodes || []);
      const removed = Array.from(change.removedNodes || []);
      return [...added, ...removed].length > 0 && [...added, ...removed].every((node) =>
        node.nodeType === 1 && (
          node.hasAttribute?.("data-codex-course-markdown")
          || node.hasAttribute?.("data-codex-markdown-style")
        ));
    })) return;

    pendingFrame = window.requestAnimationFrame(() => {
      pendingFrame = 0;
      if (host.isConnected) syncNativeAssistantMarkdown(shadow);
    });
  });
  observer.observe(shadow, { childList: true, subtree: true });

  const cleanup = () => {
    observer.disconnect();
    if (pendingFrame) window.cancelAnimationFrame(pendingFrame);
    for (const element of shadow.querySelectorAll("[data-codex-markdown-original]")) {
      element.hidden = false;
      element.removeAttribute("aria-hidden");
      element.removeAttribute("data-codex-markdown-original");
    }
    for (const rendered of shadow.querySelectorAll("[data-codex-course-markdown]")) {
      rendered.remove();
    }
    shadow.querySelector("[data-codex-markdown-style]")?.remove();
    delete host.__learnAssistantMarkdownBridge;
  };

  host.__learnAssistantMarkdownBridge = { observer, cleanup };
  host.addEventListener("astro:unmount", cleanup, { once: true });
  syncNativeAssistantMarkdown(shadow);
}

function syncNativeReviewModeMessages(shadow) {
  const prompt = visibleCodexUserMessage({ prompt: "/review staging" });
  for (const bubble of shadow.querySelectorAll('.flex.justify-end > [class*="rounded-2xl"]')) {
    const row = bubble.parentElement;
    if (bubble.textContent.trim() !== prompt) continue;
    if (row.querySelector("[data-codex-review-mode]")) continue;
    row.style.flexDirection = "column";
    row.style.alignItems = "flex-end";
    const label = document.createElement("span");
    label.dataset.codexReviewMode = "true";
    label.textContent = "Review mode";
    label.style.cssText = "margin-top:4px;color:var(--muted-foreground);font-size:12px;line-height:18px;";
    row.append(label);
  }
}

function renderCodexCommandActivity(commands, options = {}) {
  if (!Array.isArray(commands)) return "";

  const observed = commands.filter((command) => command
    && typeof command.command === "string"
    && command.command.trim()
    && ["in_progress", "completed", "failed"].includes(command.status));
  if (!observed.length || typeof escapeHtml !== "function") return "";

  const terminal = '<svg data-codex-command-icon="true" viewBox="0 0 20 20" fill="none"'
    + ' stroke="currentColor" stroke-width="1.5" aria-hidden="true">'
    + '<rect x="2.5" y="4" width="15" height="12" rx="2"/>'
    + '<path d="m5.5 8 2.2 2.1-2.2 2m4.5 0h4" stroke-linecap="round" stroke-linejoin="round"/>'
    + "</svg>";
  const active = options.running === true
    ? [...observed].reverse().find((command) => command.status === "in_progress")
    : null;

  if (active) {
    return '<div class="codex-command-activity codex-command-running"'
      + ' data-codex-command-activity="running" role="status">'
      + terminal + '<span class="codex-command-label">Running '
      + escapeHtml(active.command.trim()) + "</span></div>";
  }

  const chevron = '<svg class="codex-command-chevron" viewBox="0 0 20 20" fill="none"'
    + ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round"'
    + ' stroke-linejoin="round" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>';
  const rows = observed.map((command) => {
    const row = '<div class="codex-command-row">'
      + terminal + '<span class="codex-command-label">'
      + (command.status === "failed" ? "Failed " : "Ran ")
      + escapeHtml(command.command.trim()) + "</span></div>";
    return row;
  }).join("");

  return '<details class="codex-command-activity codex-command-complete"'
    + ' data-codex-command-activity="complete">'
    + '<summary class="codex-command-summary">' + terminal
    + '<span class="codex-command-label">Ran commands</span>' + chevron + "</summary>"
    + '<div class="codex-command-list">' + rows + "</div></details>";
}

function nativeCommandExecutionTranscript(commands) {
  if (!Array.isArray(commands)) return "";
  return commands.map((command) => {
    const label = command.status === "in_progress"
      ? "Running"
      : command.status === "completed" ? "Ran" : "Failed";
    const heading = `**${label}** \`${command.command}\``;
    if (typeof command.output !== "string" || !command.output.trim()) return heading;
    const output = command.output.replace(/```/g, "``\\`");
    return `${heading}\n\n\`\`\`text\n${output}\n\`\`\``;
  }).join("\n\n");
}

function syncFallbackCodexStreamActivity(pending) {
  if (!pending || typeof app === "undefined" || typeof renderCodexStreamActivity !== "function") {
    return false;
  }

  const body = app.querySelector?.(".codex-mini-fallback .tool-activity.is-running .tool-activity-body");
  if (!body) return false;
  if (Number.isFinite(pending.startedAt) && pending.startedAt > 0) {
    const heading = app.querySelector?.(
      ".codex-mini-fallback .tool-activity.is-running .tool-activity-header > span",
    );
    if (heading) {
      const elapsed = Math.max(1, Math.floor((Date.now() - pending.startedAt) / 1_000));
      heading.textContent = `Thought ${elapsed}s`;
    }
  }
  const activity = renderCodexStreamActivity(pending);
  let current = body.querySelector?.("[data-codex-stream-summary]");
  if (!activity) {
    current?.remove?.();
    return false;
  }

  if (!current) {
    if (typeof document?.createElement !== "function") return false;
    current = document.createElement("div");
    current.dataset.codexStreamSummary = "true";
    current.setAttribute("role", "status");
    body.replaceChildren?.(current);
    if (!current.parentElement && typeof body.append === "function") body.append(current);
  }
  if (current.__codexStreamSource !== activity) {
    current.innerHTML = activity;
    current.__codexStreamSource = activity;
  }
  return true;
}

function syncLiveCodexStreamDisplay(pendingId = state.pendingConversation?.id) {
  const pending = state.pendingConversation;
  if (!state.isRunning || !pending || pending.id !== pendingId) return false;

  const shadow = nativeCodexShadow();
  if (!shadow) {
    return typeof syncFallbackCodexStreamActivity === "function"
      ? syncFallbackCodexStreamActivity(pending)
      : false;
  }

  const heading = Array.from(shadow.querySelectorAll(".text-xs.text-muted-foreground > span.font-semibold"))
    .reverse()
    .find((element) => element.textContent.trim() === "Thought"
      || (pending.stepId === "connect" && element.textContent.trim() === "Working for"));
  const part = heading?.parentElement?.parentElement;
  if (!part) return false;

  const compactCommandActivity = !pending.progressHeartbeat
    && (pending.stepId === "ticket" || pending.stepId === "test")
    && Array.isArray(pending.commandExecutions)
    && pending.commandExecutions.length
    && typeof renderCodexCommandActivity === "function"
    ? renderCodexCommandActivity(pending.commandExecutions, { running: true })
    : "";
  const commandTranscript = !pending.progressHeartbeat
    && !compactCommandActivity && typeof nativeCommandExecutionTranscript === "function"
    ? nativeCommandExecutionTranscript(pending.commandExecutions)
    : "";
  const summaryText = [
    pending.streamSummary || (commandTranscript ? "" : pending.streamStatus) || "",
    commandTranscript,
  ].filter(Boolean).join("\n\n");
  const actualActivity = compactCommandActivity || (typeof renderCodexStreamActivity === "function"
    ? renderCodexStreamActivity(pending)
    : "");
  let renderedSummary = "";
  if (actualActivity) {
    renderedSummary = actualActivity
      + (commandTranscript ? renderCodexMarkdown(commandTranscript) : "");
  } else if (summaryText) {
    renderedSummary = renderCodexMarkdown(summaryText.replace(/\n(?=\*\*[^\n]+\*\*)/g, "\n\n"));
  }
  let summary = part.querySelector("[data-codex-stream-summary]");
  if (renderedSummary) {
    if (!summary) {
      summary = document.createElement("div");
      summary.dataset.codexStreamSummary = "true";
      summary.dataset.codexCourseMarkdown = "true";
      summary.className = "text-xs text-muted-foreground";
      summary.style.cssText = "margin-top:.35rem;white-space:pre-wrap;";
      summary.setAttribute("role", "status");
      part.append(summary);
    }
    if (summary.__codexStreamSource !== renderedSummary) {
      summary.innerHTML = renderedSummary;
      summary.__codexStreamSource = renderedSummary;
    }
  } else {
    summary?.remove();
  }

  let response = part.querySelector("[data-codex-stream-response]");
  if (pending.streamResponse) {
    if (!response) {
      response = document.createElement("div");
      response.dataset.codexStreamResponse = "true";
      response.dataset.codexCourseMarkdown = "true";
      response.className = "text-foreground";
      response.style.cssText = "margin-top:.55rem;white-space:normal;";
      response.setAttribute("aria-live", "polite");
      part.append(response);
    }
    if (response.__codexStreamSource !== pending.streamResponse) {
      response.innerHTML = pending.stepId === "pr" && pending.publicationPhase === "publishing"
        && typeof renderTrainingPullRequestResponse === "function"
        ? renderTrainingPullRequestResponse(pending.streamResponse)
        : /^\s*<proposed_plan>/.test(pending.streamResponse)
          ? renderCodexAssistantContent(pending.streamResponse, { streaming: true })
          : renderCodexMarkdown(pending.streamResponse);
      response.__codexStreamSource = pending.streamResponse;
    }
  } else {
    response?.remove();
  }

  if ((renderedSummary || pending.streamResponse) && typeof scrollNativeThreadToBottom === "function") {
    scrollNativeThreadToBottom();
  }
  return Boolean(renderedSummary || pending.streamResponse);
}

function clearLiveCodexStreamDisplay(pendingId = "") {
  if (pendingId && state.pendingConversation && state.pendingConversation.id !== pendingId) {
    return false;
  }

  const shadow = nativeCodexShadow();
  if (!shadow) {
    const summary = typeof app !== "undefined"
      ? app.querySelector?.(".codex-mini-fallback [data-codex-stream-summary]")
      : null;
    summary?.remove?.();
    return Boolean(summary);
  }

  for (const element of shadow.querySelectorAll(
    "[data-codex-stream-summary], [data-codex-stream-response]",
  )) {
    element.remove();
  }
  return true;
}

function syncNativeCodexThinkingElapsed(pendingId = state.pendingConversation?.id) {
  const pending = state.pendingConversation;
  if (!state.isRunning || !pending || pending.id !== pendingId) return false;

  const shadow = nativeCodexShadow();
  if (!shadow) return false;

  const label = Array.from(shadow.querySelectorAll(".text-xs.text-muted-foreground > span.font-semibold"))
    .reverse()
    .find((element) => element.textContent.trim() === "Thought"
      || (pending.stepId === "connect" && element.textContent.trim() === "Working for"));
  if (!label?.parentElement) return false;

  const elapsed = Math.max(1, Math.floor((Date.now() - (pending.startedAt || Date.now())) / 1_000));
  const seconds = Array.from(label.parentElement.childNodes)
    .find((node) => node.nodeType === 3 && /^\s*\d+\s*$/.test(node.nodeValue || ""));
  if (!seconds) return false;

  if (seconds.nodeValue.trim() !== String(elapsed)) {
    seconds.nodeValue = seconds.nodeValue.replace(/\d+/, String(elapsed));
  }
  if (pending.stepId === "connect" && label.textContent.trim() !== "Working for") {
    label.textContent = "Working for";
  }
  return true;
}

function codexProgressHeartbeatMessage(pending, elapsedMs, detail = "") {
  if (!pending || typeof pending !== "object"
    || !Number.isFinite(elapsedMs) || elapsedMs < 0) return "";

  const command = Array.isArray(pending.commandExecutions)
    ? [...pending.commandExecutions].reverse().find((entry) =>
      entry?.status === "in_progress"
      && typeof entry.command === "string"
      && entry.command.trim())
    : null;
  const phases = {
    project: "Preparing the project request",
    connect: "Reviewing the connected Linear request",
    ticket: pending.branchPreparationApproved === true
      ? "Preparing the approved branch request"
      : "Reviewing the issue request",
    plan: "Preparing the requested plan",
    build: pending.executionApproved === true
      ? "Working on the approved implementation"
      : "Reviewing the implementation request",
    review: "Reviewing the requested code changes",
    test: pending.verificationApproved === true
      ? "Preparing the approved checks"
      : "Reviewing the verification request",
    pr: pending.publicationPhase === "publishing"
      ? "Preparing the pull request"
      : "Reviewing the pull request",
  };
  if (typeof detail === "string" && detail.trim()
    && !/\b(?:awaiting the first (?:observed codex activity|codex progress update)|waiting for the next codex update|codex is still processing the active request|no new codex output has arrived yet|the request remains active)\b/i
      .test(detail)) {
    const normalizedDetail = detail.trim().replace(/\s+/g, " ");
    if (normalizedDetail.length <= 120) return normalizedDetail;
    const timing = normalizedDetail.match(/\s+\(last observed \d+s ago\)$/);
    const withoutTiming = timing ? normalizedDetail.slice(0, timing.index) : normalizedDetail;
    const available = Math.max(1, 120 - (timing?.[0].length || 0));
    const bounded = withoutTiming.length <= available
      ? withoutTiming
      : withoutTiming.slice(0, available).replace(/\s+\S*$/, "").trim();
    return `${bounded}${timing?.[0] || ""}`;
  }

  const observedStatus = typeof pending.streamStatus === "string"
    && pending.streamStatus.trim()
    && !/^(?:starting\s+codex|codex\s+is\s+(?:starting|thinking|responding)|working|thinking)$/i
      .test(pending.streamStatus.trim())
    ? pending.streamStatus.trim()
    : "";
  const phase = observedStatus || phases[pending.stepId] || "Processing the current request";
  const current = Array.isArray(pending.streamActivities)
    ? [...pending.streamActivities].reverse().find((activity) =>
      activity && typeof activity.text === "string" && activity.text.trim())
    : null;
  const summary = typeof current?.text === "string" && current.text.trim()
    ? current.text
    : typeof pending.streamSummary === "string" && pending.streamSummary.trim()
      ? pending.streamSummary
      : "";
  const response = typeof pending.streamResponse === "string" && pending.streamResponse.trim()
    ? pending.streamResponse
    : "";
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const changed = pending.executionApproved === true && workspace?.changed
    && Array.isArray(workspace.changedFiles)
    ? workspace.changedFiles.find((file) => typeof file?.path === "string"
      && /^(?!\/|\.\.?\/)[a-zA-Z0-9._/-]+$/.test(file.path))
    : null;
  const observed = command
    ? `Running ${command.command.trim()}`
    : changed
      ? `Updated ${changed.path}`
      : summary
        ? summary
        : response
          ? `Responding: ${response}`
          : "";
  const normalized = observed
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/(?:\*\*|__|`)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  const elapsedSeconds = Math.max(1, Math.floor(elapsedMs / 1_000));
  const observedAt = Number.isFinite(pending.lastObservedCodexActivityAt)
    ? pending.lastObservedCodexActivityAt
    : Number.isFinite(pending.startedAt) ? pending.startedAt : Date.now();
  const observedSeconds = Math.max(1, Math.floor((Date.now() - observedAt) / 1_000));

  if (!normalized) {
    const safePaths = new Set((Array.isArray(workspace?.files) ? workspace.files : [])
      .map((file) => typeof file?.path === "string" ? file.path : "")
      .filter((path) => /^(?!\/|\.\.?\/)[a-zA-Z0-9._/-]+$/.test(path)
        && !path.split("/").some((segment) => segment.startsWith(".")
          || /(?:secret|credential|private.?key|access.?token)/i.test(segment))));
    const relevantPaths = [
      "src/components/HeroVisual.tsx",
      "src/App.test.tsx",
      "src/styles.css",
      "src/App.tsx",
    ].filter((path) => safePaths.has(path));
    const currentBranch = typeof workspace?.branch === "string"
      && /^(?![./])(?!.*\.\.)[a-zA-Z0-9._/-]+$/.test(workspace.branch)
      ? workspace.branch
      : "";
    const requestedBranch = typeof COURSE !== "undefined"
      && typeof COURSE.repository?.workingBranch === "string"
      && /^(?![./])(?!.*\.\.)[a-zA-Z0-9._/-]+$/.test(COURSE.repository.workingBranch)
      ? COURSE.repository.workingBranch
      : "";
    const preparedIssue = typeof LINEAR_ISSUE !== "undefined"
      && typeof LINEAR_ISSUE.id === "string"
      && /^[A-Z][A-Z0-9]+-\d+$/.test(LINEAR_ISSUE.id)
      ? LINEAR_ISSUE.id
      : "";
    const availableSource = relevantPaths[(Math.max(1, Math.floor(elapsedMs / 4_000)) - 1)
      % Math.max(1, relevantPaths.length)] || "";
    let knownRequest = "";
    if (pending.stepId === "ticket" && pending.branchPreparationApproved === true
      && currentBranch && requestedBranch) {
      knownRequest = `Approved branch request: ${currentBranch} → ${requestedBranch}`;
    } else if (pending.stepId === "ticket" && preparedIssue && currentBranch) {
      knownRequest = `Issue ${preparedIssue} on ${currentBranch}`;
    } else if (pending.stepId === "connect" && preparedIssue) {
      knownRequest = `Linear issue ${preparedIssue}`;
    } else if (pending.stepId === "plan" && availableSource) {
      const verifiedSource = workspace.files.find((file) => file?.path === availableSource);
      knownRequest = typeof verifiedSource?.content === "string"
        ? `Using verified project context from ${availableSource}`
        : `Preparing the plan for verified source ${availableSource}`;
    } else if (pending.stepId === "build" && pending.executionApproved === true && availableSource) {
      knownRequest = `Approved source includes ${availableSource}`;
    } else if (pending.stepId === "test" && pending.verificationApproved === true) {
      knownRequest = "Approved read-only source review";
    } else if (pending.stepId === "pr" && pending.publicationPhase === "publishing" && preparedIssue) {
      knownRequest = `Pull request for ${preparedIssue}`;
    } else if (availableSource) {
      knownRequest = `Available source: ${availableSource}`;
    } else if (typeof pending.prompt === "string" && pending.prompt.trim()) {
      knownRequest = `Submitted request: ${pending.prompt.trim()
        .replace(/[\u0000-\u001f\u007f]+/g, " ")
        .replace(/\s+/g, " ")}`;
    } else {
      knownRequest = `Submitted ${pending.stepId || "course"} request`;
    }
    const timing = ` (${elapsedSeconds}s)`;
    const available = Math.max(1, 120 - phase.length - 3 - timing.length);
    const bounded = knownRequest.length <= available
      ? knownRequest
      : knownRequest.slice(0, available).replace(/\s+\S*$/, "").trim();
    return `${phase} · ${bounded}${timing}`;
  }
  const timing = ` (last observed ${observedSeconds}s ago)`;
  const available = Math.max(1, 120 - phase.length - 3 - timing.length);
  const bounded = normalized.length <= available
    ? normalized
    : normalized.slice(0, available).replace(/\s+\S*$/, "").trim();
  return `${phase} · ${bounded}${timing}`;
}

function syncCodexProgressHeartbeat(pendingId = state.pendingConversation?.id) {
  const pending = state.pendingConversation;
  if (!state.isRunning || !pending || pending.id !== pendingId) return false;

  const now = Date.now();
  const startedAt = Number.isFinite(pending.startedAt) ? pending.startedAt : now;
  const lastUpdate = Number.isFinite(pending.lastProgressUpdateAt)
    ? pending.lastProgressUpdateAt
    : startedAt;
  const elapsedMs = Math.max(0, now - startedAt);
  if (elapsedMs < 4_000 || now - lastUpdate < 4_000) return false;

  const sequence = (pending.progressHeartbeatLocalSequence || 0) + 1;
  const message = codexProgressHeartbeatMessage(pending, elapsedMs);
  if (!message) return false;
  pending.progressHeartbeatLocalSequence = sequence;
  pending.progressHeartbeat = { source: "system", elapsedMs, message };
  pending.lastProgressUpdateAt = now;
  return true;
}

function stopCodexThinkingTimer(pendingId = "") {
  if (pendingId && codexThinkingPendingId && pendingId !== codexThinkingPendingId) return false;

  if (codexThinkingTimer !== null) {
    window.clearInterval(codexThinkingTimer);
    codexThinkingTimer = null;
  }
  codexThinkingPendingId = "";
  if (state.pendingConversation && (!pendingId || state.pendingConversation.id === pendingId)) {
    state.pendingConversation.streamController?.abort();
    delete state.pendingConversation.streamController;
  }
  if (typeof clearLiveCodexStreamDisplay === "function") {
    clearLiveCodexStreamDisplay(pendingId);
  }
  return true;
}

function startCodexThinkingTimer(pendingId) {
  if (!pendingId || state.pendingConversation?.id !== pendingId || !state.isRunning) return false;
  if (codexThinkingTimer !== null && codexThinkingPendingId === pendingId) {
    syncNativeCodexThinkingElapsed(pendingId);
    return true;
  }

  stopCodexThinkingTimer();
  codexThinkingPendingId = pendingId;
  codexThinkingTimer = window.setInterval(() => {
    if (!state.isRunning || state.pendingConversation?.id !== pendingId) {
      stopCodexThinkingTimer(pendingId);
      return;
    }
    syncNativeCodexThinkingElapsed(pendingId);
    if (typeof syncCodexProgressHeartbeat === "function") {
      syncCodexProgressHeartbeat(pendingId);
    }
    if (typeof syncLiveCodexStreamDisplay === "function") {
      syncLiveCodexStreamDisplay(pendingId);
    }
  }, 1_000);

  syncNativeCodexThinkingElapsed(pendingId);
  return true;
}

function buildRepositoryTree(paths = Object.keys(FILES)) {
  const root = {
    name: COURSE.repo.split("/").at(-1),
    path: "",
    type: "folder",
    children: [],
  };

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let parent = root;
    let currentPath = "";

    for (let index = 0; index < parts.length; index += 1) {
      const name = parts[index];
      currentPath = currentPath ? `${currentPath}/${name}` : name;
      let child = parent.children.find((entry) => entry.path === currentPath);
      if (!child) {
        child = {
          name,
          path: currentPath,
          type: index === parts.length - 1 ? "file" : "folder",
          children: [],
        };
        parent.children.push(child);
      }
      parent = child;
    }
  }

  const sortChildren = (node) => {
    node.children.sort((first, second) => {
      if (first.type !== second.type) return first.type === "folder" ? -1 : 1;
      return first.name.localeCompare(second.name, undefined, { sensitivity: "base" });
    });
    for (const child of node.children) sortChildren(child);
  };
  sortChildren(root);
  return root;
}

function repositoryFileSource(path) {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (workspace) {
    const actualFile = workspace.files.find((file) => file.path === path);
    return typeof actualFile?.content === "string" ? actualFile.content : "";
  }
  const file = FILES[path];
  if (!file) return "";
  return isComplete("build") && file.updated ? file.updated : file.initial;
}

function parseReviewDiffLines(path) {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const actualFile = workspace?.changedFiles.find((file) => file.path === path);
  const patch = workspace ? actualFile?.patch
    : (typeof fallbackReviewDiffs === "function" ? fallbackReviewDiffs() : DIFFS)[path];
  if (!patch) return [];

  const originalSource = (workspace ? actualFile.originalContent || "" : FILES[path].initial).split("\n");
  const updatedSource = (workspace ? actualFile.content || ""
    : typeof repositoryFileSource === "function" ? repositoryFileSource(path)
      : typeof isComplete === "function" && isComplete("build")
        ? FILES[path].updated || FILES[path].initial
        : FILES[path].review || FILES[path].updated || FILES[path].initial).split("\n");
  const changedLines = [];
  let oldLine = 0;
  let newLine = 0;
  const alignSourceLine = (source, expected, text) => {
    if (source[expected - 1] === text) return expected;
    for (let distance = 1; distance <= 6; distance += 1) {
      if (expected > distance && source[expected - distance - 1] === text) return expected - distance;
      if (source[expected + distance - 1] === text) return expected + distance;
    }
    return expected;
  };

  for (const sourceLine of patch.split("\n")) {
    const hunk = sourceLine.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      continue;
    }

    if (!oldLine && !newLine) continue;
    if (sourceLine.startsWith("+++ ") || sourceLine.startsWith("--- ")) continue;

    if (sourceLine.startsWith("+")) {
      const text = sourceLine.slice(1);
      newLine = alignSourceLine(updatedSource, newLine, text);
      changedLines.push({ line: newLine, side: "new", type: "add", text });
      newLine += 1;
    } else if (sourceLine.startsWith("-")) {
      const text = sourceLine.slice(1);
      oldLine = alignSourceLine(originalSource, oldLine, text);
      changedLines.push({ line: oldLine, side: "old", type: "delete", text });
      oldLine += 1;
    } else if (sourceLine.startsWith(" ") || sourceLine === "") {
      const text = sourceLine.startsWith(" ") ? sourceLine.slice(1) : "";
      oldLine = alignSourceLine(originalSource, oldLine, text);
      newLine = alignSourceLine(updatedSource, newLine, text);
      oldLine += 1;
      newLine += 1;
    }
  }

  return changedLines;
}


function parseReviewDiffRows(path) {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const actualFile = workspace?.changedFiles?.find((file) => file.path === path);
  const patch = workspace ? actualFile?.patch
    : (typeof fallbackReviewDiffs === "function" ? fallbackReviewDiffs() : DIFFS)[path];
  if (typeof patch !== "string" || !patch.trim()) return [];

  const hunks = [];
  let currentHunk = null;
  for (const sourceLine of patch.split("\n")) {
    if (sourceLine.startsWith("@@ ")) {
      if (currentHunk) hunks.push(currentHunk);
      currentHunk = [sourceLine];
    } else if (currentHunk) {
      if (sourceLine.startsWith("diff --git ") || sourceLine.startsWith("--- ") || sourceLine.startsWith("+++ ")) {
        hunks.push(currentHunk);
        currentHunk = null;
      } else {
        currentHunk.push(sourceLine);
      }
    }
  }
  if (currentHunk) hunks.push(currentHunk);

  const rows = [];
  for (const hunkLines of hunks) {
    const range = hunkLines[0].match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (!range) continue;
    let oldLine = Number(range[1]);
    let newLine = Number(range[2]);
    const canonicalHunk = hunkLines.join("\n");
    const diffHunk = canonicalHunk.length <= 16_000 ? canonicalHunk : "";

    for (const sourceLine of hunkLines.slice(1)) {
      if (sourceLine.startsWith("\\ No newline at end of file")) continue;
      if (sourceLine.startsWith("+")) {
        rows.push({
          line: newLine,
          oldLine: null,
          newLine,
          side: "new",
          type: "add",
          lineType: "change-addition",
          text: sourceLine.slice(1),
          diffHunk,
        });
        newLine += 1;
      } else if (sourceLine.startsWith("-")) {
        rows.push({
          line: oldLine,
          oldLine,
          newLine: null,
          side: "old",
          type: "delete",
          lineType: "change-deletion",
          text: sourceLine.slice(1),
          diffHunk,
        });
        oldLine += 1;
      } else if (sourceLine.startsWith(" ")) {
        rows.push({
          line: newLine,
          oldLine,
          newLine,
          side: "new",
          type: "context",
          lineType: "context",
          text: sourceLine.slice(1),
          diffHunk,
        });
        oldLine += 1;
        newLine += 1;
      }
    }
  }

  return rows;
}

function repositoryFileIcon(path) {
  const extension = String(path).toLowerCase().split(".").pop();
  let type = "file";
  let glyph = '<path d="M4 2.2h5l3 3v8.6H4z"/><path d="M9 2.2v3h3"/>';

  if (extension === "md" || extension === "mdx") {
    type = "markdown";
    glyph = '<path d="M2.5 11V4.8h1.7L6.6 8l2.3-3.2h1.7V11"/><path d="M12 7.2v3.6m-1.4-1.4 1.4 1.4 1.4-1.4"/>';
  } else if (extension === "json") {
    type = "json";
    glyph = '<path d="M6.1 3.1H5c-.9 0-1.3.5-1.3 1.3v1.3c0 .8-.4 1.2-1.2 1.3.8.1 1.2.5 1.2 1.3v1.3c0 .8.4 1.3 1.3 1.3h1.1m3.8-7.8H11c.9 0 1.3.5 1.3 1.3v1.3c0 .8.4 1.2 1.2 1.3-.8.1-1.2.5-1.2 1.3v1.3c0 .8-.4 1.3-1.3 1.3H9.9"/>';
  } else if (extension === "tsx" || extension === "jsx") {
    type = "tsx";
    glyph = '<circle cx="8" cy="8" r="1.15" fill="currentColor" stroke="none"/><ellipse cx="8" cy="8" rx="6" ry="2.25"/><ellipse cx="8" cy="8" rx="6" ry="2.25" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6" ry="2.25" transform="rotate(120 8 8)"/>';
  } else if (extension === "ts" || extension === "mts" || extension === "cts") {
    type = "typescript";
    glyph = '<rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" stroke="none"/><text x="8" y="10.9" fill="white" stroke="none" font-family="system-ui,sans-serif" font-size="6.3" font-weight="700" text-anchor="middle">TS</text>';
  } else if (extension === "js" || extension === "mjs" || extension === "cjs") {
    type = "javascript";
    glyph = '<rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" stroke="none"/><text x="8" y="10.9" fill="#292524" stroke="none" font-family="system-ui,sans-serif" font-size="6.3" font-weight="700" text-anchor="middle">JS</text>';
  } else if (extension === "css" || extension === "scss") {
    type = "css";
    glyph = '<path d="M5.3 3.2 4.4 12.8m6.2-9.6-.9 9.6M3 6.2h10m-10.5 3.6h10"/>';
  }

  return `<span class="codex-repo-file-icon codex-repo-file-icon--${type}" data-file-type="${type}" aria-hidden="true"><svg class="codex-repo-type-glyph" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg></span>`;
}

function renderRepositoryTree(nodes, depth = 0) {
  return nodes.map((node) => {
    const indent = `${depth * 12 + 7}px`;

    if (node.type === "folder") {
      const expanded = state.repoExpandedFolders.has(node.path);
      return `
        <div class="codex-repo-folder" role="treeitem" aria-expanded="${expanded}">
          <button class="codex-repo-folder-row" type="button" data-codex-repo-action="toggle-folder" data-path="${escapeHtml(node.path)}" aria-expanded="${expanded}" style="padding-left:${indent}">
            <span class="codex-repo-chevron${expanded ? " is-open" : ""}" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 3.2 2.8 2.8-2.8 2.8"/></svg></span><span>${escapeHtml(node.name)}</span>
          </button>
          ${expanded ? `<div class="codex-repo-children" role="group" style="--codex-repo-guide:${depth * 12 + 13}px">${renderRepositoryTree(node.children, depth + 1)}</div>` : ""}
        </div>`;
    }

    const selected = state.repoSelectedPath === node.path;
    const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
    const actualFile = workspace?.files.find((file) => file.path === node.path);
    const modified = workspace
      ? actualFile?.status !== undefined && actualFile.status !== "unchanged"
      : isComplete("build") && FILES[node.path]?.status === "modified";
    return `
      <button class="codex-repo-file${selected ? " is-selected" : ""}" type="button" role="treeitem" data-codex-repo-action="open-file" data-path="${escapeHtml(node.path)}" aria-current="${selected}" aria-selected="${selected}" style="padding-left:${indent}">
        ${repositoryFileIcon(node.path)}<span class="codex-repo-file-name">${escapeHtml(node.name)}</span>${modified ? '<span class="codex-repo-modified" aria-label="Modified">M</span>' : ""}
      </button>`;
  }).join("");
}

function renderNativeRepositoryExplorer() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const files = workspace ? workspace.files : Object.entries(FILES).map(([path, file]) => ({ path, ...file }));
  const paths = files.map((file) => file.path);
  const repository = buildRepositoryTree(paths);
  const preferredPath = workspace
    ? ["src/components/HeroVisual.tsx", "src/App.tsx", paths[0]].find((path) => paths.includes(path)) || ""
    : defaultFile;
  const awaitingProjectSelection = Boolean(workspace)
    && typeof STEPS !== "undefined"
    && STEPS[state.currentIndex]?.id === "project"
    && !isComplete("project");
  const selectedPath = awaitingProjectSelection
    ? ""
    : paths.includes(state.repoSelectedPath) ? state.repoSelectedPath : preferredPath;
  if (workspace && selectedPath && state.repoSelectedPath !== selectedPath) {
    state.repoSelectedPath = selectedPath;
    for (const folder of selectedPath.split("/").slice(0, -1)) {
      const previous = Array.from(state.repoExpandedFolders).find((entry) => entry.endsWith(`/${folder}`));
      if (!previous) {
        const parts = selectedPath.split("/");
        state.repoExpandedFolders.add(parts.slice(0, parts.indexOf(folder) + 1).join("/"));
      }
    }
  }
  const source = selectedPath ? repositoryFileSource(selectedPath) : "";
  const file = files.find((candidate) => candidate.path === selectedPath);
  const updated = workspace
    ? file?.status !== undefined && file.status !== "unchanged"
    : isComplete("build") && file.status === "modified";
  const lines = source.split("\n").map((line, index) => `<span class="codex-repo-code-line${state.sourceCitation?.path === selectedPath && state.sourceCitation.line === index + 1 ? " is-cited" : ""}"><span class="codex-repo-line-number">${index + 1}</span><span>${highlightCode(line) || " "}</span></span>`).join("");

  return `
    <div class="codex-repo-explorer" data-codex-repo-explorer="true" aria-label="Repository files" role="tabpanel" id="codex-repo-panel-files" aria-labelledby="codex-repo-tab-files">
      <div class="codex-repo-tree-pane">
        <div class="codex-repo-tree-heading"><span>${escapeHtml(repository.name)}</span><span>${paths.length} files</span></div>
        <div class="codex-repo-tree" role="tree" aria-label="Blossom Bank repository files">${renderRepositoryTree(repository.children)}</div>
      </div>
      <div class="codex-repo-file-view">
        ${selectedPath
          ? `<div class="codex-repo-file-header"><span class="codex-repo-file-path">${escapeHtml(selectedPath)}</span>${updated ? '<span class="codex-repo-file-status">Modified</span>' : ""}</div>
        <pre class="codex-repo-code" tabindex="0" aria-label="Contents of ${escapeHtml(selectedPath)}"><code>${lines}</code></pre>`
          : `<div class="codex-repo-empty-state"><span class="codex-repo-empty-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h3.2l1.5 1.6h5A1.7 1.7 0 0 1 16.6 8.8v5.9a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2Z"/><path d="M6 5.5V4.4a1.2 1.2 0 0 1 1.2-1.2h3.1l1.5 1.6h4.6a1.2 1.2 0 0 1 1.2 1.2v6.2"/></svg></span><h3 class="codex-repo-empty-title">Open file</h3><p class="codex-repo-empty-copy">Select a file from the workspace tree</p></div>`}
      </div>
    </div>`;
}

function syncNativeBrowserNavigation(panel) {
  const frame = panel?.__codexBrowserFrame || panel?.querySelector?.("[data-codex-browser-frame]");
  if (!frame) return;

  let url = "";
  try {
    url = frame.contentWindow?.location?.href || frame.getAttribute?.("src") || "";
  } catch {
    url = frame.getAttribute?.("src") || "";
  }
  if (!url || url === "about:blank") return;

  const history = panel.__codexBrowserHistory ||= { entries: [], index: -1 };
  if (history.entries[history.index] !== url) {
    if (history.entries[history.index - 1] === url) history.index -= 1;
    else if (history.entries[history.index + 1] === url) history.index += 1;
    else {
      history.entries.splice(history.index + 1);
      history.entries.push(url);
      history.index = history.entries.length - 1;
    }
  }

  const address = panel.querySelector("[data-browser-sidebar-address-input]");
  if (address && address.value !== url) address.value = url;
  const back = panel.querySelector('[data-codex-repo-action="browser-back"]');
  const next = panel.querySelector('[data-codex-repo-action="browser-next"]');
  if (back) back.disabled = history.index <= 0;
  if (next) next.disabled = history.index >= history.entries.length - 1;
}

function syncNativeBrowserPortal(shadow, panel) {
  const stage = shadow?.host?.closest?.(".codex-mini-live-stage");
  const viewport = panel?.querySelector?.("[data-codex-browser-viewport]");
  if (!stage || !viewport) return null;

  let frame = panel.__codexBrowserFrame;
  if (!frame) {
    frame = document.createElement("iframe");
    frame.dataset.codexBrowserFrame = "true";
    frame.dataset.codexBrowserPortal = "true";
    frame.dataset.codexBrowserSource = "/training/codex-lab/demos/blossom-bank/index.html";
    frame.title = "Blossom Bank | Banking that sees the bigger picture";
    frame.src = "/training/codex-lab/demos/blossom-bank/index.html";
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.style.cssText = "position:absolute;z-index:15;display:none;border:0;background:#fff;pointer-events:auto;";
    frame.hidden = true;
    panel.__codexBrowserFrame = frame;
    stage.append(frame);

    const update = () => {
      if (stage.isConnected === false || panel.isConnected === false || panel.hidden || state.repoPaneTab !== "browser") {
        frame.hidden = true;
        frame.style.display = "none";
        return;
      }

      const stageBounds = stage.getBoundingClientRect?.();
      const viewportBounds = viewport.getBoundingClientRect?.();
      if (!stageBounds || !viewportBounds || viewportBounds.width <= 0 || viewportBounds.height <= 0) {
        frame.hidden = true;
        frame.style.display = "none";
        return;
      }

      frame.style.left = `${viewportBounds.left - stageBounds.left}px`;
      frame.style.top = `${viewportBounds.top - stageBounds.top}px`;
      frame.style.width = `${viewportBounds.width}px`;
      frame.style.height = `${viewportBounds.height}px`;
      frame.style.display = "block";
      frame.hidden = false;
    };

    const onLoad = () => {
      syncNativeBrowserNavigation(panel);
      if (typeof observeStagedPreviewInspection === "function") {
        observeStagedPreviewInspection(frame);
      }
      try {
        const page = frame.contentWindow;
        const refresh = () => syncNativeBrowserNavigation(panel);
        page?.addEventListener?.("popstate", refresh);
        page?.addEventListener?.("hashchange", refresh);
        page?.document?.addEventListener?.("click", () => page.setTimeout(refresh, 0), true);
      } catch {
        // The actual bank remains interactive even if its navigation state cannot be inspected.
      }
    };
    frame.addEventListener?.("load", onLoad);

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    observer?.observe(stage);
    observer?.observe(viewport);
    window.addEventListener?.("resize", update);
    window.addEventListener?.("scroll", update, true);

    const host = shadow.host.closest?.(".codex-mini-host");
    const cleanup = () => {
      observer?.disconnect();
      window.removeEventListener?.("resize", update);
      window.removeEventListener?.("scroll", update, true);
      frame.removeEventListener?.("load", onLoad);
      host?.removeEventListener?.("astro:unmount", cleanup);
      if (panel.__codexBrowserFrame === frame) delete panel.__codexBrowserFrame;
      delete panel.__codexBrowserPortal;
      frame.remove?.();
    };
    panel.__codexBrowserPortal = { frame, update, cleanup, observer };
    host?.addEventListener?.("astro:unmount", cleanup, { once: true });
  }

  if (state.repoPaneTab === "browser") {
    const source = typeof codexWorkspaceBrowserPath === "function"
      ? codexWorkspaceBrowserPath()
      : "/training/codex-lab/demos/blossom-bank/index.html";
    if (frame.dataset.codexBrowserSource !== source) {
      frame.dataset.codexBrowserSource = source;
      frame.src = source;
    }
  }

  panel.__codexBrowserPortal?.update();
  return frame;
}

function ensureNativeRepositoryStyle(shadow) {
  if (shadow.querySelector("[data-codex-repo-style]")) return;

  const style = document.createElement("style");
  style.dataset.codexRepoStyle = "true";
  style.textContent = `
    ${projectActionStyles}
    [data-codex-native-thread-scroll] { box-sizing:border-box; min-width:0; padding:24px !important; }
    [data-codex-native-thread-column] > :not([hidden]) ~ :not([hidden]) { margin-top:28px; }
    @container (max-width:520px) { [data-codex-native-thread-scroll] { padding:20px 16px !important; } [data-codex-native-thread-composer] { padding-inline:12px !important; } }
    [data-codex-native-thread-column] { width:100%; min-width:0; max-width:calc(48rem - 32px); margin-right:auto; margin-left:auto; }
    [data-codex-native-thread-composer] { box-sizing:border-box; width:100%; min-width:0; max-width:48rem; margin-right:auto; margin-left:auto; padding:12px 20px 16px !important; }
    [data-codex-environment-toggle] { display:inline-flex; width:29px; height:29px; flex:0 0 29px; align-items:center; justify-content:center; padding:0; border:0; border-radius:8px; background:transparent; color:rgba(26,28,31,.66); cursor:pointer; }
    [data-codex-files-toggle] { display:inline-flex; width:28px; height:28px; flex:0 0 28px; align-items:center; justify-content:center; padding:0; border:0; border-radius:8px; background:transparent; color:rgba(26,28,31,.5); cursor:pointer; }
    .codex-side-panel-tooltip { position:fixed; z-index:50; display:flex; max-width:min(320px,calc(100vw - 16px)); max-height:calc(100vh - 16px); align-items:center; gap:8px; box-sizing:border-box; padding:4px 8px; border:1px solid rgba(26,28,31,.08); border-radius:10px; background:#fff; color:#1a1c1f; font:400 13px/19px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; overflow-wrap:anywhere; white-space:normal; pointer-events:none; user-select:none; }
    .codex-side-panel-tooltip[hidden] { display:none; }
    .codex-side-panel-tooltip kbd { display:inline-flex; padding:2px 6px; border:0; border-radius:8px; background:rgba(26,28,31,.1); color:currentColor; box-shadow:none; font:400 12px/12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    [data-codex-project-heading] { display:flex !important; min-height:24px; align-items:center; justify-content:space-between; }
    [data-codex-project-add] { display:inline-flex; width:24px; height:24px; flex:0 0 24px; align-items:center; justify-content:center; padding:0; border:0; border-radius:7px; background:transparent; color:inherit; cursor:pointer; opacity:.45; }
    [data-codex-project-add] svg { width:14px; height:14px; }
    [data-codex-project-heading]:hover [data-codex-project-add], [data-codex-project-add]:focus-visible { opacity:1; }
    [data-codex-project-add]:hover, [data-codex-project-add]:focus-visible { background:rgba(26,28,31,.06); outline-offset:2px; }
    [data-codex-environment-toggle]:hover, [data-codex-environment-toggle][aria-expanded="true"] { background:rgba(26,28,31,.06); color:#1a1c1f; }
    [data-codex-files-toggle]:hover { background:rgba(26,28,31,.05); }
    [data-codex-files-toggle][aria-pressed="true"] { background:rgba(26,28,31,.05); color:#1a1c1f; }
    [data-codex-files-toggle][aria-pressed="true"]:hover { background:rgba(26,28,31,.1); }
    [data-codex-environment-toggle] svg { width:17px; height:17px; }
    [data-codex-files-toggle] svg { width:16px; height:16px; transform:rotate(180deg); }
    [data-codex-environment-panel] { position:absolute; z-index:15; top:46px; right:10px; box-sizing:border-box; width:min(292px,calc(100% - 20px)); max-height:calc(100% - 56px); overflow:auto; padding:12px 8px 9px; border:1px solid rgba(26,28,31,.13); border-radius:20px; background:#fff; color:#1a1c1f; font:400 13px/19px system-ui,-apple-system,sans-serif; box-shadow:0 8px 28px rgba(26,28,31,.11); }
    [data-codex-environment-panel][hidden] { display:none !important; }
    .codex-environment-heading { margin:0 0 6px; padding:0 7px; color:rgba(26,28,31,.56); font:500 12px/20px system-ui,-apple-system,sans-serif; }
    .codex-environment-row { box-sizing:border-box; display:flex; width:100%; min-width:0; height:35px; align-items:center; gap:10px; padding:0 7px; border:0; border-radius:8px; background:transparent; color:inherit; font:inherit; text-align:left; }
    button.codex-environment-row { cursor:pointer; }
    button.codex-environment-row:hover, button.codex-environment-row:focus-visible { background:rgba(26,28,31,.06); }
    .codex-environment-row > svg { width:17px; height:17px; flex:0 0 17px; }
    .codex-environment-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .codex-environment-counts { display:flex; align-items:center; gap:4px; margin-left:auto; font-variant-numeric:tabular-nums; }
    .codex-environment-additions { color:#00a240; }
    .codex-environment-deletions { color:#ba2623; }
    .codex-environment-branch-trigger { position:relative; }
    .codex-environment-branch-trigger .codex-branch-chevron { width:15px; height:15px; margin-left:auto; color:rgba(26,28,31,.58); }
    .codex-branch-picker { display:flex; box-sizing:border-box; width:min(288px,100%); max-width:100%; flex-direction:column; gap:6px; margin:5px 0 2px; overflow:hidden; padding:7px; border:1px solid rgba(26,28,31,.13); border-radius:12px; background:#fff; color:#1a1c1f; }
    .codex-branch-search-wrap { display:flex; min-height:34px; min-width:0; align-items:center; gap:7px; padding:0 6px; color:rgba(26,28,31,.58); }
    .codex-branch-search-wrap > svg { width:15px; height:15px; flex:0 0 15px; }
    .codex-branch-search { width:100%; min-width:0; border:0; background:transparent; padding:0; color:inherit; font:400 12px system-ui,-apple-system,sans-serif; outline:0; }
    .codex-branch-section { margin:0; padding:3px 6px 0; color:rgba(26,28,31,.58); font:500 11px/17px system-ui,-apple-system,sans-serif; }
    .codex-branch-list { display:grid; max-height:200px; gap:2px; overflow-y:auto; }
    .codex-branch-option { display:flex; min-height:34px; min-width:0; align-items:center; gap:8px; border:0; border-radius:7px; background:transparent; padding:0 6px; color:inherit; font:400 12px system-ui,-apple-system,sans-serif; text-align:left; cursor:pointer; }
    .codex-branch-option:hover, .codex-branch-option:focus-visible { background:rgba(26,28,31,.06); }
    .codex-branch-option:focus-visible { outline:2px solid #339cff; outline-offset:-2px; }
    .codex-branch-option > svg { width:15px; height:15px; flex:0 0 15px; }
    .codex-branch-name { min-width:0; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .codex-branch-check { margin-left:auto; }
    .codex-branch-empty { margin:0; padding:12px 6px; color:rgba(26,28,31,.58); font:400 12px system-ui,-apple-system,sans-serif; }
    [data-codex-environment-toggle]:focus-visible, button.codex-environment-row:focus-visible { outline:2px solid #339cff; outline-offset:1px; }
    [data-codex-files-toggle]:focus-visible { outline:none; }
    [data-codex-panel-picker] { position:absolute; z-index:16; top:46px; right:0; bottom:0; display:flex; align-items:center; justify-content:center; box-sizing:border-box; width:min(344px,100%); padding:20px; border-left:1px solid rgba(26,28,31,.1); background:#fff; color:#1a1c1f; font:400 12px system-ui,-apple-system,sans-serif; }
    .codex-panel-picker-options { display:flex; width:100%; max-width:576px; min-width:0; flex-direction:column; gap:4px; }
    .codex-disabled-reason-wrap { position:relative; display:block; width:100%; min-width:0; }
    .codex-disabled-reason-wrap > .codex-panel-picker-option { width:100%; }
    .codex-panel-picker-option { display:flex; box-sizing:border-box; width:100%; min-height:40px; min-width:0; align-items:center; gap:8px; padding:8px 10px; border:0; border-radius:8px; background:rgba(26,28,31,.02); color:inherit; font:inherit; text-align:left; cursor:pointer; }
    .codex-panel-picker-option:hover:not(:disabled), .codex-panel-picker-option:focus-visible { background:rgba(26,28,31,.06); }
    .codex-panel-picker-option:disabled { color:rgba(26,28,31,.46); cursor:default; }
    .codex-panel-picker-option:focus-visible { outline:2px solid #339cff; outline-offset:-2px; }
    .codex-panel-picker-icon { display:inline-flex; width:16px; height:16px; flex:0 0 16px; color:rgba(26,28,31,.64); }
    .codex-panel-picker-icon svg { width:100%; height:100%; }
    .codex-panel-picker-label { min-width:0; overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
    .codex-panel-picker-shortcut { display:inline-flex; min-height:20px; align-items:center; justify-content:center; margin-left:auto; padding:2px 6px; border:0; border-radius:8px; background:rgba(26,28,31,.08); color:rgba(26,28,31,.55); font:400 11px system-ui,-apple-system,sans-serif; line-height:1; white-space:nowrap; }
    [data-codex-repo-pane] { display:flex !important; flex-direction:column; min-height:0; min-width:0; overflow:hidden; color:#1a1c1f; }
    [data-codex-repo-pane][hidden], [role="separator"][aria-label="Resize panels"][hidden] { display:none !important; }
    [data-codex-repo-tabs] { display:flex; flex:0 0 40px; align-items:center; height:40px; overflow-x:auto; padding:0 8px; border-bottom:1px solid rgba(26,28,31,.08); background:#fff; scrollbar-width:none; }
    [data-codex-repo-tabs]::-webkit-scrollbar { display:none; }
    .codex-repo-tab-group { display:flex; width:clamp(calc(var(--codex-repo-tab-count) * 90px + (var(--codex-repo-tab-count) - 1) * 3px),100%,calc(var(--codex-repo-tab-count) * 160px + (var(--codex-repo-tab-count) - 1) * 3px)); min-width:0; align-items:center; gap:3px; }
    .codex-repo-tab-controller { position:relative; display:flex; width:100%; max-width:160px; min-width:0; height:28px; flex:1 1 0; align-items:center; box-sizing:border-box; padding-right:4px; }
    [data-codex-repo-tab] { display:flex; width:100%; max-width:156px; height:28px; min-height:28px; min-width:0; flex:1; align-items:center; gap:8px; padding:4px 8px; overflow:hidden; border:0; border-radius:10px; background:transparent; color:rgba(26,28,31,.58); font:400 13px/19px system-ui,-apple-system,sans-serif; cursor:pointer; }
    .codex-repo-tab-icon { position:relative; z-index:1; display:flex; width:16px; height:16px; flex:0 0 16px; align-items:center; justify-content:center; overflow:visible; }
    .codex-repo-tab-icon > svg, .codex-repo-tab-icon > img { width:16px; height:16px; object-fit:contain; }
    .codex-repo-tab-label { position:relative; z-index:1; min-width:0; flex:1; overflow:hidden; }
    .codex-repo-tab-label[data-overflow="true"]::after { position:absolute; z-index:20; top:0; right:0; bottom:0; width:28px; background:linear-gradient(to right,transparent,#fff 85%); content:""; pointer-events:none; }
    .codex-repo-tab-label > span { display:block; width:100%; min-width:0; overflow:hidden; text-align:left; white-space:nowrap; }
    [data-codex-repo-tab]::before { position:absolute; z-index:0; inset:0; border-radius:8px; background:transparent; content:""; pointer-events:none; }
    [data-codex-repo-tab]:hover::before { background:rgba(26,28,31,.05); }
    [data-codex-repo-tab][aria-selected="true"], [data-codex-repo-tab][aria-selected="true"]:hover { background:transparent; color:#1a1c1f; }
    [data-codex-repo-tab][aria-selected="true"]::before, [data-codex-repo-tab][aria-selected="true"]:hover::before { background:rgba(26,28,31,.05); }
    [data-codex-repo-tab]:hover .codex-repo-tab-label[data-overflow="true"]::after,
    [data-codex-repo-tab][aria-selected="true"] .codex-repo-tab-label[data-overflow="true"]::after { background:linear-gradient(to right,transparent,color-mix(in srgb,#1a1c1f 5%,#fff) 85%); }
    [data-codex-repo-tab]:focus-visible, .codex-repo-file:focus-visible, .codex-repo-folder-row:focus-visible { outline:2px solid #339cff; outline-offset:-2px; }
    [data-codex-plan-panel] { display:block; box-sizing:border-box; min-width:0; min-height:0; flex:1; overflow-y:auto; padding:16px; background:#fff; color:#1a1c1f; }
    [data-codex-plan-panel][hidden] { display:none !important; }
    [data-codex-plan-full] { overflow:hidden; border-radius:8px; background:rgba(26,28,31,.05); }
    [data-codex-plan-full-header] { box-sizing:border-box; display:flex; height:40px; align-items:center; padding:8px 12px; font:600 14px/20px system-ui,-apple-system,sans-serif; }
    [data-codex-plan-panel] [data-codex-plan-markdown] { padding:12px 16px; }
    [data-codex-browser-panel] { display:grid; flex:1; min-height:0; min-width:0; grid-template-rows:40px minmax(0,1fr); overflow:hidden; background:#fff; }
    [data-codex-browser-panel][hidden] { display:none !important; }
    [data-browser-sidebar-toolbar] { display:flex; min-width:0; align-items:center; gap:4px; padding:0 8px; border-bottom:1px solid rgba(26,28,31,.1); color:rgba(26,28,31,.68); }
    [data-codex-browser-navigation] { display:flex; flex:0 0 auto; align-items:center; gap:1px; }
    [data-codex-browser-button] { display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; border:0; border-radius:7px; background:transparent; color:inherit; cursor:pointer; }
    [data-codex-browser-button]:hover:not(:disabled) { background:rgba(26,28,31,.055); }
    [data-codex-browser-button]:disabled { opacity:.34; cursor:default; }
    [data-codex-browser-button]:focus-visible, [data-browser-sidebar-address-input]:focus-visible { outline:2px solid #339cff; outline-offset:-2px; }
    [data-codex-browser-button] svg { width:15px; height:15px; }
    [data-codex-browser-address] { display:flex; height:28px; min-width:0; flex:1; align-items:center; overflow:hidden; border-radius:10px; background:rgba(26,28,31,.045); }
    [data-browser-sidebar-address-input] { width:100%; min-width:0; height:28px; border:0; padding:0 9px; background:transparent; color:rgba(26,28,31,.75); font:400 11px system-ui,-apple-system,sans-serif; outline:0; }
    [data-codex-browser-viewport] { min-width:0; min-height:0; background:#fff; }
    [data-codex-browser-frame] { display:block; width:100%; height:100%; min-width:0; min-height:0; border:0; background:#fff; }
    button[data-codex-native-stop="true"] { position:relative; }
    button[data-codex-native-stop="true"] svg { visibility:hidden; }
    button[data-codex-native-stop="true"]::after { position:absolute; top:50%; left:50%; width:10px; height:10px; transform:translate(-50%,-50%); border-radius:2px; background:currentColor; content:""; }
    [data-codex-mention-menu] { position:fixed; z-index:30; display:grid; width:280px; max-width:calc(100vw - 16px); padding:6px; border:1px solid rgba(26,28,31,.12); border-radius:12px; background:#fff; color:#1a1c1f; font:400 12px system-ui,-apple-system,sans-serif; box-shadow:0 10px 35px rgba(26,28,31,.14); }
    .codex-mention-section { padding:7px 9px 5px; color:rgba(26,28,31,.57); font-size:11px; font-weight:500; }
    [data-codex-mention-option] { display:flex; min-height:46px; align-items:center; gap:10px; padding:7px 9px; border:0; border-radius:8px; background:rgba(26,28,31,.055); color:inherit; font:inherit; text-align:left; cursor:pointer; }
    [data-codex-mention-option]:focus-visible { outline:2px solid #339cff; outline-offset:-2px; }
    .codex-mention-icon { width:20px; height:20px; flex:0 0 20px; }
    .codex-mention-copy { display:grid; gap:2px; }
    .codex-mention-name { font-weight:500; }
    .codex-mention-detail { color:rgba(26,28,31,.58); font-size:11px; }
    .codex-stream-activity { display:grid; min-width:0; max-width:100%; gap:4px; padding:4px 0; }
    .codex-stream-activity-row { display:inline-flex !important; min-width:0; max-width:100%; min-height:28px; align-self:flex-start; align-items:center; gap:6px !important; color:var(--muted-foreground,rgba(26,28,31,.62)) !important; font-size:12px !important; font-weight:400 !important; line-height:20px !important; }
    .codex-stream-activity-label { min-width:0; max-width:100%; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .codex-command-activity { display:grid; min-width:0; max-width:100%; padding:2px 0; color:var(--muted-foreground,rgba(26,28,31,.62)); font-size:12px; font-weight:400; line-height:20px; }
    .codex-command-running, .codex-command-summary, .codex-command-row { display:flex; min-width:0; max-width:100%; min-height:28px; align-items:center; gap:6px; }
    .codex-command-summary { width:fit-content; cursor:pointer; list-style:none; }
    .codex-command-summary::-webkit-details-marker { display:none; }
    [data-codex-command-icon] { width:16px; height:16px; flex:0 0 16px; }
    .codex-command-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .codex-command-chevron { width:14px; height:14px; flex:0 0 14px; transform:rotate(-90deg); }
    .codex-command-activity[open] .codex-command-chevron { transform:rotate(0deg); }
    .codex-command-list { display:grid; min-width:0; }
    .codex-worked-activity { display:block; min-width:0; max-width:100%; margin:0 0 10px; border-bottom:1px solid rgba(26,28,31,.12); padding-bottom:8px; color:var(--muted-foreground,rgba(26,28,31,.62)); font:400 12px/20px system-ui,-apple-system,sans-serif; }
    .codex-worked-summary { display:flex; width:fit-content; min-height:28px; align-items:center; gap:5px; cursor:pointer; list-style:none; }
    .codex-worked-summary::-webkit-details-marker { display:none; }
    .codex-worked-summary:focus-visible { outline:2px solid #339cff; outline-offset:2px; border-radius:4px; }
    .codex-worked-chevron { width:14px; height:14px; flex:0 0 14px; transition:transform 120ms ease; }
    .codex-worked-activity[open] .codex-worked-chevron { transform:rotate(90deg); }
    .codex-worked-details { display:grid; min-width:0; gap:5px; padding:5px 0 2px 12px; }
    .codex-worked-row { min-width:0; overflow-wrap:anywhere; white-space:pre-wrap; }
    code[data-codex-plain-currency="true"] { margin:0 !important; border:0 !important; border-radius:0 !important; background:transparent !important; padding:0 !important; color:inherit !important; font:inherit !important; box-shadow:none !important; }
    [data-codex-linear-mention].codex-linear-mention { display:inline-flex !important; max-width:100%; align-items:center; gap:3px !important; margin:0 !important; border:0 !important; border-radius:0 !important; background:transparent !important; padding:0 2px !important; color:#3267d4 !important; font-size:inherit !important; font-weight:500 !important; line-height:inherit !important; vertical-align:bottom !important; }
    [data-codex-linear-icon].codex-linear-mention-icon { width:16px !important; height:16px !important; flex:0 0 16px !important; }
    [data-codex-mention-option] > [data-codex-linear-icon] { width:20px !important; height:20px !important; flex-basis:20px !important; }
    .codex-linear-activity { display:grid; width:100%; min-width:0; gap:9px; margin:9px 0 12px; color:#1a1c1f; }
    .codex-linear-work-status { margin:0; color:rgba(26,28,31,.58); font:500 12px/18px system-ui,-apple-system,sans-serif; }
    .codex-linear-tool-label { display:flex; min-width:0; align-items:center; gap:7px; margin:0; color:rgba(26,28,31,.72); font:500 12px/18px system-ui,-apple-system,sans-serif; }
    .codex-linear-tool-label img { width:14px; height:14px; flex:0 0 14px; object-fit:contain; }
    [data-codex-repo-native-panel] { display:flex; flex:1 1 auto; min-height:0; min-width:0; overflow:hidden; }
    [data-codex-repo-native-panel] > * { min-height:0; min-width:0; }
    [data-codex-repo-native-panel][hidden], [data-codex-repo-explorer][hidden] { display:none !important; }
    [data-codex-repo-pane][data-codex-repo-active-tab="plan"] > [data-codex-repo-native-panel] { display:none !important; }
    [data-codex-repo-explorer] { display:grid; flex:1 1 auto; grid-template-rows:minmax(108px,42%) minmax(0,1fr); min-height:0; min-width:0; overflow:hidden; background:#fff; }
    [data-codex-repo-layout="narrow-open"] { position:relative; }
    [data-codex-repo-layout="narrow-open"] > [data-codex-repo-pane] { position:absolute !important; z-index:14; inset:0; width:auto !important; max-width:none !important; min-width:0 !important; }
    [data-codex-repo-layout="narrow-open"] > [role="separator"] { display:none !important; }
    [data-codex-repo-layout="narrow-open"] > :first-child { visibility:hidden; pointer-events:none; }
    @media (max-width:560px) {
      .codex-repo-empty-state { padding:12px 8px; }
    }
    .codex-repo-tree-pane, .codex-repo-file-view { min-height:0; min-width:0; overflow:hidden; }
    .codex-repo-tree-pane { display:flex; flex-direction:column; border-bottom:1px solid rgba(26,28,31,.08); }
    .codex-repo-tree-heading { display:flex; height:37px; flex:0 0 37px; align-items:center; justify-content:space-between; padding:0 11px; color:rgba(26,28,31,.63); font:500 11px system-ui,-apple-system,sans-serif; }
    .codex-repo-tree { flex:1; min-height:0; overflow:auto; padding:0 5px 7px; }
    .codex-repo-folder, .codex-repo-children { position:relative; min-width:0; }
    .codex-repo-children::before { position:absolute; top:0; bottom:5px; left:var(--codex-repo-guide); width:1px; background:rgba(26,28,31,.12); content:""; opacity:0; pointer-events:none; transition:opacity 120ms ease; }
    .codex-repo-tree:hover .codex-repo-children::before, .codex-repo-tree:focus-within .codex-repo-children::before { opacity:.75; }
    .codex-repo-folder-row, .codex-repo-file { display:flex; width:100%; height:24px; min-height:24px; align-items:center; gap:5px; overflow:hidden; border:0; border-radius:5px; background:transparent; color:rgba(26,28,31,.82); font:400 12px/18px system-ui,-apple-system,sans-serif; text-align:left; white-space:nowrap; cursor:pointer; }
    .codex-repo-folder-row { font-weight:475; }
    .codex-repo-folder-row:hover, .codex-repo-file:hover { background:rgba(26,28,31,.045); }
    .codex-repo-file.is-selected { background:rgba(26,28,31,.07); color:#1a1c1f; }
    .codex-repo-chevron, .codex-repo-file-icon { display:inline-flex; width:14px; height:14px; flex:0 0 14px; align-items:center; justify-content:center; }
    .codex-repo-chevron { color:rgba(26,28,31,.48); transition:transform 120ms ease; }
    .codex-repo-chevron.is-open { transform:rotate(90deg); }
    .codex-repo-chevron svg { width:12px; height:12px; }
    .codex-repo-type-glyph { width:14px; height:14px; }
    .codex-repo-file-icon--markdown { color:#199f43; }
    .codex-repo-file-icon--json { color:#d47628; }
    .codex-repo-file-icon--tsx { color:#1ca1c7; }
    .codex-repo-file-icon--typescript { color:#1a85d4; }
    .codex-repo-file-icon--javascript { color:#d5a910; }
    .codex-repo-file-icon--css { color:#693acf; }
    .codex-repo-file-icon--file { color:#84848a; }
    .codex-repo-file-name { overflow:hidden; text-overflow:ellipsis; }
    .codex-repo-modified { margin-left:auto; padding-right:6px; color:var(--codex-mini-green,#00a240); font-size:10px; font-weight:600; }
    .codex-repo-file-view { display:flex; flex-direction:column; }
    .codex-repo-empty-state { display:flex; min-height:0; flex:1; align-items:center; justify-content:center; flex-direction:column; gap:7px; padding:24px; color:rgba(26,28,31,.64); text-align:center; }
    .codex-repo-empty-icon { display:inline-flex; width:20px; height:20px; color:rgba(26,28,31,.56); }
    .codex-repo-empty-icon svg { width:100%; height:100%; }
    .codex-repo-empty-title { margin:0; color:#1a1c1f; font:600 16px/21px system-ui,-apple-system,sans-serif; }
    .codex-repo-empty-copy { max-width:288px; margin:0; font:400 13px/19px system-ui,-apple-system,sans-serif; }
    .codex-repo-file-header { display:flex; min-height:37px; flex:0 0 37px; align-items:center; justify-content:space-between; gap:8px; padding:0 10px; border-bottom:1px solid rgba(26,28,31,.08); }
    .codex-repo-file-path { overflow:hidden; color:rgba(26,28,31,.72); font:500 11px system-ui,-apple-system,sans-serif; text-overflow:ellipsis; white-space:nowrap; }
    .codex-repo-file-status { color:var(--codex-mini-green,#00a240); font:500 10px system-ui,-apple-system,sans-serif; }
    .codex-repo-code { flex:1; margin:0; min-height:0; min-width:0; overflow:auto; padding:9px 0; background:var(--codex-mini-editor-background,#fafafa); color:#1a1c1f; font:12px/18px ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; white-space:pre; }
    .codex-repo-code > code { display:block; margin:0; padding:0; line-height:18px; }
    .codex-repo-code-line { display:grid; height:18px; min-height:18px; grid-template-columns:34px max-content; margin:0; padding:0 12px 0 0; line-height:18px; }
    .codex-repo-code-line.is-cited { background:color-mix(in srgb,var(--foreground,#1a1c1f) 10%,transparent); }
    .codex-repo-line-number { padding-right:9px; color:rgba(26,28,31,.37); line-height:18px; text-align:right; user-select:none; }
    .codex-repo-code .code-keyword { color:#8250df; }
    .codex-repo-code .code-string { color:#086641; }
    .codex-repo-code .code-comment { color:#8a8a8a; }
    [data-codex-review-scroll] { display:grid !important; max-width:100%; min-width:0; grid-template-columns:max-content; container-type:inline-size; overflow-x:auto !important; overflow-y:visible; overscroll-behavior-x:contain; }
    [data-codex-review-line] { position:relative; display:grid !important; width:100%; min-width:0; grid-template-columns:max-content max-content; align-items:stretch; white-space:pre !important; }
    [data-codex-review-code] { min-width:max-content; white-space:pre !important; }
    [data-codex-review-gutter] { position:sticky !important; z-index:3; left:0; display:grid !important; min-width:calc(5ch + 20px); grid-template-columns:2ch minmax(3ch,max-content) 20px; grid-template-rows:minmax(0,1fr); align-items:center; overflow:visible !important; box-sizing:border-box; padding-left:0 !important; white-space:nowrap !important; background-color:inherit; }
    [data-codex-review-select-line] { cursor:default; touch-action:none; }
    [data-codex-review-gutter][data-codex-review-augmented-number="true"] > :not(.codex-review-visible-line):not(.codex-review-add-comment):not([data-codex-review-marker="true"]) { display:none !important; }
    [data-codex-review-marker="true"] { grid-column:1; grid-row:1; display:block !important; width:2ch; margin:0 !important; padding:0 !important; line-height:1 !important; text-align:center; pointer-events:none; }
    .codex-review-visible-line { grid-column:2; grid-row:1; min-width:3ch; padding-right:1ch; color:rgba(26,28,31,.48); text-align:right; user-select:none; }
    .codex-review-add-comment { position:static; z-index:2; grid-column:3; grid-row:1; display:inline-flex; width:20px; height:20px; align-items:center; justify-content:center; border:0; border-radius:4px; padding:0; background:#1a1c1f; color:#fff; opacity:0; pointer-events:none; cursor:pointer; transition:opacity 120ms ease,background-color 120ms ease; }
    [data-codex-review-line]:hover .codex-review-add-comment, [data-codex-review-line][data-codex-review-hover="true"] .codex-review-add-comment, [data-codex-review-line]:focus-within .codex-review-add-comment, .codex-review-add-comment:focus-visible { opacity:1; pointer-events:auto; }
    [data-codex-review-line][data-codex-review-selected="true"] > [data-codex-review-gutter], [data-codex-review-line][data-codex-review-selected="true"] > [data-codex-review-code] { background:#d9edff !important; }
    [data-codex-review-line][data-codex-review-selected="true"]:not([data-codex-review-selection-bottom="true"]) .codex-review-add-comment { opacity:0 !important; pointer-events:none !important; }
    [data-codex-review-line][data-codex-review-selection-bottom="true"] .codex-review-add-comment { opacity:1; pointer-events:auto; }
    .codex-review-add-comment:focus-visible { outline:2px solid #339cff; outline-offset:2px; }
    .codex-review-add-comment svg { width:16px; height:16px; }
    [data-codex-review-composer], [data-codex-review-thread] { position:sticky; left:0; justify-self:start; box-sizing:border-box; width:min(768px,100cqi); max-width:100cqi; min-width:0; margin:0; padding:6px; color:#1a1c1f; font:400 12px system-ui,-apple-system,sans-serif; white-space:normal; }
    .codex-review-comment-surface, .codex-review-comment-card { overflow:hidden; border:1px solid rgba(26,28,31,.12); border-radius:16px; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.045); }
    .codex-review-comment-surface:focus-within { border-color:#339cff; box-shadow:0 0 0 1px rgba(51,156,255,.15); }
    .codex-review-comment-heading { display:flex; min-height:36px; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 12px; padding:10px 12px; border-bottom:1px solid rgba(26,28,31,.08); color:rgba(26,28,31,.65); font-size:11px; }
    .codex-review-comment-identity { display:flex; min-width:0; align-items:center; gap:8px; color:#1a1c1f; font-weight:550; }
    .codex-review-comment-avatar { display:inline-flex; width:24px; height:24px; flex:0 0 24px; align-items:center; justify-content:center; overflow:hidden; border-radius:50%; background:#1a1c1f; color:#fff; }
    .codex-review-comment-avatar svg { width:15px; height:15px; }
    .codex-review-comment-accessory { min-width:0; overflow-wrap:anywhere; color:rgba(26,28,31,.56); font-weight:400; }
    .codex-review-comment-input { box-sizing:border-box; display:block; width:100%; min-height:72px; resize:vertical; border:0; padding:12px; background:transparent; color:#1a1c1f; font:400 12px/18px system-ui,-apple-system,sans-serif; outline:0; }
    .codex-review-comment-input::placeholder { color:rgba(26,28,31,.42); }
    .codex-review-comment-actions { display:flex; align-items:center; justify-content:flex-end; gap:6px; padding:0 10px 10px; }
    .codex-review-comment-cancel, .codex-review-comment-submit { display:inline-flex; min-height:28px; align-items:center; padding:0 10px; border:0; border-radius:6px; font:500 11px system-ui,-apple-system,sans-serif; cursor:pointer; }
    .codex-review-comment-cancel { background:transparent; color:rgba(26,28,31,.68); }
    .codex-review-comment-cancel:hover { background:rgba(26,28,31,.055); }
    .codex-review-comment-submit { background:#1a1c1f; color:#fff; }
    .codex-review-comment-submit:disabled { opacity:.42; cursor:not-allowed; }
    .codex-review-comment-entry { padding:12px; }
    .codex-review-comment-entry + .codex-review-comment-entry { border-top:1px solid rgba(26,28,31,.08); }
    .codex-review-comment-author { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 12px; margin-bottom:8px; color:#1a1c1f; font-weight:550; }
    .codex-review-comment-body { overflow-wrap:anywhere; color:rgba(26,28,31,.82); line-height:17px; }
    .codex-review-comments-rail { position:relative; z-index:12; display:flex; min-width:0; align-items:flex-start; justify-content:flex-start; padding:8px 8px 6px; font:400 12px/16px system-ui,-apple-system,sans-serif; }
    .codex-review-comments-sent-rail { justify-content:flex-end; padding:0; }
    .codex-review-comments-attachment { position:relative; display:inline-flex; max-width:min(100%,320px); align-items:center; color:var(--foreground,#1a1c1f); }
    .codex-review-comments-pill { box-sizing:border-box; display:inline-flex; min-width:0; max-width:320px; align-items:center; gap:4px; border:1px solid var(--border,rgba(26,28,31,.12)); border-radius:999px; padding:6px 8px; background:var(--color-token-dropdown-background,var(--accent,rgba(26,28,31,.045))); color:var(--foreground,#1a1c1f); font:400 14px/20px system-ui,-apple-system,sans-serif; white-space:nowrap; }
    button.codex-review-comments-pill { cursor:pointer; }
    button.codex-review-comments-pill:hover { background:var(--color-token-menu-background,var(--accent,rgba(26,28,31,.07))); }
    .codex-review-comments-pill > svg { width:14px; height:14px; flex:0 0 14px; color:var(--muted-foreground,rgba(26,28,31,.58)); }
    .codex-review-comments-pill [data-codex-review-comments-count] { min-width:0; overflow:hidden; padding-inline-end:4px; font-weight:500; text-overflow:ellipsis; }
    .codex-review-comments-remove { position:absolute; z-index:2; top:50%; right:4px; display:inline-flex; width:20px; height:20px; align-items:center; justify-content:center; border:0; border-radius:999px; padding:0; background:transparent; color:var(--foreground,#1a1c1f); opacity:0; cursor:pointer; pointer-events:none; transform:translateY(-50%); }
    .codex-review-comments-remove::before { position:absolute; inset-block:0; right:0; left:-32px; background:linear-gradient(to right,transparent,var(--color-token-dropdown-background,var(--popover,#fff)),var(--color-token-dropdown-background,var(--popover,#fff))); content:""; pointer-events:none; }
    .codex-review-comments-remove-circle { position:relative; display:inline-flex; width:20px; height:20px; align-items:center; justify-content:center; border:1px solid var(--border,rgba(26,28,31,.12)); border-radius:999px; background:var(--color-token-menu-background,var(--popover,#fff)); }
    .codex-review-comments-remove:hover .codex-review-comments-remove-circle,
    .codex-review-comments-remove:focus-visible .codex-review-comments-remove-circle { background:color-mix(in srgb,var(--color-token-menu-background,var(--popover,#fff)) 88%,var(--foreground,#1a1c1f)); }
    .codex-review-comments-remove svg { width:14px; height:14px; }
    .codex-review-comments-attachment--pending:hover .codex-review-comments-remove,
    .codex-review-comments-remove:focus-visible { opacity:1; pointer-events:auto; }
    .codex-review-comments-attachment--pending:hover .codex-review-comments-remove::before { background:linear-gradient(to right,transparent,var(--color-token-menu-background,var(--popover,#fff)),var(--color-token-menu-background,var(--popover,#fff))); }
    .codex-review-comments-pill:focus,
    .codex-review-comments-remove:focus { outline:none; }
    .codex-review-comments-popover { position:absolute; z-index:30; left:0; bottom:calc(100% + 4px); box-sizing:border-box; display:flex; width:384px; max-width:min(var(--radix-popover-content-available-width,100vw),calc(100vw - 16px)); max-height:min(20rem,var(--radix-popover-content-available-height,100vh),calc(100vh - 16px)); flex-direction:column; gap:8px; overflow:auto; visibility:hidden; border:0; border-radius:12px; padding:4px; background:color-mix(in srgb,var(--color-token-dropdown-background,var(--popover,#fff)) 90%,transparent); color:var(--foreground,#1a1c1f); box-shadow:0 0 0 .5px var(--border,rgba(26,28,31,.12)),0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1); opacity:0; pointer-events:none; text-align:left; backdrop-filter:blur(8px); }
    .codex-review-comments-attachment[data-open="true"] .codex-review-comments-popover { visibility:visible; opacity:1; pointer-events:auto; }
    .codex-review-comments-popover-list { display:flex; min-width:0; flex-direction:column; }
    .codex-review-comments-popover-item { display:flex; min-width:0; flex-direction:column; gap:6px; margin:0; padding:8px 10px; }
    .codex-review-comments-popover-item + .codex-review-comments-popover-item { border-top:1px solid var(--border,rgba(26,28,31,.08)); }
    .codex-review-comments-popover-location { display:flex; min-width:0; flex-wrap:wrap; align-items:center; column-gap:8px; row-gap:4px; color:var(--muted-foreground,rgba(26,28,31,.58)); font:400 12px/16px system-ui,-apple-system,sans-serif; }
    .codex-review-comments-popover-path { min-width:0; overflow-wrap:anywhere; word-break:break-all; }
    .codex-review-comments-popover-side { color:var(--foreground,#1a1c1f); font-weight:500; }
    .codex-review-comments-popover-item p { margin:0; overflow-wrap:anywhere; color:var(--foreground,#1a1c1f); font:400 14px/20px system-ui,-apple-system,sans-serif; }
    .codex-review-comments-sent-turn { flex-direction:column; align-items:flex-end; gap:8px; }
    @media (max-width:390px) { .codex-review-comment-accessory { flex-basis:100%; padding-left:32px; } }
    @media (hover:none), (pointer:coarse) { [data-codex-review-line] .codex-review-add-comment { opacity:1; pointer-events:auto; } }
    @media (prefers-reduced-motion:reduce) { .codex-review-add-comment { transition:none; } }
    :host(.dark) [data-codex-repo-pane],
    :host(.dark) [data-codex-repo-tabs],
    :host(.dark) [data-codex-repo-explorer],
    :host(.dark) [data-codex-panel-picker],
    :host(.dark) [data-codex-repo-native-panel],
    :host(.dark) .codex-repo-tree-pane,
    :host(.dark) .codex-repo-file-view,
    :host(.dark) .codex-repo-file-header,
    :host(.dark) [data-codex-plan-panel],
    :host(.dark) [data-codex-browser-panel],
    :host(.dark) [data-browser-sidebar-toolbar] {
      border-color:var(--border,rgba(255,255,255,.08));
      background:var(--background,#181818);
      color:var(--foreground,#fff);
    }
    :host(.dark) [data-codex-plan-full] { background:rgba(255,255,255,.05); }
    :host(.dark) [data-codex-repo-tab],
    :host(.dark) [data-codex-project-add],
    :host(.dark) .codex-repo-tree-heading,
    :host(.dark) .codex-repo-file-path,
    :host(.dark) .codex-repo-chevron,
    :host(.dark) .codex-repo-line-number,
    :host(.dark) [data-codex-environment-toggle],
    :host(.dark) .codex-repo-empty-icon,
    :host(.dark) .codex-repo-empty-copy,
    :host(.dark) .codex-panel-picker-icon,
    :host(.dark) .codex-panel-picker-shortcut,
    :host(.dark) [data-codex-files-toggle],
    :host(.dark) [data-browser-sidebar-toolbar],
    :host(.dark) .codex-environment-heading,
    :host(.dark) .codex-mention-section,
    :host(.dark) .codex-mention-detail,
    :host(.dark) .codex-branch-chevron,
    :host(.dark) .codex-branch-search-wrap,
    :host(.dark) .codex-branch-section,
    :host(.dark) .codex-branch-empty,
    :host(.dark) .codex-review-comment-heading,
    :host(.dark) .codex-review-comment-cancel,
    :host(.dark) .codex-linear-work-status,
    :host(.dark) .codex-linear-tool-label {
      color:var(--muted-foreground,rgba(255,255,255,.65));
    }
    :host(.dark) .codex-panel-picker-option:disabled,
    :host(.dark) .codex-panel-picker-option:disabled .codex-panel-picker-icon,
    :host(.dark) .codex-panel-picker-option:disabled .codex-panel-picker-shortcut {
      color:rgba(255,255,255,.42);
    }
    :host(.dark) .codex-panel-picker-option {
      background:rgba(255,255,255,.03);
    }
    :host(.dark) .codex-panel-picker-shortcut {
      background:rgba(255,255,255,.09);
    }
    :host(.dark) [data-codex-repo-tab][aria-selected="true"],
    :host(.dark) [data-codex-repo-tab][aria-selected="true"]:hover {
      background:transparent;
      color:var(--foreground,#fff);
    }
    :host(.dark) [data-codex-repo-tab]:hover::before,
    :host(.dark) [data-codex-repo-tab][aria-selected="true"]::before,
    :host(.dark) [data-codex-repo-tab][aria-selected="true"]:hover::before { background:rgba(255,255,255,.05); }
    :host(.dark) .codex-repo-tab-label[data-overflow="true"]::after { background:linear-gradient(to right,transparent,#181818 85%); }
    :host(.dark) [data-codex-repo-tab]:hover .codex-repo-tab-label[data-overflow="true"]::after,
    :host(.dark) [data-codex-repo-tab][aria-selected="true"] .codex-repo-tab-label[data-overflow="true"]::after { background:linear-gradient(to right,transparent,color-mix(in srgb,#fff 5%,#181818) 85%); }
    :host(.dark) .codex-repo-file.is-selected {
      background:var(--accent,rgba(255,255,255,.08));
      color:var(--foreground,#fff);
    }
    :host(.dark) .codex-repo-folder-row,
    :host(.dark) .codex-repo-file,
    :host(.dark) .codex-repo-empty-title,
    :host(.dark) [data-browser-sidebar-address-input],
    :host(.dark) .codex-review-comment-input,
    :host(.dark) .codex-review-comment-author,
    :host(.dark) .codex-review-comment-body {
      color:var(--foreground,#fff);
    }
    :host(.dark) .codex-side-panel-tooltip { border-color:rgba(255,255,255,.082); background:#2d2d2d; color:#fff; }
    :host(.dark) .codex-side-panel-tooltip kbd { background:rgba(255,255,255,.1); }
    :host(.dark) .codex-repo-folder-row:hover,
    :host(.dark) .codex-repo-file:hover,
    :host(.dark) [data-codex-project-add]:hover,
    :host(.dark) [data-codex-environment-toggle]:hover,
    :host(.dark) [data-codex-environment-toggle][aria-expanded="true"],
    :host(.dark) .codex-panel-picker-option:hover:not(:disabled),
    :host(.dark) .codex-panel-picker-option:focus-visible,
    :host(.dark) .codex-branch-option:hover,
    :host(.dark) .codex-branch-option:focus-visible,
    :host(.dark) button.codex-environment-row:hover,
    :host(.dark) button.codex-environment-row:focus-visible,
    :host(.dark) [data-codex-browser-button]:hover:not(:disabled),
    :host(.dark) .codex-review-comment-cancel:hover {
      background:var(--accent,rgba(255,255,255,.08));
      color:var(--foreground,#fff);
    }
    :host(.dark) [data-codex-files-toggle] { color:rgba(255,255,255,.5); }
    :host(.dark) [data-codex-files-toggle]:hover { background:var(--accent,rgba(255,255,255,.08)); }
    :host(.dark) [data-codex-files-toggle][aria-pressed="true"] { background:rgba(255,255,255,.05); color:var(--foreground,#fff); }
    :host(.dark) [data-codex-files-toggle][aria-pressed="true"]:hover { background:rgba(255,255,255,.1); }
    :host(.dark) .codex-repo-children::before {
      background:var(--border,rgba(255,255,255,.12));
    }
    :host(.dark) .codex-repo-code {
      background:var(--codex-mini-editor-background,#212121);
      color:var(--foreground,#fff);
    }
    :host(.dark) .codex-repo-code .code-keyword { color:var(--sh-keyword,#f67576); }
    :host(.dark) .codex-repo-code .code-string { color:var(--sh-string,#85df7b); }
    :host(.dark) .codex-repo-code .code-comment { color:var(--sh-comment,#999); }
    :host(.dark) .codex-repo-file-icon--markdown { color:var(--codex-mini-green,#40c977); }
    :host(.dark) .codex-repo-file-icon--json { color:var(--sh-jsxliterals,#fa994c); }
    :host(.dark) .codex-repo-file-icon--tsx { color:var(--sh-entity,#6dcbf4); }
    :host(.dark) .codex-repo-file-icon--typescript { color:var(--codex-mini-blue,#339cff); }
    :host(.dark) .codex-repo-file-icon--javascript { color:#e8c96d; }
    :host(.dark) .codex-repo-file-icon--css { color:var(--sh-class,#b06dff); }
    :host(.dark) .codex-repo-file-icon--file { color:var(--muted-foreground,#999); }
    :host(.dark) [data-codex-environment-panel],
    :host(.dark) [data-codex-mention-menu],
    :host(.dark) .codex-branch-picker {
      border-color:var(--border,rgba(255,255,255,.12));
      background:var(--card,#212121);
      color:var(--foreground,#fff);
      box-shadow:0 8px 28px rgba(0,0,0,.34);
    }
    :host(.dark) .codex-environment-additions,
    :host(.dark) .codex-repo-modified,
    :host(.dark) .codex-repo-file-status {
      color:var(--codex-mini-green,#40c977);
    }
    :host(.dark) .codex-review-add-comment { background:#f4f4f4; color:#181818; }
    :host(.dark) [data-codex-review-line][data-codex-review-selected="true"] > [data-codex-review-gutter],
    :host(.dark) [data-codex-review-line][data-codex-review-selected="true"] > [data-codex-review-code] { background:#16324f !important; }
    :host(.dark) [data-codex-review-composer],
    :host(.dark) [data-codex-review-thread] { color:var(--foreground,#fff); }
    :host(.dark) .codex-review-comment-surface,
    :host(.dark) .codex-review-comment-card { border-color:var(--border,rgba(255,255,255,.12)); background:var(--card,#212121); box-shadow:0 1px 4px rgba(0,0,0,.25); }
    :host(.dark) .codex-review-comment-identity,
    :host(.dark) .codex-review-comment-author,
    :host(.dark) .codex-review-comment-input { color:var(--foreground,#fff); }
    :host(.dark) .codex-review-comment-avatar { background:#f4f4f4; color:#181818; }
    :host(.dark) .codex-review-comment-accessory { color:rgba(255,255,255,.56); }
    :host(.dark) .codex-review-comment-body { color:rgba(255,255,255,.82); }
    :host(.dark) .codex-review-comment-cancel { color:rgba(255,255,255,.7); }
    :host(.dark) .codex-review-comment-cancel:hover { background:rgba(255,255,255,.07); }
    :host(.dark) .codex-review-comment-submit { background:#f4f4f4; color:#181818; }
    :host(.dark) .codex-environment-deletions {
      color:var(--codex-mini-red,#ff6764);
    }
    :host(.dark) [data-codex-linear-mention].codex-linear-mention { color:#8eabe6 !important; }
    :host(.dark) [data-codex-browser-address],
    :host(.dark) [data-codex-mention-option] {
      background:var(--accent,rgba(255,255,255,.08));
    }
    :host(.dark) .codex-review-comment-heading,
    :host(.dark) .codex-review-comment-entry + .codex-review-comment-entry {
      border-color:var(--border,rgba(255,255,255,.08));
    }
    :host(.dark) .codex-review-comment-input::placeholder {
      color:var(--muted-foreground,rgba(255,255,255,.5));
    }
    :host(.dark) .codex-review-comment-submit {
      background:var(--primary,#fff);
      color:var(--primary-foreground,#0d0d0d);
    }
    @media (prefers-reduced-motion:reduce) { .codex-repo-chevron, .codex-repo-children::before { transition:none; } }
  `;
  shadow.append(style);
}

function ensureNativeHomeRepositorySplit(shadow) {
  if (!shadow?.querySelector) return null;

  const existing = shadow.querySelector('[role="separator"][aria-label="Resize panels"]');
  if (shadow.querySelector('[data-codex-mini-plugins="true"]')) return null;

  const home = shadow.querySelector("[data-home-composer-region]");
  const grid = home?.closest?.("section");
  if (existing?.nextElementSibling) {
    const ownedGrid = existing.parentElement?.dataset?.codexHomeRepositorySplit === "true";
    if (!ownedGrid || existing.parentElement === grid) {
      if (ownedGrid && grid.children
        && (grid.children[grid.children.length - 1] !== existing.nextElementSibling
          || grid.children[grid.children.length - 2] !== existing)) {
        const adjacentPane = existing.nextElementSibling;
        const pane = adjacentPane?.dataset?.codexOwnedHomePane === "true"
          ? adjacentPane
          : grid.querySelector?.('[data-codex-owned-home-pane="true"]');
        if (pane) grid.append(existing, pane);
      }
      return existing;
    }
    const staleGrid = existing.parentElement;
    const stalePane = existing.nextElementSibling;
    if (stalePane?.dataset?.codexOwnedHomePane === "true") {
      stalePane.querySelector?.("[data-codex-browser-panel]")?.__codexBrowserPortal?.cleanup?.();
      stalePane.remove?.();
    }
    existing.remove?.();
    staleGrid.style.display = staleGrid.dataset.codexHomeOriginalDisplay || "";
    staleGrid.style.gridTemplateColumns = staleGrid.dataset.codexHomeOriginalColumns || "";
    staleGrid.style.minWidth = staleGrid.dataset.codexHomeOriginalMinWidth || "";
    staleGrid.style.width = staleGrid.dataset.codexHomeOriginalWidth || "";
    delete staleGrid.dataset.codexHomeRepositorySplit;
    delete staleGrid.dataset.codexHomeOriginalDisplay;
    delete staleGrid.dataset.codexHomeOriginalColumns;
    delete staleGrid.dataset.codexHomeOriginalMinWidth;
    delete staleGrid.dataset.codexHomeOriginalWidth;
  }
  if (!grid?.firstElementChild || !grid.parentElement || !grid.style
    || typeof document?.createElement !== "function") return null;

  grid.dataset.codexHomeOriginalDisplay = grid.style.display || "";
  grid.dataset.codexHomeOriginalColumns = grid.style.gridTemplateColumns || "";
  grid.dataset.codexHomeOriginalMinWidth = grid.style.minWidth || "";
  grid.dataset.codexHomeOriginalWidth = grid.style.width || "";
  grid.dataset.codexHomeRepositorySplit = "true";
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "minmax(0, 1fr) 8px minmax(0, 1fr)";
  grid.style.minWidth = "568px";
  grid.style.width = "100%";

  const separator = document.createElement("div");
  separator.className = "group relative h-full w-full cursor-col-resize select-none";
  separator.setAttribute("role", "separator");
  separator.setAttribute("aria-orientation", "vertical");
  separator.setAttribute("aria-label", "Resize panels");
  separator.dataset.codexOwnedHomeSeparator = "true";
  separator.innerHTML = '<div class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border group-hover:bg-border/80"></div>';
  separator.hidden = true;

  const pane = document.createElement("div");
  pane.className = "min-h-0 min-w-0 overflow-hidden";
  pane.dataset.codexOwnedHomePane = "true";
  pane.hidden = true;
  const nativePanel = document.createElement("section");
  nativePanel.hidden = true;
  pane.append(nativePanel);
  grid.append(separator, pane);
  return separator;
}

function syncNativeRepositorySplitLayout(shadow, mode) {
  const separator = shadow?.querySelector?.('[role="separator"][aria-label="Resize panels"]');
  const pane = separator?.nextElementSibling;
  const grid = separator?.parentElement;
  const viewport = grid?.parentElement;
  if (!separator || !pane || !grid || !viewport) return false;
  grid.dataset.codexRepoLayout = mode;

  if (grid.dataset.codexRepoOriginalColumns === undefined) {
    grid.dataset.codexRepoOriginalColumns = grid.style.gridTemplateColumns || "";
    grid.dataset.codexRepoOriginalMinWidth = grid.style.minWidth || "";
    grid.dataset.codexRepoOriginalWidth = grid.style.width || "";
    viewport.dataset.codexRepoOriginalOverflowX = viewport.style.overflowX || "";
    separator.dataset.codexRepoOriginalWidth = separator.style.width || "";
    separator.dataset.codexRepoOriginalMinWidth = separator.style.minWidth || "";
    separator.dataset.codexRepoOriginalOverflow = separator.style.overflow || "";
    separator.dataset.codexRepoOriginalPointerEvents = separator.style.pointerEvents || "";
  }

  if (mode === "wide-open") {
    const syntheticHome = grid.dataset.codexHomeRepositorySplit === "true";
    const previousColumns = grid.dataset.codexRepoOriginalColumns || "";
    const completeHomeSplit = /\b8px\b/.test(previousColumns)
      && (previousColumns.match(/minmax\s*\(/g) || []).length >= 2;
    grid.style.gridTemplateColumns = syntheticHome && !completeHomeSplit
      ? "minmax(0, 1fr) 8px minmax(0, 1fr)"
      : previousColumns;
    grid.style.minWidth = syntheticHome && !completeHomeSplit
      ? "568px"
      : grid.dataset.codexRepoOriginalMinWidth;
    grid.style.width = syntheticHome && !completeHomeSplit
      ? "100%"
      : grid.dataset.codexRepoOriginalWidth;
    viewport.style.overflowX = viewport.dataset.codexRepoOriginalOverflowX;
    delete grid.dataset.codexRepoOriginalColumns;
    delete grid.dataset.codexRepoOriginalMinWidth;
    delete grid.dataset.codexRepoOriginalWidth;
    delete viewport.dataset.codexRepoOriginalOverflowX;
    separator.style.width = separator.dataset.codexRepoOriginalWidth;
    separator.style.minWidth = separator.dataset.codexRepoOriginalMinWidth;
    separator.style.overflow = separator.dataset.codexRepoOriginalOverflow;
    separator.style.pointerEvents = separator.dataset.codexRepoOriginalPointerEvents;
    delete separator.dataset.codexRepoOriginalWidth;
    delete separator.dataset.codexRepoOriginalMinWidth;
    delete separator.dataset.codexRepoOriginalOverflow;
    delete separator.dataset.codexRepoOriginalPointerEvents;
    delete pane.dataset.codexRepoNarrowDocked;
    separator.hidden = false;
    pane.hidden = false;
    return true;
  }

  viewport.style.overflowX = "hidden";
  grid.style.width = "100%";
  if (mode === "narrow-open") {
    grid.style.gridTemplateColumns = "minmax(0, 1fr)";
    grid.style.minWidth = "0";
    pane.dataset.codexRepoNarrowDocked = "true";
    separator.hidden = false;
    separator.style.width = "0";
    separator.style.minWidth = "0";
    separator.style.overflow = "hidden";
    separator.style.pointerEvents = "none";
    pane.hidden = false;
    return true;
  }

  grid.style.gridTemplateColumns = "minmax(0, 1fr)";
  grid.style.minWidth = "0";
  delete pane.dataset.codexRepoNarrowDocked;
  separator.hidden = true;
  pane.hidden = true;
  return true;
}

function syncNativeRepositoryPane(shadow = nativeCodexShadow()) {
  if (!shadow) return;
  const pluginView = shadow.querySelector('[data-codex-mini-plugins="true"]');
  if (pluginView) {
    const applicationRoot = pluginView.closest?.("[data-codex-mini-app]");
    if (applicationRoot?.dataset) {
      delete applicationRoot.dataset.codexRepositoryPaneOpen;
      delete applicationRoot.dataset.codexProjectFilesOpen;
    }
    const ownedSeparator = shadow.querySelector('[role="separator"][aria-label="Resize panels"]');
    const ownedGrid = ownedSeparator?.parentElement;
    if (ownedGrid?.dataset?.codexHomeRepositorySplit === "true") {
      const ownedPane = ownedSeparator.nextElementSibling;
      if (ownedPane?.dataset?.codexOwnedHomePane === "true") {
        ownedPane.querySelector?.("[data-codex-browser-panel]")?.__codexBrowserPortal?.cleanup?.();
        ownedPane.remove?.();
      }
      ownedSeparator.remove?.();
      ownedGrid.style.display = ownedGrid.dataset.codexHomeOriginalDisplay || "";
      ownedGrid.style.gridTemplateColumns = ownedGrid.dataset.codexHomeOriginalColumns || "";
      ownedGrid.style.minWidth = ownedGrid.dataset.codexHomeOriginalMinWidth || "";
      ownedGrid.style.width = ownedGrid.dataset.codexHomeOriginalWidth || "";
      if (ownedGrid.parentElement?.dataset?.codexRepoOriginalOverflowX !== undefined) {
        ownedGrid.parentElement.style.overflowX = ownedGrid.parentElement.dataset.codexRepoOriginalOverflowX;
        delete ownedGrid.parentElement.dataset.codexRepoOriginalOverflowX;
      }
      delete ownedGrid.dataset.codexHomeRepositorySplit;
      delete ownedGrid.dataset.codexHomeOriginalDisplay;
      delete ownedGrid.dataset.codexHomeOriginalColumns;
      delete ownedGrid.dataset.codexHomeOriginalMinWidth;
      delete ownedGrid.dataset.codexHomeOriginalWidth;
      delete ownedGrid.dataset.codexRepoOriginalColumns;
      delete ownedGrid.dataset.codexRepoOriginalMinWidth;
      delete ownedGrid.dataset.codexRepoOriginalWidth;
    }
    return;
  }
  const existing = shadow.querySelector('[role="separator"][aria-label="Resize panels"]');
  const separator = typeof ensureNativeHomeRepositorySplit === "function"
    && (shadow.querySelector("[data-home-composer-region]")
      || existing?.parentElement?.dataset?.codexHomeRepositorySplit === "true")
    ? ensureNativeHomeRepositorySplit(shadow)
    : existing;
  const pane = separator?.nextElementSibling;
  if (!pane) return;
  const applySplitLayout = typeof syncNativeRepositorySplitLayout === "function"
    ? (mode) => syncNativeRepositorySplitLayout(shadow, mode)
    : (mode) => {
      const grid = separator.parentElement;
      if (!grid?.style || !grid.dataset) return false;
      grid.dataset.codexRepoLayout = mode;
      if (grid.dataset.codexRepoOriginalColumns === undefined) {
        grid.dataset.codexRepoOriginalColumns = grid.style.gridTemplateColumns || "";
        grid.dataset.codexRepoOriginalMinWidth = grid.style.minWidth || "";
      }
      if (mode === "wide-open") {
        grid.style.gridTemplateColumns = grid.dataset.codexRepoOriginalColumns;
        grid.style.minWidth = grid.dataset.codexRepoOriginalMinWidth;
        delete grid.dataset.codexRepoOriginalColumns;
        delete grid.dataset.codexRepoOriginalMinWidth;
        separator.hidden = false;
        pane.hidden = false;
      } else if (mode === "narrow-open") {
        grid.style.gridTemplateColumns = "minmax(0, 1fr)";
        grid.style.minWidth = "0";
        separator.hidden = false;
        separator.style.width = "0";
        separator.style.minWidth = "0";
        separator.style.overflow = "hidden";
        separator.style.pointerEvents = "none";
        pane.hidden = false;
      } else {
        grid.style.gridTemplateColumns = "minmax(0, 1fr)";
        grid.style.minWidth = "0";
        separator.hidden = true;
        pane.hidden = true;
      }
      return true;
    };
  const currentStepId = typeof STEPS === "undefined" ? "" : STEPS[state.currentIndex]?.id || "";
  const applicationRoot = shadow.querySelector("[data-codex-mini-app]");
  const hostWidth = Number(shadow.host?.clientWidth) || Number(applicationRoot?.clientWidth) || Infinity;
  const narrow = typeof isNarrowCodexWorkspace === "function"
    && isNarrowCodexWorkspace(hostWidth);
  if (applicationRoot?.dataset) {
    applicationRoot.dataset.codexRepositoryNarrow = String(narrow);
  }

  ensureNativeRepositoryStyle(shadow);
  pane.dataset.codexRepoPane = "true";
  if (state.repositoryPaneOpen === false) {
    if (applicationRoot?.dataset) {
      delete applicationRoot.dataset.codexRepositoryPaneOpen;
      delete applicationRoot.dataset.codexProjectFilesOpen;
    }
    delete pane.dataset.codexRepoActiveTab;
    applySplitLayout("closed");
    return;
  }
  applySplitLayout(narrow ? "narrow-open" : "wide-open");
  const projectAwaitingSource = !(typeof verifiedCodexWorkspace === "function"
    && verifiedCodexWorkspace());
  if (applicationRoot?.dataset) {
    if (!projectAwaitingSource) applicationRoot.dataset.codexRepositoryPaneOpen = "true";
    else delete applicationRoot.dataset.codexRepositoryPaneOpen;
    if (currentStepId === "project" && !projectAwaitingSource) {
      applicationRoot.dataset.codexProjectFilesOpen = "true";
    } else {
      delete applicationRoot.dataset.codexProjectFilesOpen;
    }
  }
  let noProject = Array.from(pane.children).find((child) => child.dataset.codexRepoEmptyPanel === "true");
  if (projectAwaitingSource) {
    delete pane.dataset.codexRepoActiveTab;
    for (const child of pane.children) child.hidden = true;
    if (!noProject) {
      noProject = document.createElement("section");
      noProject.dataset.codexRepoEmptyPanel = "true";
      noProject.innerHTML = '<div class="codex-repo-empty-state"><h3 class="codex-repo-empty-title">Nothing here yet</h3></div>';
      pane.append(noProject);
    }
    noProject.hidden = false;
    return;
  }
  noProject?.remove?.();
  const built = isComplete("build");
  const browserAvailable = [ "plan", "build", "test", "pr"].includes(currentStepId);
  const planAvailable = state.planPanelOpen === true
    && courseConversations("plan").some((exchange) =>
      typeof exchange?.response === "string"
      && /^\s*<proposed_plan>[\t ]*(?:\n|$)/.test(exchange.response)
      && /(?:^|\n)[\t ]*<\/proposed_plan>[\t ]*$/.test(exchange.response));
  const stageKey = currentStepId === "build"
    ? currentStepId
    : `${currentStepId}:${built ? "built" : "pending"}`;
  if (currentStepId && pane.dataset.codexRepoStage !== stageKey) {
    pane.dataset.codexRepoStage = stageKey;
    const availableTabs = new Set(["files"]);
    if (currentStepId !== "project") availableTabs.add("review");
    if (browserAvailable) availableTabs.add("browser");
    if (planAvailable) availableTabs.add("plan");
    if (!availableTabs.has(state.repoPaneTab)) {
      state.repoPaneTab = built && ["test", "pr"].includes(currentStepId)
        ? "review"
        : "files";
    }
  }

  for (const child of pane.children) {
    if (child.dataset.codexPlanPanel !== "true" || child.dataset.codexRepoNativePanel !== "true") continue;
    delete child.dataset.codexRepoNativePanel;
    child.id = "codex-repo-panel-plan";
    child.setAttribute("aria-labelledby", "codex-repo-tab-plan");
  }
  let nativePanel = Array.from(pane.children).find((child) =>
    child.dataset.codexRepoNativePanel === "true" && child.dataset.codexPlanPanel !== "true");
  if (!nativePanel) {
    nativePanel = Array.from(pane.children).find((child) =>
      !child.dataset.codexRepoTabs && !child.dataset.codexRepoExplorer
      && !child.dataset.codexBrowserPanel && !child.dataset.codexPlanPanel);
    if (!nativePanel) return;
    nativePanel.dataset.codexRepoNativePanel = "true";
    nativePanel.id = "codex-repo-panel-review";
    nativePanel.setAttribute("role", "tabpanel");
    nativePanel.setAttribute("aria-labelledby", "codex-repo-tab-review");
  }
  for (const control of nativePanel.querySelectorAll?.(
    'button[aria-label="Discard"], button[aria-label="Commit"]',
  ) || []) {
    control.hidden = true;
    control.style?.setProperty?.("display", "none", "important");
  }

  let tabs = Array.from(pane.children).find((child) => child.dataset.codexRepoTabs === "true");
  if (!tabs) {
    tabs = document.createElement("div");
    tabs.dataset.codexRepoTabs = "true";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Repository views");
    pane.prepend(tabs);
  }
  const tabsKey = currentStepId === "project"
    ? "open-file"
    : `${browserAvailable ? "files,review,browser" : "files,review"}${planAvailable ? ",plan" : ""}`;
  if (tabs.dataset.codexRepoTabsKey !== tabsKey) {
    tabs.dataset.codexRepoTabsKey = tabsKey;
    const tabCount = currentStepId === "project" ? 1 : (browserAvailable ? 3 : 2) + Number(planAvailable);
    tabs.innerHTML = `<div class="codex-repo-tab-group" style="--codex-repo-tab-count:${tabCount}">
      <span class="codex-repo-tab-controller"><button type="button" role="tab" id="codex-repo-tab-files" aria-controls="codex-repo-panel-files" data-codex-repo-tab="files" data-codex-repo-action="show-files">${codexRepositoryTabContent("files", "Files")}</button></span>
      ${currentStepId === "project" ? "" : `<span class="codex-repo-tab-controller"><button type="button" role="tab" id="codex-repo-tab-review" aria-controls="codex-repo-panel-review" data-codex-repo-tab="review" data-codex-repo-action="show-review">${codexRepositoryTabContent("review", "Review")}</button></span>`}${browserAvailable
      ? `<span class="codex-repo-tab-controller"><button type="button" role="tab" id="codex-repo-tab-browser" aria-controls="codex-repo-panel-browser" data-codex-repo-tab="browser" data-codex-repo-action="show-browser" title="Blossom Bank | Banking that sees the bigger picture">${codexRepositoryTabContent("browser", "Blossom Bank")}</button></span>`
      : ""}${planAvailable
      ? `<span class="codex-repo-tab-controller"><button type="button" role="tab" id="codex-repo-tab-plan" aria-controls="codex-repo-panel-plan" data-codex-repo-tab="plan" data-codex-repo-action="show-plan">${codexRepositoryTabContent("plan", "Plan")}</button></span>`
      : ""}</div>`;
  }

  const renderKey = JSON.stringify([
    state.repoSelectedPath,
    built,
    Array.from(state.repoExpandedFolders).sort(),
    typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace()?.revision : undefined,
  ]);
  let explorer = Array.from(pane.children).find((child) => child.dataset.codexRepoExplorer === "true");
  if (!explorer || explorer.dataset.codexRepoRenderKey !== renderKey) {
    const container = document.createElement("div");
    container.innerHTML = renderNativeRepositoryExplorer().trim();
    const replacement = container.firstElementChild;
    replacement.dataset.codexRepoRenderKey = renderKey;
    if (explorer) explorer.replaceWith(replacement);
    else pane.append(replacement);
    explorer = replacement;
  }

  let browser = Array.from(pane.children).find((child) => child.dataset.codexBrowserPanel === "true");
  if (browserAvailable && !browser) {
    browser = document.createElement("section");
    browser.dataset.codexBrowserPanel = "true";
    browser.id = "codex-repo-panel-browser";
    browser.setAttribute("role", "tabpanel");
    browser.setAttribute("aria-labelledby", "codex-repo-tab-browser");
    const browserPath = typeof codexWorkspaceBrowserPath === "function"
      ? codexWorkspaceBrowserPath()
      : "/training/codex-lab/demos/blossom-bank/index.html";
    const browserUrl = `${typeof location === "undefined" ? "" : location.origin}${browserPath}`;
    browser.innerHTML = `
      <div data-browser-sidebar-toolbar="true" class="flex h-full min-w-0 items-center gap-1 px-2 text-token-description-foreground">
        <div data-codex-browser-navigation="true" class="flex items-center gap-px">
          <button type="button" data-codex-browser-button="true" data-codex-repo-action="browser-back" aria-label="Back" title="Back" disabled><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.75 3.75-4.5 4.25 4.5 4.25"/></svg></button>
          <button type="button" data-codex-browser-button="true" data-codex-repo-action="browser-next" aria-label="Next" title="Next" disabled><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6.25 3.75 4.5 4.25-4.5 4.25"/></svg></button>
          <button type="button" data-codex-browser-button="true" data-codex-repo-action="browser-reload" aria-label="Reload page" title="Reload page"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 7.9A5 5 0 1 1 11.5 4.4"/><path d="M11.5 2v2.5H9"/></svg></button>
        </div>
        <div data-codex-browser-address="true" class="group/address-bar flex h-[28px] min-w-0 w-full items-center overflow-hidden rounded-[10px]"><input data-browser-sidebar-address-input="true" aria-label="Enter a URL" placeholder="Enter a URL" value="${browserUrl}" dir="ltr"></div>
      </div>
      <div data-codex-browser-viewport="true"></div>`;
    pane.append(browser);
  } else if (!browserAvailable && browser) {
    browser.__codexBrowserPortal?.cleanup();
    browser.remove();
    browser = null;
  }
  if (browser) {
  }
  let plan = Array.from(pane.children).find((child) => child.dataset.codexPlanPanel === "true");
  if (planAvailable && !plan && typeof renderCodexPlanPanel === "function") {
    const container = document.createElement("div");
    container.innerHTML = renderCodexPlanPanel().trim();
    plan = container.firstElementChild;
    if (plan) {
      plan.id = "codex-repo-panel-plan";
      plan.setAttribute("aria-labelledby", "codex-repo-tab-plan");
      pane.append(plan);
    }
  } else if (!planAvailable && plan) {
    plan.remove();
    plan = null;
  }

  const selectedTab = state.repoPaneTab === "plan" && planAvailable && plan
    ? "plan"
    : state.repoPaneTab === "review"
    ? "review"
    : state.repoPaneTab === "browser" && browserAvailable
    ? "browser"
    : "files";
  state.repoPaneTab = selectedTab;
  pane.dataset.codexRepoActiveTab = selectedTab;
  nativePanel.hidden = selectedTab !== "review";
  explorer.hidden = selectedTab !== "files";
  if (browser) browser.hidden = selectedTab !== "browser";
  if (plan) plan.hidden = selectedTab !== "plan";
  if (browser && typeof syncNativeBrowserPortal === "function") syncNativeBrowserPortal(shadow, browser);
  for (const tab of tabs.querySelectorAll("[data-codex-repo-tab]")) {
    const selected = tab.dataset.codexRepoTab === selectedTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  if (typeof syncRepositoryTabLabelOverflow === "function") syncRepositoryTabLabelOverflow(tabs, true);
  if (typeof syncRepositoryTabLabelOverflow === "function"
    && typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => syncRepositoryTabLabelOverflow(tabs, true));
  }

  if (selectedTab === "review" && typeof syncNativeDiffComments === "function") {
    syncNativeDiffComments(shadow);
  }
}

function reviewCommentLocation(line, side, startLine, startSide) {
  const endSideLabel = side === "old" ? "L" : "R";
  const end = `${endSideLabel}${line}`;
  if (!Number.isSafeInteger(startLine) || startLine < 1 || !["new", "old"].includes(startSide)) {
    return `Comment on line ${end}`;
  }
  const startSideLabel = startSide === "old" ? "L" : "R";
  const start = `${startSideLabel}${startLine}`;
  if (start === end) return `Comment on line ${end}`;
  if (startSide === side) {
    const first = Math.min(startLine, line);
    const last = Math.max(startLine, line);
    return `Comment on lines ${endSideLabel}${first} to ${endSideLabel}${last}`;
  }
  return `Comment on lines ${start} to ${end}`;
}

function renderNativeDiffCommentComposer(path, line, side, startLine, startSide) {
  const lineKey = `${path}:${side}:${line}`;
  const sideLabel = side === "old" ? "L" : "R";
  const location = `${sideLabel}${line}`;
  const locationLabel = typeof reviewCommentLocation === "function"
    ? reviewCommentLocation(line, side, startLine, startSide)
    : `Comment on line ${location}`;
  const rangeAttributes = Number.isSafeInteger(startLine) && startLine > 0
    && ["new", "old"].includes(startSide)
    ? ` data-start-line="${startLine}" data-start-side="${escapeHtml(startSide)}"`
    : "";
  return `
    <section class="codex-review-comment-composer" data-codex-review-composer="${escapeHtml(lineKey)}" aria-label="${escapeHtml(locationLabel)}">
      <div class="codex-review-comment-surface">
        <div class="codex-review-comment-heading">
          <span class="codex-review-comment-identity"><span class="codex-review-comment-avatar" aria-hidden="true"><svg viewBox="0 0 500 500" fill="currentColor"><path d="M330.34 313.62H262.5c-7.65 0-13.85-6.2-13.85-13.85s6.2-13.85 13.85-13.85h67.84c7.65 0 13.85 6.2 13.85 13.85s-6.2 13.85-13.85 13.85Z"/><path d="M169.65 313.38c-2.36 0-4.74-.6-6.93-1.87-6.62-3.83-8.88-12.31-5.05-18.93l23.78-41.08-23.91-43.21c-3.7-6.69-1.28-15.12 5.41-18.82 6.69-3.71 15.12-1.28 18.82 5.41l31.51 56.94-31.64 54.65c-2.57 4.43-7.22 6.91-12 6.91Z"/><path d="M144.61 144.5c1.42-41.82 35.79-75.27 77.95-75.25 27.89.02 52.35 14.68 66.11 36.71 10.93-5.82 23.41-9.12 36.65-9.11 43.05.02 77.94 34.94 77.91 78 0 13.24-3.32 25.72-9.16 36.64 22.02 13.79 36.66 38.26 36.64 66.15-.02 42.16-33.52 76.48-75.34 77.86-1.42 41.82-35.78 75.28-77.94 75.25-27.89-.02-52.35-14.68-66.11-36.72-10.93 5.82-23.4 9.13-36.65 9.12-43.05-.02-77.94-34.94-77.91-78 0-13.24 3.32-25.72 9.16-36.64-22.02-13.79-36.65-38.26-36.64-66.15.02-42.16 33.51-76.48 75.33-77.86Zm153.16-72.51c-19.24-19.26-45.83-31.17-75.2-31.19-49.23-.03-90.67 33.39-102.84 78.79-45.41 12.12-78.87 53.52-78.9 102.76-.02 29.37 11.87 55.97 31.1 75.23-2.35 8.79-3.62 18.03-3.63 27.56-.03 58.77 47.58 106.44 106.35 106.47 9.53 0 18.77-1.25 27.55-3.6 19.24 19.26 45.84 31.18 75.21 31.2 49.24.03 90.67-33.39 102.84-78.8 45.42-12.11 78.88-53.51 78.91-102.75.02-29.37-11.87-55.98-31.11-75.24 2.35-8.78 3.62-18.02 3.63-27.55.03-58.77-47.58-106.44-106.35-106.47-9.53 0-18.77 1.25-27.56 3.59Z"/></svg></span><span>Local comment</span></span>
          <span class="codex-review-comment-accessory">${escapeHtml(locationLabel)}</span>
        </div>
        <textarea class="codex-review-comment-input" data-codex-review-input="true" placeholder="Request change" rows="3" aria-label="Request change"></textarea>
        <div class="codex-review-comment-actions">
          ${isHomepageReviewLocation({ path, line, side, startLine, startSide }) ? '<button class="codex-review-comment-cancel" type="button" data-action="use-required-review-comment" data-codex-review-action="use-required-comment">Use required comment</button>' : ""}
          <button class="codex-review-comment-cancel" type="button" data-action="cancel-review-comment" data-codex-review-action="cancel-comment">Cancel</button>
          <button class="codex-review-comment-submit" type="button" data-action="submit-review-comment" data-codex-review-action="submit-comment" data-path="${escapeHtml(path)}" data-line="${line}" data-side="${escapeHtml(side)}"${rangeAttributes} disabled>Comment</button>
        </div>
      </div>
    </section>`;
}

function renderNativeDiffCommentThread(comments) {
  return `<div class="codex-review-comment-card">${comments.map((comment) => `
    <article class="codex-review-comment-entry" data-comment-id="${escapeHtml(comment.id)}" data-diff-comment-role="card">
      <div class="codex-review-comment-author"><span class="codex-review-comment-identity"><span class="codex-review-comment-avatar" aria-hidden="true"><svg viewBox="0 0 500 500" fill="currentColor"><path d="M330.34 313.62H262.5c-7.65 0-13.85-6.2-13.85-13.85s6.2-13.85 13.85-13.85h67.84c7.65 0 13.85 6.2 13.85 13.85s-6.2 13.85-13.85 13.85Z"/><path d="M169.65 313.38c-2.36 0-4.74-.6-6.93-1.87-6.62-3.83-8.88-12.31-5.05-18.93l23.78-41.08-23.91-43.21c-3.7-6.69-1.28-15.12 5.41-18.82 6.69-3.71 15.12-1.28 18.82 5.41l31.51 56.94-31.64 54.65c-2.57 4.43-7.22 6.91-12 6.91Z"/><path d="M144.61 144.5c1.42-41.82 35.79-75.27 77.95-75.25 27.89.02 52.35 14.68 66.11 36.71 10.93-5.82 23.41-9.12 36.65-9.11 43.05.02 77.94 34.94 77.91 78 0 13.24-3.32 25.72-9.16 36.64 22.02 13.79 36.66 38.26 36.64 66.15-.02 42.16-33.52 76.48-75.34 77.86-1.42 41.82-35.78 75.28-77.94 75.25-27.89-.02-52.35-14.68-66.11-36.72-10.93 5.82-23.4 9.13-36.65 9.12-43.05-.02-77.94-34.94-77.91-78 0-13.24 3.32-25.72 9.16-36.64-22.02-13.79-36.65-38.26-36.64-66.15.02-42.16 33.51-76.48 75.33-77.86Zm153.16-72.51c-19.24-19.26-45.83-31.17-75.2-31.19-49.23-.03-90.67 33.39-102.84 78.79-45.41 12.12-78.87 53.52-78.9 102.76-.02 29.37 11.87 55.97 31.1 75.23-2.35 8.79-3.62 18.03-3.63 27.56-.03 58.77 47.58 106.44 106.35 106.47 9.53 0 18.77-1.25 27.55-3.6 19.24 19.26 45.84 31.18 75.21 31.2 49.24.03 90.67-33.39 102.84-78.8 45.42-12.11 78.88-53.51 78.91-102.75.02-29.37-11.87-55.98-31.11-75.24 2.35-8.78 3.62-18.02 3.63-27.55.03-58.77-47.58-106.44-106.35-106.47-9.53 0-18.77 1.25-27.56 3.59Z"/></svg></span><span>Local comment</span></span><span class="codex-review-comment-accessory">Comment on line ${comment.side === "old" ? "L" : "R"}${comment.line}</span></div>
      <div class="codex-review-comment-body">${escapeHtml(comment.text)}</div>
    </article>`).join("")}</div>`;
}

function reviewCommentSnapshot(comment) {
  if (!comment || typeof comment !== "object"
    || typeof comment.id !== "string" || !comment.id
    || typeof comment.path !== "string" || !comment.path || comment.path.length > 512
    || !Number.isSafeInteger(comment.line) || comment.line < 1
    || !["new", "old"].includes(comment.side)
    || typeof comment.text !== "string" || !comment.text.trim()
    || comment.text.trim().length > 2_000) return null;
  return {
    id: comment.id,
    path: comment.path,
    line: comment.line,
    side: comment.side,
    text: comment.text.trim(),
    stepId: typeof comment.stepId === "string" ? comment.stepId : "review",
    createdAt: typeof comment.createdAt === "string" ? comment.createdAt : "",
    ...(typeof comment.sessionId === "string" && comment.sessionId
      ? { sessionId: comment.sessionId }
      : {}),
    ...(Number.isSafeInteger(comment.revision) && comment.revision >= 0
      ? { revision: comment.revision }
      : {}),
    ...(Number.isSafeInteger(comment.startLine) && comment.startLine > 0
      ? { startLine: comment.startLine }
      : {}),
    ...(["new", "old"].includes(comment.startSide) ? { startSide: comment.startSide } : {}),
    ...(typeof comment.diffHunk === "string"
      && comment.diffHunk.startsWith("@@ ")
      && comment.diffHunk.length <= 16_000
      ? { diffHunk: comment.diffHunk }
      : {}),
  };
}

function renderReviewCommentsAttachment(comments, options = {}) {
  const snapshots = Array.isArray(comments)
    ? comments.slice(0, 16).map(reviewCommentSnapshot).filter(Boolean)
    : [];
  if (!snapshots.length) return "";
  const sent = options.sent === true;
  const attachmentId = typeof options.id === "string" && options.id
    ? options.id.replace(/[^a-zA-Z0-9_-]/g, "-")
    : sent ? "sent" : "pending";
  const open = state.reviewCommentsAttachmentOpen === attachmentId;
  const countLabel = `${snapshots.length} ${snapshots.length === 1 ? "comment" : "comments"}`;
  const popoverId = `codex-review-comments-popover-${attachmentId}`;
  const commentIcon = `<svg viewBox="0 0 21 21" fill="none" aria-hidden="true"><path fill="currentColor" d="M17.2379 7.69907C17.2379 6.95248 17.237 6.43448 17.2041 6.03179C17.1799 5.73568 17.1402 5.53676 17.0862 5.38579L17.0277 5.24941C16.866 4.93211 16.6201 4.66653 16.3181 4.4814L16.1859 4.40757C16.02 4.32306 15.7978 4.26345 15.4035 4.2312C15.0009 4.19831 14.4826 4.19736 13.7362 4.19736H7.26086C6.51427 4.19736 5.99627 4.1983 5.59357 4.2312C5.29763 4.25539 5.09852 4.29409 4.94758 4.3481L4.8112 4.40757C4.49383 4.56929 4.22831 4.81512 4.04318 5.11714L3.96936 5.24941C3.88482 5.41532 3.82523 5.6373 3.79299 6.03179C3.76009 6.43448 3.75915 6.95248 3.75915 7.69907V12.8732C3.75915 13.548 3.76318 13.7789 3.80017 13.956L3.834 14.0944C4.03021 14.777 4.58934 15.3012 5.29211 15.448L5.44079 15.4695C5.61188 15.4861 5.86792 15.4879 6.3739 15.4879C6.58107 15.4879 6.7238 15.4877 6.86506 15.4992L7.05373 15.5197C7.49382 15.5811 7.91814 15.7309 8.30061 15.9596L8.48518 16.0796C8.55028 16.1245 8.62134 16.1752 8.70564 16.2355L10.0909 17.225L10.3996 17.4382C10.4603 17.4756 10.4695 17.4737 10.455 17.47L10.498 17.4751C10.5127 17.4752 10.5278 17.4737 10.5421 17.47L10.5965 17.4382C10.6645 17.3964 10.7522 17.3349 10.9061 17.225L12.2914 16.2355L12.5109 16.0796C12.576 16.0346 12.6356 15.996 12.6965 15.9596L12.8626 15.8663C13.2563 15.6605 13.6879 15.5354 14.132 15.4992L14.3525 15.49C14.4315 15.4887 14.5187 15.4879 14.6221 15.4879C15.2969 15.4879 15.5279 15.4849 15.705 15.448L15.8434 15.4131C16.5259 15.217 17.05 14.6586 17.1969 13.956L17.2184 13.8063C17.2351 13.6352 17.2379 13.379 17.2379 12.8732V7.69907ZM10.6785 10.6758C11.0641 10.6758 11.3768 10.9884 11.3768 11.3741C11.3768 11.7597 11.0641 12.0724 10.6785 12.0724H7.69665C7.31102 12.0724 6.99836 11.7597 6.99836 11.3741C6.99836 10.9884 7.31102 10.6758 7.69665 10.6758H10.6785ZM13.3035 7.17612L13.444 7.19048C13.7623 7.2555 14.0018 7.5369 14.0018 7.87442C14.0016 8.21182 13.7622 8.49341 13.444 8.55835L13.3035 8.57271H7.69665C7.31113 8.57271 6.99854 8.25989 6.99836 7.87442C6.99836 7.48878 7.31102 7.17612 7.69665 7.17612H13.3035ZM18.6345 12.8732C18.6345 13.3267 18.6359 13.6704 18.6058 13.9632L18.5637 14.2411C18.3105 15.4535 17.4066 16.4171 16.2289 16.7553L15.99 16.8148C15.6362 16.8886 15.2264 16.8845 14.6221 16.8845L14.2458 16.8917C14.0252 16.9097 13.8098 16.9651 13.6091 17.0558L13.4132 17.1583L13.1025 17.3716L11.7182 18.3611C11.5042 18.5141 11.2697 18.6916 11.0015 18.7876L10.8846 18.8235C10.6945 18.8717 10.4977 18.8845 10.3042 18.8605L10.1125 18.8235C9.87394 18.7631 9.66181 18.6313 9.4675 18.4954L9.27883 18.3611L7.89353 17.3716L7.58386 17.1583C7.39381 17.0447 7.18578 16.9643 6.96965 16.9214L6.75124 16.8917C6.67965 16.8859 6.60316 16.8845 6.3739 16.8845C5.92038 16.8845 5.57673 16.887 5.28391 16.8568L5.00603 16.8148C3.79382 16.5615 2.82999 15.6574 2.49177 14.48L2.43332 14.2411C2.3594 13.8871 2.36257 13.4777 2.36257 12.8732V7.69907C2.36257 6.97553 2.36188 6.39072 2.40051 5.91797C2.43979 5.43729 2.52314 5.01117 2.72453 4.61572L2.85271 4.38604C3.172 3.86554 3.63042 3.4415 4.17751 3.16274L4.32722 3.09302C4.68032 2.94157 5.05908 2.8731 5.47976 2.83872C5.95251 2.8001 6.53731 2.80078 7.26086 2.80078H13.7362C14.4596 2.80078 15.0446 2.8001 15.5173 2.83872C15.998 2.87802 16.4241 2.9613 16.8196 3.16274L17.0482 3.29092C17.5689 3.61023 17.9927 4.06846 18.2715 4.61572L18.3423 4.76543C18.4937 5.11849 18.5612 5.49736 18.5955 5.91797C18.6342 6.39072 18.6345 6.97553 18.6345 7.69907V12.8732Z"/></svg>`;
  return `
    <div class="codex-review-comments-attachment codex-review-comments-attachment--${sent ? "sent" : "pending"}"
      ${sent ? 'data-codex-review-comments-sent="true"' : 'data-codex-review-comments-attachment="true"'}
      data-codex-review-comments-id="${escapeHtml(attachmentId)}" data-open="${open}">
      <button class="codex-review-comments-pill" type="button" data-action="toggle-review-comments-attachment"
        data-codex-review-comments-action="toggle-attachment" data-codex-review-comments-trigger="true"
        data-composer-attachment-pill="true" data-state="${open ? "open" : "closed"}"
        aria-haspopup="dialog" aria-expanded="${open}" aria-controls="${escapeHtml(popoverId)}">
        ${commentIcon}
        <span data-codex-review-comments-count="true">${escapeHtml(countLabel)}</span>
        ${sent ? "" : '<div class="codex-review-comments-remove" role="button" tabindex="0" data-action="remove-review-comments-attachment" data-codex-review-comments-action="remove-attachment" data-codex-review-comments-remove="true" aria-label="Remove comments attachment"><span class="codex-review-comments-remove-circle"><svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true"><path fill="currentColor" d="M14.6549 5.57307C14.9283 5.2997 15.3718 5.2997 15.6451 5.57307C15.9185 5.84643 15.9185 6.28993 15.6451 6.5633L11.3903 10.8182L15.6451 15.0731L15.735 15.1834C15.9141 15.4551 15.8842 15.8242 15.6451 16.0633C15.4061 16.3024 15.0369 16.3322 14.7653 16.1531L14.6549 16.0633L10.4 11.8084L6.14515 16.0633C5.87178 16.3367 5.42828 16.3367 5.15492 16.0633C4.88155 15.7899 4.88155 15.3464 5.15492 15.0731L9.4098 10.8182L5.15492 6.5633L5.06507 6.45295C4.88597 6.18128 4.91584 5.81214 5.15492 5.57307C5.39399 5.33399 5.76313 5.30413 6.0348 5.48322L6.14515 5.57307L10.4 9.82795L14.6549 5.57307Z"/></svg></span></div>'}
      </button>
      <div class="codex-review-comments-popover" id="${escapeHtml(popoverId)}" data-codex-review-comments-popover="true" role="dialog" data-state="${open ? "open" : "closed"}" aria-hidden="${!open}">
        <div class="codex-review-comments-popover-list">${snapshots.map((comment) => {
          const side = comment.side === "old" ? "L" : "R";
          const startSide = comment.startSide === "old" ? "L" : comment.startSide === "new" ? "R" : side;
          const lineRange = Number.isSafeInteger(comment.startLine) && comment.startLine > 0
            ? startSide === side
              ? Math.min(comment.startLine, comment.line) === Math.max(comment.startLine, comment.line)
                ? String(comment.line)
                : `${Math.min(comment.startLine, comment.line)}-${Math.max(comment.startLine, comment.line)}`
              : `${startSide}${comment.startLine}-${side}${comment.line}`
            : String(comment.line);
          return `<article class="codex-review-comments-popover-item">
            <div class="codex-review-comments-popover-location"><span class="codex-review-comments-popover-path">${escapeHtml(comment.path)}</span><span class="codex-review-comments-popover-side">${side}</span><span class="codex-review-comments-popover-range">${escapeHtml(lineRange)}</span></div>
            <p>${escapeHtml(comment.text)}</p>
            ${sent ? "" : `<button class="codex-review-comment-cancel" type="button" data-action="remove-review-comment" data-codex-review-comments-action="remove-comment" data-comment-id="${escapeHtml(comment.id)}">Remove comment</button>`}
          </article>`;
        }).join("")}</div>
      </div>
    </div>`;
}

function useRequiredReviewComment(control) {
  const input = control?.closest?.("[data-codex-review-composer]")?.querySelector?.('[data-codex-review-input="true"]');
  if (!input) return false;
  input.value = REQUIRED_HOMEPAGE_REVIEW_COMMENT;
  input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  input.focus();
  return true;
}

function usePracticeReviewComment() {
  const step = STEPS[state.currentIndex];
  if (step?.id !== "build" || state.isRunning || isComplete("build")
    || practiceTaskCount(step) < 2 || homepageHeadingPhase(verifiedCodexWorkspace()) !== "first") return false;

  const { path, line, side } = HOMEPAGE_REVIEW_LOCATION;
  state.repositoryPaneOpen = true;
  state.inspectorOpen = true;
  state.environmentOpen = false;
  state.repoPaneTab = "review";
  state.activeTab = "diff";
  state.repoSelectedPath = path;
  state.selectedDiff = path;
  state.mobileView = "workspace";
  state.reviewSelection = { path, line, side, startLine: line, startSide: side };
  state.activeDiffComment = { path, line, side };
  const shadow = nativeCodexShadow();
  if (shadow) syncNativeRepositoryPane(shadow);
  else refreshCurrentLab();

  const composer = (shadow || app).querySelector(`[data-codex-review-composer="${path}:${side}:${line}"]`);
  if (!composer) return false;
  composer.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  // Fill only. The learner still chooses Comment and then Send.
  return useRequiredReviewComment(composer);
}

function removePendingDiffComment(id) {
  if (!state.diffComments?.some((comment) => comment.id === id)) return false;
  state.diffComments = state.diffComments.filter((comment) => comment.id !== id);
  if (!isComplete("build") && (state.taskProgress?.build || 0) >= 2) {
    const workspace = verifiedCodexWorkspace();
    state.taskProgress.build = state.diffComments.some((comment) => isRequiredHomepageReviewComment(comment, workspace)) ? 3 : 2;
    state.expandedPracticeTask = null;
  }
  state.validationMessage = "";
  if (!state.diffComments.length) state.reviewCommentsAttachmentOpen = false;
  saveState();
  refreshCurrentLab();
  return true;
}

function removePendingDiffCommentAttachments() {
  if (!Array.isArray(state.diffComments) || state.diffComments.length === 0) return false;
  state.diffComments = [];
  state.activeDiffComment = null;
  state.reviewCommentsAttachmentOpen = false;
  if (!isComplete("build") && (state.taskProgress?.build || 0) >= 3) {
    state.taskProgress.build = 2;
    state.expandedPracticeTask = null;
  }
  saveState();
  refreshCurrentLab();
  return true;
}

function toggleReviewCommentsAttachment(id) {
  if (typeof id !== "string" || !id) return false;
  if (typeof reviewCommentsAttachmentCloseTimer !== "undefined" && reviewCommentsAttachmentCloseTimer !== null) {
    window.clearTimeout(reviewCommentsAttachmentCloseTimer);
    reviewCommentsAttachmentCloseTimer = null;
  }
  state.reviewCommentsAttachmentOpen = state.reviewCommentsAttachmentOpen === id ? false : id;
  return true;
}

function setReviewCommentsAttachmentDomOpen(attachment, open) {
  if (!attachment?.dataset?.codexReviewCommentsId) return false;
  const isOpen = open === true;
  const id = attachment.dataset.codexReviewCommentsId;
  if (isOpen) {
    const root = attachment.getRootNode?.();
    for (const other of root?.querySelectorAll?.('[data-codex-review-comments-id][data-open="true"]') || []) {
      if (other !== attachment) setReviewCommentsAttachmentDomOpen(other, false);
    }
  }
  state.reviewCommentsAttachmentOpen = isOpen
    ? id
    : state.reviewCommentsAttachmentOpen === id ? false : state.reviewCommentsAttachmentOpen;
  attachment.dataset.open = String(isOpen);
  const trigger = attachment.querySelector?.("[data-codex-review-comments-trigger]");
  if (trigger) {
    trigger.dataset.state = isOpen ? "open" : "closed";
    trigger.setAttribute("aria-expanded", String(isOpen));
  }
  const popover = attachment.querySelector?.("[data-codex-review-comments-popover]");
  if (popover) {
    popover.dataset.state = isOpen ? "open" : "closed";
    popover.setAttribute("aria-hidden", String(!isOpen));
  }
  const rail = attachment.closest?.("[data-codex-review-comments-rail]");
  if (rail) rail.dataset.codexReviewCommentsOpen = String(isOpen);
  return true;
}

function handleReviewCommentsAttachmentMouseover(event) {
  const attachment = event.target.closest?.("[data-codex-review-comments-id]");
  if (!attachment || attachment.contains?.(event.relatedTarget)) return;
  if (reviewCommentsAttachmentCloseTimer !== null) {
    window.clearTimeout(reviewCommentsAttachmentCloseTimer);
    reviewCommentsAttachmentCloseTimer = null;
  }
  setReviewCommentsAttachmentDomOpen(attachment, true);
}

function handleReviewCommentsAttachmentMouseout(event) {
  const attachment = event.target.closest?.("[data-codex-review-comments-id]");
  if (!attachment || attachment.contains?.(event.relatedTarget)) return;
  const attachmentId = attachment.dataset.codexReviewCommentsId;
  if (reviewCommentsAttachmentCloseTimer !== null) {
    window.clearTimeout(reviewCommentsAttachmentCloseTimer);
  }
  reviewCommentsAttachmentCloseTimer = window.setTimeout(() => {
    reviewCommentsAttachmentCloseTimer = null;
    if (state.reviewCommentsAttachmentOpen !== attachmentId) return;
    setReviewCommentsAttachmentDomOpen(attachment, false);
  }, 100);
}

function reviewSelectionEntry(control) {
  const dataset = control?.dataset;
  const path = dataset?.codexReviewPath || dataset?.path;
  const line = Number(dataset?.codexReviewLine || dataset?.line);
  const side = dataset?.codexReviewSide || dataset?.side;
  if (typeof path !== "string" || !path || !Number.isSafeInteger(line) || line < 1
    || !["new", "old"].includes(side)) return null;
  return { path, line, side };
}

function normalizeReviewSelection(selection) {
  if (!selection || typeof selection.path !== "string" || !selection.path
    || !Number.isSafeInteger(selection.startLine) || selection.startLine < 1
    || !Number.isSafeInteger(selection.line) || selection.line < 1
    || !["new", "old"].includes(selection.startSide)
    || !["new", "old"].includes(selection.side)) return null;
  if (typeof parseReviewDiffRows === "function") {
    const rows = parseReviewDiffRows(selection.path);
    const indexFor = (line, side) => rows.findIndex((row) => row.line === line && row.side === side);
    const anchorIndex = indexFor(selection.startLine, selection.startSide);
    const focusIndex = indexFor(selection.line, selection.side);
    if (anchorIndex < 0 || focusIndex < 0) return null;
    const firstIndex = Math.min(anchorIndex, focusIndex);
    const lastIndex = Math.max(anchorIndex, focusIndex);
    const first = rows[firstIndex];
    const last = rows[lastIndex];
    return {
      path: selection.path,
      startLine: first.line,
      startSide: first.side,
      line: last.line,
      side: last.side,
      firstIndex,
      lastIndex,
    };
  }
  if (selection.startSide !== selection.side) return null;
  return {
    path: selection.path,
    startLine: Math.min(selection.startLine, selection.line),
    startSide: selection.side,
    line: Math.max(selection.startLine, selection.line),
    side: selection.side,
  };
}

function reviewSelectionContains(selection, entry) {
  if (!selection || !entry || selection.path !== entry.path) return false;
  const normalized = normalizeReviewSelection(selection);
  if (!normalized) return false;
  if (Number.isSafeInteger(normalized.firstIndex) && typeof parseReviewDiffRows === "function") {
    const rows = parseReviewDiffRows(selection.path);
    const indexFor = (line, side) => rows.findIndex((row) => row.line === line && row.side === side);
    const current = indexFor(entry.line, entry.side);
    return current >= normalized.firstIndex && current <= normalized.lastIndex;
  }
  return entry.side === normalized.side
    && entry.line >= normalized.startLine && entry.line <= normalized.line;
}

function selectReviewLine(entry, options = {}) {
  if (!entry) return false;
  const current = state.reviewSelection;
  if (options.extend === true && current?.path === entry.path) {
    state.reviewSelection = {
      path: current.path,
      startLine: current.startLine,
      startSide: current.startSide,
      line: entry.line,
      side: entry.side,
    };
    return true;
  }
  const sameSingleton = current?.path === entry.path
    && current.startLine === current.line && current.startSide === current.side
    && current.line === entry.line && current.side === entry.side;
  if (options.toggle !== false && sameSingleton) {
    state.reviewSelection = null;
    return true;
  }
  state.reviewSelection = {
    path: entry.path,
    startLine: entry.line,
    startSide: entry.side,
    line: entry.line,
    side: entry.side,
  };
  return true;
}

function syncReviewSelectionDom(root) {
  const rows = Array.from(root?.querySelectorAll?.("[data-codex-review-line][data-codex-review-path]") || [])
    .filter((row) => row.dataset?.codexReviewSelectLine !== "true");
  const selectedRows = [];
  for (const row of rows) {
    const entry = reviewSelectionEntry(row);
    const selected = reviewSelectionContains(state.reviewSelection, entry);
    row.dataset.codexReviewSelected = String(selected);
    delete row.dataset.codexReviewSelectionBottom;
    if (selected) selectedRows.push(row);
  }
  const bottom = selectedRows.at(-1);
  if (bottom?.dataset) bottom.dataset.codexReviewSelectionBottom = "true";
  return selectedRows.length;
}

function handleReviewSelectionPointerDown(event) {
  if (event?.button !== 0) return false;
  if (event.target?.closest?.('[data-codex-review-action="open-comment"], [data-action="open-review-comment"]')) {
    return false;
  }
  const control = event.target?.closest?.("[data-codex-review-select-line]");
  const entry = reviewSelectionEntry(control);
  if (!entry) return false;
  const extending = event.shiftKey === true && state.reviewSelection?.path === entry.path;
  selectReviewLine(entry, { extend: extending, toggle: !extending });
  state.reviewSelectionDrag = state.reviewSelection ? {
    pointerId: event.pointerId,
    path: state.reviewSelection.path,
    startLine: state.reviewSelection.startLine,
    startSide: state.reviewSelection.startSide,
  } : null;
  event.preventDefault?.();
  if (typeof syncReviewSelectionDom === "function") {
    syncReviewSelectionDom(control?.getRootNode?.() || event.currentTarget);
  }
  return true;
}

function handleReviewSelectionPointerMove(event) {
  const drag = state.reviewSelectionDrag;
  if (!drag || event?.buttons !== 1 || (drag.pointerId != null && event.pointerId !== drag.pointerId)) return false;
  let control = event.target?.closest?.("[data-codex-review-select-line]");
  if (!control && typeof document?.elementFromPoint === "function") {
    control = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-codex-review-select-line]");
  }
  const entry = reviewSelectionEntry(control);
  if (!entry || entry.path !== drag.path) return false;
  state.reviewSelection = {
    path: drag.path,
    startLine: drag.startLine,
    startSide: drag.startSide,
    line: entry.line,
    side: entry.side,
  };
  event.preventDefault?.();
  if (typeof syncReviewSelectionDom === "function") {
    syncReviewSelectionDom(control?.getRootNode?.() || event.currentTarget);
  }
  return true;
}

function handleReviewSelectionPointerUp() {
  if (!state.reviewSelectionDrag) return false;
  state.reviewSelectionDrag = null;
  return true;
}

function openReviewCommentSelection(control) {
  const entry = reviewSelectionEntry(control);
  if (!entry) return false;
  let selection = state.reviewSelection;
  if (!reviewSelectionContains(selection, entry)) {
    selectReviewLine(entry, { toggle: false });
    selection = state.reviewSelection;
  }
  const normalized = normalizeReviewSelection(selection);
  if (!normalized) return false;
  const singleton = normalized.startLine === normalized.line && normalized.startSide === normalized.side;
  state.activeDiffComment = {
    path: entry.path,
    line: normalized.line,
    side: normalized.side,
    ...(!singleton ? { startLine: normalized.startLine, startSide: normalized.startSide } : {}),
  };
  return true;
}

function submitReviewCommentSelection(control) {
  const composer = control?.closest?.("[data-codex-review-composer]");
  const text = composer?.querySelector?.("textarea")?.value || "";
  const startLine = Number(control?.dataset?.startLine);
  const startSide = control?.dataset?.startSide;
  return submitNativeDiffComment(
    control?.dataset?.path,
    Number(control?.dataset?.line),
    text,
    control?.dataset?.side,
    Number.isSafeInteger(startLine) && startLine > 0 ? startLine : undefined,
    ["new", "old"].includes(startSide) ? startSide : undefined,
  );
}

function syncNativeReviewLineGutter(gutter, entry) {
  if (!gutter?.dataset || !entry || !Number.isSafeInteger(entry.line)
    || entry.line < 1 || !["new", "old"].includes(entry.side)) return false;
  const expected = String(entry.line);
  const children = Array.from(gutter.children || []);
  const owned = children.find((child) => child.dataset?.codexReviewNumberOwned === "true");
  const nativeNumber = children.find((child) => child !== owned
    && child.dataset?.codexReviewAction !== "open-comment"
    && child.textContent?.trim() === expected);
  let number = nativeNumber || owned;
  if (nativeNumber) {
    owned?.remove?.();
    delete gutter.dataset.codexReviewAugmentedNumber;
  } else {
    if (!number) {
      number = document.createElement("span");
      number.dataset.codexReviewNumberOwned = "true";
      const trigger = gutter.querySelector?.('[data-codex-review-action="open-comment"]');
      gutter.insertBefore(number, trigger || null);
    }
    number.textContent = expected;
    gutter.dataset.codexReviewAugmentedNumber = "true";
  }
  for (const child of Array.from(gutter.children || [])) {
    if (child === number) continue;
    const nativeMarker = child.dataset?.codexReviewAction !== "open-comment"
      && /^[+\-−]$/.test(child.textContent?.trim() || "");
    if (nativeMarker) {
      child.hidden = false;
      child.dataset.codexReviewMarker = "true";
    }
    if (child.dataset) {
      delete child.dataset.codexReviewVisibleLine;
      delete child.dataset.codexReviewVisibleSide;
    }
    child.classList?.remove?.("codex-review-visible-line");
  }
  number.classList?.add?.("codex-review-visible-line");
  number.dataset.codexReviewVisibleLine = expected;
  number.dataset.codexReviewVisibleSide = entry.side;
  gutter.dataset.codexReviewGutter = "true";
  return true;
}

function nativeReviewRenderedRows(card) {
  return Array.from(card?.querySelectorAll?.('[class*="whitespace-pre"]') || [])
    .filter((row) => row.dataset?.codexReviewHunk !== "true"
      && !row.textContent?.trim().startsWith("@@"));
}

function syncNativeDiffComments(shadow = nativeCodexShadow()) {
  if (!shadow) return false;
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const step = typeof STEPS !== "undefined" ? STEPS[state.currentIndex] : null;
  const progress = step?.id === "build" && typeof practiceTaskCount === "function"
    ? practiceTaskCount(step)
    : 0;
  const activeBuildReview = step?.id === "build"
    && state.phase === "practice"
    && !isComplete("build")
    && progress >= 1 && progress <= 3
    && workspace?.changed === true
    && typeof homepageHeadingPhase === "function"
    && homepageHeadingPhase(workspace) === "first";
  if (!isComplete("build") && !activeBuildReview) return false;

  const cards = Array.from(shadow.querySelectorAll?.("[data-codex-mini-file-name]") || []);
  for (const card of cards) {
    const path = card.dataset.codexMiniFileName;
    if (workspace ? !workspace.changedFiles.some((file) => file.path === path && file.patch) : !DIFFS[path]) continue;

    const supportsEveryEligibleRow = typeof parseReviewDiffRows === "function";
    const changedLines = supportsEveryEligibleRow ? parseReviewDiffRows(path) : parseReviewDiffLines(path);
    const renderedRows = nativeReviewRenderedRows(card);
    const scroll = renderedRows[0]?.parentElement;
    if (scroll?.dataset) scroll.dataset.codexReviewScroll = "true";
    const changedRows = supportsEveryEligibleRow
      ? renderedRows
      : renderedRows.filter((row) => {
        const gutter = row.firstElementChild;
        const marker = (gutter?.firstChild?.textContent ?? gutter?.textContent ?? "").trim();
        return marker === "+" || marker === "-";
      });

    for (let index = 0; index < changedRows.length; index += 1) {
      const row = changedRows[index];
      const entry = changedLines[index];
      if (!entry) continue;

      const lineKey = `${path}:${entry.side}:${entry.line}`;
      row.dataset.codexReviewLine = String(entry.line);
      row.dataset.codexReviewPath = path;
      row.dataset.codexReviewSide = entry.side;
      row.dataset.codexReviewLineType = entry.lineType || (entry.side === "old" ? "change-deletion" : "change-addition");
      attachNativeReviewLineHover(row);

      const gutter = row.firstElementChild;
      if (!gutter) continue;
      gutter.dataset.codexReviewGutter = "true";
      gutter.dataset.codexReviewSelectLine = "true";
      gutter.dataset.codexReviewPath = path;
      gutter.dataset.codexReviewLine = String(entry.line);
      gutter.dataset.codexReviewSide = entry.side;
      const code = Array.from(row.children || []).find((child) => child !== gutter);
      if (code?.dataset) code.dataset.codexReviewCode = "true";
      let trigger = gutter.querySelector('[data-codex-review-action="open-comment"]');
      if (!trigger) {
        trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "codex-review-add-comment";
        trigger.dataset.codexReviewAction = "open-comment";
        trigger.dataset.utilityButton = "true";
        trigger.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7.46758 13.2V8.53201H2.79961C2.50579 8.53201 2.26758 8.29379 2.26758 7.99998C2.26758 7.70616 2.50579 7.46794 2.79961 7.46794H7.46758V2.79998C7.46758 2.50616 7.70579 2.26794 7.99961 2.26794C8.29342 2.26794 8.53164 2.50616 8.53164 2.79998V7.46794H13.1996L13.3066 7.47888C13.5491 7.52843 13.7316 7.74283 13.7316 7.99998C13.7316 8.25712 13.5491 8.47152 13.3066 8.52107L13.1996 8.53201H8.53164V13.2C8.53164 13.4938 8.29342 13.732 7.99961 13.732C7.70579 13.732 7.46758 13.4938 7.46758 13.2Z"/></svg>';
        gutter.append(trigger);
      }
      syncNativeReviewLineGutter(gutter, entry);
      const location = `${entry.side === "old" ? "L" : "R"}${entry.line}`;
      trigger.dataset.path = path;
      trigger.dataset.line = String(entry.line);
      trigger.dataset.side = entry.side;
      trigger.removeAttribute("aria-label");
      trigger.removeAttribute("title");

      const comments = (state.diffComments || []).filter((comment) =>
        comment.path === path && comment.line === entry.line && comment.side === entry.side);
      let thread = Array.from(row.parentElement.children).find((child) => child.dataset.codexReviewThread === lineKey);
      if (comments.length) {
        const threadKey = comments.map((comment) => `${comment.id}:${comment.text}`).join("|");
        if (!thread) {
          thread = document.createElement("section");
          thread.className = "codex-review-comment-thread";
          thread.dataset.codexReviewThread = lineKey;
          thread.setAttribute("aria-label", `Comments on line ${location}`);
          row.insertAdjacentElement("afterend", thread);
        }
        if (thread.dataset.codexReviewRenderKey !== threadKey) {
          thread.innerHTML = renderNativeDiffCommentThread(comments);
          thread.dataset.codexReviewRenderKey = threadKey;
        }
      } else if (thread) {
        thread.remove();
      }

      const active = state.activeDiffComment;
      const isActive = active?.path === path && active.line === entry.line && active.side === entry.side;
      let composer = Array.from(row.parentElement.children).find((child) => child.dataset.codexReviewComposer === lineKey);
      if (isActive && !composer) {
        const container = document.createElement("div");
        container.innerHTML = renderNativeDiffCommentComposer(
          path,
          entry.line,
          entry.side,
          active.startLine,
          active.startSide,
        ).trim();
        composer = container.firstElementChild;
        (thread || row).insertAdjacentElement("afterend", composer);
      } else if (!isActive && composer) {
        composer.remove();
      }
    }
    syncReviewSelectionDom(card);
  }
  if (typeof completeBuildReviewInspection === "function") {
    completeBuildReviewInspection(shadow);
  }
  return true;
}

function attachNativeReviewLineHover(row) {
  if (!row?.addEventListener || row.dataset.codexReviewHoverBound === "true") return false;
  row.dataset.codexReviewHoverBound = "true";
  row.addEventListener("pointerenter", () => {
    row.dataset.codexReviewHover = "true";
  });
  row.addEventListener("pointerleave", () => {
    delete row.dataset.codexReviewHover;
  });
  return true;
}

function completeBuildReviewInspection(reviewRoot = null) {
  const step = STEPS[state.currentIndex];
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const appChange = workspace?.changedFiles?.find((file) => file?.path === "src/App.tsx" && file.patch);
  const renderedAppHeading = !reviewRoot || reviewRoot.querySelector?.(
    '[data-codex-mini-file-name="src/App.tsx"] '
      + '[data-codex-review-path="src/App.tsx"][data-codex-review-line="353"][data-codex-review-side="new"]',
  );
  if (step?.id !== "build" || state.phase !== "practice" || isComplete("build")
    || practiceTaskCount(step) !== 1
    || state.repositoryPaneOpen !== true || state.repoPaneTab !== "review"
    || homepageHeadingPhase(workspace) !== "first" || !appChange || !renderedAppHeading) return false;
  return markPracticeTask("build", 2);
}

function submitNativeDiffComment(path, line, text, side = "new", startLine, startSide) {
  const body = typeof text === "string" ? text.trim() : "";
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const changedFile = workspace
    ? workspace.changedFiles.some((file) => file.path === path && file.patch)
    : typeof DIFFS === "object" && fallbackReviewDiffs()[path];
  const step = STEPS[state.currentIndex];
  const buildInProgress = step?.id === "build"
    && state.phase === "practice"
    && !isComplete("build")
    && typeof practiceTaskCount === "function"
    && practiceTaskCount(step) >= 2;
  if (!buildInProgress || !workspace?.changed || homepageHeadingPhase(workspace) !== "first"
    || typeof workspace.sessionId !== "string" || !workspace.sessionId
    || !Number.isSafeInteger(workspace.revision) || workspace.revision < 0
    || !changedFile || !Number.isSafeInteger(line) || line < 1
    || !body || body.length > 2_000 || !["new", "old"].includes(side)
    || (startLine !== undefined && (!Number.isSafeInteger(startLine) || startLine < 1
      || !["new", "old"].includes(startSide)))
    || (state.diffComments || []).length >= 16) return false;
  const reviewRows = typeof parseReviewDiffRows === "function"
    ? parseReviewDiffRows(path)
    : parseReviewDiffLines(path);
  const normalized = normalizeReviewSelection({
    path,
    startLine: startLine === undefined ? line : startLine,
    startSide: startLine === undefined ? side : startSide,
    line,
    side,
  });
  if (!normalized) return false;
  const singleton = normalized.startLine === normalized.line
    && normalized.startSide === normalized.side;
  const selectedRow = reviewRows.find((entry) =>
    entry.line === normalized.line && entry.side === normalized.side);
  const selectedStartRow = reviewRows.find((entry) =>
    entry.line === normalized.startLine && entry.side === normalized.startSide);
  if (!selectedRow || !selectedStartRow) return false;
  const completesRequiredReview = isRequiredHomepageReviewComment({
    ...normalized, comment: body, sessionId: workspace.sessionId, revision: workspace.revision,
  }, workspace);

  const comment = {
    id: `review-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    path,
    line: normalized.line,
    side: normalized.side,
    text: body,
    stepId: step.id,
    createdAt: new Date().toISOString(),
    ...(!singleton ? { startLine: normalized.startLine, startSide: normalized.startSide } : {}),
    ...(workspace ? { sessionId: workspace.sessionId, revision: workspace.revision } : {}),
    ...(typeof selectedRow.diffHunk === "string"
      && selectedRow.diffHunk.startsWith("@@ ")
      && selectedRow.diffHunk.length <= 16_000
      ? { diffHunk: selectedRow.diffHunk }
      : {}),
  };
  (state.diffComments ||= []).push(comment);
  state.activeDiffComment = null;
  state.validationMessage = homepageReviewCommentError(state.diffComments, workspace);
  const advancedReview = completesRequiredReview && step.id === "build"
    && practiceTaskCount(step) >= 2
    && markPracticeTask("build", 3);
  if (!advancedReview) saveState();
  refreshCurrentLab();
  return true;
}

function serializePendingDiffComments(comments) {
  if (!Array.isArray(comments)) return "";
  const sections = comments.slice(0, 16).flatMap((comment, index) => {
    if (!comment || typeof comment !== "object"
      || typeof comment.path !== "string" || !comment.path || comment.path.length > 512
      || !Number.isSafeInteger(comment.line) || comment.line < 1
      || !["new", "old"].includes(comment.side)
      || typeof comment.text !== "string" || !comment.text.trim()
      || comment.text.trim().length > 2_000) return [];
    const side = comment.side === "old" ? "L" : "R";
    const startSide = comment.startSide === "old" ? "L" : "R";
    const range = Number.isSafeInteger(comment.startLine) && comment.startLine > 0
      ? `${startSide}${comment.startLine}-${side}${comment.line}`
      : `${side}${comment.line}`;
    const hunk = typeof comment.diffHunk === "string"
      && comment.diffHunk.startsWith("@@ ")
      && comment.diffHunk.length <= 16_000
      ? `\nDiff hunk:\n\`\`\`diff\n${comment.diffHunk}\n\`\`\``
      : "";
    return [`## Comment ${index + 1}\nFile: ${comment.path}\nSide: ${side}\nLines: ${range}${hunk}\nComment:\n${comment.text.trim()}`];
  });
  return sections.length ? `# Diff comments:\n\n${sections.join("\n\n")}` : "";
}

function pendingDiffCommentAttachment() {
  const comments = Array.isArray(state.diffComments) ? state.diffComments.slice(0, 16) : [];
  const ids = new Set();
  const structured = [];
  const snapshots = [];
  for (const comment of comments) {
    if (!comment || typeof comment.id !== "string" || !comment.id
      || typeof comment.path !== "string" || !comment.path || comment.path.length > 512
      || !Number.isSafeInteger(comment.line) || comment.line < 1
      || !["new", "old"].includes(comment.side)
      || typeof comment.text !== "string" || !comment.text.trim()
      || comment.text.trim().length > 2_000) continue;
    ids.add(comment.id);
    const snapshot = reviewCommentSnapshot(comment);
    if (snapshot) snapshots.push(snapshot);
    structured.push({
      path: comment.path,
      line: comment.line,
      side: comment.side,
      comment: comment.text.trim(),
      ...(Number.isSafeInteger(comment.startLine) && comment.startLine > 0
        ? { startLine: comment.startLine }
        : {}),
      ...(["new", "old"].includes(comment.startSide) ? { startSide: comment.startSide } : {}),
      ...(typeof comment.diffHunk === "string"
        && comment.diffHunk.startsWith("@@ ")
        && comment.diffHunk.length <= 16_000
        ? { diffHunk: comment.diffHunk }
        : {}),
      ...(typeof comment.sessionId === "string"
        && Number.isSafeInteger(comment.revision) && comment.revision >= 0
        ? { sessionId: comment.sessionId, revision: comment.revision }
        : {}),
    });
  }
  return { ids, text: serializePendingDiffComments(comments), comments: structured, snapshots };
}

function syncNativeReviewCommentsAttachment(shadow = nativeCodexShadow()) {
  if (!shadow?.querySelector) return false;
  const attachment = pendingDiffCommentAttachment();
  const textarea = shadow.querySelector("textarea");
  const composerSurface = textarea?.closest?.(".rounded-3xl") || textarea?.parentElement?.parentElement;
  if (!textarea || !composerSurface) return false;

  let rail = composerSurface.querySelector?.('[data-codex-review-comments-rail="pending"]');
  const renderKey = attachment.snapshots.map((comment) => `${comment.id}:${comment.text}`).join("|");
  if (!attachment.snapshots.length) {
    rail?.remove?.();
    if (state.reviewCommentsAttachmentOpen === "pending") {
      state.reviewCommentsAttachmentOpen = false;
    }
  } else {
    if (!rail) {
      rail = document.createElement("div");
      rail.className = "codex-review-comments-rail";
      rail.dataset.codexReviewCommentsRail = "pending";
      const editor = textarea.parentElement;
      composerSurface.insertBefore(rail, editor || composerSurface.firstChild);
    }
    if (rail.dataset.codexReviewCommentsRenderKey !== renderKey
      || rail.dataset.codexReviewCommentsOpen !== String(state.reviewCommentsAttachmentOpen === "pending")) {
      rail.innerHTML = renderReviewCommentsAttachment(attachment.snapshots, { id: "pending" });
      rail.dataset.codexReviewCommentsRenderKey = renderKey;
      rail.dataset.codexReviewCommentsOpen = String(state.reviewCommentsAttachmentOpen === "pending");
    }
  }

  const send = shadow.querySelector('button[aria-label="Send"]');
  if (send) {
    const commentOnlyEnabled = attachment.snapshots.length > 0 && state.isRunning !== true;
    if (commentOnlyEnabled) {
      send.disabled = false;
      send.dataset.codexReviewCommentsSendEnabled = "true";
    } else if (send.dataset.codexReviewCommentsSendEnabled === "true") {
      delete send.dataset.codexReviewCommentsSendEnabled;
      if (!textarea.value.trim() && state.isRunning !== true) send.disabled = true;
    }
  }
  return attachment.snapshots.length > 0;
}

function reviewConversationTurns() {
  const turns = [];
  const threadSteps = codexConversationSteps(STEPS[state.currentIndex]);
  for (const step of threadSteps) {
    for (const exchange of courseConversations(step.id)) {
      turns.push({
        id: exchange.id,
        prompt: exchange.prompt,
        commentOnly: exchange.commentOnly === true,
        reviewComments: Array.isArray(exchange.reviewComments)
          ? exchange.reviewComments.map(reviewCommentSnapshot).filter(Boolean)
          : [],
      });
    }
  }
  if (state.isRunning && state.pendingConversation
    && threadSteps.some((step) => step.id === state.pendingConversation.stepId)
    && state.pendingConversation.accepted !== false) {
    turns.push({
      id: state.pendingConversation.id,
      prompt: state.pendingConversation.prompt,
      commentOnly: state.pendingConversation.commentOnly === true,
      reviewComments: Array.isArray(state.pendingConversation.reviewComments)
        ? state.pendingConversation.reviewComments.map(reviewCommentSnapshot).filter(Boolean)
        : [],
    });
  }
  return turns;
}

function syncNativeSentReviewCommentAttachments(shadow = nativeCodexShadow()) {
  const column = shadow?.querySelector?.("[data-codex-native-thread-column]");
  if (!column) return false;
  const userRows = Array.from(column.children).filter((child) =>
    child.classList?.contains("justify-end"));
  const turns = reviewConversationTurns();
  let updated = false;

  for (let index = 0; index < userRows.length; index += 1) {
    const row = userRows[index];
    const turn = turns[index];
    const comments = turn?.reviewComments || [];
    let rail = Array.from(row.children).find((child) =>
      child.dataset?.codexReviewCommentsRail === "sent");
    const messageBubble = Array.from(row.children).find((child) =>
      child !== rail && child.dataset?.codexReviewCommentsRail !== "sent");

    if (!comments.length) {
      if (rail) {
        rail.remove();
        updated = true;
      }
      if (messageBubble?.hidden) {
        messageBubble.hidden = false;
        updated = true;
      }
      row.classList.remove("codex-review-comments-sent-turn");
      continue;
    }

    const attachmentId = `sent-${turn.id}`;
    const renderKey = comments.map((comment) => `${comment.id}:${comment.text}`).join("|");
    if (!rail) {
      rail = document.createElement("div");
      rail.className = "codex-review-comments-rail codex-review-comments-sent-rail";
      rail.dataset.codexReviewCommentsRail = "sent";
      row.insertBefore(rail, messageBubble || null);
      updated = true;
    }
    if (rail.dataset.codexReviewCommentsRenderKey !== renderKey
      || rail.dataset.codexReviewCommentsOpen !== String(state.reviewCommentsAttachmentOpen === attachmentId)) {
      rail.innerHTML = renderReviewCommentsAttachment(comments, { sent: true, id: attachmentId });
      rail.dataset.codexReviewCommentsRenderKey = renderKey;
      rail.dataset.codexReviewCommentsOpen = String(state.reviewCommentsAttachmentOpen === attachmentId);
      updated = true;
    }
    row.classList.add("codex-review-comments-sent-turn");
    if (messageBubble?.hidden) {
      messageBubble.hidden = false;
      updated = true;
    }
  }
  return updated;
}

function attachNativeRepositoryBridge(host, shadow) {
  if (host.__learnRepositoryBridge) return;

  let pendingFrame = 0;
  const observer = new MutationObserver(() => {
    if (pendingFrame || !host.isConnected) return;
    pendingFrame = window.requestAnimationFrame(() => {
      pendingFrame = 0;
      syncNativeRepositoryPane(shadow);
      if (typeof syncNativeCodexModel === "function") syncNativeCodexModel(shadow);
      if (typeof syncNativeCodexBranch === "function") syncNativeCodexBranch(shadow);
      if (typeof syncNativeCodexEnvironment === "function") syncNativeCodexEnvironment(shadow);
      syncPracticeScenarioOverlay(shadow);
      if (typeof syncNativeReviewCommentsAttachment === "function") syncNativeReviewCommentsAttachment(shadow);
      if (typeof syncNativeSentReviewCommentAttachments === "function") syncNativeSentReviewCommentAttachments(shadow);
    });
  });
  observer.observe(shadow, { childList: true, subtree: true });

  const cleanup = () => {
    if (state.pendingConversation) stopCodexThinkingTimer(state.pendingConversation.id);
    observer.disconnect();
    if (pendingFrame) window.cancelAnimationFrame(pendingFrame);
    delete host.__learnRepositoryBridge;
  };
  host.__learnRepositoryBridge = { observer, cleanup };
  host.addEventListener("astro:unmount", cleanup, { once: true });
  syncNativeRepositoryPane(shadow);
  syncPracticeScenarioOverlay(shadow);
  if (typeof syncNativeReviewCommentsAttachment === "function") syncNativeReviewCommentsAttachment(shadow);
  if (typeof syncNativeSentReviewCommentAttachments === "function") syncNativeSentReviewCommentAttachments(shadow);
}

function syncNativeCodexModel(shadow) {
  if (!state.codexModel) return;

  const button = shadow?.querySelector('button[aria-label^="Model:"]');
  const labels = button?.querySelectorAll?.(".truncate");
  const label = labels?.[0] || button?.querySelector(".truncate");
  if (!button || !label) return;

  const model = state.codexModel
    .replace(/^gpt-/i, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const reasoning = labels?.[1];
  const effort = {
    none: "None",
    minimal: "Minimal",
    low: "Light",
    medium: "Medium",
    high: "High",
    xhigh: "Extra High",
    max: "Max",
    ultra: "Ultra",
  }[state.codexReasoningEffort];
  // Mini owns the separate effort label. Never append effort to the name:
  // that can duplicate it when the responsive selector mounts its second label.
  if (label.textContent !== model) label.textContent = model;
  if (reasoning && effort && reasoning.textContent !== effort) reasoning.textContent = effort;
  const visibleEffort = effort || reasoning?.textContent;
  button.setAttribute("aria-label", `Model: ${model}${visibleEffort ? ` ${visibleEffort}` : ""}`);
}

function syncNativeCodexBranch(shadow) {
  const label = shadow?.querySelector('[data-slot="composer-project-utility-bar"] button:last-of-type span.truncate');
  if (!label || label.textContent?.trim() === "Choose project") return;

  const branch = activeCourseBranch();
  if (label.textContent !== branch) label.textContent = branch;
  label.closest?.("button")?.setAttribute("title", branch);
}

function syncNativeCodexEnvironment(shadow) {
  if (!shadow?.querySelector) return;
  if (shadow.querySelector('[data-codex-mini-plugins="true"]')) return;

  const stepId = typeof STEPS === "undefined" ? "" : STEPS[state.currentIndex]?.id || "";
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const root = shadow.querySelector("[data-codex-mini-app]");
  const header = root?.querySelector?.("section")?.previousElementSibling;
  if (header?.tagName !== "HEADER") return;
  const actions = header?.lastElementChild;
  if (!root || !actions) return;
  const projectAwaitingSource = stepId === "project" && !workspace;

  if (typeof ensureNativeRepositoryStyle === "function") ensureNativeRepositoryStyle(shadow);

  let filesToggle = shadow.querySelector("[data-codex-files-toggle]");
  if (!filesToggle || (typeof actions.contains === "function" && !actions.contains(filesToggle))) {
    filesToggle = document.createElement("button");
    filesToggle.dataset.codexFilesToggle = "true";
    actions.append(filesToggle);
  }
  filesToggle.type = "button";
  filesToggle.dataset.codexRepoAction = "toggle-files";
  filesToggle.disabled = false;

  const panelOpen = state.repositoryPaneOpen === true;
  filesToggle.setAttribute("aria-label", "Toggle side panel");
  filesToggle.removeAttribute("title");
  filesToggle.removeAttribute("aria-expanded");
  filesToggle.setAttribute("aria-pressed", String(panelOpen));
  const panelIconState = panelOpen ? "open" : "closed";
  if (filesToggle.dataset.codexPanelIcon !== panelIconState) {
    filesToggle.innerHTML = codexEnvironmentIcon(`panel-${panelIconState}`);
    filesToggle.dataset.codexPanelIcon = panelIconState;
  }
  if (typeof attachCodexSidePanelTooltip === "function") attachCodexSidePanelTooltip(shadow);

  let toggle = shadow.querySelector("[data-codex-environment-toggle]");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.dataset.codexEnvironmentToggle = "true";
    toggle.dataset.codexEnvironmentAction = "toggle";
    toggle.setAttribute("aria-label", "Toggle environment sidebar");
    toggle.setAttribute("aria-controls", "codex-environment-panel");
    toggle.setAttribute("title", "Environment");
    toggle.innerHTML = codexEnvironmentIcon("environment");
    if (typeof actions.insertBefore === "function") actions.insertBefore(toggle, filesToggle);
    else actions.append(toggle);
  }
  toggle.disabled = projectAwaitingSource;
  toggle.setAttribute("title", projectAwaitingSource
    ? "Select a project to view its environment"
    : "Environment");

  if (projectAwaitingSource) {
    toggle.setAttribute("aria-expanded", "false");
    shadow.querySelector("[data-codex-environment-panel]")?.remove?.();
    shadow.querySelector("[data-codex-panel-picker]")?.remove?.();
    if (typeof ensureNativeHomeRepositorySplit === "function") ensureNativeHomeRepositorySplit(shadow);
    return;
  }

  if (typeof ensureNativeHomeRepositorySplit === "function") ensureNativeHomeRepositorySplit(shadow);

  let sidePanelPicker = shadow.querySelector("[data-codex-panel-picker]");
  if (stepId === "project" && state.projectPanelPickerOpen === true
    && state.repositoryPaneOpen !== true && typeof renderCodexPanelPicker === "function") {
    if (!sidePanelPicker) {
      const template = document.createElement("template");
      template.innerHTML = renderCodexPanelPicker().trim();
      sidePanelPicker = template.content.firstElementChild;
      if (sidePanelPicker) root.append(sidePanelPicker);
    }
  } else if (sidePanelPicker) {
    sidePanelPicker.remove();
  }
  if (typeof attachCodexSidePanelTooltip === "function") attachCodexSidePanelTooltip(shadow);

  let panel = shadow.querySelector("[data-codex-environment-panel]");
  if (!panel) {
    const template = document.createElement("template");
    template.innerHTML = renderCodexEnvironmentPanel().trim();
    panel = template.content.firstElementChild;
    if (!panel) return;
    root.append(panel);
  }

  const expanded = state.environmentOpen === true;
  if (toggle.getAttribute("aria-expanded") !== String(expanded)) {
    toggle.setAttribute("aria-expanded", String(expanded));
  }
  if (panel.hidden !== !expanded) panel.hidden = !expanded;

  const branch = typeof activeCourseBranch === "function"
    ? activeCourseBranch()
    : COURSE.repository.defaultBranch;
  const branchLabel = panel.querySelector("[data-codex-environment-branch]");
  if (branchLabel && branchLabel.textContent !== branch) {
    branchLabel.textContent = branch;
    branchLabel.setAttribute("title", branch);
  }
  if (typeof syncCodexBranchPicker === "function") syncCodexBranchPicker(panel);

  const additions = workspace?.totals.additions || 0;
  const deletions = workspace?.totals.deletions || 0;
  const added = panel.querySelector(".codex-environment-additions");
  const removed = panel.querySelector(".codex-environment-deletions");
  if (added && added.textContent !== `+${additions}`) added.textContent = `+${additions}`;
  if (removed && removed.textContent !== `−${deletions}`) removed.textContent = `−${deletions}`;
  const changes = panel.querySelector(".codex-environment-changes");
  const label = `Inspect current changes: +${additions} −${deletions}`;
  if (changes && changes.getAttribute("aria-label") !== label) {
    changes.setAttribute("aria-label", label);
  }
}

function syncNativeCodexRequestControl(shadow) {
  const textarea = shadow?.querySelector("textarea:not([data-codex-review-input])");
  if (textarea && !state.isRunning) {
    const blocked = verificationComposerBlocked();
    if (blocked) {
      textarea.dataset.verificationBlocked = "true";
      textarea.disabled = true;
      textarea.placeholder = state.verificationThreadCreated || STEPS[state.currentIndex]?.id === "pr"
        ? "Return to the verification thread to continue" : "Create a new thread to verify this change";
    } else if (textarea.dataset.verificationBlocked) {
      delete textarea.dataset.verificationBlocked;
      textarea.disabled = false;
      textarea.placeholder = "Do anything";
    }
  }
  const button = shadow?.querySelector('button[data-codex-native-stop], button[aria-label="Stop"], button[aria-label="Send"]');
  if (!button) return;
  if (!state.isRunning && verificationComposerBlocked()) { button.disabled = true; return; }

  if (!state.isRunning || !state.pendingConversation) {
    if (button.dataset.codexNativeStop !== "true") return;
    button.disabled = button.dataset.codexNativeDisabled === "true";
    delete button.dataset.codexNativeStop;
    delete button.dataset.codexNativeDisabled;
    delete button.dataset.codexRepoAction;
    button.setAttribute("aria-label", "Send");
    button.removeAttribute("title");
    return;
  }

  if (button.dataset.codexNativeStop !== "true") {
    button.dataset.codexNativeDisabled = String(button.disabled);
  }
  button.dataset.codexNativeStop = "true";
  button.dataset.codexRepoAction = "stop-request";
  button.disabled = false;
  button.setAttribute("aria-label", "Stop");
  button.setAttribute("title", "Stop");
}

function syncNativeProjectNewThread(shadow, projectHeading, selected) {
  const row = projectHeading?.nextElementSibling?.querySelector(":scope > div > .group");
  if (!row) return;
  let button = row.querySelector('[data-codex-project-action="new-thread"]');
  if (!selected) {
    button?.remove();
    row.classList.remove("training-project-row");
    return;
  }
  row.classList.add("training-project-row");
  if (!button) {
    ensureNativeRepositoryStyle(shadow);
    button = document.createElement("button");
    button.type = "button";
    button.className = "training-project-new-thread";
    button.dataset.codexProjectAction = "new-thread";
    button.innerHTML = projectComposeIcon;
    row.append(button);
  }
  const name = row.querySelector(":scope > button:first-child")?.textContent?.trim() || "Blossom Bank";
  button.setAttribute("aria-label", `New thread in ${name}`);
  button.disabled = state.isRunning === true;
  attachCodexSidePanelTooltip(shadow);
}

function syncNativeProjectSelection(shadow) {
  if (!shadow || typeof STEPS === "undefined" || !STEPS[state.currentIndex]) return;
  if (typeof syncTrainingMiniSidebar === "function") {
    syncTrainingMiniSidebar(shadow, "Codex", shadow.host.getBoundingClientRect().width);
  }

  const projectStep = STEPS[state.currentIndex].id === "project";
  const selected = typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace();
  const sidebar = shadow.querySelector?.("aside");
  const projectHeading = Array.from(sidebar?.children || [])
    .find((element) => element.textContent?.trim() === "Projects");
  syncNativeProjectNewThread(shadow, projectHeading, selected);
  const existingProjectButton = projectHeading?.querySelector?.('[data-codex-project-action="start-project"]');
  if (projectStep && selected) {
    existingProjectButton?.remove?.();
    if (projectHeading?.dataset) delete projectHeading.dataset.codexProjectHeading;
  } else if (projectStep && projectHeading && !existingProjectButton && typeof document !== "undefined"
    && typeof document.createElement === "function" && typeof projectHeading.append === "function") {
    if (typeof ensureNativeRepositoryStyle === "function") ensureNativeRepositoryStyle(shadow);
    const addProject = document.createElement("button");
    addProject.type = "button";
    addProject.dataset.codexProjectAction = "start-project";
    addProject.dataset.codexProjectAdd = "true";
    addProject.setAttribute("aria-label", "Add new project");
    addProject.setAttribute("title", "Add new project");
    addProject.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11"/></svg>';
    if (projectHeading.dataset) projectHeading.dataset.codexProjectHeading = "true";
    projectHeading.append(addProject);
  }

  const toggleUnsupported = (element, hide, marker) => {
    if (!element) return;
    if (hide) {
      if (element.dataset) element.dataset[marker] = "true";
      element.hidden = true;
      element.style?.setProperty?.("display", "none", "important");
      return;
    }
    if (element.dataset?.[marker] !== "true") return;
    element.hidden = false;
    element.style?.removeProperty?.("display");
    delete element.dataset[marker];
  };

  const sidebarButtons = Array.from(shadow.querySelectorAll?.("aside button") || []);
  const placeholder = sidebarButtons.find((button) => button.textContent?.trim() === "Project");
  if (projectStep && !selected && placeholder) {
    toggleUnsupported(placeholder.closest?.(".group") || placeholder.parentElement, true, "codexProjectPlaceholder");
  } else if (projectStep && selected) {
    for (const row of shadow.querySelectorAll?.("[data-codex-project-placeholder]") || []) {
      toggleUnsupported(row, false, "codexProjectPlaceholder");
    }
  }

  for (const button of shadow.querySelectorAll?.("header button") || []) {
    const label = button.textContent?.trim();
    if (["Terminal", "Review", "Open", "Commit"].includes(label)) {
      const taskStarted = typeof hasStartedCodexTask === "function"
        && hasStartedCodexTask(STEPS[state.currentIndex]);
      toggleUnsupported(button,
        label === "Terminal" || label === "Open" || label === "Commit"
          || !selected || (!projectStep && !taskStarted),
        "codexProjectUnsupported");
    }
  }

  if (!projectStep) return;
  const chooser = shadow.querySelector?.('[data-slot="composer-project-utility-bar"] button');
  if (!chooser || chooser.textContent?.trim() !== "Choose project") return;
  if (state.projectSelecting === true) chooser.setAttribute?.("aria-busy", "true");
  else chooser.removeAttribute?.("aria-busy");
}

function syncNativeLinearToolResult(shadow) {
  if (!shadow?.querySelectorAll || typeof renderLinearToolResult !== "function") return false;

  const exchange = [...(state.conversations?.connect || [])].reverse().find((entry) =>
    entry?.guided === true
    && typeof entry.response === "string"
    && typeof LINEAR_ISSUE?.id === "string"
    && entry.response.toLowerCase().includes(LINEAR_ISSUE.id.toLowerCase()));
  const existing = Array.from(shadow.querySelectorAll("[data-codex-linear-activity]"));

  if (!exchange || state.linearConnected !== true) {
    for (const activity of existing) activity.remove();
    return false;
  }

  const current = existing.find((activity) => activity.dataset.codexLinearActivity === String(exchange.id || "result"));
  for (const activity of existing) {
    if (activity !== current) activity.remove();
  }
  if (current) return true;

  const label = Array.from(shadow.querySelectorAll("span")).reverse().find((element) =>
    element.textContent?.trim().toLowerCase() === "search issues"
    && !element.closest("[data-codex-linear-activity]"));
  const row = label?.closest("div");
  if (!row?.insertAdjacentElement || typeof document?.createElement !== "function") return false;

  if (typeof ensureNativeRepositoryStyle === "function") ensureNativeRepositoryStyle(shadow);
  const template = document.createElement("template");
  template.innerHTML = renderLinearToolResult(exchange).trim();
  const result = template.content?.firstElementChild;
  if (!result) return false;

  row.insertAdjacentElement("afterend", result);
  return true;
}

function codexLinearLogo() {
  // Exact plugin artwork: openai/openai/chatgpt/oai-maintained-plugins/plugins/linear/assets/linear-icon.svg
  // Monorepo blob e1849a742fb264ab866e5fbf079f6e30f7e2efaa (also used by the Work catalog).
  return '<img class="codex-linear-mention-icon" data-codex-linear-icon="true" src="/images/codex/work-plugins/linear.svg" alt="" aria-hidden="true" />';
}

function syncNativeLinearMentions(shadow) {
  if (!shadow?.querySelectorAll || typeof document?.createElement !== "function"
    || (typeof state !== "undefined" && state.linearConnected !== true)) return false;

  let updated = false;
  for (const label of shadow.querySelectorAll(".justify-end .whitespace-pre-wrap > span > span")) {
    if (label.textContent?.trim() !== "Linear") continue;

    const mention = label.parentElement;
    if (!mention || typeof mention.className !== "string"
      || !mention.className.includes("automation-badge-purple")) continue;

    if (mention.dataset.codexLinearMention !== "true") {
      mention.dataset.codexLinearMention = "true";
      mention.classList.add("codex-linear-mention");
      label.classList.add("codex-linear-mention-label");
      updated = true;
    }

    const currentIcon = mention.querySelector("svg, img");
    if (currentIcon?.getAttribute("data-codex-linear-icon") === "true") continue;

    const template = document.createElement("template");
    template.innerHTML = codexLinearLogo();
    const icon = template.content?.firstElementChild;
    if (!icon) continue;

    if (currentIcon) currentIcon.replaceWith(icon);
    else mention.insertBefore(icon, label);
    updated = true;
  }

  if (updated && typeof ensureNativeRepositoryStyle === "function") ensureNativeRepositoryStyle(shadow);
  return updated;
}

function syncNativeCurrencyMentions(shadow) {
  if (!shadow?.querySelectorAll) return false;

  const currency = /^\$(?:0|[1-9]\d{0,2}(?:,\d{3})*|[1-9]\d*)(?:\.\d{1,2})?$/;
  let updated = false;
  for (const code of shadow.querySelectorAll(".justify-end .whitespace-pre-wrap code")) {
    if (typeof code.className !== "string"
      || !code.className.includes("automation-badge-purple-bg")
      || !currency.test(code.textContent || "")) {
      continue;
    }

    if (code.dataset.codexPlainCurrency !== "true") {
      code.dataset.codexPlainCurrency = "true";
      updated = true;
    }
    if (code.getAttribute?.("role") !== "presentation") {
      code.setAttribute?.("role", "presentation");
      updated = true;
    }
  }

  if (updated && typeof ensureNativeRepositoryStyle === "function") ensureNativeRepositoryStyle(shadow);
  return updated;
}

function syncNativeThreadColumn(shadow) {
  if (!shadow?.querySelectorAll) return false;

  let updated = false;
  for (const column of shadow.querySelectorAll(".space-y-3")) {
    const scroll = column.parentElement;
    const pane = scroll?.parentElement;
    const composer = scroll?.nextElementSibling;
    if (!scroll?.classList?.contains("overflow-auto")
      || !scroll.classList.contains("p-2.5")
      || !scroll.classList.contains("pb-5")
      || !pane?.classList?.contains("flex-col")
      || composer?.parentElement !== pane
      || !composer?.classList?.contains("shrink-0")
      || !composer.classList.contains("p-2.5")
      || !composer.querySelector?.("textarea")) continue;

    if (scroll.dataset.codexNativeThreadScroll !== "true") {
      scroll.dataset.codexNativeThreadScroll = "true";
      updated = true;
    }
    if (column.dataset.codexNativeThreadColumn !== "true") {
      column.dataset.codexNativeThreadColumn = "true";
      updated = true;
    }
    if (composer.dataset.codexNativeThreadComposer !== "true") {
      composer.dataset.codexNativeThreadComposer = "true";
      updated = true;
    }
  }

  if (updated && typeof ensureNativeRepositoryStyle === "function") ensureNativeRepositoryStyle(shadow);
  return updated;
}

function initializeHostedCodexRuntime() {
  if (state.hostedRuntimeCandidate !== true || state.hostedPreviewForced === true
    || typeof fetch !== "function") return Promise.resolve(null);
  if (hostedRuntimeStatusPromise) return hostedRuntimeStatusPromise;

  hostedRuntimeStatusPromise = Promise.resolve()
    .then(() => fetch("/api/codex/status", { headers: { Accept: "application/json" } }))
    .then((response) => response.ok ? response.json() : null)
    .then((status) => {
      if (status?.preview === true || status?.runtimeMode === "preview") {
        if (typeof status.reason === "string" && status.reason.trim()) {
          state.hostedPreviewReason = status.reason.trim();
        }
        return status;
      }
      if (status?.available !== true || status.runtimeMode !== "hosted") return status;

      state.hostedPreview = false;
      state.hostedPreviewInstructionsOpen = false;
      state.hostedPreviewInstructionsCopied = false;
      state.validationMessage = "";
      document.body?.classList?.remove?.("hosted-preview-open");
      if (typeof status.model === "string" && status.model.trim()) {
        state.codexModel = status.model;
      }
      if (typeof status.reasoningEffort === "string" && status.reasoningEffort.trim()) {
        state.codexReasoningEffort = status.reasoningEffort;
      }
      if (typeof render === "function") render();
      return status;
    })
    .catch(() => null);
  return hostedRuntimeStatusPromise;
}

function attachCodexMiniBridge(host, attempt = 0) {
  const shadow = nativeCodexShadow(host);
  if (!shadow) {
    if (attempt < 40) window.setTimeout(() => attachCodexMiniBridge(host, attempt + 1), 35);
    return;
  }

  if (!shadow.__learnCodexBridge) {
    shadow.__learnCodexBridge = true;
    shadow.addEventListener("click", handleNativeCodexClick, true);
    shadow.addEventListener("keydown", handleNativeCodexKeydown, true);
    shadow.addEventListener("input", handleNativeCodexInput, true);
    shadow.addEventListener("scroll", syncCodexCourseCue, { capture: true, passive: true });
    shadow.addEventListener("pointerdown", handleReviewSelectionPointerDown, true);
    shadow.addEventListener("pointermove", handleReviewSelectionPointerMove, true);
    shadow.addEventListener("pointerup", handleReviewSelectionPointerUp, true);
    shadow.addEventListener("pointercancel", handleReviewSelectionPointerUp, true);
    shadow.addEventListener("mouseover", handleReviewCommentsAttachmentMouseover, true);
    shadow.addEventListener("mouseout", handleReviewCommentsAttachmentMouseout, true);
    const observer = new MutationObserver(() => {
      syncNativePluginCatalog(shadow);
      syncNativeScheduledLayout(shadow);
      syncNativeProjectSelection(shadow);
      syncNativeCodexRequestControl(shadow);
      if (typeof syncNativeLinearToolResult === "function") syncNativeLinearToolResult(shadow);
      if (typeof syncNativeLinearMentions === "function") syncNativeLinearMentions(shadow);
      if (typeof syncNativeCurrencyMentions === "function") syncNativeCurrencyMentions(shadow);
      if (typeof syncNativeThreadColumn === "function") syncNativeThreadColumn(shadow);
      if (typeof syncNativePlanImplementationRequest === "function") {
        syncNativePlanImplementationRequest(shadow);
      }
      if (typeof syncNativeReviewCommentsAttachment === "function") syncNativeReviewCommentsAttachment(shadow);
      if (typeof syncNativeSentReviewCommentAttachments === "function") syncNativeSentReviewCommentAttachments(shadow);
      if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
    });
    observer.observe(shadow, { childList: true, subtree: true });
    host.addEventListener("astro:unmount", () => {
      if (typeof disconnectRepositoryTabLabelOverflow === "function") {
        disconnectRepositoryTabLabelOverflow(shadow.querySelector?.("[data-codex-repo-tabs]"));
      }
    }, { once: true });
  }

  syncNativePluginCatalog(shadow);
  syncNativeScheduledLayout(shadow);
  syncNativeProjectSelection(shadow);
  if (typeof syncNativeLinearToolResult === "function") syncNativeLinearToolResult(shadow);
  if (typeof syncNativeLinearMentions === "function") syncNativeLinearMentions(shadow);
  if (typeof syncNativeCurrencyMentions === "function") syncNativeCurrencyMentions(shadow);
  if (typeof syncNativeThreadColumn === "function") syncNativeThreadColumn(shadow);
  if (typeof syncNativePlanImplementationRequest === "function") {
    syncNativePlanImplementationRequest(shadow);
  }
  if (typeof syncNativeReviewCommentsAttachment === "function") syncNativeReviewCommentsAttachment(shadow);
  if (typeof syncNativeSentReviewCommentAttachments === "function") syncNativeSentReviewCommentAttachments(shadow);
  syncNativeComposerMode(shadow);
  syncNativeCodexModel(shadow);
  syncNativeCodexBranch(shadow);
  if (typeof syncNativeCodexEnvironment === "function") syncNativeCodexEnvironment(shadow);
  syncNativeCodexRequestControl(shadow);
  if (!state.codexModel && !host.__learnCodexStatusPromise && typeof fetch === "function") {
    host.__learnCodexStatusPromise = (typeof hostedRuntimeStatusPromise !== "undefined"
      && hostedRuntimeStatusPromise
      ? hostedRuntimeStatusPromise
      : Promise.resolve()
        .then(() => fetch("/api/codex/status", { headers: { Accept: "application/json" } }))
        .then((response) => response.ok ? response.json() : null))
      .then((status) => {
        if (status?.preview === true || status?.runtimeMode === "preview") {
          const changed = state.hostedPreview !== true;
          state.hostedPreview = true;
          if (typeof status.reason === "string" && status.reason.trim()) {
            state.hostedPreviewReason = status.reason.trim();
          }
          state.validationMessage = "";
          if (changed && typeof render === "function") render();
          return;
        }
        const hostedRuntimeAvailable = state.hostedPreview === true
          && state.hostedPreviewForced !== true
          && state.hostedRuntimeCandidate === true
          && status?.available === true
          && status.runtimeMode === "hosted";
        if (hostedRuntimeAvailable) {
          state.hostedPreview = false;
          state.hostedPreviewInstructionsOpen = false;
          state.hostedPreviewInstructionsCopied = false;
          state.validationMessage = "";
          if (typeof document !== "undefined") {
            document.body?.classList?.remove?.("hosted-preview-open");
          }
        }
        if (typeof status?.model === "string" && status.model.trim()) {
          state.codexModel = status.model;
          if (typeof status.reasoningEffort === "string" && status.reasoningEffort.trim()) {
            state.codexReasoningEffort = status.reasoningEffort;
          }
          if (host.isConnected) syncNativeCodexModel(shadow);
        }
        if (hostedRuntimeAvailable && typeof render === "function") render();
      })
      .catch(() => {});
  }
  if (state.pendingConversation) {
    syncLiveCodexStreamDisplay(state.pendingConversation.id);
  }
  attachCodexMiniResponsiveBridge(host);
  attachNativeRepositoryBridge(host, shadow);
  attachNativeAssistantMarkdownBridge(host, shadow);
  syncNativeRepositoryPane(shadow);

  if (pendingCodexMiniPrompt) {
    const prompt = pendingCodexMiniPrompt;
    if (setNativeCodexPrompt(prompt)) pendingCodexMiniPrompt = "";
  }

  syncCodexMiniResponsiveLayout(host);
  if (typeof syncCodexCourseCue === "function") {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => syncCodexCourseCue());
    } else {
      syncCodexCourseCue();
    }
  }
}

function attachCodexMiniResponsiveBridge(host) {
  if (host.__learnCodexResponsiveBridge) {
    const bridge = host.__learnCodexResponsiveBridge;
    const currentWorkspace = host.closest?.(".codex-mini-live") || host;
    if (currentWorkspace !== bridge.measuredWorkspace) {
      bridge.observer?.unobserve?.(bridge.measuredWorkspace);
      bridge.observer?.observe?.(currentWorkspace);
      bridge.measuredWorkspace = currentWorkspace;
    }
    return;
  }

  const measuredWorkspace = host.closest?.(".codex-mini-live") || host;
  let pendingFrame = 0;
  let pendingCueFrame = 0;
  const scheduleLayout = () => {
    if (pendingFrame || !host.isConnected) return;
    pendingFrame = window.requestAnimationFrame(() => {
      pendingFrame = 0;
      syncCodexMiniResponsiveLayout(host);
      if (pendingCueFrame) window.cancelAnimationFrame(pendingCueFrame);
      pendingCueFrame = window.requestAnimationFrame(() => {
        pendingCueFrame = 0;
        if (host.isConnected) syncCodexCourseCue();
      });
    });
  };
  const observer = typeof ResizeObserver === "function"
    ? new ResizeObserver(scheduleLayout)
    : null;
  observer?.observe(host);
  if (measuredWorkspace !== host) observer?.observe(measuredWorkspace);
  window.addEventListener("resize", scheduleLayout);
  window.visualViewport?.addEventListener("resize", scheduleLayout);

  const cleanup = () => {
    observer?.disconnect();
    window.removeEventListener("resize", scheduleLayout);
    window.visualViewport?.removeEventListener("resize", scheduleLayout);
    if (pendingFrame) window.cancelAnimationFrame(pendingFrame);
    if (pendingCueFrame) window.cancelAnimationFrame(pendingCueFrame);
    delete host.__learnCodexResponsiveBridge;
  };
  host.__learnCodexResponsiveBridge = { observer, measuredWorkspace, cleanup };
  host.addEventListener("astro:unmount", cleanup, { once: true });
}

function syncRepositoryPaneBreakpoint(container, width) {
  if (!container?.dataset) return false;
  const narrow = isNarrowCodexWorkspace(width);
  state.repositoryPaneResponsiveNarrow = narrow;
  container.dataset.codexRepositoryNarrow = String(narrow);
  state.repositoryPaneResizeRestoreTab = "";
  return false;
}

function syncCodexMiniResponsiveLayout(host) {
  if (!host?.isConnected) return;
  const measuredWorkspace = host.closest?.(".codex-mini-live");
  const workspaceWidth = measuredWorkspace?.clientWidth || host.clientWidth;
  const paneStateChanged = typeof syncRepositoryPaneBreakpoint === "function"
    && syncRepositoryPaneBreakpoint(host, workspaceWidth);
  const shadow = nativeCodexShadow(host);
  if (!shadow) {
    if (paneStateChanged && typeof refreshCurrentLab === "function") refreshCurrentLab();
    return;
  }

  if (typeof syncTrainingMiniSidebar === "function") {
    syncTrainingMiniSidebar(shadow, "Codex", workspaceWidth);
  }
  syncPracticeScenarioOverlay(shadow);

  if (typeof syncNativeRepositoryPane === "function") {
    syncNativeRepositoryPane(shadow);
    if (typeof syncNativeCodexEnvironment === "function") syncNativeCodexEnvironment(shadow);
    if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
  }

  if (!state.modeMenuOpen) return;
  const trigger = shadow.querySelector('button[aria-label="Add files and more"]');
  if (!trigger) return;

  const bounds = trigger.getBoundingClientRect();
  const x = Math.max(8, Math.min(Math.round(bounds.left), window.innerWidth - 8));
  const y = Math.max(8, Math.min(Math.round(bounds.top - 8), window.innerHeight - 8));
  if (state.modeMenuAnchor.x === x && state.modeMenuAnchor.y === y) return;

  state.modeMenuAnchor = { x, y };
  const menu = app.querySelector(".codex-mode-menu");
  if (!menu) {
    updateCodexModeMenu();
    return;
  }
  menu.style.setProperty("--codex-mode-x", `${x}px`);
  menu.style.setProperty("--codex-mode-y", `${y}px`);
}

function nativeCodexMentionQuery(textarea) {
  if (!textarea || typeof textarea.value !== "string") return null;

  const cursor = typeof textarea.selectionStart === "number" ? textarea.selectionStart : textarea.value.length;
  const match = textarea.value.slice(0, cursor).match(/(?:^|\s)@([^\s@]*)$/);
  if (!match) return null;

  return {
    query: match[1].toLowerCase(),
    start: cursor - match[1].length - 1,
    end: cursor,
  };
}

function closeNativeCodexMentionMenu(shadow) {
  const menu = shadow?.querySelector?.("[data-codex-mention-menu]");
  if (!menu) return;

  menu.remove();
  const textarea = shadow.querySelector("textarea");
  textarea?.removeAttribute?.("aria-controls");
  textarea?.removeAttribute?.("aria-activedescendant");
  textarea?.removeAttribute?.("aria-autocomplete");
  textarea?.removeAttribute?.("aria-expanded");
}

function syncNativeCodexMentionMenu(shadow, textarea) {
  if (!shadow || !textarea) return;

  const mention = nativeCodexMentionQuery(textarea);
  const matchesPlugin = mention && ["linear"]
    .some((name) => name.includes(mention.query));
  if (state.linearConnected !== true || !matchesPlugin) {
    closeNativeCodexMentionMenu(shadow);
    return;
  }

  let menu = shadow.querySelector("[data-codex-mention-menu]");
  if (!menu) {
    if (typeof ensureNativeRepositoryStyle === "function") ensureNativeRepositoryStyle(shadow);

    menu = document.createElement("div");
    menu.dataset.codexMentionMenu = "true";
    menu.id = "codex-native-mention-list";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Mention a plugin");
    menu.innerHTML = `
      <div class="codex-mention-section" aria-hidden="true">Plugins</div>
      <button class="codex-mention-option" type="button" role="option"
        id="codex-native-mention-linear" data-codex-mention-option="linear"
        aria-selected="true">
        ${codexLinearLogo()}
        <span class="codex-mention-copy">
          <span class="codex-mention-name">Linear</span>
          <span class="codex-mention-detail">Linear · Connected</span>
        </span>
      </button>`;
    shadow.append(menu);
  }

  const bounds = textarea.getBoundingClientRect?.();
  if (bounds && menu.style && typeof window !== "undefined") {
    const width = Math.max(220, Math.min(320, bounds.width));
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`;
    menu.style.bottom = `${Math.max(8, window.innerHeight - bounds.top + 8)}px`;
  }

  textarea.setAttribute?.("aria-controls", "codex-native-mention-list");
  textarea.setAttribute?.("aria-activedescendant", "codex-native-mention-linear");
  textarea.setAttribute?.("aria-autocomplete", "list");
  textarea.setAttribute?.("aria-expanded", "true");
}

function insertNativeCodexMention(shadow, option = shadow?.querySelector?.("[data-codex-mention-option]")) {
  if (state.linearConnected !== true || option?.dataset?.codexMentionOption !== "linear") return;

  const textarea = shadow.querySelector("textarea");
  const mention = nativeCodexMentionQuery(textarea);
  if (!mention) return;

  const suffix = textarea.value.slice(mention.end);
  const insertion = `@Linear${suffix.startsWith(" ") ? "" : " "}`;
  const value = `${textarea.value.slice(0, mention.start)}${insertion}${suffix}`;
  const cursor = mention.start + insertion.length;
  closeNativeCodexMentionMenu(shadow);

  const setter = typeof HTMLTextAreaElement === "undefined"
    ? null
    : Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(textarea, value);
  else textarea.value = value;

  textarea.setSelectionRange?.(cursor, cursor);
  if (typeof Event === "function") {
    textarea.dispatchEvent?.(new Event("input", { bubbles: true, composed: true }));
  }
  textarea.focus?.();
  textarea.setSelectionRange?.(cursor, cursor);
}

function handlePracticeSlackLink(event) {
  const slackLink = event.target.closest?.('a[href="#practice-slack-thread"]');
  const pullRequestLink = event.target.closest?.("a.codex-github-link");
  if (!slackLink && !pullRequestLink) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  const frame = app.querySelector(".practice-codex-frame");
  if (!frame) return true;
  frame.querySelector(".codex-practice-notice")?.remove();
  const notice = document.createElement("div");
  notice.className = "codex-practice-notice";
  notice.setAttribute("role", "status");
  const message = document.createElement("span");
  message.textContent = slackLink
    ? "This is a sample Slack thread. No real Slack message was sent."
    : "This pull request uses sample data. It won’t open a real pull request.";
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.setAttribute("aria-label", "Dismiss notice");
  dismiss.innerHTML = icon("close");
  dismiss.addEventListener("click", () => notice.remove());
  notice.append(message, dismiss);
  frame.append(notice);
  return true;
}

function handleNativeCodexClick(event) {
  if (handlePracticeSlackLink(event)) return;
  const pageSidebar = event.currentTarget.querySelector('[data-codex-mini-plugins], input[aria-label="Search scheduled tasks"]')
    && event.currentTarget.querySelector('[data-training-sidebar]');
  if (pageSidebar && event.currentTarget.host.getBoundingClientRect().width <= 520
    && event.target.closest?.('button[aria-label="Toggle sidebar"], [data-training-open-sidebar]')) {
    event.preventDefault(); event.stopImmediatePropagation();
    // These pages have no native top bar to reopen a closed sidebar. Keep the
    // native navigation mounted and toggle only its mobile overlay here.
    pageSidebar.hidden = !event.target.closest?.("[data-training-open-sidebar]");
    syncTrainingMiniSidebar(event.currentTarget, "Codex", event.currentTarget.host.getBoundingClientRect().width);
    return;
  }
  const newProjectThread = event.target.closest?.('[data-codex-project-action="new-thread"]');
  if (newProjectThread) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (state.isRunning) return;
    if (startVerificationThread()) return;
    // Let Mini create the conversation through its normal New chat handler.
    const newChat = Array.from(event.currentTarget.querySelectorAll("aside button"))
      .find((button) => button.textContent?.trim() === "New chat");
    newChat?.click();
    return;
  }
  const threadButton = event.target.closest?.("aside button");
  const threadLabel = (threadButton?.getAttribute("aria-label") || threadButton?.textContent?.trim() || "")
    .replace(/\s*(?:Now|Working)$/, "");
  if (isVerificationLesson() && threadLabel === "New chat") {
    event.preventDefault(); event.stopImmediatePropagation();
    startVerificationThread();
    return;
  }
  const selectedThread = { "Shorten the homepage heading": "eng-248", "Verify the homepage change": "eng-248-verify", "eng-248": "eng-248", "eng-248-verify": "eng-248-verify" }[threadLabel];
  if (isVerificationLesson() && selectedThread) {
    if (state.isRunning) {
      event.preventDefault(); event.stopImmediatePropagation();
      return;
    }
    state.selectedCodexThread = selectedThread;
    // Let Mini leave Plugins/Scheduled through its own navigation handler,
    // then synchronize the selected training history and composer guard.
    window.requestAnimationFrame(() => refreshCurrentLab());
    return;
  }
  const sidebarNavigation = event.target.closest?.('aside button[data-kind="sidebar"], aside button[data-kind="sidebarMeta"]');
  if (sidebarNavigation && event.currentTarget.host.getBoundingClientRect().width <= 520) {
    const shadow = event.currentTarget;
    window.requestAnimationFrame(() => shadow.querySelector('button[aria-label="Toggle sidebar"]')?.click());
  }
  const pluginInstall = event.target.closest?.("[data-plugin-install]");
  if (pluginInstall) {
    event.preventDefault(); event.stopImmediatePropagation();
    installTrainingPlugin(event.currentTarget, pluginInstall.dataset.pluginInstall);
    return;
  }
  if (event.target.closest?.("[data-training-open-sidebar]")) {
    event.preventDefault(); event.stopImmediatePropagation();
    const nativeToggle = event.currentTarget.querySelector('button[aria-label="Open sidebar"]:not([data-training-open-sidebar])')
      || event.currentTarget.querySelector('button[aria-label="Toggle sidebar"]');
    nativeToggle?.click();
    return;
  }

  const stagedPreviewControl = event.target.closest?.("[data-codex-staged-preview]");
  if (stagedPreviewControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openStagedPreviewAction(
      stagedPreviewControl.dataset.codexStagedPreview,
      stagedPreviewControl,
      event.currentTarget,
    );
    return;
  }

  if (state.branchPickerOpen === true
    && !event.target.closest?.("[data-codex-branch-picker], [data-codex-branch-trigger]")) {
    state.branchPickerOpen = false;
    state.branchPickerQuery = "";
    if (typeof syncCodexBranchPicker === "function") {
      syncCodexBranchPicker(event.currentTarget?.querySelector?.("[data-codex-environment-panel]"));
    }
  }

  const planControl = event.target.closest?.("[data-codex-plan-action]");
  if (planControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = planControl.dataset.codexPlanAction;
    if (action === "open-plan"
      && typeof openCodexPlanSidePanel === "function") {
      openCodexPlanSidePanel(event.currentTarget);
    } else if (action === "dismiss-request") {
      dismissCodexPlanImplementationRequest(event.currentTarget);
    } else if (action === "choose-implement") {
      if (planControl.disabled !== true) chooseCodexPlanImplementation();
    } else if (action === "submit-feedback") {
      const input = planControl.closest?.("[data-codex-composer-request-navigation]")
        ?.querySelector?.('[data-codex-plan-feedback="true"]');
      submitCodexPlanFeedback(input, event.currentTarget);
    }
    return;
  }

  const projectControl = event.target.closest?.("[data-codex-project-action]");
  if (projectControl && STEPS[state.currentIndex]?.id === "project") {
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = projectControl.dataset.codexProjectAction;
    if (action === "start-project" && typeof startCodexProject === "function") {
      startCodexProject();
    } else if (action === "select-project-type" && typeof selectCodexProjectType === "function") {
      selectCodexProjectType(projectControl.dataset.projectType);
    } else if (action === "continue-project-creation" && typeof continueCodexProjectCreation === "function") {
      continueCodexProjectCreation();
    } else if (action === "select-project-directory" && state.projectCreationStarted === true
      && state.projectSelecting !== true && typeof selectCodexProjectDirectory === "function") {
      selectCodexProjectDirectory();
    } else if (action === "remove-project-directory" && state.projectCreationStarted === true
      && state.projectSelecting !== true && typeof removeCodexProjectDirectory === "function") {
      removeCodexProjectDirectory();
    }
    return;
  }

  const environmentControl = event.target.closest?.("[data-codex-environment-action]");
  if (environmentControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = environmentControl.dataset.codexEnvironmentAction;
    const preparingRepository = typeof STEPS !== "undefined"
      && STEPS[state.currentIndex]?.id === "ticket";

    if (action === "toggle") {
      state.environmentOpen = state.environmentOpen !== true;
      if (!state.environmentOpen) {
        state.branchPickerOpen = false;
        state.branchPickerQuery = "";
      }
      if (state.environmentOpen && preparingRepository && typeof markPracticeTask === "function") {
        state.ticketEnvironmentOpenedByLearner = true;
        markPracticeTask("ticket", 1);
      }
      if (typeof syncNativeCodexEnvironment === "function") {
        syncNativeCodexEnvironment(event.currentTarget);
      }
      environmentControl.focus?.();
      return;
    }

    if (action === "toggle-branch-picker") {
      if (typeof toggleCodexBranchPicker === "function") toggleCodexBranchPicker(event.currentTarget);
      return;
    }

    if (action === "switch-branch") {
      if (typeof switchCodexBranch === "function") {
        void switchCodexBranch(environmentControl.dataset.branch, event.currentTarget);
      }
      return;
    }

    if (action === "inspect-changes") {
      state.repoPaneTab = "review";
      state.repositoryPaneOpen = true;
      state.inspectorOpen = true;
      if (typeof syncNativeRepositoryPane === "function") {
        syncNativeRepositoryPane(event.currentTarget);
      }
      if (typeof syncNativeCodexEnvironment === "function") {
        syncNativeCodexEnvironment(event.currentTarget);
      }
    }
    return;
  }

  const projectChooser = event.target.closest?.('[data-slot="composer-project-utility-bar"] button');
  if (projectChooser && STEPS[state.currentIndex]?.id === "project"
    && projectChooser.textContent?.trim() === "Choose project"
    && !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.projectSelecting !== true && typeof startCodexProject === "function") {
      startCodexProject();
    }
    return;
  }

  const mentionOption = event.target.closest?.("[data-codex-mention-option]");
  if (mentionOption && typeof insertNativeCodexMention === "function") {
    event.preventDefault();
    event.stopImmediatePropagation();
    insertNativeCodexMention(event.currentTarget, mentionOption);
    return;
  }

  if (
    typeof closeNativeCodexMentionMenu === "function" &&
    event.currentTarget?.querySelector?.("[data-codex-mention-menu]") &&
    event.target !== event.currentTarget.querySelector("textarea")
  ) {
    closeNativeCodexMentionMenu(event.currentTarget);
  }

  const sidebarControl = event.target.closest?.('button[data-kind="sidebar"]');
  if (
    sidebarControl &&
    STEPS[state.currentIndex]?.id === "connect" &&
    sidebarControl.textContent?.trim() === "Plugins"
  ) {
    markPracticeTask("connect", 1);
  }

  const reviewAttachmentControl = event.target.closest?.("[data-codex-review-comments-action]");
  if (reviewAttachmentControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = reviewAttachmentControl.dataset.codexReviewCommentsAction;
    if (action === "remove-attachment") {
      removePendingDiffCommentAttachments();
      event.currentTarget.querySelector?.("textarea")?.focus?.();
    } else if (action === "remove-comment") {
      removePendingDiffComment(reviewAttachmentControl.dataset.commentId);
    } else if (action === "toggle-attachment") {
      const attachment = reviewAttachmentControl.closest?.("[data-codex-review-comments-id]");
      if (toggleReviewCommentsAttachment(attachment?.dataset.codexReviewCommentsId || "")) {
        syncNativeReviewCommentsAttachment(event.currentTarget);
        syncNativeSentReviewCommentAttachments(event.currentTarget);
      }
      reviewAttachmentControl.focus?.();
    }
    return;
  }

  const reviewControl = event.target.closest?.("[data-codex-review-action]");
  if (reviewControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = reviewControl.dataset.codexReviewAction;

    if (action === "use-required-comment") {
      useRequiredReviewComment(reviewControl);
    } else if (action === "open-comment") {
      openReviewCommentSelection(reviewControl);
      syncNativeDiffComments(event.currentTarget);
      event.currentTarget.querySelector("[data-codex-review-composer] textarea")?.focus();
    } else if (action === "cancel-comment") {
      const active = state.activeDiffComment;
      state.activeDiffComment = null;
      syncNativeDiffComments(event.currentTarget);
      const trigger = Array.from(event.currentTarget.querySelectorAll('[data-codex-review-action="open-comment"]'))
        .find((button) => button.dataset.path === active?.path && button.dataset.line === String(active?.line) && button.dataset.side === active?.side);
      trigger?.focus();
    } else if (action === "submit-comment") {
      submitReviewCommentSelection(reviewControl);
    }
    return;
  }

  const repositoryControl = event.target.closest?.("[data-codex-repo-action]")
    || event.composedPath?.().find((node) => node?.dataset?.codexRepoAction);
  if (repositoryControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = repositoryControl.dataset.codexRepoAction;
    const path = repositoryControl.dataset.path;
    const restoreFocus = event.currentTarget.activeElement === repositoryControl
      && !(Number.isFinite(event.detail) && event.detail > 0);

    const stepId = typeof STEPS === "undefined" ? "" : STEPS[state.currentIndex]?.id || "";

    if (action === "toggle-files") {
      state.repositoryPaneOpen = state.repositoryPaneOpen !== true;
      state.inspectorOpen = state.repositoryPaneOpen;
      if (state.repositoryPaneOpen) {
        state.repositoryPaneResizeRestoreTab = "";
        state.environmentOpen = false;
        state.branchPickerOpen = false;
        state.branchPickerQuery = "";
        if (stepId === "project") {
          state.repoPaneTab = "files";
          state.activeTab = "files";
        }
      }
      state.projectPanelPickerOpen = false;
      syncNativeRepositoryPane(event.currentTarget);
      if (typeof syncNativeCodexEnvironment === "function") {
        syncNativeCodexEnvironment(event.currentTarget);
      }
      if (typeof saveState === "function") saveState();
      repositoryControl.focus?.();
      return;
    } else if (action === "open-project-files" && stepId === "project"
      && state.projectPanelPickerOpen === true
      && typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace()) {
      state.projectPanelPickerOpen = false;
      state.repositoryPaneOpen = true;
      state.inspectorOpen = true;
      state.environmentOpen = false;
      state.branchPickerOpen = false;
      state.branchPickerQuery = "";
      state.repoPaneTab = "files";

      syncNativeRepositoryPane(event.currentTarget);
      if (typeof syncNativeCodexEnvironment === "function") {
        syncNativeCodexEnvironment(event.currentTarget);
      }
      return;
    } else if (action === "show-files") {
      state.repoPaneTab = "files";
    }
    else if (action === "show-browser") state.repoPaneTab = "browser";
    else if (action === "show-plan" && state.planPanelOpen === true) state.repoPaneTab = "plan";
    else if (action === "show-review") {
      state.repoPaneTab = "review";
      state.repositoryPaneOpen = true;
      state.inspectorOpen = true;
      state.repositoryPaneResizeRestoreTab = "";
    } else if (["browser-back", "browser-next", "browser-reload"].includes(action)) {
      const browser = repositoryControl.closest?.("[data-codex-browser-panel]")
        || event.currentTarget.querySelector?.("[data-codex-browser-panel]");
      const frame = browser?.__codexBrowserFrame || browser?.querySelector?.("[data-codex-browser-frame]");
      try {
        if (action === "browser-back") frame?.contentWindow?.history?.back?.();
        else if (action === "browser-next") frame?.contentWindow?.history?.forward?.();
        else if (frame?.contentWindow?.location?.pathname === "/") frame.src = "/training/codex-lab/demos/blossom-bank/index.html";
        else if (typeof frame?.contentWindow?.location?.reload === "function") frame.contentWindow.location.reload();
        else if (frame?.src) frame.src = frame.src;
      } catch {
        if (action === "browser-reload" && frame?.src) frame.src = frame.src;
      }
      return;
    } else if (action === "stop-request") {
      if (typeof stopCurrentCodexRequest === "function") stopCurrentCodexRequest();
      return;
    } else if (action === "toggle-folder") {
      if (state.repoExpandedFolders.has(path)) state.repoExpandedFolders.delete(path);
      else state.repoExpandedFolders.add(path);
    } else if (action === "open-file"
      && typeof verifiedCodexWorkspace === "function"
      && verifiedCodexWorkspace()?.files.some((file) => file.path === path)) {
      state.sourceCitation = repositoryControl.dataset.codexSourceCitation === "true"
        ? { path, line: Number(repositoryControl.dataset.line) } : null;
      if (repositoryControl.dataset.codexSourceCitation === "true") {
        state.repositoryPaneOpen = true;
        state.inspectorOpen = true;
        state.repositoryPaneResizeRestoreTab = "";
        state.environmentOpen = false;
        state.branchPickerOpen = false;
        state.branchPickerQuery = "";
      }
      state.repoSelectedPath = path;
      state.selectedFile = path;
      state.repoPaneTab = "files";
    }

    syncNativeRepositoryPane(event.currentTarget);
    if (["show-files", "show-browser", "show-plan", "show-review"].includes(action)
      && typeof saveState === "function") saveState();
    if (["show-files", "show-browser", "show-plan", "show-review"].includes(action)
      && typeof syncCodexCourseCue === "function") {
      if (action === "show-files" && typeof currentCodexCourseTarget === "function") {
        const requiredChild = currentCodexCourseTarget();
        if (requiredChild?.element?.dataset?.codexRepoAction === "open-file"
          && /^build:changed-file$/.test(requiredChild.key)
          && state.courseCueSeen && typeof state.courseCueSeen.delete === "function") {
          state.courseCueSeen.delete(requiredChild.key);
        }
      }
      syncCodexCourseCue();
    }
    if (repositoryControl.dataset.codexSourceCitation === "true") {
      const line = Number(repositoryControl.dataset.line);
      if (Number.isSafeInteger(line) && line > 0) {
        event.currentTarget.querySelectorAll?.(".codex-repo-code-line")?.[line - 1]
          ?.scrollIntoView?.({ block: "center", inline: "nearest" });
      }
    }
    if (restoreFocus && path) {
      const replacement = Array.from(event.currentTarget.querySelectorAll?.("[data-codex-repo-action]") || [])
        .find((control) => control.dataset.codexRepoAction === action && control.dataset.path === path);
      replacement?.focus();
    }
    return;
  }

  const externalLink = event.target.closest?.("a");
  if (externalLink) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  const dismissMode = event.target.closest?.("[data-codex-mode-dismiss]");
  if (dismissMode) {
    event.preventDefault();
    event.stopImmediatePropagation();
    selectCodexMode("agent");
    return;
  }

  const modeControl = event.target.closest?.('button[aria-label="Add files and more"], button[data-codex-course-mode]');
  if (modeControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openCodexModeMenu(modeControl);
    return;
  }

  const send = event.target.closest?.('button[aria-label="Send"]');
  if (!send) return;

  const prompt = event.currentTarget.querySelector("textarea")?.value || "";
  const pendingReviewComments = pendingDiffCommentAttachment();
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!prompt.trim() && !pendingReviewComments.snapshots.length) return;
  if (handleCodexModeCommand(prompt)) return;
  runStep(prompt);
}

function handleNativeCodexInput(event) {
  if (event.target.matches?.('[data-codex-plan-feedback="true"]')) {
    updateCodexPlanRequestInput(event.target);
    return;
  }

  if (event.target.matches?.("[data-codex-branch-search]")) {
    if (typeof filterCodexBranchPicker === "function") filterCodexBranchPicker(event.target);
    return;
  }

  const reviewInput = event.target.closest?.("[data-codex-review-composer] textarea");
  if (!reviewInput) {
    if (event.target.tagName === "TEXTAREA" && typeof syncNativeCodexMentionMenu === "function") {
      syncNativeCodexMentionMenu(event.currentTarget, event.target);
      syncReviewCommandInput(event.target);
    }
    return;
  }

  const submit = reviewInput.closest("[data-codex-review-composer]")?.querySelector('[data-codex-review-action="submit-comment"]');
  if (submit) submit.disabled = !reviewInput.value.trim();
}

function handleNativeCodexKeydown(event) {
  if (handleReviewCommandKeydown(event)) return;
  if (handleCodexProjectTypeKeydown(event)) return;
  const stagedPreviewControl = event.target.closest?.("[data-codex-staged-preview]");
  if (stagedPreviewControl && event.key === "Enter") {
    event.preventDefault();
    event.stopImmediatePropagation();
    openStagedPreviewAction(
      stagedPreviewControl.dataset.codexStagedPreview,
      stagedPreviewControl,
      event.currentTarget,
    );
    return;
  }

  if (typeof handleCodexPlanRequestKeydown === "function"
    && handleCodexPlanRequestKeydown(event, event.currentTarget)) return;

  const branchPicker = event.target.closest?.("[data-codex-branch-picker]");
  if (branchPicker && ["Escape", "ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
    const options = Array.from(branchPicker.querySelectorAll?.("[data-codex-environment-action=\"switch-branch\"]") || []);
    const position = options.indexOf(event.target);
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === "Escape") {
      state.branchPickerOpen = false;
      state.branchPickerQuery = "";
      const panel = event.currentTarget?.querySelector?.("[data-codex-environment-panel]");
      if (typeof syncCodexBranchPicker === "function") syncCodexBranchPicker(panel);
      panel?.querySelector?.("[data-codex-branch-trigger]")?.focus?.();
    } else if (event.key === "ArrowDown") {
      options[Math.min(position + 1, options.length - 1)]?.focus?.();
    } else if (event.key === "ArrowUp") {
      if (position <= 0) branchPicker.querySelector("[data-codex-branch-search]")?.focus?.();
      else options[position - 1]?.focus?.();
    } else {
      const option = position >= 0 ? options[position] : options[0];
      if (option && typeof switchCodexBranch === "function") {
        void switchCodexBranch(option.dataset.branch, event.currentTarget);
      }
    }
    return;
  }

  const reviewInput = event.target.closest?.("[data-codex-review-composer] textarea");
  if (reviewInput && event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    reviewInput.closest("[data-codex-review-composer]")?.querySelector('[data-codex-review-action="cancel-comment"]')?.click();
    return;
  }
  if (reviewInput && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    reviewInput.closest("[data-codex-review-composer]")?.querySelector('[data-codex-review-action="submit-comment"]')?.click();
    return;
  }
  if (reviewInput) return;

  const reviewAttachmentControl = event.target.closest?.("[data-codex-review-comments-action]");
  if (reviewAttachmentControl?.dataset.codexReviewCommentsAction === "remove-attachment"
    && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    removePendingDiffCommentAttachments();
    event.currentTarget.querySelector?.("textarea")?.focus?.();
    return;
  }

  const mentionMenu = event.target.tagName === "TEXTAREA" && typeof insertNativeCodexMention === "function"
    ? event.currentTarget?.querySelector?.("[data-codex-mention-menu]")
    : null;
  if (
    mentionMenu &&
    ["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(event.key) &&
    !event.isComposing &&
    !(event.shiftKey && ["Enter", "Tab"].includes(event.key))
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.key === "Escape") closeNativeCodexMentionMenu(event.currentTarget);
    else if (["Enter", "Tab"].includes(event.key)) insertNativeCodexMention(event.currentTarget);
    else mentionMenu.querySelector?.("[data-codex-mention-option]")?.setAttribute?.("aria-selected", "true");
    return;
  }

  if (event.key === "Escape" && state.environmentOpen === true) {
    event.preventDefault();
    event.stopImmediatePropagation();
    state.environmentOpen = false;
    if (typeof syncNativeCodexEnvironment === "function") {
      syncNativeCodexEnvironment(event.currentTarget);
    }
    event.currentTarget.querySelector?.("[data-codex-environment-toggle]")?.focus?.();
    return;
  }

  const browserAddress = event.target.closest?.("[data-browser-sidebar-address-input]");
  if (browserAddress && event.key === "Enter") {
    event.preventDefault();
    event.stopImmediatePropagation();
    const browser = browserAddress.closest?.("[data-codex-browser-panel]");
    const frame = browser?.__codexBrowserFrame || browser?.querySelector?.("[data-codex-browser-frame]");
    try {
      const destination = new URL(browserAddress.value.trim(), location.href);
      if (destination.origin === location.origin && destination.pathname === "/") {
        destination.pathname = "/training/codex-lab/demos/blossom-bank/index.html";
      }
      const allowed = destination.pathname === "/training/codex-lab/demos/blossom-bank"
        || destination.pathname.startsWith("/training/codex-lab/demos/blossom-bank/")
        || ["/products", "/solutions", "/wealth", "/security", "/pricing"].includes(destination.pathname);
      if (destination.origin === location.origin && allowed && frame) frame.src = destination.href;
      else if (frame?.contentWindow?.location?.href) browserAddress.value = frame.contentWindow.location.href;
    } catch {
      if (frame?.contentWindow?.location?.href) browserAddress.value = frame.contentWindow.location.href;
    }
    return;
  }

  const repositoryTab = event.target.closest?.("[data-codex-repo-tab]");
  if (repositoryTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    const tabs = Array.from(event.currentTarget.querySelectorAll("[data-codex-repo-tab]"));
    const currentIndex = tabs.indexOf(repositoryTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;

    event.preventDefault();
    event.stopImmediatePropagation();
    state.repoPaneTab = tabs[nextIndex].dataset.codexRepoTab;
    syncNativeRepositoryPane(event.currentTarget);
    tabs[nextIndex].focus();
    return;
  }

  const repositoryControl = event.target.closest?.('[data-codex-repo-action="toggle-folder"], [data-codex-repo-action="open-file"]');
  if (repositoryControl && ["Enter", " ", "Space", "Spacebar"].includes(event.key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    repositoryControl.click();
    return;
  }

  if (event.key !== "Enter" || event.shiftKey || event.isComposing || event.target.tagName !== "TEXTAREA") return;

  event.preventDefault();
  event.stopImmediatePropagation();
  if (!event.target.value?.trim() && !pendingDiffCommentAttachment().snapshots.length) return;
  if (handleCodexModeCommand(event.target.value)) return;
  runStep(event.target.value);
}

function syncNativeComposerMode(shadow = nativeCodexShadow()) {
  const addButton = shadow?.querySelector('button[aria-label="Add files and more"]');
  if (!addButton) return;

  addButton.setAttribute("aria-haspopup", "menu");
  addButton.setAttribute("aria-expanded", String(state.modeMenuOpen));
  let indicator = shadow.querySelector("[data-codex-course-mode]");

  if (state.composerMode === "agent") {
    indicator?.closest(".codex-mode-indicator")?.remove();
    return;
  }

  if (!shadow.querySelector("[data-codex-mode-indicator-style]")) {
    const style = document.createElement("style");
    style.dataset.codexModeIndicatorStyle = "true";
    style.textContent = [
      ".codex-mode-indicator-label,.codex-mode-indicator-dismiss{display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;}",
      ".codex-mode-indicator-label{height:25px;padding:0;white-space:nowrap;}",
      ".codex-mode-indicator-dismiss{width:0;height:18px;margin-left:0;padding:0;overflow:hidden;border-radius:5px;opacity:0;pointer-events:none;transition:width .14s ease,margin-left .14s ease,opacity .14s ease;}",
      ".codex-mode-indicator:hover .codex-mode-indicator-dismiss,.codex-mode-indicator:focus-within .codex-mode-indicator-dismiss{width:18px;margin-left:5px;opacity:1;pointer-events:auto;}",
      ".codex-mode-indicator-dismiss:hover{background:rgba(26,28,31,.08);}",
      ".codex-mode-indicator-label:focus-visible,.codex-mode-indicator-dismiss:focus-visible{outline:2px solid #339cff;outline-offset:1px;border-radius:4px;}",
      "@media (hover:none){.codex-mode-indicator-dismiss{width:18px;margin-left:5px;opacity:1;pointer-events:auto;}}",
      "@media (prefers-reduced-motion:reduce){.codex-mode-indicator-dismiss{transition:none;}}",
    ].join("\n");
    shadow.append(style);
  }

  if (!indicator) {
    const wrapper = document.createElement("span");
    wrapper.className = "codex-mode-indicator";
    wrapper.style.cssText = "display:inline-flex;height:27px;align-items:center;padding:0 8px;border:1px solid rgba(26,28,31,.09);border-radius:999px;background:rgba(26,28,31,.035);font:500 12px system-ui,-apple-system,sans-serif;white-space:nowrap;";

    indicator = document.createElement("button");
    indicator.type = "button";
    indicator.className = "codex-mode-indicator-label";
    wrapper.append(indicator);

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "codex-mode-indicator-dismiss";
    dismiss.dataset.codexModeDismiss = state.composerMode;
    dismiss.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m3 3 6 6m0-6-6 6"/></svg>';
    wrapper.append(dismiss);

    addButton.insertAdjacentElement("afterend", wrapper);
  }

  indicator.dataset.codexCourseMode = state.composerMode;
  indicator.textContent = state.composerMode === "plan" ? "Plan" : "Goal";
  indicator.parentElement.style.color = state.composerMode === "plan" ? "#5946c4" : "#17764d";
  indicator.setAttribute("aria-label", `${indicator.textContent} mode; change work mode`);

  const dismiss = indicator.parentElement.querySelector("[data-codex-mode-dismiss]");
  dismiss.dataset.codexModeDismiss = state.composerMode;
  dismiss.setAttribute("aria-label", `Exit ${indicator.textContent} mode`);
  dismiss.setAttribute("title", `Exit ${indicator.textContent} mode`);
}

function updateCodexModeMenu() {
  const screen = app.querySelector(".practice-screen");
  const existing = screen?.querySelector(".codex-mode-menu");

  if (!state.modeMenuOpen || !screen) {
    existing?.remove();
    syncNativeComposerMode();
    return;
  }

  const template = document.createElement("template");
  template.innerHTML = renderCodexModeMenu().trim();
  const menu = template.content.firstElementChild;
  if (!menu) return;
  if (existing) existing.replaceWith(menu);
  else screen.append(menu);
  syncNativeComposerMode();
}

function openCodexModeMenu(anchor) {
  if (state.modeMenuOpen) {
    closeCodexModeMenu();
    return;
  }

  const bounds = anchor.getBoundingClientRect();
  state.modeMenuAnchor = { x: Math.round(bounds.left), y: Math.round(bounds.top - 8) };
  state.modeMenuOpen = true;
  state.hintsOpen = false;
  state.learnMoreOpen = false;
  updateCodexModeMenu();
  app.querySelector(".codex-mode-menu [role^=menuitem]")?.focus();
}

function closeCodexModeMenu(restoreFocus = false) {
  state.modeMenuOpen = false;
  updateCodexModeMenu();
  if (restoreFocus) nativeCodexShadow()?.querySelector('button[aria-label="Add files and more"]')?.focus();
}

function selectCodexMode(mode) {
  if (!["agent", "plan", "goal"].includes(mode)) return false;

  const planWasActive = state.planMode === true;
  state.composerMode = mode;
  state.planMode = mode === "plan";
  if (!planWasActive && state.planMode
    && state.hostedPreview !== true
    && typeof STEPS !== "undefined"
    && STEPS[state.currentIndex]?.id === "plan"
    && state.planDraftReady !== true
    && (typeof isComplete !== "function" || !isComplete("plan"))) {
    state.expandedPracticeTask = null;
  }
  state.modeMenuOpen = false;
  state.validationMessage = "";
  refreshCurrentLab();
  syncNativeComposerMode();
  nativeCodexShadow()?.querySelector("textarea")?.focus();
  return true;
}

function togglePlanMode() {
  return selectCodexMode(state.planMode ? "agent" : "plan");
}

function toggleGoalMode() {
  return selectCodexMode(state.composerMode === "goal" ? "agent" : "goal");
}

// Mirrors the app's review-mode slash-command submenu: select a base branch.
let reviewCommandMenuCleanup = null;
function closeReviewCommandMenu() {
  reviewCommandMenuCleanup?.();
  reviewCommandMenuCleanup = null;
  state.reviewCommandMenu = "";
  app.querySelector("[data-review-command-menu]")?.remove();
}

function highlightReviewCommand(menu, index) {
  const items = [...menu.querySelectorAll("button")];
  const selected = (index + items.length) % items.length;
  items.forEach((item, itemIndex) => {
    if (itemIndex === selected) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
  items[selected]?.scrollIntoView?.({ block: "nearest" });
}

function reviewCommandMenuContent(phase, query = "") {
  if (phase === "branches") return `<button type="button" role="menuitem" tabindex="-1" data-action="review-uncommitted">Review uncommitted changes</button>
    <div role="group" aria-label="Review against a base branch">
      <p class="codex-review-command-section">Review against a base branch</p>
      <button type="button" role="menuitem" tabindex="-1" data-action="review-base-branch" data-branch="staging">staging</button>
      <button type="button" role="menuitem" tabindex="-1" data-action="review-base-branch" data-branch="main">main</button>
    </div>`;
  const match = query.trim().replace(/^\//, "").toLowerCase();
  const title = match && "review".startsWith(match)
    ? `<span class="codex-review-command-muted">Code </span>${escapeHtml(match)}<span class="codex-review-command-muted">${escapeHtml("review".slice(match.length))}</span>`
    : "Code review";
  return `<button type="button" role="menuitem" tabindex="-1" data-action="review-command-options">
    <span class="codex-review-command-icon">${appIcons.review}</span>
    <span class="codex-review-command-title">${title}</span>
    <span class="codex-review-command-description">Review uncommitted changes or compare against a branch</span>
  </button>`;
}

function showReviewCommandMenu(phase = "command", textarea = nativeCodexShadow()?.querySelector("textarea") || app.querySelector("#composer-input")) {
  if (!textarea || verificationComposerBlocked() || state.isRunning || STEPS[state.currentIndex]?.id !== "test") return false;
  closeReviewCommandMenu();
  state.reviewCommandMenu = phase;
  const menu = document.createElement("div");
  menu.className = "codex-review-command-menu";
  menu.dataset.reviewCommandMenu = phase;
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", phase === "command" ? "Slash commands" : "Code review");
  menu.innerHTML = reviewCommandMenuContent(phase, textarea.value);
  const anchor = textarea.closest('[class*="rounded-3xl"]') || textarea.closest(".composer") || textarea;
  const position = () => {
    if (!textarea.isConnected) return closeReviewCommandMenu();
    const bounds = anchor.getBoundingClientRect();
    const width = Math.min(bounds.width, window.innerWidth - 24);
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12))}px`;
    menu.style.bottom = `${Math.max(12, window.innerHeight - bounds.top + 8)}px`;
    menu.style.maxHeight = `${Math.max(32, Math.min(320, bounds.top - 20))}px`;
  };
  const dismiss = (event) => {
    const path = event.composedPath();
    if (!path.includes(menu) && !path.includes(anchor)) closeReviewCommandMenu();
  };
  // The app highlights suggestions while keeping typing focus in the composer.
  menu.addEventListener("mousedown", (event) => event.preventDefault());
  menu.addEventListener("mousemove", (event) => {
    const item = event.target.closest("button");
    if (item) highlightReviewCommand(menu, [...menu.querySelectorAll("button")].indexOf(item));
  });
  app.querySelector(".practice-screen")?.append(menu);
  position();
  highlightReviewCommand(menu, 0);
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, true);
  document.addEventListener("pointerdown", dismiss, true);
  reviewCommandMenuCleanup = () => {
    window.removeEventListener("resize", position);
    window.removeEventListener("scroll", position, true);
    document.removeEventListener("pointerdown", dismiss, true);
  };
  return true;
}

function syncReviewCommandInput(textarea) {
  if (STEPS[state.currentIndex]?.id !== "test") return;
  if (/^\/(?:r(?:e(?:v(?:i(?:e(?:w)?)?)?)?)?)?$/i.test(textarea.value.trim())) {
    if (!state.reviewCommandMenu) showReviewCommandMenu("command", textarea);
    else if (state.reviewCommandMenu === "command") {
      const menu = app.querySelector("[data-review-command-menu]");
      if (menu) {
        menu.innerHTML = reviewCommandMenuContent("command", textarea.value);
        highlightReviewCommand(menu, 0);
      }
    }
  } else closeReviewCommandMenu();
}

function handleReviewCommandKeydown(event) {
  if (!state.reviewCommandMenu) return false;
  const menu = app.querySelector("[data-review-command-menu]");
  if (!menu) return false;
  const items = [...menu.querySelectorAll("button")];
  if (event.key === "Escape") {
    event.preventDefault(); event.stopImmediatePropagation();
    closeReviewCommandMenu();
    (nativeCodexShadow()?.querySelector("textarea") || app.querySelector("#composer-input"))?.focus();
    return true;
  }
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault(); event.stopImmediatePropagation();
    const current = items.findIndex((item) => item.getAttribute("aria-current") === "true");
    const index = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
    highlightReviewCommand(menu, index);
    return true;
  }
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault(); event.stopImmediatePropagation();
    items.find((item) => item.getAttribute("aria-current") === "true")?.click();
    return true;
  }
  if (event.key === "Tab") closeReviewCommandMenu();
  return false;
}

function handleCodexModeCommand(prompt) {
  if (prompt.trim().toLowerCase() === "/review") {
    showReviewCommandMenu("branches");
    return true;
  }
  const match = prompt.trim().match(/^\/(agent|plan|goal)(?:\s+([\s\S]*))?$/i);
  if (!match) return false;

  const mode = match[1].toLowerCase();
  const remainingPrompt = (match[2] || "").trim();
  if (!selectCodexMode(mode)) return false;

  pendingCodexMiniPrompt = remainingPrompt;
  if (setNativeCodexPrompt(remainingPrompt)) pendingCodexMiniPrompt = "";
  else {
    const fallback = app.querySelector("#composer-input");
    if (fallback) {
      fallback.value = remainingPrompt;
      fallback.focus();
    }
  }
  return true;
}

function installTrainingPlugin(shadow, id) {
  if (id === "slack") {
    const step = STEPS[state.currentIndex];
    if (step?.id !== "pr" || practiceTaskCount(step) !== 1 || state.isRunning) return false;
    state.slackConnected = true;
    markPracticeTask("pr", 2);
    saveState();
    syncTrainingPluginCatalogState(shadow);
    return true;
  }
  if (id !== "linear") {
    state.catalogInstalledPlugins ||= new Set();
    state.catalogInstalledPlugins.add(id);
    syncTrainingPluginCatalogState(shadow);
    return true;
  }
  const step = STEPS[state.currentIndex];
  if (step?.id !== "connect" || isComplete("connect") || state.linearConnected === true
    || practiceTaskCount(step) < 1 || state.hostedPreview === true) return false;
  state.linearConnected = true;
  if (!markPracticeTask("connect", 2)) { state.linearConnected = false; return false; }
  syncTrainingPluginCatalogState(shadow);
  const destination = shadow.querySelector?.('aside button[data-kind="sidebarMeta"]')
    || Array.from(shadow.querySelectorAll?.('aside button') || []).find((button) => button.textContent?.trim() === "New chat");
  pendingCodexMiniPrompt = "";
  destination?.click();
  return true;
}

const nativePluginCatalogStyles = `
  [data-codex-mini-plugins] { position: relative; display: flex; flex-direction: column; min-height: 0; padding: 0 !important; overflow: hidden !important; }
  [data-codex-mini-plugins] > :not([data-training-plugin-page]) { display: none !important; }
  [data-training-plugin-page] { display: flex; flex: 1; flex-direction: column; min-height: 0; height: 100%; color: var(--foreground); background: var(--background); container-type: inline-size; }
  .training-plugin-topbar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; flex-shrink: 0; }
  .training-plugin-topbar button { width: 28px; height: 28px; padding: 4px; background: transparent; color: var(--muted-foreground); border: 0; }
  .training-plugin-scroll { flex: 1; min-height: 0; overflow: auto; }
  header[data-training-plugin-header-hidden] { display: none !important; }
`;

function renderTrainingPluginCatalog() {
  return `<section data-training-plugin-page aria-label="Plugins">
    <header class="training-plugin-topbar">
      <button type="button" aria-label="Open sidebar" data-training-open-sidebar>${icon("panel")}</button>
      <div class="training-plugin-tabs" aria-hidden="true"><span data-selected="true">Plugins</span><span>Skills</span></div>
    </header>
    <div class="training-plugin-scroll">${pluginCatalogHtml}</div>
  </section>`;
}

function syncTrainingPluginCatalogState(root) {
  const page = root.querySelector?.("[data-training-plugin-page]");
  if (!page) return;
  const installed = new Set(state.catalogInstalledPlugins || []);
  if (state.linearConnected === true || state.preparedSteps?.includes("connect")) installed.add("linear");
  if (state.slackConnected === true) installed.add("slack");
  const key = [...installed].sort().join(",");
  if (page.dataset.installed === key) return;
  page.dataset.installed = key;
  const icons = page.querySelector(".training-plugin-installed-icons");
  icons.replaceChildren();
  if (!installed.size) {
    const empty = document.createElement("p");
    empty.textContent = "No plugins installed yet";
    icons.append(empty);
  }
  for (const button of page.querySelectorAll("[data-plugin-install]")) {
    const connected = installed.has(button.dataset.pluginInstall);
    const name = button.getAttribute("aria-label").replace(/^(?:Install|Installed) /, "");
    button.disabled = connected;
    button.setAttribute("aria-label", `${connected ? "Installed" : "Install"} ${name}`);
    button.innerHTML = connected ? pluginInstalledIcon + "Installed" : "Install";
    if (!connected) continue;
    const artwork = button.closest("article").querySelector(".training-plugin-icon").cloneNode(true);
    artwork.removeAttribute("aria-hidden");
    artwork.setAttribute("aria-label", button.getAttribute("aria-label").replace(/^Installed /, ""));
    icons.append(artwork);
  }
}

function syncNativePluginCatalog(shadow) {
  const catalog = shadow.querySelector("[data-codex-mini-plugins]");
  const frame = app.querySelector?.(".practice-codex-frame");
  if (frame) frame.dataset.courseCatalog = String(Boolean(catalog));
  const header = shadow.querySelector("section")?.previousElementSibling;
  if (header?.tagName === "HEADER") {
    if (catalog && !header.hasAttribute("data-training-plugin-header-hidden")) header.setAttribute("data-training-plugin-header-hidden", "");
    else if (!catalog) header.removeAttribute("data-training-plugin-header-hidden");
  }
  if (!catalog) return;
  if (!shadow.querySelector("[data-training-catalog-style]")) {
    const style = document.createElement("style");
    style.dataset.trainingCatalogStyle = "true";
    style.textContent = pluginCatalogStyles + nativePluginCatalogStyles;
    shadow.append(style);
  }
  if (!catalog.querySelector("[data-training-plugin-page]")) {
    catalog.insertAdjacentHTML("beforeend", renderTrainingPluginCatalog());
  }
  const sidebarIcon = shadow.querySelector('button[aria-label="Toggle sidebar"] svg');
  const sidebarToggle = catalog.querySelector("[data-training-open-sidebar]");
  if (sidebarIcon && sidebarToggle && !sidebarToggle.dataset.trainingSidebarIcon) {
    sidebarToggle.dataset.trainingSidebarIcon = "true";
    sidebarToggle.replaceChildren(sidebarIcon.cloneNode(true));
  }
  syncTrainingPluginCatalogState(shadow);
}

function syncNativeScheduledLayout(shadow) {
  const search = shadow.querySelector('input[aria-label="Search scheduled tasks"]');
  const controls = search?.closest("label")?.parentElement;
  const page = controls?.parentElement;
  if (!page || page.dataset.trainingScheduledPage) return;
  page.dataset.trainingScheduledPage = "true";
  controls.dataset.trainingScheduledControls = "true";
  const sidebarIcon = shadow.querySelector('button[aria-label="Toggle sidebar"] svg');
  if (sidebarIcon) {
    const sidebarToggle = document.createElement("button");
    sidebarToggle.type = "button";
    sidebarToggle.className = "training-scheduled-sidebar-toggle";
    sidebarToggle.dataset.trainingOpenSidebar = "true";
    sidebarToggle.setAttribute("aria-label", "Open sidebar");
    sidebarToggle.append(sidebarIcon.cloneNode(true));
    page.querySelector("header").prepend(sidebarToggle);
  }
  if (shadow.querySelector("[data-training-scheduled-style]")) return;

  const style = document.createElement("style");
  style.dataset.trainingScheduledStyle = "true";
  style.textContent = `
    [data-training-scheduled-page] { max-width: 800px; padding: 24px 24px 32px; container-type: inline-size; }
    [data-training-scheduled-page] > header h1 { font-size: 28px; font-weight: 400; line-height: 1.25; }
    [data-training-scheduled-page] > header p { margin-top: 8px; line-height: 1.5; }
    .training-scheduled-sidebar-toggle { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; margin-bottom: 12px; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--muted-foreground); }
    .training-scheduled-sidebar-toggle:hover { background: var(--muted); }
    .training-scheduled-sidebar-toggle:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
    [data-training-scheduled-controls] { display: grid; grid-template-columns: minmax(0, 1fr) auto; row-gap: 24px; margin-top: 20px; }
    [data-training-scheduled-controls] > label { grid-column: 1 / -1; min-width: 0; }
    [data-training-scheduled-controls] input { border-radius: 999px; }
    [data-training-scheduled-controls] > [role="group"] { justify-self: start; padding: 0; background: transparent; }
    [data-training-scheduled-controls] [aria-pressed] { font-size: 14px; font-weight: 400; box-shadow: none; }
    [data-training-scheduled-controls] [aria-pressed="true"] { background: var(--muted); }
    [data-training-scheduled-page] > [role="list"] { margin-top: 12px; }
    [data-training-scheduled-page] [role="listitem"] { min-height: 64px; }
    [data-training-scheduled-page] [role="listitem"] .text-foreground { font-weight: 400; }
    @container (max-width: 460px) {
      [data-training-scheduled-controls] { grid-template-columns: minmax(0, 1fr); row-gap: 12px; }
      [data-training-scheduled-controls] > button { justify-self: start; }
    }
  `;
  shadow.append(style);
}

function setNativeCodexPrompt(prompt) {
  const textarea = nativeCodexShadow()?.querySelector("textarea");
  if (!textarea) return false;

  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(textarea, prompt);
  else textarea.value = prompt;
  textarea.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  textarea.focus();
  return true;
}

function clearNativeCodexPrompt() {
  pendingCodexMiniPrompt = "";
  setNativeCodexPrompt("");
  const fallback = app.querySelector("#composer-input");
  if (fallback) fallback.value = "";
}

function scrollNativeThreadToBottom(afterScroll, shouldScroll) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (typeof shouldScroll === "function" && !shouldScroll()) return;
      const fallback = app.querySelector?.(".codex-mini-fallback .codex-messages");
      if (fallback && fallback.scrollHeight > fallback.clientHeight) {
        fallback.scrollTop = fallback.scrollHeight;
      }
      const shadow = nativeCodexShadow();
      if (shadow) {
        for (const container of shadow.querySelectorAll(".overflow-auto, [data-codex-mini-thread-scroll]")) {
          if (container.scrollHeight > container.clientHeight) container.scrollTop = container.scrollHeight;
        }
      }
      if (typeof afterScroll === "function") afterScroll();
    });
  });
}

function practiceThreadScrollAllowed(step) {
  return Boolean(step
    && typeof hasStartedCodexTask === "function"
    && hasStartedCodexTask(step)
    && !(step.id === "pr" && state.restoredPublishedThreadScrollPending === true));
}

function settlePracticeThreadAtBottom(step, workspace) {
  if (!step || state.pendingPracticeThreadScroll !== step.id) return false;

  const route = state.practiceThreadScrollRoute;
  const current = () => state.pendingPracticeThreadScroll === step.id
    && state.phase === "practice"
    && STEPS[state.currentIndex] === step
    && state.practiceThreadScrollRoute === route
    && location.hash === route
    && workspace?.isConnected !== false
    && (!app.querySelector?.(".codex-mini-live")
      || app.querySelector(".codex-mini-live") === workspace)
    && ["ready", "fallback"].includes(workspace?.dataset?.codexMiniState);

  if (!current()) {
    state.pendingPracticeThreadScroll = "";
    return false;
  }

  if (workspace.__learnPracticeThreadScroll === route) return true;
  workspace.__learnPracticeThreadScroll = route;
  scrollNativeThreadToBottom(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const waitingForLocalWorkspace = state.hostedPreview !== true
          && typeof codexWorkspaceBootstrap !== "undefined"
          && Boolean(codexWorkspaceBootstrap)
          && typeof verifiedCodexWorkspace === "function"
          && !verifiedCodexWorkspace();
        if (current() && !waitingForLocalWorkspace) state.pendingPracticeThreadScroll = "";
        if (workspace.__learnPracticeThreadScroll === route) {
          delete workspace.__learnPracticeThreadScroll;
        }
      });
    });
  }, current);
  return true;
}

function restoredPublishedThreadSurface() {
  const root = nativeCodexShadow() || app.querySelector?.(".codex-mini-fallback");
  if (!root?.querySelectorAll) return null;

  const targets = [...root.querySelectorAll("div, article, section")]
    .filter((element) => {
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();
      return /\b(?:created (?:PR|pull request) #\d+|completed training PR #\d+|training PR prepared\b|training pull request #\d+ prepared)\b/i.test(text)
        || /https:\/\/github\.com\/openai\/blossom-bank-demo-01\/pull\/\d+\b/i.test(text);
    })
    .sort((left, right) => (left.textContent || "").length - (right.textContent || "").length);

  for (const target of targets) {
    let container = target.parentElement;
    while (container && container !== root) {
      if (container.clientHeight > 0 && container.scrollHeight > container.clientHeight) {
        return { root, target, container };
      }
      container = container.parentElement;
    }
  }
  return null;
}

function restoredPublishedThreadTargetVisible(surface) {
  if (!surface?.target?.getBoundingClientRect || !surface?.container?.getBoundingClientRect) return false;
  const target = surface.target.getBoundingClientRect();
  const container = surface.container.getBoundingClientRect();
  return target.width > 0
    && target.height > 0
    && target.bottom > container.top
    && target.top < container.bottom;
}

function settleRestoredPublishedThreadAtBottom(step) {
  if (step?.id !== "pr"
    || state.restoredPublishedThreadScrollPending !== true
    || restoredPublishedThreadScrollCleanup) return false;

  let active = true;
  let scheduled = false;
  let checks = 0;
  const maximumChecks = 16;
  const observedRoots = new Set();
  const observedElements = new Set();
  const mutationObservers = [];
  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => schedule())
    : null;
  let cleanupTimer = 0;

  const stillCurrent = () => state.phase === "practice"
    && STEPS[state.currentIndex] === step;

  const finish = () => {
    if (!active) return;
    active = false;
    for (const observer of mutationObservers) observer.disconnect();
    resizeObserver?.disconnect();
    if (cleanupTimer) window.clearTimeout(cleanupTimer);
    state.restoredPublishedThreadScrollPending = false;
    restoredPublishedThreadScrollCleanup = null;
  };

  const observeRoot = (root) => {
    if (!root || observedRoots.has(root) || typeof MutationObserver !== "function") return;
    const observer = new MutationObserver(() => schedule());
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    observedRoots.add(root);
    mutationObservers.push(observer);
  };

  const observeSurface = (surface) => {
    if (!resizeObserver || !surface) return;
    for (const element of [surface.container, surface.target]) {
      if (!element || observedElements.has(element)) continue;
      observedElements.add(element);
      resizeObserver.observe(element);
    }
  };

  const confirm = () => {
    scheduled = false;
    if (!active) return;
    if (!stillCurrent()) {
      finish();
      return;
    }

    checks += 1;
    const surface = restoredPublishedThreadSurface();
    observeRoot(surface?.root || nativeCodexShadow() || app.querySelector?.(".codex-mini-fallback"));
    observeSurface(surface);
    if (surface?.container.scrollHeight > surface?.container.clientHeight) {
      surface.container.scrollTop = surface.container.scrollHeight;
    }
    if (surface && restoredPublishedThreadTargetVisible(surface)) {
      state.restoredPublishedThreadScrollPending = false;
      return;
    }
    if (checks >= maximumChecks) {
      finish();
      return;
    }
    schedule();
  };

  function schedule() {
    if (!active || scheduled) return;
    scheduled = true;
    scrollNativeThreadToBottom(confirm);
  }

  restoredPublishedThreadScrollCleanup = finish;
  observeRoot(nativeCodexShadow() || app.querySelector?.(".codex-mini-fallback"));
  cleanupTimer = window.setTimeout(finish, 800);
  schedule();
  return true;
}

function renderDesktopWindowbar(step) {
  const selectingProject = step.id === "project"
    && !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace());
  const taskStarted = typeof hasStartedCodexTask === "function"
    ? hasStartedCodexTask(step)
    : Boolean((state.isRunning && state.pendingConversation?.prompt?.trim())
      || (state.conversations?.[step.id] || []).some((exchange) => exchange?.prompt?.trim() && exchange?.response?.trim()));
  const taskTitle = taskStarted && typeof codexTaskTitle === "function"
    ? codexTaskTitle(step)
    : "New chat";

  return `
    <header class="workspace-toolbar desktop-windowbar">
      <div class="desktop-project-identity desktop-project-selector" title="Current Codex task">
        <span class="desktop-task-context">${escapeHtml(taskTitle)}</span>
        ${taskStarted ? `<span class="desktop-project-icon">${icon("folder")}</span><span class="desktop-project-name">${escapeHtml(COURSE.repo)}</span>` : ""}
      </div>
      <div class="desktop-window-actions">
        <button class="desktop-environment-toggle" type="button" data-action="toggle-environment" data-codex-environment-toggle="true" aria-label="Toggle environment sidebar" aria-controls="codex-environment-panel" aria-expanded="${!selectingProject && state.environmentOpen === true}" title="${selectingProject ? "Select a project to view its environment" : "Environment"}"${selectingProject ? " disabled" : ""}>${codexEnvironmentIcon("environment")}</button>
        <button class="desktop-environment-toggle desktop-files-toggle" type="button" data-action="toggle-inspector" data-codex-files-toggle="true" aria-label="Toggle side panel" aria-pressed="${state.inspectorOpen === true}">${codexEnvironmentIcon(state.inspectorOpen === true ? "panel-open" : "panel-closed")}</button>
      </div>
    </header>`;
}

function renderProjectRail(step) {
  const artifactActive = state.activeTab === "artifact";
  const pluginsActive = state.fallbackPluginsOpen === true;
  const projectSelected = step.id !== "project"
    || (typeof verifiedCodexWorkspace === "function" && Boolean(verifiedCodexWorkspace()));
  const taskStarted = typeof hasStartedCodexTask === "function"
    ? hasStartedCodexTask(step)
    : Boolean((state.isRunning && state.pendingConversation?.prompt?.trim())
      || (state.conversations?.[step.id] || []).some((exchange) => exchange?.prompt?.trim() && exchange?.response?.trim()));
  const taskTitle = taskStarted && typeof codexTaskTitle === "function"
    ? codexTaskTitle(step)
    : "New chat";
  const ticketDiscovered = taskTitle === LINEAR_ISSUE.title;
  const projectName = typeof state.projectDisplayName === "string" && state.projectDisplayName.trim()
    ? state.projectDisplayName.trim() : "Blossom Bank";

  return `
    <style>${projectActionStyles}</style>
    <nav class="project-rail" aria-label="Codex project navigation">
      <div class="project-rail-header">
        <span class="project-rail-icon"><img class="codex-product-mark" src="./codex-mark.png" alt="" aria-hidden="true" /></span>
        <span class="project-rail-label">Codex</span>
        ${icon("chevron-down", "project-rail-product-chevron")}
      </div>
      <button class="project-rail-item project-rail-new-chat project-rail-new-task" type="button" data-action="focus-thread" title="Start a new Codex task">
        <span class="project-rail-icon">${icon("sparkle")}</span>
        <span class="project-rail-label">New chat</span>
      </button>
      <button class="project-rail-item${pluginsActive ? " active" : ""}" type="button" data-action="switch-tab" data-tab="artifact" title="Plugins">
        <span class="project-rail-icon">${icon("plug")}</span>
        <span class="project-rail-label">Plugins</span>
      </button>
      <button class="project-rail-item" type="button" data-action="focus-thread" title="Scheduled tasks">
        <span class="project-rail-icon">${icon("clock")}</span>
        <span class="project-rail-label">Scheduled</span>
      </button>
      <div class="project-rail-section">
        <span class="project-rail-label project-rail-section-title">Projects</span>
        ${step.id === "project" && !projectSelected
          ? `<button class="project-rail-add" type="button" data-action="start-project" data-codex-project-action="start-project" aria-label="Add new project" title="Add new project"${state.projectSelecting ? " disabled" : ""}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11"/></svg></button>`
          : ""}
      </div>
      ${projectSelected ? `<div class="project-rail-item project-rail-project training-project-row" title="${escapeHtml(COURSE.repo)}">
        <span class="project-rail-icon">${icon("folder")}</span>
        <span class="project-rail-label">${escapeHtml(projectName)}</span>
        <button class="training-project-new-thread project-rail-new-chat" type="button" data-action="new-verification-thread" data-codex-project-action="new-thread" aria-label="New thread in ${escapeHtml(projectName)}"${state.isRunning ? " disabled" : ""}>${projectComposeIcon}</button>
      </div>` : ""}
      ${projectSelected && isVerificationLesson(step) ? [
        ["eng-248", "Shorten the homepage heading"],
        ...(hasStartedCodexTask(step, "eng-248-verify") ? [["eng-248-verify", "Verify the homepage change"]] : []),
      ].map(([id, title]) => `<button class="project-rail-item project-rail-thread${activeCodexThreadId(step) === id && !pluginsActive ? " active" : ""}" type="button" data-action="select-training-thread" data-thread="${id}"><span class="project-rail-icon">${icon("ticket")}</span><span class="project-rail-label">${title}</span></button>`).join("") : projectSelected && step.id !== "project" && taskStarted ? `<button class="project-rail-item project-rail-thread${artifactActive && !pluginsActive && step.id !== "connect" ? " active" : ""}" type="button" data-action="switch-tab" data-tab="artifact" title="${escapeHtml(ticketDiscovered ? `${LINEAR_ISSUE.id} · ${taskTitle}` : taskTitle)}">
        <span class="project-rail-icon">${icon("ticket")}</span>
        <span class="project-rail-label">${escapeHtml(taskTitle)}${ticketDiscovered ? ` <span class="project-rail-thread-meta">${escapeHtml(LINEAR_ISSUE.id)}</span>` : ""}</span>
      </button>` : ""}
    </nav>`;
}

function renderThreadHeader(step) {
  const status = state.isRunning ? "Working" : isComplete(step.id) ? "Completed" : "Ready";
  const branch = activeCourseBranch();
  const selectingProject = step.id === "project"
    && !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace());
  const taskStarted = typeof hasStartedCodexTask === "function"
    ? hasStartedCodexTask(step)
    : Boolean((state.isRunning && state.pendingConversation?.prompt?.trim())
      || (state.conversations?.[step.id] || []).some((exchange) => exchange?.prompt?.trim() && exchange?.response?.trim()));
  const taskTitle = taskStarted && typeof codexTaskTitle === "function"
    ? codexTaskTitle(step)
    : "New chat";

  return `
    <header class="thread-header">
      <div class="thread-heading">
        <span class="thread-title">${escapeHtml(taskTitle)}</span>
        ${selectingProject ? "" : `<span class="thread-subtitle">${escapeHtml(COURSE.repository.name)}</span>`}
      </div>
      <div class="thread-header-actions">
        <span class="thread-status-label">${status}</span>
        ${selectingProject ? "" : `<span class="thread-context" title="${escapeHtml(branch)}">
          ${icon("code")} <span>${escapeHtml(branch)}</span>
        </span>`}
      </div>
    </header>`;
}

function renderComposer(step) {
  if (typeof planImplementationRequestPending === "function"
    && planImplementationRequestPending(step)
    && typeof renderCodexPlanImplementationRequest === "function") {
    return renderCodexPlanImplementationRequest(step);
  }

  const configuredModel = state.codexModel || "gpt-5.6-sol";
  const reasoning = {
    none: "None",
    minimal: "Minimal",
    low: "Light",
    medium: "Medium",
    high: "High",
    xhigh: "Extra High",
    max: "Max",
    ultra: "Ultra",
  }[state.codexReasoningEffort || "xhigh"] || state.codexReasoningEffort || "Extra High";
  const branch = activeCourseBranch();
  const modelLabel = configuredModel
    .replace(/^gpt-/i, "")
    .replace(/-([a-z])/gi, (_, letter) => ` ${letter.toUpperCase()}`);
  const placeholder = state.planMode
    ? "Describe your task to generate a plan..."
    : "Do anything";
  const selectingProject = step.id === "project"
    && !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace());
  const pendingReviewAttachment = typeof pendingDiffCommentAttachment === "function"
    ? pendingDiffCommentAttachment()
    : { snapshots: [] };
  return `
    <form class="composer desktop-composer" id="codex-composer">
      <div class="composer-project-shelf" aria-label="Project context">
        ${selectingProject
          ? `<button class="composer-project" type="button" data-action="choose-project"${state.projectSelecting ? ' aria-busy="true" disabled' : ""}>${icon("folder")} <span>Choose project</span></button>`
          : `<span class="composer-project">${icon("folder")} <span>${escapeHtml(typeof state.projectDisplayName === "string" && state.projectDisplayName.trim() ? state.projectDisplayName.trim() : "Blossom Bank")}</span></span>
        <span class="composer-context composer-local" title="Local environment">${icon("terminal")} <span>Local</span></span>
        <span class="composer-branch" title="Current branch: ${escapeHtml(branch)}">${icon("git-pull")} <span>${escapeHtml(branch)}</span></span>`}
      </div>
      <div class="composer-editor">
        ${pendingReviewAttachment.snapshots?.length
          ? `<div class="codex-review-comments-rail" data-codex-review-comments-rail="pending">${renderReviewCommentsAttachment(pendingReviewAttachment.snapshots, { id: "pending" })}</div>`
          : ""}
        <label class="sr-only" for="composer-input">Message Codex</label>
        <textarea class="composer-input" id="composer-input" rows="1" placeholder="${escapeHtml(placeholder)}" ${state.isRunning || verificationComposerBlocked(step) ? "disabled" : ""}></textarea>
        <div class="composer-controls">
          <div class="composer-controls-start">
            <span class="composer-tool" title="Project context">${icon("folder")}</span>
            ${step.id === "plan"
              ? `<button class="mode-toggle composer-mode${state.planMode ? " active" : ""}" type="button" data-action="toggle-plan" aria-pressed="${state.planMode}" title="Toggle Plan mode">${icon("list")} <span>Plan</span></button>`
              : `<span class="composer-mode">${icon("sparkle")} <span>Agent</span></span>`}
          </div>
          <div class="composer-model-picker" aria-label="Model: ${escapeHtml(modelLabel)} ${escapeHtml(reasoning)}">
            <span class="composer-model">${escapeHtml(modelLabel)}</span>
            <span class="composer-reasoning">${escapeHtml(reasoning)}</span>
            ${icon("chevron-down")}
          </div>
          <div class="composer-controls-end">
            ${state.isRunning
              ? `<button class="send-button" type="button" data-action="stop-generation" aria-label="Stop">${icon("close")}</button>`
              : `<button class="send-button" type="submit" aria-label="Send message"${pendingReviewAttachment.snapshots?.length ? "" : " disabled"}>${icon("arrow-up")}</button>`}
          </div>
        </div>
      </div>
    </form>`;
}

function renderCompletion() {
  const courseComplete = STEPS.every((step) => isComplete(step.id));
  return `
    <div class="course-completion">
      <h3>${courseComplete ? "You completed the course" : "Your training PR is ready"}</h3>
      <p>${courseComplete
        ? "You read the Linear ticket, reviewed the final source, and prepared a training PR record."
        : "Finish the remaining lessons to complete the course."}</p>
      <button class="restart-button" type="button" data-action="${courseComplete ? "confirm-restart" : "resume-course"}">${courseComplete ? "Restart the course" : "Finish remaining lessons"}</button>
    </div>`;
}

function artifactLabel(step) {
  return {
    project: "Project files",
    connect: "Plugins",
    ticket: "Repository setup",
    plan: "Plan",
    build: "Live preview",
    review: "Review",
    test: "Verification",
    pr: "Pull request",
  }[step.id];
}

function renderWorkspaceTab(id, name, label, selectedOverride) {
  const selected = typeof selectedOverride === "boolean"
    ? selectedOverride
    : state.activeTab === id || (id === "files" && !["diff", "browser", "plan"].includes(state.activeTab));
  const title = id === "browser" ? ' title="Blossom Bank | Banking that sees the bigger picture"' : "";
  const tab = `<button class="${selected ? "active" : ""}" type="button" role="tab" aria-selected="${selected}" data-action="switch-tab" data-tab="${id}"${title}>${codexRepositoryTabContent(name, label)}</button>`;
  return `<span class="codex-repo-tab-controller">${tab}</span>`;
}

function renderWorkspaceContent(step, browserSelected = false) {
  if (state.activeTab === "plan" && state.planPanelOpen === true) return renderCodexPlanPanel();
  if (state.activeTab === "browser" || browserSelected) return renderPreview();
  if (state.activeTab === "diff") return renderDiff();
  return renderFiles();
}

function renderFallbackPlugins() {
  return `<style>${pluginCatalogStyles}${nativePluginCatalogStyles}</style>${renderTrainingPluginCatalog()}`;
}

function renderIntegration() {
  const connected = state.linearConnected === true;

  return `
    <section class="inspector-document integration-context" aria-label="Connected project tools">
      <header class="inspector-document-header">
        <h3>Project tools</h3>
        <p>Available to this task</p>
      </header>
      ${renderIntegrationRows(connected)}
    </section>`;
}

function renderIntegrationRows(connected) {
  return `
    <div class="integration-context-row">
      <span class="integration-app-icon">${icon("plug")}</span>
      <span class="integration-context-copy">
        <span class="integration-context-name">Linear</span>
        <span class="integration-context-meta">Linear · Blossom Bank</span>
      </span>
      <span class="integration-status-row${connected ? " connected" : ""}">${connected ? "Connected" : "Not connected"}</span>
    </div>
    <div class="integration-context-row integration-permission-row">
      <span class="integration-app-icon">${icon("shield")}</span>
      <span class="integration-context-copy">
        <span class="integration-context-name">Access</span>
        <span class="integration-context-meta">Read-only · Assigned issues</span>
      </span>
    </div>
    ${connected
      ? isComplete("connect")
        ? `<div class="integration-issue-row">${icon("ticket")} <span>${escapeHtml(LINEAR_ISSUE.id)} · ${escapeHtml(LINEAR_ISSUE.title)}</span></div>`
        : `<div class="integration-issue-row">${icon("check")} <span>Connected. Ask Codex to find your tickets.</span></div>`
      : `<button class="integration-context-action" type="button" data-action="connect-linear">Connect Linear</button>`}`;
}

function renderIssue() {
  return `
    <div class="issue-breadcrumb">${escapeHtml(LINEAR_ISSUE.project)} ${icon("chevron-right")} Sprint 14</div>
    <article class="linear-card issue-details">
      <div class="issue-topline"><span class="linear-key">${escapeHtml(LINEAR_ISSUE.id)}</span><span class="pill warning">${escapeHtml(LINEAR_ISSUE.priority)}</span></div>
      <h3>${escapeHtml(LINEAR_ISSUE.title)}</h3>
      <p>${escapeHtml(LINEAR_ISSUE.description)}</p>
      <div class="issue-section"><h4>User story</h4><p>${escapeHtml(LINEAR_ISSUE.userStory)}</p></div>
      <div class="issue-section"><h4>Acceptance criteria</h4><ul class="issue-criteria">${LINEAR_ISSUE.acceptanceCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
      <div class="linear-meta"><span>${escapeHtml(LINEAR_ISSUE.estimate)}</span><span>·</span><span>${escapeHtml(LINEAR_ISSUE.status)}</span></div>
      <div class="issue-labels">${LINEAR_ISSUE.labels.map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("")}</div>
    </article>`;
}

function renderRepositoryPreparation() {
  const prepared = isComplete("ticket");
  const currentBranch = activeCourseBranch();
  const base = COURSE.repository.defaultBranch;
  const featureBranch = COURSE.repository.workingBranch;

  return `
    <article class="linear-card issue-details repository-preparation" aria-label="Repository preparation">
      <div class="issue-topline"><span class="linear-key">${escapeHtml(COURSE.repo)}</span><span class="pill${prepared ? " success" : ""}">${prepared ? "Ready" : "Setup needed"}</span></div>
      <h3>Prepare the repository for ENG-248</h3>
      <p>Check the local repository before changing any code.</p>
      <div class="issue-section"><h4>Current branch</h4><p><code>${escapeHtml(currentBranch)}</code></p></div>
      <div class="issue-section"><h4>Local base</h4><p><code>${escapeHtml(base)}</code> · ${prepared ? "Checked" : "Not checked yet"}</p></div>
      <div class="issue-section"><h4>Working tree</h4><p>${prepared ? "Clean" : "Not checked yet"}</p></div>
      <div class="issue-section"><h4>${prepared ? "Feature branch" : "Planned feature branch"}</h4><p><code>${escapeHtml(featureBranch)}</code> · ${prepared ? "Created" : "Not created yet"}</p></div>
    </article>`;
}

function renderFiles() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (!workspace && typeof STEPS !== "undefined" && STEPS[state.currentIndex]?.id === "project") {
    return '<div class="workspace-empty">Choose a project to inspect its repository files.</div>';
  }
  const paths = workspace ? workspace.files.map((file) => file.path) : Object.keys(FILES);
  const awaitingProjectSelection = Boolean(workspace)
    && typeof STEPS !== "undefined"
    && STEPS[state.currentIndex]?.id === "project"
    && !isComplete("project");
  const selectedPath = awaitingProjectSelection
    ? ""
    : paths.includes(state.selectedFile)
      ? state.selectedFile
      : paths.find((path) => path === "src/components/HeroVisual.tsx") || paths[0] || defaultFile;
  const selected = workspace
    ? workspace.files.find((file) => file.path === selectedPath)
    : FILES[selectedPath] || FILES[defaultFile];
  const updated = workspace ? workspace.changed : isComplete("build");

  return `
    <div class="file-tree">
      <h3>${escapeHtml(COURSE.repo)}</h3>
      <span class="file-entry folder">${icon("folder")} ${escapeHtml(COURSE.repository.name)}</span>
      ${paths.map((path) => {
        const depth = Math.max(1, Math.min(4, path.split("/").length - 1));
        const name = path.split("/").at(-1);
        const file = workspace ? workspace.files.find((entry) => entry.path === path) : FILES[path];
        const changed = workspace ? file?.status !== "unchanged" : updated && file?.status === "modified";
        const marker = file?.status === "added" ? "A" : file?.status === "deleted" ? "D" : "M";
        return `<button class="file-entry${selectedPath === path ? " active" : ""}" type="button" data-depth="${depth}" data-action="select-file" data-path="${escapeHtml(path)}" aria-current="${selectedPath === path}">${icon("file")} <span>${escapeHtml(name)}</span>${changed ? `<span class="file-status">${marker}</span>` : ""}</button>`;
      }).join("")}
    </div>
    ${selectedPath
      ? `<div class="code-header">${icon("file")} <span>${escapeHtml(selectedPath.split("/").at(-1))}</span>${selected?.status && selected.status !== "unchanged" && (workspace || updated) ? '<span class="file-modified-badge">Modified</span>' : ""}</div>
    <div class="code-view">${renderCode(workspace ? selected?.content || "" : updated ? selected.updated : selected.initial)}</div>`
      : `<div class="codex-repo-empty-state"><span class="codex-repo-empty-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h3.2l1.5 1.6h5A1.7 1.7 0 0 1 16.6 8.8v5.9a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2Z"/><path d="M6 5.5V4.4a1.2 1.2 0 0 1 1.2-1.2h3.1l1.5 1.6h4.6a1.2 1.2 0 0 1 1.2 1.2v6.2"/></svg></span><h3 class="codex-repo-empty-title">Open file</h3><p class="codex-repo-empty-copy">Select a file from the workspace tree</p></div>`}`;
}

function renderCode(source) {
  return source.split("\n").map((line, index) => `
    <div class="code-line${state.sourceCitation?.path === state.selectedFile && state.sourceCitation.line === index + 1 ? " is-cited" : ""}"><span class="line-number">${index + 1}</span><span>${highlightCode(line) || " "}</span></div>`).join("");
}

function highlightCode(line) {
  const tokens = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*|\b(?:import|from|export|function|return|const|let|type|if|else|describe|expect|it|null|true|false)\b)/g;
  let result = "";
  let cursor = 0;

  for (const match of line.matchAll(tokens)) {
    result += escapeHtml(line.slice(cursor, match.index));
    const token = match[0];
    const className = token.startsWith("//")
      ? "code-comment"
      : ['"', "'", "`"].includes(token[0])
        ? "code-string"
        : "code-keyword";
    result += `<span class="${className}">${escapeHtml(token)}</span>`;
    cursor = match.index + token.length;
  }

  return result + escapeHtml(line.slice(cursor));
}

function renderPlan() {
  const approved = isComplete("plan");
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (!approved && !state.planDraftReady) {
    return `
      <div class="workspace-empty plan-empty">
        ${icon("list")}
        <h3>Start with a plan.</h3>
        <p>Switch to Plan mode and ask Codex to outline the change before any files are edited.</p>
        <span class="pill">No files changed</span>
      </div>`;
  }

  const planStep = STEPS.find((step) => step.id === "plan");
  const draftedPlan = [...courseConversations("plan")]
    .reverse()
    .find((entry) => entry.guided && entry.response.trim());
  const items = (draftedPlan?.response || planStep.assistantResponse)
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  return `
    <article class="plan-card implementation-plan">
      <div class="plan-topline"><span class="pill${approved ? " success" : ""}">${approved ? "Plan approved" : "Awaiting your approval"}</span><span class="plan-issue">ENG-248</span></div>
      <h3>Update the homepage heading</h3>
      <p>Change the #hero-title heading and its focused test without altering the existing homepage structure.</p>
      <ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      <div class="plan-files"><h4>Files to change</h4>${(workspace
        ? STEPS.find((step) => step.id === "build")?.filePaths?.filter((path) => workspace.files.some((file) => file.path === path)) || []
        : modifiedFiles).map((file) => `<span>${icon("file")} ${escapeHtml(file.split("/").at(-1))}</span>`).join("")}</div>
      <div class="plan-approval">${icon(approved ? "check" : "clock")} ${approved ? "Approved before implementation" : "Review the plan, then approve it before building."}</div>
    </article>`;
}

function renderPreview() {
  const origin = typeof location === "undefined" ? "" : location.origin;
  const source = typeof codexWorkspaceBrowserPath === "function"
    ? codexWorkspaceBrowserPath()
    : "/training/codex-lab/demos/blossom-bank/index.html";
  const address = `${origin}${source}`;
  const currentStepId = typeof STEPS !== "undefined" ? STEPS[state.currentIndex]?.id : "";
  return `
    <section class="codex-fallback-browser" data-codex-browser-panel="true" aria-label="Blossom Bank browser">
      <div data-browser-sidebar-toolbar="true">
        <button type="button" data-action="browser-back" data-codex-repo-action="browser-back" aria-label="Back" title="Back" disabled>${icon("arrow-left")}</button>
        <button type="button" data-action="browser-next" data-codex-repo-action="browser-next" aria-label="Next" title="Next" disabled>${icon("arrow-right")}</button>
        <button type="button" data-action="browser-reload" data-codex-repo-action="browser-reload" aria-label="Reload page" title="Reload page">${icon("rotate-ccw")}</button>
        <input data-browser-sidebar-address-input="true" aria-label="Enter a URL" placeholder="Enter a URL" value="${escapeHtml(address)}" dir="ltr">
      </div>
      <iframe data-codex-browser-frame="true" title="Blossom Bank | Banking that sees the bigger picture" src="${escapeHtml(source)}" sandbox="allow-scripts allow-same-origin allow-forms" referrerpolicy="no-referrer"></iframe>
    </section>`;
}

function renderDiff() {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (workspace ? !workspace.changed : !isComplete("build")) {
    return `<div class="workspace-empty">${icon("diff")}<h3>No changes yet.</h3><p>The diff will appear after you ask Codex to implement the change.</p></div>`;
  }

  const fallbackDiffs = fallbackReviewDiffs();
  const changedFiles = workspace ? workspace.changedFiles : modifiedFiles.map((path) => ({ path, status: "modified", patch: fallbackDiffs[path] }));
  const selectedFile = changedFiles.find((file) => file.path === state.selectedDiff) || changedFiles[0];
  const selectedPath = selectedFile?.path || "";
  const diff = selectedFile?.patch || "";
  const totals = workspace ? workspace.totals : reviewDiffTotals(fallbackDiffs);
  const supportsReviewComments = typeof parseReviewDiffRows === "function"
    && typeof renderNativeDiffCommentComposer === "function"
    && typeof renderNativeDiffCommentThread === "function";
  const reviewRows = supportsReviewComments ? parseReviewDiffRows(selectedPath) : [];
  const selectedReviewRows = supportsReviewComments
    ? reviewRows.filter((entry) => reviewSelectionContains(state.reviewSelection, { ...entry, path: selectedPath }))
    : [];
  const selectedReviewBottom = selectedReviewRows.at(-1);
  let reviewIndex = 0;
  let insideHunk = false;
  let legacyLineNumber = 1;
  const rows = !supportsReviewComments
    ? diff.split("\n")
      .filter((line) => !line.startsWith("diff --git") && !line.startsWith("index ")
        && !line.startsWith("--- ") && !line.startsWith("+++ "))
      .map((line) => {
        if (line.startsWith("@@")) return `<div class="diff-hunk">${escapeHtml(line)}</div>`;
        const type = line.startsWith("+") ? " diff-added" : line.startsWith("-") ? " diff-removed" : "";
        const number = line.startsWith("-") ? "−" : legacyLineNumber++;
        return `<div class="diff-row${type}"><span class="line-number">${number}</span><span>${highlightCode(line) || " "}</span></div>`;
      }).join("")
    : diff.split("\n").flatMap((line) => {
    if (line.startsWith("diff --git") || line.startsWith("index ")
      || line.startsWith("--- ") || line.startsWith("+++ ")) return [];
    if (line.startsWith("@@")) {
      insideHunk = true;
      return [`<div class="diff-hunk">${escapeHtml(line)}</div>`];
    }
    if (!insideHunk || line.startsWith("\\ No newline at end of file") || line === "") return [];
    const entry = reviewRows[reviewIndex];
    reviewIndex += 1;
    if (!entry) return [];

    const location = `${entry.side === "old" ? "L" : "R"}${entry.line}`;
    const lineKey = `${selectedPath}:${entry.side}:${entry.line}`;
    const type = entry.type === "add" ? " diff-added" : entry.type === "delete" ? " diff-removed" : "";
    const comments = (state.diffComments || []).filter((comment) =>
      comment.path === selectedPath && comment.line === entry.line && comment.side === entry.side);
    const selected = reviewSelectionContains(state.reviewSelection, { ...entry, path: selectedPath });
    const selectionBottom = selected && selectedReviewBottom?.line === entry.line
      && selectedReviewBottom?.side === entry.side;
    const active = state.activeDiffComment;
    const isActive = active?.path === selectedPath && active.line === entry.line && active.side === entry.side;
    const trigger = `<button class="codex-review-add-comment" type="button" data-action="open-review-comment" data-codex-review-action="open-comment" data-path="${escapeHtml(selectedPath)}" data-line="${entry.line}" data-side="${entry.side}"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7.46758 13.2V8.53201H2.79961C2.50579 8.53201 2.26758 8.29379 2.26758 7.99998C2.26758 7.70616 2.50579 7.46794 2.79961 7.46794H7.46758V2.79998C7.46758 2.50616 7.70579 2.26794 7.99961 2.26794C8.29342 2.26794 8.53164 2.50616 8.53164 2.79998V7.46794H13.1996L13.3066 7.47888C13.5491 7.52843 13.7316 7.74283 13.7316 7.99998C13.7316 8.25712 13.5491 8.47152 13.3066 8.52107L13.1996 8.53201H8.53164V13.2C8.53164 13.4938 8.29342 13.732 7.99961 13.732C7.70579 13.732 7.46758 13.4938 7.46758 13.2Z"/></svg></button>`;
    const commentThread = comments.length
      ? `<section class="codex-review-comment-thread" data-codex-review-thread="${escapeHtml(lineKey)}" aria-label="Comments on line ${location}">${renderNativeDiffCommentThread(comments)}</section>`
      : "";
    const composer = isActive
      ? renderNativeDiffCommentComposer(
        selectedPath,
        entry.line,
        entry.side,
        active.startLine,
        active.startSide,
      )
      : "";
    return [`<div class="diff-row${type}" data-codex-review-line="${entry.line}" data-codex-review-path="${escapeHtml(selectedPath)}" data-codex-review-side="${entry.side}" data-codex-review-line-type="${entry.lineType}" data-codex-review-selected="${selected}"${selectionBottom ? ' data-codex-review-selection-bottom="true"' : ""}><span class="line-number" data-codex-review-gutter="true" data-codex-review-select-line="true" data-codex-review-path="${escapeHtml(selectedPath)}" data-codex-review-line="${entry.line}" data-codex-review-side="${entry.side}"><span class="codex-review-visible-line" data-codex-review-visible-line="${entry.line}" data-codex-review-visible-side="${entry.side}">${entry.line}</span>${trigger}</span><span data-codex-review-code="true">${highlightCode(line) || " "}</span></div>${commentThread}${composer}`];
    }).join("");

  return `
    <div class="diff-summary"><div><strong>${changedFiles.length} ${changedFiles.length === 1 ? "file" : "files"} changed</strong><span><b>+${totals.additions}</b> <i>−${totals.deletions}</i></span></div><span class="pill">ENG-248</span></div>
    <div class="diff-file-tabs" aria-label="Changed files">${changedFiles.map(({ path, status }) => `<button class="diff-file${selectedPath === path ? " active" : ""}" type="button" data-action="select-diff" data-path="${escapeHtml(path)}">${icon("file")} <span>${escapeHtml(path.split("/").at(-1))}</span><span class="diff-file-state">${status === "added" ? "A" : status === "deleted" ? "D" : "M"}</span></button>`).join("")}</div>
    <div class="diff-header">${icon("diff")} ${escapeHtml(selectedPath.split("/").at(-1))}</div>
    <div class="code-view diff-view">${rows}</div>`;
}

function renderPullRequest() {
  const ready = isComplete("pr");
  const pullRequest = COURSE.pullRequest;
  const reviewed = lessonContextReady("build");
  const verificationSummary = lessonContextReady("test") ? "Final source and diff reviewed" : "Source review pending";
  const built = lessonContextReady("build");
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const changedCount = workspace ? workspace.changedFiles.length : modifiedFiles.length;

  if (!ready) {
    return `
      <div class="workspace-empty pr-empty">
        ${icon("git-pull")}
        <h3>Ready to open a pull request.</h3>
        <p>Ask Codex to summarize the change and link ENG-248.</p>
        <div class="pr-preflight"><span>${icon(reviewed ? "check" : "clock")} ${reviewed ? `${changedCount} ${changedCount === 1 ? "file" : "files"} reviewed` : built ? "Code review pending" : "Implementation pending"}</span><span>${icon(lessonContextReady("test") ? "check" : "clock")} ${escapeHtml(verificationSummary)}</span></div>
      </div>`;
  }

  return `
    ${ready ? `<div class="success-banner">${icon("check")}<div><h3>Training pull request #${pullRequest.number} prepared</h3><p>GitHub unchanged.</p></div></div>` : ""}
    <article class="pr-card prepared-pr">
      <span class="pill success">Training PR · #184</span>
      <h3>${escapeHtml(pullRequest.title)}</h3>
      <div class="pr-branch">${escapeHtml(pullRequest.branch)} → ${escapeHtml(pullRequest.base)}</div>
      <div class="pr-section"><h4>Summary</h4><p>${escapeHtml(pullRequest.summary)}</p></div>
      <div class="pr-section"><h4>Linked issue</h4><span class="linear-key">${escapeHtml(pullRequest.linkedIssue)}</span></div>
      <div class="pr-section"><h4>Verification</h4><ul>${pullRequest.checks.map((check) => {
        const complete = /reviewed/i.test(check) ? reviewed : lessonContextReady("test");
        return `<li${complete ? ' class="check-pass"' : ""}>${escapeHtml(check)}${complete ? "" : " (pending)"}</li>`;
      }).join("")}</ul></div>
      <div class="pr-meta"><span>${built ? `${changedCount} ${changedCount === 1 ? "file" : "files"} changed` : "No files changed"}</span><span>·</span><span>${escapeHtml(verificationSummary)}</span></div>
      <div class="pr-url" data-training-pr-url="true">${escapeHtml(pullRequest.url)}</div>
      <div class="pr-opened">${icon("check")} Training pull request prepared; GitHub unchanged.</div>
    </article>`;
}

function renderLinearToolResult(exchange) {
  if (typeof LINEAR_ISSUE === "undefined"
    || state.linearConnected !== true
    || exchange?.guided !== true
    || typeof exchange.response !== "string"
    || typeof LINEAR_ISSUE.id !== "string"
    || !exchange.response.toLowerCase().includes(LINEAR_ISSUE.id.toLowerCase())) {
    return "";
  }

  // This is a prepared search example, not the browser request's elapsed time.
  return `
    <section class="codex-linear-activity" data-codex-linear-activity="${escapeHtml(exchange.id || "result")}" role="group" aria-label="Linear search activity">
      <p class="codex-linear-work-status">Worked for 1m 5s</p>
      <p class="codex-linear-tool-label"><img src="/images/codex/work-plugins/linear.svg" alt="" aria-hidden="true" /> <span>Linear</span> <span>Search</span></p>
    </section>`;
}

function renderCodexUserPrompt(text) {
  const source = String(text ?? "");
  if (typeof state !== "undefined" && state.linearConnected !== true) return escapeHtml(source);

  const provider = /(?<!\S)@Linear(?![\p{L}\p{N}_-])/gu;
  let markup = "";
  let cursor = 0;

  for (const match of source.matchAll(provider)) {
    markup += escapeHtml(source.slice(cursor, match.index));
    markup += '<span class="codex-linear-mention" data-codex-linear-mention="true">'
      + codexLinearLogo()
      + '<span class="codex-linear-mention-label">Linear</span></span>';
    cursor = match.index + match[0].length;
  }

  return markup + escapeHtml(source.slice(cursor));
}

function renderConversation(step) {
  const completed = isComplete(step.id);
  const stepIndex = STEPS.findIndex((candidate) => candidate.id === step.id);
  const history = step.id === "project"
    ? courseConversations("project").map((exchange) => ({ step, exchange }))
    : codexConversationSteps(step)
      .flatMap((candidate) => (state.conversations?.[candidate.id] || [])
        .map((exchange) => ({ step: candidate, exchange })));
  const newTask = !state.isRunning && history.length === 0;
  const selectingProject = step.id === "project"
    && !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace());
  const selectedProjectName = typeof state.projectDisplayName === "string"
    && state.projectDisplayName.trim()
    ? state.projectDisplayName.trim()
    : "Blossom Bank";
  const messages = [];

  if (newTask) {
    messages.push(`
      <div class="conversation-title timeline-heading conversation-task-title conversation-home-state">
        ${codexHomeLogo()}
        <h2 class="conversation-task-heading">${selectingProject ? "What should we build?" : `What should we build in ${escapeHtml(selectedProjectName)}?`}</h2>
      </div>`);
  }

  for (const { step: exchangeStep, exchange } of history) {
    const userMessage = typeof visibleCodexUserMessage === "function"
      ? visibleCodexUserMessage(exchange)
      : exchange.prompt;
    const prompt = typeof renderCodexUserPrompt === "function"
      ? renderCodexUserPrompt(userMessage)
      : userMessage === exchange.prompt
        ? escapeHtml(exchange.prompt)
        : escapeHtml(userMessage);
    const reviewComments = Array.isArray(exchange.reviewComments)
      ? exchange.reviewComments.map(reviewCommentSnapshot).filter(Boolean)
      : [];
    if (exchange.prompt.trim() || reviewComments.length) {
      messages.push(`<div class="message user-message${reviewComments.length ? " codex-review-comments-sent-turn" : ""}">
        ${reviewComments.length
          ? `<div class="codex-review-comments-rail codex-review-comments-sent-rail" data-codex-review-comments-rail="sent">${renderReviewCommentsAttachment(reviewComments, { sent: true, id: `sent-${exchange.id}` })}</div>`
          : ""}
        ${userMessage.trim() ? `<div class="message-body">${prompt}</div>` : ""}
        ${exchange.prompt === "/review staging" ? '<span class="codex-review-mode">Review mode</span>' : ""}
      </div>`);
    }
    if (exchange.guided) {
      const linearActivity = exchangeStep.id === "connect" && renderLinearToolResult(exchange);
      if (linearActivity) messages.push(linearActivity);
      else {
        const activityCompleted = exchangeStep.id === "pr"
          ? exchange.publicationPhase === "published"
          : isComplete(exchangeStep.id);
        const completedActivity = renderToolActivity(
          exchangeStep,
          activityCompleted,
          false,
          exchange.commandExecutions,
        );
        const workedActivity = typeof renderCodexWorkedActivity === "function"
          ? renderCodexWorkedActivity(exchange, { content: completedActivity })
          : "";
        messages.push(workedActivity || completedActivity);
      }
    } else if (typeof renderCodexWorkedActivity === "function") {
      const workedActivity = renderCodexWorkedActivity(exchange);
      if (workedActivity) messages.push(workedActivity);
    }
    if (exchange.response.trim()) messages.push(renderAssistantMessage(exchange.response, {
      stagedPreview: requestsLocalPreview(exchange.prompt) ? exchange.stagedPreview : null,
      exchangeId: exchange.id,
      architecture: exchangeStep.id === "project" && exchange.guided,
      trainingPullRequest: exchangeStep.id === "pr" && exchange.publicationPhase === "published",
    }));
  }

  if (state.isRunning && state.pendingConversation?.stepId === step.id) {
    const userMessage = typeof visibleCodexUserMessage === "function"
      ? visibleCodexUserMessage(state.pendingConversation)
      : state.pendingConversation.prompt;
    const prompt = typeof renderCodexUserPrompt === "function"
      ? renderCodexUserPrompt(userMessage)
      : escapeHtml(userMessage);
    const reviewComments = Array.isArray(state.pendingConversation.reviewComments)
      ? state.pendingConversation.reviewComments.map(reviewCommentSnapshot).filter(Boolean)
      : [];
    if (state.pendingConversation.accepted !== false
      && (state.pendingConversation.prompt.trim() || reviewComments.length)) {
      messages.push(`<div class="message user-message${reviewComments.length ? " codex-review-comments-sent-turn" : ""}">
        ${reviewComments.length
          ? `<div class="codex-review-comments-rail codex-review-comments-sent-rail" data-codex-review-comments-rail="sent">${renderReviewCommentsAttachment(reviewComments, { sent: true, id: `sent-${state.pendingConversation.id}` })}</div>`
          : ""}
        ${userMessage.trim() ? `<div class="message-body">${prompt}</div>` : ""}
        ${state.pendingConversation.prompt === "/review staging" ? '<span class="codex-review-mode">Review mode</span>' : ""}
      </div>`);
    }
    messages.push(renderToolActivity(
      step,
      completed,
      state.isRunning,
      state.pendingConversation.commandExecutions,
    ));
  }

  return messages.join("");
}

function renderToolActivity(step, completed, running = state.isRunning, commandExecutions) {
  const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  const changedCount = workspace ? workspace.changedFiles.length : modifiedFiles.length;
  const actualTotals = workspace ? workspace.totals : reviewDiffTotals();
  const observedCommands = step.id === "ticket"
    ? Array.isArray(commandExecutions)
      ? commandExecutions
      : running && state.pendingConversation?.stepId === "ticket"
        ? state.pendingConversation.commandExecutions || []
        : []
    : [];
  if (step.id === "ticket" && observedCommands.length
    && typeof renderCodexCommandActivity === "function") {
    return renderCodexCommandActivity(observedCommands, { running });
  }
  const ticketDiscovered = (state.conversations?.connect || []).some((exchange) =>
    typeof exchange?.response === "string" && /\bENG-248\b/i.test(exchange.response));
  const activities = {
    project: [
      { name: "Analyze repository", detail: "React source and imports", icon: "search" },
      { name: "Visualize architecture", detail: "Read-only onboarding overview", icon: "file" },
    ],
    connect: [
      { name: "Linear", detail: "Search", icon: "plug" },
      { name: "Search issues", detail: ticketDiscovered ? "ENG-248 · High priority" : "Searching assigned issues", icon: "ticket" },
    ],
    ticket: observedCommands.length
      ? observedCommands.map((command) => ({
        name: command.status === "in_progress" ? "Running Git command" : "Ran Git command",
        detail: command.command,
        icon: command.id === "branch-switch" ? "git-pull" : "terminal",
      }))
      : [{ name: "Prepare local feature branch", detail: "Waiting for approved Git activity", icon: "git-pull" }],
    plan: [
      { name: "Inspect project context", detail: "Plan mode · read-only", icon: "search" },
      { name: "Outline implementation", detail: "Project files · Suggested tests", icon: "list" },
    ],
    build: [
      { name: "Implement minimal change", detail: "ENG-248 · Heading and focused test", icon: "list" },
      { name: "Update project files", detail: `${changedCount} ${changedCount === 1 ? "file" : "files"} changed · +${actualTotals.additions} −${actualTotals.deletions}`, icon: "file" },
    ],
    test: [
      { name: "Review final source", detail: "Read-only review of the homepage heading change", icon: "diff" },
      { name: "Staged preview", detail: "Open after reviewing the focused checks", icon: "browser" },
    ],
    pr: [
      { name: "Prepare pull request", detail: workspace ? `ENG-248 · ${changedCount} changed ${changedCount === 1 ? "file" : "files"}` : "ENG-248 · Waiting for project changes", icon: "git-pull" },
      ...(completed
        ? [{ name: "Create pull request", detail: "#184 · ENG-248", icon: "check" }]
        : []),
    ],
  }[step.id];
  const activityLabels = {
    project: "Visualized repository architecture",
    connect: "Connected project context",
    ticket: "Prepared a feature branch",
    plan: "Prepared an implementation plan",
    build: workspace ? `Edited ${changedCount} ${changedCount === 1 ? "file" : "files"}` : "Updated project files",
    review: workspace ? `Reviewed ${changedCount} changed ${changedCount === 1 ? "file" : "files"}` : "Reviewed project changes",
    test: "Reviewed final source",
    pr: completed ? "Created PR #184" : "Prepared pull request",
  };
  const activityFinished = completed;
  const pendingActivity = running
    && state.pendingConversation?.stepId === step.id
    && typeof renderCodexStreamActivity === "function";
  const liveActivity = pendingActivity ? renderCodexStreamActivity(state.pendingConversation) : "";
  const visibleActivities = state.prPublishing === true && step.id === "pr"
    ? []
    : pendingActivity ? [] : activities;
  const startedAt = state.pendingConversation?.startedAt;
  const elapsed = Number.isFinite(startedAt) && startedAt > 0
    ? Math.max(1, Math.floor((Date.now() - startedAt) / 1_000))
    : null;
  const runningHeading = pendingActivity
    ? `Thought${elapsed === null ? "" : ` ${elapsed}s`}`
    : "Working";
  const event = running
    ? `<div class="thinking-event tool-activity-status activity-transcript-result">${icon("sparkle")} ${escapeHtml(state.prPublishing ? "Preparing pull request #184" : thinkingMessage(step.id))}<span class="thinking-dots" aria-label="Working">···</span></div>`
    : `<div class="tool-activity-status activity-transcript-result${activityFinished ? " success" : ""}">${icon(activityFinished ? "check" : "shield")} ${escapeHtml(completed
      ? workspace && step.id === "build"
        ? `Updated ${changedCount} ${changedCount === 1 ? "file" : "files"} · +${actualTotals.additions} −${actualTotals.deletions} lines`
        : stageEvents[step.id]
      : step.id === "plan"
      ? "Plan drafted · Waiting for your feedback"
      : step.id === "test"
      ? stageEvents.test
      : step.id === "pr"
      ? "Pull request ready to publish"
      : stageEvents[step.id])}</div>`;
  return `
    <div class="tool-activity activity-transcript${running ? " is-running" : " is-complete"}" data-state="${running ? "running" : completed ? "complete" : "approval"}">
      <div class="tool-activity-header">
        <span>${running && pendingActivity ? "" : icon(running ? "sparkle" : "chevron-down")} ${escapeHtml(running ? runningHeading : activityLabels[step.id])}</span>
      </div>
      <div class="tool-activity-body">
        ${liveActivity ? `<div data-codex-stream-summary="true" role="status">${liveActivity}</div>` : ""}
        ${visibleActivities.map((activity) => `
          <div class="tool-activity-row activity-transcript-line">
            <span class="tool-activity-icon">${icon(activity.icon)}</span>
            <span class="tool-activity-copy"><span class="tool-activity-name activity-transcript-command">${escapeHtml(activity.name)}</span><span class="tool-activity-detail activity-transcript-result">${escapeHtml(activity.detail)}</span></span>
          </div>`).join("")}
      </div>
      ${pendingActivity ? "" : event}
    </div>`;
}

function renderAssistantMessage(message, options = {}) {
  const trainingPullRequest = options.trainingPullRequest === true;
  const normalizedMessage = trainingPullRequest
    && typeof normalizeTrainingPullRequestResponse === "function"
    ? normalizeTrainingPullRequestResponse(message)
    : message;
  const content = trainingPullRequest && typeof renderTrainingPullRequestResponse === "function"
    ? renderTrainingPullRequestResponse(message)
    : /^\s*<proposed_plan>/.test(String(normalizedMessage ?? ""))
      ? renderCodexAssistantContent(normalizedMessage)
      : renderCodexMarkdown(normalizedMessage);
  const stagedAction = typeof renderStagedPreviewAction === "function"
    ? renderStagedPreviewAction(
      options.stagedPreview,
      typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null,
      options.exchangeId || "",
    )
    : "";

  return `<div class="message assistant-message"><div class="message-body">${content}${options.architecture ? `<style>${architectureStyles}</style>${architectureHtml}` : ""}${stagedAction}</div></div>`;
}

function inlineCode(text) {
  return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function thinkingMessage(stepId) {
  return {
    connect: "Searching Linear with Linear",
    ticket: "Refreshing the repository and creating a feature branch",
    plan: "Preparing the implementation plan",
    build: "Applying the approved change to the Blossom Bank project",
    review: "Inspecting the diff against acceptance criteria",
    test: "Reviewing the final source and staged-preview link",
    pr: "Preparing the pull request description",
  }[stepId];
}

function useSuggestedPrompt(promptOverride = "") {
  const prompt = promptOverride || STEPS[state.currentIndex].prompt;
  const feedbackInput = STEPS[state.currentIndex]?.id === "plan"
    ? (typeof nativeCodexShadow === "function"
      ? nativeCodexShadow()?.querySelector?.('[data-codex-plan-feedback="true"]')
      : null)
      || (typeof app !== "undefined"
        ? app.querySelector?.('[data-codex-plan-feedback="true"]')
        : null)
    : null;
  if (feedbackInput) {
    state.hintsOpen = false;
    state.learnMoreOpen = false;
    state.mobileView = "workspace";
    feedbackInput.value = prompt;
    feedbackInput.dispatchEvent?.(new Event("input", { bubbles: true, composed: true }));
    updateCodexPlanRequestInput(feedbackInput);
    feedbackInput.focus?.({ preventScroll: true });
    return true;
  }
  pendingCodexMiniPrompt = prompt;
  state.hintsOpen = false;
  state.learnMoreOpen = false;
  state.mobileView = "workspace";
  refreshCurrentLab();

  if (setNativeCodexPrompt(prompt)) {
    pendingCodexMiniPrompt = "";
    return;
  }

  const composer = document.querySelector("#composer-input");
  if (!composer) return;

  composer.value = prompt;
  composer.focus();
  composer.style.height = "auto";
  composer.style.height = `${Math.min(composer.scrollHeight, 110)}px`;
}

function linearPromptIntent(prompt) {
  const normalized = String(prompt || "").trim().toLowerCase();
  const courtesy = /^(?:(?:can|could|would|will)\s+you(?:\s+please)?|please|i(?:\s+would|'d)?\s+(?:like|want|need)\s+you\s+to)\s+/;
  const request = normalized
    .replace(courtesy, "")
    .replace(/^@linear\b[\s,:-]*/, "")
    .replace(courtesy, "");
  const mentionsLinear = /\b(?:linear|plugins?|apps?)\b/.test(normalized);
  const installationRequest = /^(?:connect|install|enable|authorize|link|add|set up)\b/.test(request);
  if (mentionsLinear && installationRequest) return "install";

  const mentionsWorkItem =
    /\b(?:tickets?|issues?|assignments?|backlog|work\s+items?|eng-\d+)\b/.test(normalized);
  const mentionsTicket = mentionsWorkItem || /\blinear\b/.test(normalized);
  const lookupRequest =
    /^(?:find|show(?:\s+me)?|list|search(?:\s+for)?|pull(?:\s+up)?|fetch|get|locate|retrieve|look\s+up|identify)\b/.test(request)
    || (
      mentionsWorkItem
      && (
        /^(?:read|open|summarize|summarise|explain|describe|tell(?:\s+me)?(?:\s+about)?)\b/.test(request)
        || /^(?:what|which|do|does|are|is|can|could|would|will|have|has)\b/.test(normalized)
      )
    );
  if (mentionsTicket && lookupRequest) return "lookup";
  return "informational";
}

function promptAdvancesStep(step, prompt) {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (normalizedPrompt === step.prompt.trim().toLowerCase()) return true;
  if (step.id === "project") return /\b(repo(?:sitory)?|architecture|codebase)\b/i.test(prompt) && /visuali[sz](?:e|ation)|visual representation|diagram/i.test(prompt);
  if (step.id === "connect") return linearPromptIntent(prompt) === "lookup";

  const patterns = {
    ticket: /\b(git(?:hub)?|repo(?:sitory)?|fetch|pull|refresh|sync|origin|main|branch|checkout|switch|working tree|eng-248)\b/i,
    plan: /\b(plan|approach|strategy|outline|implementation)\b/i,
    build: /\b(implement|build|code|apply|update|write|add|fix|heading|headline)\b/i,
    review: /\b(diff|review|inspect|change(?:d|s)?|files?|scope)\b/i,
    test: /\b(test|verify|verification|typecheck|type check|run|check|confirm|review|eng-248|diff|source|heading|headline)\b/i,
    pr: /\b(pull request|pr|branch|draft|ship|publish|github)\b/i,
  };

  if (!patterns[step.id]?.test(prompt)) return false;

  const actionPatterns = {
    ticket: /^(fetch|pull|refresh|sync|update|prepare|create|make|start|switch|check(?:\s+out)?|checkout|set\s+up|simulate)\b/,
    plan: /^(plan|create|make|draft|prepare|outline|write|develop|generate)\b/,
    build: /^(implement|build|code|apply|update|write|add|fix|make|warn)\b/,
    test: /^(review|confirm|explain|inspect|analyze|analyse|run|execute|perform|start|verify|check|test|typecheck)\b/,
    pr: /^(draft|prepare|create|open|write|generate|compose|publish|ship|push)\b/,
  };
  const actionPattern = actionPatterns[step.id];
  if (!actionPattern) return true;

  const request = normalizedPrompt.replace(
    /^(?:(?:can|could|would|will)\s+you(?:\s+please)?|please|i(?:\s+would|'d)?\s+(?:like|want|need)\s+you\s+to)\s+/,
    "",
  );

  if (step.id === "ticket") {
    const createsBranch = /\b(create|make|start|switch|check\s+out|checkout)\b/.test(request)
      && /\b(branch|feat\/eng-248-homepage-heading)\b/.test(request);
    const preparesWorkspace = /\b(prepare|set\s+up)\b/.test(request)
      && /\b(branch|repo(?:sitory)?|workspace)\b/.test(request);
    if ((!createsBranch && !preparesWorkspace) || !/\bstaging\b/.test(request)
      || !/\bfeat\/|\bfeature branch\b/.test(request)) return false;
  }

  if (actionPattern.test(request)) return true;

  const asksForInformation = /^(what|why|how|when|where|which|who|have|has|had|is|are|was|were|does|do|did|will|should|could|can|would|may)\b/.test(normalizedPrompt)
    || normalizedPrompt.endsWith("?")
    || /\b(tell me|show me|explain|describe|summarize|status|already|whether)\b/.test(normalizedPrompt);

  return !asksForInformation;
}

function pullRequestApprovalIntent(prompt) {
  const normalized = String(prompt || "").trim().toLowerCase();
  if (!normalized) return false;

  if (/^(?:go ahead|proceed|approved?|yes|do it|ship it)[.!]*$/.test(normalized)) {
    return true;
  }

  const request = normalized
    .replace(
      /^(?:(?:can|could|would|will)\s+you(?:\s+please)?|please|i(?:\s+would|'d)?\s+(?:like|want|need)\s+you\s+to)\s+/,
      "",
    )
    .replace(/^(?:yes[,!]?[ ]+|go ahead\s+(?:and\s+)?|proceed\s+(?:(?:to|with)\s+)?)/, "");
  return /^(?:creat(?:e|ing)|open(?:ing)?|publish(?:ing)?|push(?:ing)?)\b/.test(request)
    && /\b(?:pull request|pr|branch)\b/.test(request);
}

function requestsFocusedVerification(prompt) {
  const request = String(prompt || "").trim().replace(
    /^(?:(?:can|could|would|will)\s+you(?:\s+please)?|please)\s+/i,
    "",
  );
  return /^(?:run|execute|perform)\b/i.test(request)
    && /\b(tests?|typecheck|type\s*script|checks?)\b/i.test(request);
}

function requestsLocalPreview(prompt) {
  const request = String(prompt || "").trim().replace(
    /^(?:(?:can|could|would|will)\s+you(?:\s+please)?|please)\s+/i,
    "",
  );
  return /^(?:run|start|launch|serve|open)\b/i.test(request)
    && /\b(?:locally|localhost|local (?:app|site|server|preview)|dev(?:elopment)? server)\b/i.test(request)
    && !/\b(?:don.t|do not|without|never)\b/i.test(request);
}

function runStep(explicitPrompt = "") {
  const step = STEPS[state.currentIndex];
  if (state.isRunning) return;
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return false;
  }

  if (verificationComposerBlocked(step)) {
    state.validationMessage = state.verificationThreadCreated || step.id === "pr"
      ? "Return to the verification thread to continue."
      : "Create a new thread in your project before verifying the change.";
    refreshCurrentLab();
    return false;
  }
  if (step.id === "test" && !isComplete("test")) {
    const count = practiceTaskCount(step);
    if (count === 0) {
      state.validationMessage = "Create a new thread in your project before verifying the change.";
      refreshCurrentLab();
      return false;
    }
    if (count === 1 && explicitPrompt.trim() !== "/review staging") {
      state.validationMessage = "Use /review and select staging under Review against a base branch.";
      refreshCurrentLab();
      return false;
    }
    if (count === 2 && !requestsFocusedVerification(explicitPrompt)) {
      state.validationMessage = "Ask Codex to run tests and report results.";
      refreshCurrentLab();
      return false;
    }
    if (count === 3 && !requestsLocalPreview(explicitPrompt)) {
      state.validationMessage = "Ask Codex to run Blossom Bank locally, then open its preview in the in-app browser.";
      refreshCurrentLab();
      return false;
    }
  }
  if (step.id === "pr" && /\b(post|share|send)\b/i.test(explicitPrompt)) return shareTrainingPullRequest(explicitPrompt);
  const publishesPullRequest = step.id === "pr"
    && (typeof pullRequestApprovalIntent === "function"
      ? pullRequestApprovalIntent(String(explicitPrompt).trim() || step.prompt)
      : /^(?:publish|create|open)\b.*\b(?:pull request|pr)\b/i.test(String(explicitPrompt).trim() || step.prompt));
  if (publishesPullRequest) {
    return publishPullRequest(String(explicitPrompt).trim() || step.prompt);
  }

  if (step.id === "project" && (!verifiedCodexWorkspace()
    || !promptAdvancesStep(step, explicitPrompt.trim() || step.prompt))) {
    state.validationMessage = !verifiedCodexWorkspace()
      ? "Create a Blossom Bank project first."
      : "Ask Codex to analyze the repository and show a visualization of its architecture.";
    state.mobileView = "workspace";
    refreshCurrentLab();
    return false;
  }

  const diffCommentAttachment = typeof pendingDiffCommentAttachment === "function"
    ? pendingDiffCommentAttachment()
    : { ids: new Set(), comments: [], snapshots: [] };
  const typedPrompt = explicitPrompt.trim();
  if (step.id === "build" && !typedPrompt && practiceTaskCount(step) >= 2
    && diffCommentAttachment.snapshots.length === 0) {
    return false;
  }
  const commentOnly = step.id === "build"
    && !typedPrompt
    && diffCommentAttachment.snapshots.length > 0;
  const prompt = commentOnly ? "" : typedPrompt || step.prompt;
  const displayPrompt = prompt;
  const linearIntent = step.id === "connect" ? linearPromptIntent(prompt) : "";
  const reviewCommentReady = step.id === "build"
    && practiceTaskCount(step) >= 2
    && diffCommentAttachment.comments.some((comment) => isRequiredHomepageReviewComment(comment, verifiedCodexWorkspace()));
  if (step.id === "build" && diffCommentAttachment.snapshots.length && !reviewCommentReady) {
    state.validationMessage = homepageReviewCommentError(diffCommentAttachment.comments, verifiedCodexWorkspace());
    state.mobileView = "workspace";
    refreshCurrentLab();
    return false;
  }
  const advancesStep = !isComplete(step.id)
    && step.id !== "pr"
    && (step.id === "test" && (prompt === "/review staging" || requestsLocalPreview(prompt))
      ? true
      : step.id === "build" && reviewCommentReady
      ? true
      : promptAdvancesStep(step, prompt));

  if (
    step.id === "connect" &&
    (
      linearIntent === "install" ||
      (advancesStep && (state.linearConnected !== true || practiceTaskCount(step) < 2))
    )
  ) {
    state.validationMessage = linearIntent === "install" && state.linearConnected === true
      ? "Linear is already connected. Ask Codex to find your tickets."
      : "Open Plugins and install the Linear plugin before asking Codex to find tickets.";
    state.mobileView = "workspace";
    refreshCurrentLab();
    return;
  }

  if (step.id === "ticket" && advancesStep) {
    const environmentOpened = state.ticketEnvironmentOpenedByLearner === true
      && practiceTaskCount(step) >= 1;
    const branchesInspected = state.ticketBranchesInspectedByLearner === true
      && practiceTaskCount(step) >= 2;
    const stagingSelected = state.ticketStagingSelectedByLearner === true
      && practiceTaskCount(step) >= 3 && activeCourseBranch() === COURSE.repository.baseBranch;
    if (!environmentOpened || !branchesInspected || !stagingSelected) {
      state.validationMessage = !environmentOpened
        ? "Open the Environment sidebar before creating the feature branch."
        : !branchesInspected
          ? "Open the branch dropdown and inspect the available branches."
          : "Select staging in the branch dropdown before asking Codex to create a feat/ branch from it.";
      state.mobileView = "workspace";
      refreshCurrentLab();
      return false;
    }
  }

  if (step.id === "build" && state.planMode && advancesStep) {
    state.validationMessage = "Switch to Agent mode before implementing the change.";
    state.mobileView = "workspace";
    refreshCurrentLab();
    return;
  }

  if (step.id === "test" && state.planMode && advancesStep) {
    state.validationMessage = "Switch to Agent mode before requesting the read-only source review.";
    state.mobileView = "workspace";
    refreshCurrentLab();
    return;
  }

  const observedWorkspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
  if (advancesStep && ["build", "test", "pr"].includes(step.id)
    && typeof observedWorkspace?.branch === "string"
    && observedWorkspace.branch !== COURSE.repository.workingBranch) {
    state.validationMessage = "Switch to the ENG-248 feature branch before continuing.";
    state.mobileView = "workspace";
    refreshCurrentLab();
    return false;
  }

  if (advancesStep && (
    (step.id === "build" && !lessonContextReady("ticket"))
    || (step.id === "test" && !lessonContextReady("build"))
    || (step.id === "pr" && (!lessonContextReady("build") || !lessonContextReady("test")))
  )) {
    state.validationMessage = {
      build: "Prepare the feature branch before implementing this change.",
      test: "Implement the approved change before requesting the read-only source review.",
      pr: "Implement and review the change before preparing a pull request.",
    }[step.id];
    state.mobileView = "workspace";
    refreshCurrentLab();
    return;
  }

  const executionApproved = advancesStep && step.id === "build" && lessonContextReady("ticket") && !state.planMode;
  let implementationPhase = "";
  let implementationRevision = null;
  if (executionApproved) {
    const phase = homepageHeadingPhase(observedWorkspace);
    const exactReview = diffCommentAttachment.comments.some((comment) => isRequiredHomepageReviewComment(comment, observedWorkspace));
    if (!commentOnly && practiceTaskCount(step) === 0 && phase === "original") {
      implementationPhase = "initial";
    } else if (practiceTaskCount(step) >= 2 && phase === "first" && exactReview) {
      implementationPhase = "review-comment";
    } else {
      state.validationMessage = phase === "first"
        ? homepageReviewCommentError(diffCommentAttachment.comments, observedWorkspace)
        : "The approved homepage change no longer matches the current project revision. Return to Build and inspect the current diff.";
      refreshCurrentLab();
      return false;
    }
    implementationRevision = observedWorkspace.revision;
  }

  state.validationMessage = "";
  if (advancesStep || !state.prompts[step.id]) state.prompts[step.id] = prompt;
  const verificationApproved = advancesStep && step.id === "test"
    && requestsFocusedVerification(prompt);
  const branchPreparationApproved = advancesStep && step.id === "ticket"
    && state.ticketEnvironmentOpenedByLearner === true
    && state.ticketBranchesInspectedByLearner === true
    && state.ticketStagingSelectedByLearner === true
    && activeCourseBranch() === COURSE.repository.baseBranch
    && !state.planMode;
  if (verificationApproved) state.verificationResult = null;
  const pendingId = `${step.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  state.pendingConversation = {
    id: pendingId,
    stepId: step.id,
    prompt: displayPrompt,
    reviewComments: diffCommentAttachment.snapshots,
    commentOnly,
    ...(diffCommentAttachment.snapshots.length ? { accepted: false } : {}),
    response: "",
    streamStatus: "",
    streamSummary: "",
    streamResponse: "",
    streamActivities: [],
    guided: advancesStep,
    executionApproved,
    ...(executionApproved ? { implementationPhase, implementationRevision } : {}),
    verificationApproved,
    branchPreparationApproved,
    commandExecutions: [],
    startedAt: Date.now(),
  };
  clearNativeCodexPrompt();
  state.isRunning = true;
  state.mobileView = "workspace";
  saveState();
  refreshCurrentLab();
  startCodexThinkingTimer(pendingId);

  return Promise.resolve()
    .then(() => {
      if (typeof initializeCodexWorkspace === "function"
        && typeof verifiedCodexWorkspace === "function"
        && !verifiedCodexWorkspace()) {
        return initializeCodexWorkspace();
      }
      return null;
    })
    .then(() => requestLiveCodexResponse(step,
      commentOnly ? "Implement the attached review comment." : prompt, {
      executionApproved,
      ...(executionApproved ? { implementationPhase, implementationRevision } : {}),
      verificationApproved,
      ...(step.id === "test" && requestsLocalPreview(prompt) ? { stagedPreviewRequested: true } : {}),
      ...(branchPreparationApproved ? { branchPreparationApproved: true } : {}),
      ...(diffCommentAttachment.comments.length
        ? { reviewComments: diffCommentAttachment.comments }
        : {}),
    }))
    .then((response) => {
      if (state.pendingConversation?.id !== pendingId) {
        stopCodexThinkingTimer(pendingId);
        return false;
      }
      const workspace = step.id === "build" && advancesStep
        ? typeof verifiedCodexWorkspace === "function"
          ? verifiedCodexWorkspace()
          : state.workspaceSnapshot?.verified === true ? state.workspaceSnapshot : null
        : null;
      if (step.id === "build" && advancesStep
        && (!workspace || !workspace.changed || !Array.isArray(workspace.changedFiles) || workspace.changedFiles.length === 0)) {
        throw new Error("Codex did not make a confirmed change to the project.");
      }
      if (executionApproved && (
        workspace.sessionId !== observedWorkspace?.sessionId
        || !Number.isSafeInteger(workspace.revision)
        || workspace.revision <= implementationRevision
        || homepageHeadingPhase(workspace) !== (implementationPhase === "initial" ? "first" : "final")
      )) {
        throw new Error("Codex did not complete the approved homepage heading transition.");
      }
      if (state.pendingConversation.accepted === false) acceptPendingCodexTurn(pendingId);
      const branchWorkspace = step.id === "ticket" && advancesStep
        && typeof verifiedCodexWorkspace === "function"
        ? verifiedCodexWorkspace()
        : null;
      if (typeof branchWorkspace?.branch === "string"
        && (branchWorkspace.branch !== COURSE.repository.workingBranch
          || branchWorkspace.branchBase !== COURSE.repository.baseBranch)) {
        throw new Error("Codex did not create the requested project feature branch.");
      }

      const verification = verificationApproved
        ? typeof verifiedCodexVerification === "function"
          ? verifiedCodexVerification(state.verificationResult, { allowFailed: true })
          : null
        : null;
      if (verificationApproved && !verification) {
        throw new Error("Codex did not return valid results for both requested checks.");
      }

      const workedSeconds = Math.max(1,
        Math.floor((Date.now() - state.pendingConversation.startedAt) / 1_000));
      const observedActivities = typeof verifiedCodexWorkedActivities === "function"
        ? verifiedCodexWorkedActivities(state.pendingConversation.streamActivities)
        : [];
      const observedSummary = state.pendingConversation.streamSummary
        || state.pendingConversation.streamStatus;
      const workActivities = observedActivities.length
        ? observedActivities
        : typeof verifiedCodexWorkedActivities === "function"
          && typeof observedSummary === "string"
          && observedSummary.trim()
        ? verifiedCodexWorkedActivities([{
          id: "reasoning-observed",
          text: observedSummary,
          status: "completed",
        }])
        : [];
      stopCodexThinkingTimer(pendingId);
      const responseAdvancesStep = advancesStep;
      recordConversation(step, displayPrompt, response, {
        id: pendingId,
        guided: responseAdvancesStep,
        reviewComments: diffCommentAttachment.snapshots,
        commentOnly,
        ...(workedSeconds >= 1 && workedSeconds <= 3_600 ? { workedSeconds } : {}),
        ...(workActivities.length ? { workActivities } : {}),
        ...(workspace ? { workspaceChanges: workspace.changedFiles } : {}),
        ...(verification ? { verification } : {}),
        ...(state.pendingConversation.stagedPreview
          ? { stagedPreview: state.pendingConversation.stagedPreview }
          : {}),
        ...(branchPreparationApproved
          ? { commandExecutions: state.pendingConversation.commandExecutions }
          : {}),
      });
      state.pendingConversation = null;
      state.isRunning = false;
      if (verification && !verification.passed) {
        const failure = verification.checks.find((check) => check.exitCode !== 0);
        state.validationMessage = `${failure.command} failed with exit code ${failure.exitCode}. Review the command output before continuing.`;
        saveState();
        refreshCurrentLab();
        scrollNativeThreadToBottom();
        return false;
      }
      if (responseAdvancesStep && step.id === "test") {
        if (prompt === "/review staging") markPracticeTask("test", 2);
        if (verification?.passed) markPracticeTask("test", 3);
      } else if (responseAdvancesStep && step.id === "build" && implementationPhase === "review-comment") {
        state.completed.add("build");
        delete state.taskProgress.build;
      } else if (responseAdvancesStep && step.id === "build") {
        markPracticeTask("build", 1);
        state.homepageBuildProgressVersion = 1;
      } else if (responseAdvancesStep) {
        state.completed.add(step.id);
      }
      saveState();
      refreshCurrentLab();
      scrollNativeThreadToBottom();
      return true;
    })
    .catch((error) => {
      if (state.pendingConversation?.id !== pendingId) {
        stopCodexThinkingTimer(pendingId);
        return false;
      }
      stopCodexThinkingTimer(pendingId);
      const landed = typeof reconcileHomepageImplementation === "function"
        && reconcileHomepageImplementation(state.pendingConversation);
      if (landed && state.pendingConversation.accepted === false) acceptPendingCodexTurn(pendingId);
      else persistAcceptedPendingTurn(state.pendingConversation);
      state.pendingConversation = null;
      state.isRunning = false;
      state.validationMessage = landed
        ? "The approved file change completed before the Codex response ended."
        : `Codex could not answer: ${error?.message || "The live model is unavailable."}`;
      saveState();
      refreshCurrentLab();
      return false;
    });
}

function approvePlan() {
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return false;
  }

  if (
    STEPS[state.currentIndex]?.id !== "build"
    || !state.planDraftReady
    || state.isRunning
    || !lessonContextReady("plan")
    || state.planApproved === true
    || isComplete("build")
  ) {
    return false;
  }

  return typeof chooseCodexPlanImplementation === "function"
    ? chooseCodexPlanImplementation()
    : false;
}

function connectFallbackLinear() {
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return false;
  }

  const step = STEPS[state.currentIndex];
  if (step?.id !== "connect" || isComplete("connect") || state.linearConnected) {
    return false;
  }

  if (practiceTaskCount(step) < 1) {
    state.validationMessage = "Open Plugins before connecting Linear.";
    refreshCurrentLab();
    return false;
  }

  state.linearConnected = true;
  state.validationMessage = "";
  if (!markPracticeTask("connect", 2)) {
    state.linearConnected = false;
    return false;
  }

  state.fallbackPluginsOpen = false;
  refreshCurrentLab();
  const composer = document.querySelector("#composer-input");
  if (composer) composer.focus();
  return true;
}

function stopCurrentCodexRequest() {
  const pending = state.pendingConversation;
  if (!state.isRunning || !pending) return false;

  const landed = typeof reconcileHomepageImplementation === "function"
    && reconcileHomepageImplementation(pending);
  if (landed && pending.accepted === false) acceptPendingCodexTurn(pending.id);
  else persistAcceptedPendingTurn(pending);
  stopCodexThinkingTimer(pending.id);
  state.pendingConversation = null;
  state.isRunning = false;
  if (pending.publicationPhase === "publishing") state.prPublishing = false;
  state.validationMessage = landed
    ? "Codex stopped after the approved file change completed."
    : "Codex stopped. No action was completed.";
  saveState();
  refreshCurrentLab();
  return true;
}

function publishPullRequest(prompt = "") {
  if (state.hostedPreview === true) {
    if (typeof showHostedPreviewInstructions === "function") showHostedPreviewInstructions();
    return false;
  }

  const approved = typeof pullRequestApprovalIntent === "function"
    ? pullRequestApprovalIntent(prompt)
    : /^(?:publish|create|open)\b.*\b(?:pull request|pr)\b/i.test(String(prompt).trim());
  const workspace = typeof verifiedCodexWorkspace === "function"
    ? verifiedCodexWorkspace()
    : null;
  if (state.isRunning || isComplete("pr") || !approved || practiceTaskCount(STEPS[state.currentIndex]) >= 1) return false;
  if (!lessonContextReady("build") || !lessonContextReady("test") || !workspace) {
    state.validationMessage = "Implement and review the change before creating the pull request.";
    refreshCurrentLab();
    return false;
  }

  const step = STEPS[state.currentIndex];
  if (step?.id !== "pr") return false;
  const approval = String(prompt).trim();
  const pendingId = `pr-publish-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  state.pendingConversation = {
    id: pendingId,
    stepId: "pr",
    prompt: approval,
    response: "",
    guided: true,
    publicationPhase: "publishing",
    streamStatus: "Preparing the pull request",
    streamSummary: "Preparing the pull request",
    streamResponse: "",
    streamActivities: [],
    commandExecutions: [],
    startedAt: Date.now(),
  };
  clearNativeCodexPrompt();
  state.validationMessage = "";
  state.prPublishing = true;
  state.isRunning = true;
  state.mobileView = "workspace";
  saveState();
  refreshCurrentLab();
  startCodexThinkingTimer(pendingId);

  return Promise.resolve()
    .then(() => requestLiveCodexResponse(step, approval, {
      executionApproved: false,
      verificationApproved: false,
    }))
    .then((response) => {
      if (!state.isRunning
        || state.pendingConversation?.id !== pendingId
        || state.pendingConversation.publicationPhase !== "publishing") return false;
      const currentWorkspace = typeof verifiedCodexWorkspace === "function"
        ? verifiedCodexWorkspace()
        : null;
      if (!currentWorkspace
        || currentWorkspace.sessionId !== workspace.sessionId
        || currentWorkspace.revision !== workspace.revision
        || currentWorkspace.patch !== workspace.patch) {
        throw new Error("The implementation changed. Review the latest diff before creating the pull request.");
      }
      stopCodexThinkingTimer(pendingId);
      const publishedResponse = typeof normalizeTrainingPullRequestResponse === "function"
        ? normalizeTrainingPullRequestResponse(response)
        : response;
      recordConversation(step, approval, publishedResponse, {
        id: pendingId,
        guided: true,
        publicationPhase: "published",
      });
      state.pendingConversation = null;
      state.prPublishing = false;
      state.isRunning = false;
      markPracticeTask("pr", 1);
      saveState();
      refreshCurrentLab();
      scrollNativeThreadToBottom();
      return true;
    })
    .catch((error) => {
      if (state.pendingConversation?.id !== pendingId) {
        stopCodexThinkingTimer(pendingId);
        return false;
      }
      stopCodexThinkingTimer(pendingId);
      state.pendingConversation = null;
      state.prPublishing = false;
      state.isRunning = false;
      state.validationMessage = `Codex could not answer: ${error?.message || "The live model is unavailable."}`;
      saveState();
      refreshCurrentLab();
      return false;
    });
}

function trainingSlackResponse() {
  return `Shared in [Blossom Bank Eng](#practice-slack-thread):\n\n“ENG-248 is ready for review. The homepage heading is shorter, and the focused checks passed. [PR #${COURSE.pullRequest.number}](${COURSE.pullRequest.url})”`;
}

function shareTrainingPullRequest(prompt) {
  const step = STEPS[state.currentIndex];
  if (step?.id !== "pr" || state.isRunning || isComplete("pr")) return false;
  const ready = practiceTaskCount(step) === 2 && state.slackConnected === true;
  const requested = /^(?:(?:can|could|would) you\s+)?(?:please\s+)?(?:use Slack to\s+)?(?:post|share|send)\b/i.test(prompt.trim())
    && !/\b(don.t|do not|never|without)\b/i.test(prompt)
    && /\b(pull request|pr)\b/i.test(prompt)
    && /#?blossom-bank-eng\b|\bteam channel\b/i.test(prompt);
  if (!ready || !requested) {
    state.validationMessage = !ready ? "Create the pull request and connect Slack in Plugins first."
      : "Ask Codex to post the pull request link in #blossom-bank-eng.";
    refreshCurrentLab();
    return false;
  }
  // Prepared course result only: never send a real Slack message from the lab.
  recordConversation(step, prompt,
    trainingSlackResponse(),
    { guided: true, publicationPhase: "shared" });
  state.completed.add("pr");
  delete state.taskProgress.pr;
  state.validationMessage = "";
  clearNativeCodexPrompt();
  saveState();
  refreshCurrentLab();
  scrollNativeThreadToBottom();
  return true;
}

function restartCourse() {
  trainingAnalytics?.restart();
  if (typeof dismissCodexCourseCue === "function") dismissCodexCourseCue();
  stopCodexThinkingTimer();
  state.completed.clear();
  state.prompts = {};
  state.conversations = {};
  state.diffComments = [];
  state.taskProgress = {};
  state.homepageBuildProgressVersion = 0;
  state.linearConnected = false;
  state.slackConnected = false;
  state.verificationThreadCreated = false;
  state.selectedCodexThread = "";
  state.reviewCommandMenu = "";
  state.catalogInstalledPlugins = new Set();
  state.ticketEnvironmentOpenedByLearner = false;
  state.ticketBranchesInspectedByLearner = false;
  state.ticketStagingSelectedByLearner = false;
  state.activeDiffComment = null;
  state.reviewCommentsAttachmentOpen = false;
  state.pendingConversation = null;
  state.isRunning = false;
  state.codexSessionId = "";
  state.workspaceSnapshot = null;
  state.activeStagedPreview = null;
  state.projectCreationStarted = false;
  state.projectCreationStage = "";
  state.projectType = "local";
  state.projectSelecting = false;
  state.projectName = "";
  state.projectNameError = "";
  state.projectDisplayName = "Blossom Bank";
  state.projectSourceSelected = false;
  state.projectPanelPickerOpen = false;
  state.verificationResult = null;
  codexWorkspaceBootstrap = null;
  state.codexModel = "";
  state.codexReasoningEffort = "";
  state.phase = "brief";
  state.hintsOpen = false;
  state.learnMoreOpen = false;
  state.completionVisible = false;
  state.practiceScenarioDismissed = false;
  state.linearScenarioDismissed = false;
  state.tasksOpen = true;
  state.expandedPracticeTask = null;
  state.stepMenuOpen = false;
  state.restartDialogOpen = false;
  state.selectedFile = defaultFile;
  state.repoPaneTab = "files";
  state.repoSelectedPath = defaultFile;
  state.repoExpandedFolders = new Set(["src", "src/features", "src/features/accounts"]);
  state.selectedDiff = modifiedFiles[0];
  state.environmentOpen = false;
  state.branchPickerOpen = false;
  state.branchPickerQuery = "";
  state.branchSwitching = false;
  state.repositoryPaneOpen = false;
  state.inspectorOpen = false;
  state.practiceTicketExpanded = false;
  state.planMode = false;
  state.composerMode = "agent";
  state.modeMenuOpen = false;
  state.planDraftReady = false;
  state.planApproved = false;
  state.prPublishing = false;
  state.courseCueSeen = new Set();
  window.__CODEX_TRAINING_RUNTIME__?.reset?.();
  saveState();
  goToStep(0);
}

app.addEventListener("pointerdown", observeCodexCourseClick, true);

for (const type of ["click", "input"]) {
  app.addEventListener(type, (event) => {
    if (event.target.closest?.(".practice-workspace-pane") && isTrainingWorkspaceInteraction(event)) {
      trainingAnalytics?.interact(STEPS[state.currentIndex].id, "workspace");
    }
  }, true);
}

app.addEventListener("click", (event) => {
  if (handlePracticeSlackLink(event)) return;
  const pluginInstall = event.target.closest?.("[data-plugin-install]");
  if (pluginInstall) {
    if (pluginInstall.dataset.pluginInstall === "linear") connectFallbackLinear();
    else installTrainingPlugin(app, pluginInstall.dataset.pluginInstall);
    return;
  }

  if (state.branchPickerOpen === true
    && event.target.closest?.(".codex-mini-fallback")
    && !event.target.closest?.("[data-codex-branch-picker], [data-codex-branch-trigger]")) {
    state.branchPickerOpen = false;
    state.branchPickerQuery = "";
    if (typeof syncCodexBranchPicker === "function") {
      syncCodexBranchPicker(app.querySelector?.(".codex-mini-fallback [data-codex-environment-panel]"));
    }
  }

  const control = event.target.closest("[data-action]");
  if (!control) return;

  switch (control.dataset.action) {
    case "open-staged-preview":
      event.preventDefault();
      openStagedPreviewAction(control.dataset.codexStagedPreview, control);
      break;
    case "start-course":
      if (location.hash === "#/intro") {
        goToStep(firstIncompleteStepIndex());
      } else {
        location.hash = "/intro";
        render();
      }
      break;
    case "begin-course":
    case "resume-course":
      goToStep(firstIncompleteStepIndex());
      break;
    case "start-first-lesson":
      goToStep(0);
      break;
    case "exit-training":
      navigateTraining("/training");
      break;
    case "go-to-walkthroughs":
      navigateTraining("/training#walkthroughs");
      break;
    case "exit-intro":
      state.stepMenuOpen = false;
      state.restartDialogOpen = false;
      location.hash = "";
      render();
      break;
    case "return-to-final-lesson":
      goToStep(STEPS.length - 1, "practice");
      break;
    case "finish-course":
      state.stepMenuOpen = false;
      state.restartDialogOpen = false;
      if (finishEmbeddedTraining()) break;
      location.hash = "";
      render();
      break;
    case "start-practice":
    case "practice-with-prompt":
      state.phase = "practice";
      state.hintsOpen = false;
      state.learnMoreOpen = false;
      state.tasksOpen = true;
      state.expandedPracticeTask = null;
      state.completionVisible = false;
      state.activeTab = state.repositoryPaneOpen === true
        ? state.repoPaneTab === "review" ? "diff" : state.repoPaneTab || "files"
        : "artifact";
      if (!["files", "review", "browser", "plan"].includes(state.repoPaneTab)) {
        state.repoPaneTab = "files";
      }
      state.fallbackPluginsOpen = false;
      state.inspectorOpen = state.repositoryPaneOpen === true;
      state.environmentOpen = false;
      state.branchPickerOpen = false;
      state.branchPickerQuery = "";
      state.repositoryPaneOpen = state.repositoryPaneOpen === true;
      state.repositoryPaneResizeRestoreTab = "";
      state.projectPanelPickerOpen = false;
      state.practiceTicketExpanded = false;
      pendingCodexMiniPrompt = control.dataset.prompt || "";
      location.hash = `/lab/${state.currentIndex + 1}/practice`;
      render();
      break;
    case "back-to-brief":
      if (window.__CODEX_TRAINING_EMBEDDED__ === true) {
        goToStep(Math.max(0, state.currentIndex - 1), "practice");
        break;
      }
      state.phase = "brief";
      state.learnMoreOpen = false;
      state.completionVisible = false;
      state.fallbackPluginsOpen = false;
      state.inspectorOpen = state.repositoryPaneOpen === true;
      state.environmentOpen = false;
      state.branchPickerOpen = false;
      state.branchPickerQuery = "";
      state.repositoryPaneOpen = state.repositoryPaneOpen === true;
      state.repositoryPaneResizeRestoreTab = "";
      state.projectPanelPickerOpen = false;
      state.practiceTicketExpanded = false;
      location.hash = `/lab/${state.currentIndex + 1}`;
      render();
      break;
    case "next-step-brief":
      if (isComplete(STEPS[state.currentIndex].id)) goToStep(state.currentIndex + 1);
      break;
    case "previous-step":
      if (state.currentIndex > 0) {
        goToStep(state.currentIndex - 1, "practice");
      } else {
        state.stepMenuOpen = false;
        state.restartDialogOpen = false;
        location.hash = "/intro";
        render();
      }
      break;
    case "next-step":
      trainingAnalytics?.skip(STEPS[state.currentIndex].id);
      if (state.phase === "brief") {
        state.phase = "practice";
        state.hintsOpen = false;
        state.learnMoreOpen = false;
        state.tasksOpen = true;
        state.expandedPracticeTask = null;
        state.completionVisible = false;
        state.activeTab = state.repositoryPaneOpen === true
          ? state.repoPaneTab === "review" ? "diff" : state.repoPaneTab || "files"
          : "artifact";
        if (!["files", "review", "browser", "plan"].includes(state.repoPaneTab)) {
          state.repoPaneTab = "files";
        }
        state.fallbackPluginsOpen = false;
        state.inspectorOpen = state.repositoryPaneOpen === true;
        state.environmentOpen = false;
        state.branchPickerOpen = false;
        state.branchPickerQuery = "";
        state.repositoryPaneOpen = state.repositoryPaneOpen === true;
        state.repositoryPaneResizeRestoreTab = "";
        state.projectPanelPickerOpen = false;
        state.practiceTicketExpanded = false;
        pendingCodexMiniPrompt = "";
        location.hash = `/lab/${state.currentIndex + 1}/practice`;
        render();
      } else if (window.__CODEX_TRAINING_EMBEDDED__ !== true
        && state.hostedPreview !== true
        && !state.completed.has(STEPS[state.currentIndex].id)) {
        break;
      } else if (state.currentIndex < STEPS.length - 1) {
        goToStep(state.currentIndex + 1);
      } else if (window.__CODEX_TRAINING_EMBEDDED__ === true
        || state.hostedPreview === true
        || state.completed.has(STEPS[state.currentIndex].id)) {
        state.stepMenuOpen = false;
        state.restartDialogOpen = false;
        if (!finishEmbeddedTraining()) {
          location.hash = "/summary";
          render();
        }
      }
      break;
    case "toggle-step-menu":
      state.stepMenuOpen = !state.stepMenuOpen;
      state.modeMenuOpen = false;
      refreshCurrentLab();
      document.querySelector(".journey-step-trigger")?.focus();
      break;
    case "jump-to-step":
      goToStep(Number(control.dataset.stepIndex ?? control.dataset.index));
      break;
    case "confirm-restart":
      state.stepMenuOpen = false;
      state.restartDialogOpen = true;
      refreshCurrentLab();
      document.querySelector(".journey-restart-cancel")?.focus();
      break;
    case "cancel-restart":
      state.restartDialogOpen = false;
      refreshCurrentLab();
      document.querySelector(".journey-restart")?.focus();
      break;
    case "dismiss-completion":
      state.completionVisible = false;
      refreshCurrentLab();
      break;
    case "dismiss-practice-scenario":
      if (STEPS[state.currentIndex].id === "connect") state.linearScenarioDismissed = true;
      else state.practiceScenarioDismissed = true;
      control.closest(".practice-assignment-overlay").innerHTML = renderPracticeScenario(STEPS[state.currentIndex]);
      syncPracticeScenarioOverlay(nativeCodexShadow());
      saveState();
      (nativeCodexShadow()?.querySelector("textarea") || app.querySelector("#composer-input"))?.focus({ preventScroll: true });
      break;
    case "toggle-hints":
      if (!state.hintsOpen) trainingAnalytics?.hint(STEPS[state.currentIndex].id);
      state.hintsOpen = !state.hintsOpen;
      refreshCurrentLab();
      document.querySelector(".hint-toggle")?.focus();
      break;
    case "toggle-learn-more":
      state.learnMoreOpen = !state.learnMoreOpen;
      refreshCurrentLab();
      document.querySelector(".practice-learn-more-toggle")?.focus();
      break;
    case "toggle-tasks": {
      state.tasksOpen = !state.tasksOpen;
      // Keep the existing control focused. Replacing it and calling focus()
      // turns a pointer click into a keyboard-style focus ring in Chromium.
      const card = control.closest(".practice-task-card");
      card.dataset.open = String(state.tasksOpen);
      control.setAttribute("aria-expanded", String(state.tasksOpen));
      card.querySelector(".practice-task-content").hidden = !state.tasksOpen;
      break;
    }
    case "toggle-practice-task": {
      const step = STEPS[state.currentIndex];
      const index = Number(control.dataset.taskIndex);
      if (!Number.isSafeInteger(index) || index < 0 || index >= practiceGuides[step.id].tasks.length) break;
      if (index > practiceTaskCount(step)) break;
      const expanded = Number.isSafeInteger(state.expandedPracticeTask)
        ? state.expandedPracticeTask
        : isComplete(step.id)
          ? -1
          : practiceTaskCount(step);
      state.expandedPracticeTask = expanded === index ? -1 : index;
      syncPracticeTaskProgress(step.id);
      control.focus?.();
      break;
    }
    case "toggle-goal-mode":
      toggleGoalMode();
      break;
    case "toggle-plan-mode":
      togglePlanMode();
      break;
    case "toggle-menu":
      state.menuOpen = !state.menuOpen;
      render();
      break;
    case "open-search":
      toggleLearnSearch(true, control);
      break;
    case "close-search":
      toggleLearnSearch(false);
      break;
    case "use-search-suggestion":
      state.searchQuery = control.dataset.query || "";
      syncLearnSearch();
      break;
    case "open-search-result": {
      event.preventDefault?.();
      const index = Number(control.dataset.stepIndex);
      toggleLearnSearch(false);
      if (index === -1) {
        location.hash = "/intro";
        render();
      } else if (Number.isSafeInteger(index) && index >= 0 && index < STEPS.length) {
        goToStep(index);
      }
      break;
    }
    case "open-docs-agent":
      toggleDocsAgent(true);
      break;
    case "close-docs-agent":
      toggleDocsAgent(false);
      break;
    case "open-hosted-preview-instructions":
      openHostedPreviewInstructions(control);
      break;
    case "close-hosted-preview-instructions":
      closeHostedPreviewInstructions();
      break;
    case "copy-hosted-preview-instructions":
      void copyHostedPreviewInstructions();
      break;
    case "reset-docs-agent":
      resetDocsAgent();
      break;
    case "ask-ai-suggestion":
      void askDocsAgent(control.dataset.prompt || "");
      break;
    case "use-prompt":
      useSuggestedPrompt(control.dataset.prompt || "");
      break;
    case "use-practice-example": {
      const step = STEPS[state.currentIndex];
      if (Number(control.dataset.taskIndex) !== practiceTaskCount(step) || isComplete(step.id)) break;
      useSuggestedPrompt(control.dataset.prompt || "");
      break;
    }
    case "use-practice-comment":
      usePracticeReviewComment();
      break;
    case "run-step":
      runStep();
      break;
    case "return-to-plan":
    case "return-to-build":
    case "return-to-verify": {
      const target = { "return-to-plan": "plan", "return-to-build": "build", "return-to-verify": "test" }[control.dataset.action];
      const targetIndex = STEPS.findIndex((step) => step.id === target);
      if (targetIndex >= 0) goToStep(targetIndex, "practice");
      break;
    }
    case "open-plan":
      openCodexPlanSidePanel();
      break;
    case "choose-plan-implementation":
      if (control.disabled !== true) chooseCodexPlanImplementation();
      break;
    case "dismiss-plan-request":
      dismissCodexPlanImplementationRequest();
      break;
    case "submit-plan-feedback": {
      const input = control.closest?.("[data-codex-composer-request-navigation]")
        ?.querySelector?.('[data-codex-plan-feedback="true"]');
      submitCodexPlanFeedback(input);
      break;
    }
    case "connect-linear":
      connectFallbackLinear();
      break;
    case "toggle-practice-ticket": {
      state.practiceTicketExpanded = state.practiceTicketExpanded !== true;
      const card = control.closest?.(".practice-linear-card");
      const content = card?.querySelector?.(".practice-linear-content");
      if (card?.dataset) card.dataset.open = String(state.practiceTicketExpanded);
      control.setAttribute?.("aria-expanded", String(state.practiceTicketExpanded));
      if (content) content.hidden = !state.practiceTicketExpanded;
      control.focus?.();
      break;
    }
    case "stop-generation":
      stopCurrentCodexRequest();
      break;
    case "browser-back":
    case "browser-next":
    case "browser-reload": {
      const action = control.dataset.action;
      const panel = control.closest?.("[data-codex-browser-panel]");
      const frame = panel?.querySelector?.("[data-codex-browser-frame]");
      try {
        if (action === "browser-back") frame?.contentWindow?.history?.back?.();
        else if (action === "browser-next") frame?.contentWindow?.history?.forward?.();
        else if (frame?.contentWindow?.location?.origin === location.origin
          && frame.contentWindow.location.pathname === "/") {
          frame.src = "/training/codex-lab/demos/blossom-bank/index.html";
        } else if (typeof frame?.contentWindow?.location?.reload === "function") frame.contentWindow.location.reload();
        else if (frame?.src) frame.src = frame.src;
      } catch {
        if (action === "browser-reload" && frame?.src) frame.src = frame.src;
      }
      break;
    }
    case "previous":
      goToStep(state.currentIndex - 1);
      break;
    case "next":
      if (state.currentIndex < STEPS.length - 1) goToStep(state.currentIndex + 1);
      break;
    case "switch-mobile":
      state.mobileView = control.dataset.view;
      refreshCurrentLab();
      break;
    case "toggle-environment": {
      state.environmentOpen = state.environmentOpen !== true;
      if (!state.environmentOpen) {
        state.branchPickerOpen = false;
        state.branchPickerQuery = "";
      }
      if (state.environmentOpen && STEPS[state.currentIndex]?.id === "ticket") {
        state.ticketEnvironmentOpenedByLearner = true;
        markPracticeTask("ticket", 1);
      }
      const panel = app.querySelector(".codex-mini-fallback [data-codex-environment-panel]");
      if (panel) panel.hidden = !state.environmentOpen;
      if (panel && typeof syncCodexBranchPicker === "function") syncCodexBranchPicker(panel);
      control.setAttribute("aria-expanded", String(state.environmentOpen));
      control.focus?.();
      break;
    }
    case "toggle-branch-picker":
      if (typeof toggleCodexBranchPicker === "function") toggleCodexBranchPicker();
      break;
    case "switch-branch":
      if (typeof switchCodexBranch === "function") void switchCodexBranch(control.dataset.branch);
      break;
    case "inspect-environment": {
      if (control.classList?.contains("codex-environment-changes")) {
        state.activeTab = "diff";
        state.repositoryPaneOpen = true;
        state.inspectorOpen = true;
        render();
      }
      break;
    }
    case "switch-tab": {
      const fallbackPlugins =
        STEPS[state.currentIndex]?.id === "connect"
        && Boolean(control.closest?.(".codex-mini-fallback"))
        && (control.getAttribute?.("title") || control.title) === "Plugins";
      if (fallbackPlugins) {
        markPracticeTask("connect", 1);
      }
      state.activeTab = control.dataset.tab;
      state.repositoryPaneOpen = true;
      if (STEPS[state.currentIndex]?.id === "build" && control.dataset.tab === "diff") {
        state.repoPaneTab = "review";
        state.repositoryPaneResizeRestoreTab = "";
        completeBuildReviewInspection();
      }
      state.fallbackPluginsOpen = fallbackPlugins;
      state.inspectorOpen = !fallbackPlugins;
      if (!fallbackPlugins) {
        state.repoPaneTab = control.dataset.tab === "diff" ? "review" : control.dataset.tab;
        if (typeof saveState === "function") saveState();
      }
      render();
      if (!fallbackPlugins && control.dataset.tab === "files"
        && typeof currentCodexCourseTarget === "function") {
        const requiredChild = currentCodexCourseTarget();
        if (requiredChild?.element?.dataset?.action === "select-file"
          && /^build:changed-file$/.test(requiredChild.key)
          && state.courseCueSeen && typeof state.courseCueSeen.delete === "function") {
          state.courseCueSeen.delete(requiredChild.key);
        }
        if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
      }
      break;
    }
    case "toggle-inspector":
      state.inspectorOpen = !state.inspectorOpen;
      state.repositoryPaneOpen = state.inspectorOpen;
      if (state.inspectorOpen) {
        state.repositoryPaneResizeRestoreTab = "";
        state.environmentOpen = false;
        state.branchPickerOpen = false;
        state.branchPickerQuery = "";
        state.fallbackPluginsOpen = false;
        state.activeTab = state.repoPaneTab === "review" ? "diff" : state.repoPaneTab || "files";
        if (STEPS[state.currentIndex]?.id === "project") {
          state.activeTab = "files";
          state.repoPaneTab = "files";
        }
      }
      state.projectPanelPickerOpen = false;
      if (typeof saveState === "function") saveState();
      render();
      break;
    case "open-project-files":
      if (STEPS[state.currentIndex]?.id !== "project"
        || state.projectPanelPickerOpen !== true
        || !(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) break;
      state.projectPanelPickerOpen = false;
      state.inspectorOpen = true;
      state.repositoryPaneOpen = true;
      state.environmentOpen = false;
      state.branchPickerOpen = false;
      state.branchPickerQuery = "";
      state.activeTab = "files";
      state.repoPaneTab = "files";
      render();
      break;
    case "review-command-options":
      showReviewCommandMenu("branches");
      break;
    case "review-uncommitted":
      state.validationMessage = "For this review, select staging, the source branch for the change.";
      closeReviewCommandMenu();
      refreshCurrentLab();
      break;
    case "review-base-branch":
      if (control.dataset.branch !== COURSE.repository.baseBranch) {
        state.validationMessage = "Select staging, the source branch for this change.";
        closeReviewCommandMenu();
        refreshCurrentLab();
        break;
      }
      closeReviewCommandMenu();
      runStep("/review staging");
      break;
    case "select-training-thread":
      if (!state.isRunning && isVerificationLesson()
        && ["eng-248", "eng-248-verify"].includes(control.dataset.thread)) {
        state.selectedCodexThread = control.dataset.thread;
        state.fallbackPluginsOpen = false;
        state.activeTab = "artifact";
        refreshCurrentLab();
      }
      break;
    case "new-verification-thread":
      if (!startVerificationThread()) (document.querySelector("#composer-input"))?.focus();
      break;
    case "focus-thread":
      if (control.textContent?.trim() === "New chat" && startVerificationThread()) break;
      (nativeCodexShadow()?.querySelector("textarea") || document.querySelector("#composer-input"))?.focus();
      break;
    case "start-project":
    case "choose-project":
      startCodexProject();
      break;
    case "select-project-type":
      if (typeof selectCodexProjectType === "function") {
        selectCodexProjectType(control.dataset.projectType);
      }
      break;
    case "continue-project-creation":
      if (typeof continueCodexProjectCreation === "function") {
        continueCodexProjectCreation();
      }
      break;
    case "select-project-directory":
      selectCodexProjectDirectory();
      break;
    case "remove-project-directory":
      if (typeof removeCodexProjectDirectory === "function") {
        removeCodexProjectDirectory();
      }
      break;
    case "create-project":
      void connectCodexProject();
      break;
    case "cancel-project-creation":
      if (state.projectSelecting === true) break;
      state.projectCreationStarted = false;
      state.projectCreationStage = "";
      state.projectType = "local";
      state.projectName = "";
      state.projectNameError = "";
      state.projectSourceSelected = false;
      if (!(typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace())) {
        delete state.taskProgress.project;
      }
      saveState();
      refreshCurrentLab();
      (nativeCodexShadow()?.querySelector('[data-codex-project-action="start-project"]')
        || app.querySelector('[data-action="start-project"]'))?.focus?.();
      break;
    case "open-source-citation": {
      event.preventDefault();
      const workspace = typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace() : null;
      const path = control.dataset.path;
      if (!workspace?.files.some((file) => file.path === path)) break;
      state.sourceCitation = { path, line: Number(control.dataset.line) };

      state.repositoryPaneOpen = true;
      state.inspectorOpen = true;
      state.repositoryPaneResizeRestoreTab = "";
      state.environmentOpen = false;
      state.branchPickerOpen = false;
      state.branchPickerQuery = "";
      state.activeTab = "files";
      state.repoPaneTab = "files";
      state.selectedFile = path;
      state.repoSelectedPath = path;
      render();

      const line = Number(control.dataset.line);
      if (Number.isSafeInteger(line) && line > 0) {
        app.querySelectorAll?.(".codex-mini-fallback .code-line")?.[line - 1]
          ?.scrollIntoView?.({ block: "center", inline: "nearest" });
      }
      break;
    }
    case "select-file":
      if ((typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace()?.files.some((file) => file.path === control.dataset.path) : false)
        || (!state.workspaceSnapshot && FILES[control.dataset.path])) {
        state.sourceCitation = null;
        state.selectedFile = control.dataset.path;
        if (STEPS[state.currentIndex]?.id === "build") {
          state.repoSelectedPath = control.dataset.path;
        }
      }
      render();
      break;
    case "select-diff":
      if ((typeof verifiedCodexWorkspace === "function" ? verifiedCodexWorkspace()?.changedFiles.some((file) => file.path === control.dataset.path) : false)
        || (!state.workspaceSnapshot && DIFFS[control.dataset.path])) {
        state.selectedDiff = control.dataset.path;
      }
      render();
      break;
    case "open-review-comment":
      openReviewCommentSelection(control);
      refreshCurrentLab();
      {
        const composer = app.querySelector?.('.codex-mini-fallback [data-codex-review-composer]');
        composer?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
        const input = composer?.querySelector?.('[data-codex-review-input="true"]')
          || app.querySelector?.('[data-codex-review-input="true"]');
        input?.focus?.({ preventScroll: true });
      }
      break;
    case "cancel-review-comment": {
      const active = state.activeDiffComment;
      state.activeDiffComment = null;
      refreshCurrentLab();
      const trigger = Array.from(app.querySelectorAll?.('[data-action="open-review-comment"]') || [])
        .find((button) => button.dataset.path === active?.path
          && button.dataset.line === String(active?.line)
          && button.dataset.side === active?.side)
        || app.querySelector?.('[data-action="open-review-comment"]');
      trigger?.focus?.();
      break;
    }
    case "submit-review-comment": {
      submitReviewCommentSelection(control);
      break;
    }
    case "toggle-review-comments-attachment": {
      const attachment = control.closest?.("[data-codex-review-comments-id]");
      if (toggleReviewCommentsAttachment(attachment?.dataset.codexReviewCommentsId || "")) {
        refreshCurrentLab();
      }
      break;
    }
    case "use-required-review-comment":
      useRequiredReviewComment(control);
      break;
    case "remove-review-comment":
      removePendingDiffComment(control.dataset.commentId);
      break;
    case "remove-review-comments-attachment":
      removePendingDiffCommentAttachments();
      break;
    case "toggle-plan":
      state.planMode = !state.planMode;
      state.composerMode = state.planMode ? "plan" : "agent";
      if (state.planMode
        && state.hostedPreview !== true
        && typeof STEPS !== "undefined"
        && STEPS[state.currentIndex]?.id === "plan"
        && state.planDraftReady !== true
        && (typeof isComplete !== "function" || !isComplete("plan"))) {
        state.expandedPracticeTask = null;
      }
      state.modeMenuOpen = false;
      state.validationMessage = "";
      refreshCurrentLab();
      (document.querySelector(".practice-stage-actions .mode-toggle") || document.querySelector(".mode-toggle"))?.focus();
      break;
    case "approve-plan":
      approvePlan();
      break;
    case "restart":
      restartCourse();
      break;
    default:
      break;
  }
  if (typeof syncCodexCourseCue === "function") syncCodexCourseCue();
});

app.addEventListener("submit", (event) => {
  if (event.target.id === "docs-agent-composer") {
    event.preventDefault();
    void askDocsAgent(event.target.querySelector(".ask-ai-input")?.value || "");
    return;
  }
  if (event.target.id !== "codex-composer") return;
  event.preventDefault();
  const composer = event.target.querySelector("#composer-input");
  const prompt = composer?.value?.trim() || "";
  if (!prompt && !pendingDiffCommentAttachment().snapshots.length) return;
  if (handleCodexModeCommand(prompt)) return;
  runStep(prompt);
});

app.addEventListener("mouseover", handleReviewCommentsAttachmentMouseover, true);
app.addEventListener("mouseout", handleReviewCommentsAttachmentMouseout, true);
app.addEventListener("pointerdown", handleReviewSelectionPointerDown, true);
app.addEventListener("pointermove", handleReviewSelectionPointerMove, true);
app.addEventListener("pointerup", handleReviewSelectionPointerUp, true);
app.addEventListener("pointercancel", handleReviewSelectionPointerUp, true);

app.addEventListener("input", (event) => {
  if (event.target.id === "composer-input") syncReviewCommandInput(event.target);
  if (event.target.matches?.('[data-codex-plan-feedback="true"]')) {
    updateCodexPlanRequestInput(event.target);
    return;
  }

  if (event.target.matches?.('[data-codex-review-input="true"]')) {
    const submit = event.target.closest?.("[data-codex-review-composer]")
      ?.querySelector?.('[data-action="submit-review-comment"]');
    if (submit) submit.disabled = !event.target.value.trim();
    return;
  }

  if (event.target.matches?.("[data-codex-branch-search]")) {
    if (typeof filterCodexBranchPicker === "function") filterCodexBranchPicker(event.target);
    return;
  }

  if (event.target.id === "codex-project-name") {
    state.projectName = event.target.value;
    const validProjectName = state.projectName.trim()
      && state.projectName.length <= 120
      && !/[\u0000-\u001f\u007f]/.test(state.projectName);
    if (state.projectNameError && validProjectName) {
      state.projectNameError = "";
      event.target.setAttribute?.("aria-invalid", "false");
      event.target.removeAttribute?.("aria-describedby");
      event.target.closest?.(".codex-project-name-field")?.classList?.remove?.("has-error");
      event.target.closest?.(".codex-project-name-control")
        ?.querySelector?.("#codex-project-name-error")?.remove?.();
    }
    const createButton = event.target.closest?.("[data-codex-project-picker]")
      ?.querySelector?.('[data-action="create-project"]');
    if (createButton) {
      createButton.disabled = state.projectSelecting === true;
    }
    return;
  }

  if (event.target.id === "learn-search-input") {
    state.searchQuery = event.target.value;
    syncLearnSearch({ focus: false });
    return;
  }

  if (event.target.id === "docs-agent-input") {
    const button = event.target.closest(".ask-ai-composer")?.querySelector(".ask-ai-send");
    if (button) button.disabled = state.docsAgentPending || !event.target.value.trim();
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 112)}px`;
    return;
  }

  if (event.target.id === "composer-input") {
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 110)}px`;
    const send = event.target.closest?.("#codex-composer")?.querySelector?.('button[type="submit"][aria-label="Send message"]');
    if (send) {
      send.disabled = !event.target.value.trim() && pendingDiffCommentAttachment().snapshots.length === 0;
    }
  }
});

app.addEventListener("keydown", (event) => {
  if (handleReviewCommandKeydown(event)) return;
  if (handleCodexProjectTypeKeydown(event)) return;
  if (handleFallbackStagedPreviewKeydown(event)) return;

  if (typeof handleCodexPlanRequestKeydown === "function"
    && handleCodexPlanRequestKeydown(event)) return;

  const reviewAttachmentRemove = event.target.closest?.('[data-codex-review-comments-action="remove-attachment"]');
  if (reviewAttachmentRemove && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    event.stopPropagation();
    removePendingDiffCommentAttachments();
    app.querySelector?.("#composer-input")?.focus?.();
    return;
  }

  const reviewInput = event.target.matches?.('[data-codex-review-input="true"]')
    ? event.target
    : null;
  if (reviewInput && event.key === "Escape") {
    event.preventDefault();
    reviewInput.closest?.("[data-codex-review-composer]")
      ?.querySelector?.('[data-action="cancel-review-comment"]')?.click?.();
    return;
  }
  if (reviewInput && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    if (!reviewInput.value.trim()) return;
    reviewInput.closest?.("[data-codex-review-composer]")
      ?.querySelector?.('[data-action="submit-review-comment"]')?.click?.();
    return;
  }
  if (reviewInput) return;

  const branchPicker = event.target.closest?.(".codex-mini-fallback [data-codex-branch-picker]");
  if (branchPicker && ["Escape", "ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
    const options = Array.from(branchPicker.querySelectorAll?.("[data-action=\"switch-branch\"]") || []);
    const position = options.indexOf(event.target);
    event.preventDefault();
    if (event.key === "Escape") {
      state.branchPickerOpen = false;
      state.branchPickerQuery = "";
      const panel = app.querySelector(".codex-mini-fallback [data-codex-environment-panel]");
      if (typeof syncCodexBranchPicker === "function") syncCodexBranchPicker(panel);
      panel?.querySelector?.("[data-codex-branch-trigger]")?.focus?.();
    } else if (event.key === "ArrowDown") {
      options[Math.min(position + 1, options.length - 1)]?.focus?.();
    } else if (event.key === "ArrowUp") {
      if (position <= 0) branchPicker.querySelector("[data-codex-branch-search]")?.focus?.();
      else options[position - 1]?.focus?.();
    } else {
      const option = position >= 0 ? options[position] : options[0];
      if (option && typeof switchCodexBranch === "function") void switchCodexBranch(option.dataset.branch);
    }
    return;
  }

  if (event.target.id === "codex-project-name" && event.key === "Enter") {
    event.preventDefault();
    void connectCodexProject();
    return;
  }

  if (event.target.id === "docs-agent-input" && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void askDocsAgent(event.target.value);
    return;
  }

  if (event.target.id === "learn-search-input" && event.key === "ArrowDown") {
    const firstResult = app.querySelector(".learn-search-result");
    if (firstResult) {
      event.preventDefault();
      firstResult.focus();
    }
    return;
  }

  if (event.key === "Escape" && state.environmentOpen === true
    && event.target.closest?.(".codex-mini-fallback")) {
    event.preventDefault();
    state.environmentOpen = false;
    const panel = app.querySelector(".codex-mini-fallback [data-codex-environment-panel]");
    const toggle = app.querySelector(".codex-mini-fallback [data-codex-environment-toggle]");
    if (panel) panel.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.focus();
    return;
  }

  if (event.target.matches?.("[data-browser-sidebar-address-input]") && event.key === "Enter") {
    event.preventDefault();
    const panel = event.target.closest?.("[data-codex-browser-panel]");
    const frame = panel?.querySelector?.("[data-codex-browser-frame]");
    try {
      const destination = new URL(event.target.value, location.origin);
      if (destination.origin === location.origin && destination.pathname === "/") {
        destination.pathname = "/training/codex-lab/demos/blossom-bank/index.html";
      }
      const supportedPath = destination.pathname === "/training/codex-lab/demos/blossom-bank"
        || destination.pathname.startsWith("/training/codex-lab/demos/blossom-bank/")
        || ["/products", "/solutions", "/wealth", "/security", "/pricing"].includes(destination.pathname);
      if (destination.origin === location.origin && supportedPath && frame) {
        frame.src = `${destination.pathname}${destination.search}${destination.hash}`;
      } else {
        syncNativeBrowserNavigation(panel);
      }
    } catch {
      syncNativeBrowserNavigation(panel);
    }
    return;
  }

  if (event.target.id === "composer-input" && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const prompt = event.target.value.trim();
    if (!prompt && !pendingDiffCommentAttachment().snapshots.length) return;
    if (handleCodexModeCommand(prompt)) return;
    runStep(prompt);
  }
});

app.addEventListener("load", (event) => {
  if (!event.target.matches?.("[data-codex-browser-frame]")) return;
  const panel = event.target.closest?.("[data-codex-browser-panel]");
  if (!panel) return;
  syncNativeBrowserNavigation(panel);
  if (typeof observeStagedPreviewInspection === "function") {
    observeStagedPreviewInspection(event.target);
  }
  try {
    const page = event.target.contentWindow;
    const update = () => syncNativeBrowserNavigation(panel);
    page?.addEventListener?.("popstate", update);
    page?.addEventListener?.("hashchange", update);
    page?.document?.addEventListener?.("click", () => page.setTimeout(update, 0), true);
  } catch {
    // The bank remains interactive even if its navigation state cannot be read.
  }
}, true);

document.addEventListener("pointerdown", (event) => {
  const path = event.composedPath();
  if (state.stepMenuOpen) {
    const insideStepNavigation = path.some((item) => item instanceof Element && (item.classList.contains("journey-step-menu") || item.classList.contains("journey-step-trigger")));
    if (!insideStepNavigation) {
      state.stepMenuOpen = false;
      app.querySelector(".journey-step-menu")?.remove();
      app.querySelector(".journey-step-trigger")?.setAttribute("aria-expanded", "false");
    }
  }
  if (!state.modeMenuOpen) return;
  if (path.some((item) => item instanceof Element && (item.classList.contains("codex-mode-menu") || item.matches('button[aria-label="Add files and more"], button[data-codex-course-mode]')))) return;
  closeCodexModeMenu();
}, true);

document.addEventListener("keydown", (event) => {
  if (state.hostedPreviewInstructionsOpen === true) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeHostedPreviewInstructions();
      return;
    }
    if (event.key === "Tab") trapHostedPreviewFocus(event);
    return;
  }

  const macPlatform = typeof navigator !== "undefined"
    && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");
  const sidePanelPrimaryKey = macPlatform
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
  if (sidePanelPrimaryKey && event.altKey && !event.shiftKey
    && typeof event.key === "string" && event.key.toLowerCase() === "b"
    && state.phase === "practice" && state.searchOpen !== true && state.docsAgentOpen !== true) {
    const shadow = typeof nativeCodexShadow === "function" ? nativeCodexShadow() : null;
    const toggle = shadow?.querySelector?.("[data-codex-files-toggle]")
      || app.querySelector?.(".codex-mini-fallback [data-codex-files-toggle]");
    if (toggle) {
      event.preventDefault();
      toggle.click?.();
      return;
    }
  }

  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
    && typeof event.key === "string" && event.key.toLowerCase() === "p"
    && typeof STEPS !== "undefined" && STEPS[state.currentIndex]?.id === "project"
    && state.searchOpen !== true && state.docsAgentOpen !== true
    && state.projectCreationStarted !== true
    && typeof verifiedCodexWorkspace === "function" && verifiedCodexWorkspace()) {
    event.preventDefault();
    const shadow = typeof nativeCodexShadow === "function" ? nativeCodexShadow() : null;
    if (state.repositoryPaneOpen !== true) {
      (shadow?.querySelector?.("[data-codex-files-toggle]")
        || app.querySelector?.(".codex-mini-fallback [data-codex-files-toggle]")
        || app.querySelector?.("[data-codex-files-toggle]"))?.click?.();
    } else {
      (shadow?.querySelector?.('[data-codex-repo-action="open-file"]')
        || app.querySelector?.('[data-action="select-file"]'))?.focus?.();
    }
    return;
  }

  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
    && typeof event.key === "string" && event.key.toLowerCase() === "k") {
    const target = event.composedPath?.()[0] || event.target;
    const editable = target?.isContentEditable
      || /^(INPUT|TEXTAREA|SELECT)$/i.test(target?.tagName || "")
      || target?.getAttribute?.("contenteditable") === "true";

    if (!editable) {
      event.preventDefault();
      toggleLearnSearch(true, app.querySelector(".header-search"));
    }
    return;
  }

  if (event.key !== "Escape") return;
  if (state.searchOpen) {
    event.preventDefault();
    toggleLearnSearch(false);
    return;
  }
  if (state.docsAgentOpen) {
    event.preventDefault();
    toggleDocsAgent(false);
    return;
  }
  if (state.projectCreationStarted === true && state.projectSelecting !== true) {
    event.preventDefault();
    app.querySelector('[data-action="cancel-project-creation"]')?.click();
    return;
  }
  if (state.restartDialogOpen) {
    event.preventDefault();
    state.restartDialogOpen = false;
    refreshCurrentLab();
    document.querySelector(".journey-restart")?.focus();
    return;
  }
  if (state.stepMenuOpen) {
    event.preventDefault();
    state.stepMenuOpen = false;
    app.querySelector(".journey-step-menu")?.remove();
    const trigger = app.querySelector(".journey-step-trigger");
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.focus();
    return;
  }
  if (!state.modeMenuOpen) return;
  event.preventDefault();
  closeCodexModeMenu(true);
}, true);

if (state.hostedRuntimeCandidate === true && state.hostedPreviewForced !== true) {
  void initializeHostedCodexRuntime();
}
trainingAnalytics = createHandsOnTrainingTracker({
  course: "codex",
  lessons: STEPS.map((step) => ({
    id: step.id,
    taskIds: practiceGuides[step.id].tasks.map((_, index) => `task_${index + 1}`),
  })),
});
trainingAnalytics.update(trainingAnalyticsSnapshot());
window.addEventListener("scroll", () => syncCodexCourseCue(), { capture: true, passive: true });
window.addEventListener("hashchange", render);
window.addEventListener("training:resume", () => goToStep(firstIncompleteStepIndex(), "practice"));
trainingPageWindow().addEventListener("popstate", () => resumeEmbeddedTraining());
if (window.__CODEX_TRAINING_EMBEDDED__ === true) watchWebsiteTheme();
else watchSystemTheme();
if (!resumeEmbeddedTraining()) render();
