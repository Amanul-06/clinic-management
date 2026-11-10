import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcss = require("postcss");

const sourceFile = "src/styles/global.css";
const parsed = postcss.parse(fs.readFileSync(sourceFile, "utf8"));

const outputFiles = {
  tokens: "src/styles/tokens.css",
  reset: "src/styles/reset.css",
  typography: "src/styles/typography.css",
  shared: "src/styles/shared.css",
  Login: "src/pages/Login/Login.css",
  Dashboard: "src/pages/Dashboard/Dashboard.css",
  Patients: "src/pages/Patients/Patients.css",
  Settings: "src/pages/Settings/Settings.css",
  Sidebar: "src/components/Sidebar/Sidebar.css",
  Topbar: "src/components/Topbar/Topbar.css",
  StatCard: "src/components/StatCard/StatCard.css",
  DashboardLayout: "src/layouts/DashboardLayout/DashboardLayout.css",
};

function ownerFor(selector) {
  const s = selector.trim();

  if (s === ":root") return "tokens";

  if (["*", "body", "button", "input", "textarea", "button:disabled", "a"].includes(s)) {
    return "reset";
  }

  if (
    s === ".page-eyebrow" ||
    s === ".primary-button" ||
    s === ".primary-button:hover" ||
    s === ".outline-button" ||
    s === ".panel" ||
    s.startsWith(".page-heading") ||
    s === ".field-group" ||
    s === ".field-group.full-width" ||
    s === ".field-group label" ||
    s === ".stats-grid" ||
    s === ".table-wrapper" ||
    s.startsWith(".appointment-table") ||
    s === ".time-cell" ||
    s === ".patient-cell" ||
    s === ".patient-avatar" ||
    s === ".demo-notice" ||
    s === ".brand-symbol" ||
    s === ".brand-symbol img" ||
    s === ".user-avatar"
  ) {
    return "shared";
  }

  if (
    s.startsWith(".stat-card") ||
    s.startsWith(".stat-title") ||
    s.startsWith(".stat-icon")
  ) return "StatCard";

  if (
    s.startsWith(".login-") ||
    s === ".login-page" ||
    s === ".brand-symbol.large" ||
    s === ".eyebrow" ||
    s === ".login-welcome" ||
    s.startsWith(".role-selector") ||
    s.startsWith(".input-wrapper") ||
    s === ".password-toggle" ||
    s === ".login-submit" ||
    s === ".login-submit:hover" ||
    s === ".form-error"
  ) return "Login";

  if (
    s === ".app-shell" ||
    s === ".main-area" ||
    s === ".page-container"
  ) return "DashboardLayout";

  if (
    s.startsWith(".sidebar") ||
    s.startsWith(".brand-details") ||
    s.startsWith(".nav-") ||
    s === ".coming-soon" ||
    s === ".logout-button" ||
    s === ".logout-button:hover" ||
    s.startsWith(".user-details") ||
    s === ".mobile-close" ||
    s === ".sidebar-overlay"
  ) return "Sidebar";

  if (
    s.startsWith(".topbar") ||
    s === ".notification-button" ||
    s === ".notification-button span" ||
    s === ".mobile-menu" ||
    s === ".user-avatar.small"
  ) return "Topbar";

  if (
    s.startsWith(".dashboard-grid") ||
    s.startsWith(".appointments-panel") ||
    s.startsWith(".panel-heading") ||
    s.startsWith(".date-display") ||
    s.startsWith(".status-pill") ||
    s.startsWith(".chart-") ||
    s.startsWith(".quick-actions") ||
    s.startsWith(".quick-action-list")
  ) return "Dashboard";

  if (
    s.startsWith(".settings-") ||
    s.startsWith(".form-divider") ||
    s.startsWith(".logo-") ||
    s.startsWith(".remove-logo") ||
    s.startsWith(".save-success") ||
    s === ".field-group input" ||
    s === ".field-group textarea" ||
    s === ".field-group input:focus" ||
    s === ".field-group textarea:focus"
  ) return "Settings";

  if (
    s.startsWith(".patients-") ||
    s.startsWith(".patient-")
  ) return "Patients";

  if (s === ".sidebar-user") return "Sidebar";

  if (
    s === ".topbar-profile" ||
    s === ".topbar-profile > div:last-child" ||
    s === ".topbar-profile strong" ||
    s === ".topbar-profile span"
  ) return "Topbar";

  throw new Error(`No CSS owner configured for selector: ${s}`);
}

function add(map, owner, node) {
  if (!map.has(owner)) map.set(owner, []);
  map.get(owner).push(node);
}

function distribute(container) {
  const map = new Map();

  for (const node of container.nodes || []) {
    if (node.type === "comment") continue;

    if (node.type === "atrule" && node.name === "import") {
      add(map, "typography", node.clone());
      continue;
    }

    if (node.type === "rule") {
      const selectors = node.selector.split(",").map((s) => s.trim());

      for (const selector of selectors) {
        const owner = ownerFor(selector);
        const clone = node.clone();
        clone.selector = selector;
        clone.nodes = (node.nodes || []).map((child) => child.clone());
        add(map, owner, clone);
      }

      continue;
    }

    if (node.type === "atrule" && node.nodes) {
      const nested = distribute(node);

      for (const [owner, children] of nested) {
        const clone = node.clone();
        clone.nodes = children;
        add(map, owner, clone);
      }

      continue;
    }

    throw new Error(`Unsupported CSS node: ${node.type}`);
  }

  return map;
}

const distributed = distribute(parsed);

for (const [owner, file] of Object.entries(outputFiles)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const root = postcss.root();

  for (const node of distributed.get(owner) || []) {
    root.append(node);
  }

  fs.writeFileSync(file, root.toString() + "\n");
  console.log(`Created ${file}`);
}

const jsxImports = {
  "src/pages/Login/Login.jsx": "./Login.css",
  "src/pages/Dashboard/Dashboard.jsx": "./Dashboard.css",
  "src/pages/Patients/Patients.jsx": "./Patients.css",
  "src/pages/Settings/Settings.jsx": "./Settings.css",
  "src/components/Sidebar/Sidebar.jsx": "./Sidebar.css",
  "src/components/Topbar/Topbar.jsx": "./Topbar.css",
  "src/components/StatCard/StatCard.jsx": "./StatCard.css",
  "src/layouts/DashboardLayout/DashboardLayout.jsx": "./DashboardLayout.css",
};

for (const [file, importPath] of Object.entries(jsxImports)) {
  const current = fs.readFileSync(file, "utf8");
  const importLine = `import "${importPath}";`;

  if (!current.includes(importLine)) {
    fs.writeFileSync(file, `${importLine}\n${current}`);
  }
}

const mainFile = "src/main.jsx";
let main = fs.readFileSync(mainFile, "utf8");

const oldImport = 'import "./styles/global.css";';

if (!main.includes(oldImport)) {
  throw new Error("Could not find the original global.css import in main.jsx");
}

main = main.replace(oldImport, [
  'import "./styles/tokens.css";',
  'import "./styles/reset.css";',
  'import "./styles/typography.css";',
  'import "./styles/shared.css";',
].join("\n"));

fs.writeFileSync(mainFile, main);

// Patients uses the same stat-card styles as the reusable StatCard component.
const patientsFile = "src/pages/Patients/Patients.jsx";
let patients = fs.readFileSync(patientsFile, "utf8");

const statCardImport = 'import "../../components/StatCard/StatCard.css";';

if (!patients.includes(statCardImport)) {
  patients = `${statCardImport}\n${patients}`;
}

fs.writeFileSync(patientsFile, patients);

console.log("\nCSS split complete. Original global.css has been preserved.");
