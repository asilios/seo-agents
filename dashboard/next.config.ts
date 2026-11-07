import type { NextConfig } from "next";

const config: NextConfig = {
  // локальный режим читает файлы репозитория уровнем выше
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
};

export default config;
