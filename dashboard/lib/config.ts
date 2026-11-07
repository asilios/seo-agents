// Настройки из переменных окружения. Ничего секретного в код не попадает.

export const config = {
  repo: process.env.GITHUB_REPO || "asilios/seo-agents",
  branch: process.env.GITHUB_BRANCH || "master",
  clientId: process.env.GITHUB_CLIENT_ID || "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  authSecret: process.env.AUTH_SECRET || "",
  allowedUsers: (process.env.ALLOWED_GITHUB_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  // локальный режим — только для разработки: файлы с диска, без входа
  localMode: process.env.NODE_ENV !== "production" && process.env.DATA_SOURCE === "local",
  localRepoPath: process.env.LOCAL_REPO_PATH || "..",
};

export function repoUrl(path = ""): string {
  return `https://github.com/${config.repo}/blob/${config.branch}/${path}`;
}
