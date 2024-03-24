// TypeScript definitions
export interface Database {
  loadExtension(file: string, entrypoint?: string | undefined): void;
}

const supportedPlatforms: [string, string][] = [
  ["darwin", "x64"],
  ["darwin", "arm64"],
  ["linux", "x64"],
];

function validPlatform(platform: string, arch: string): boolean {
  return supportedPlatforms.some(([p, a]) => platform === p && arch === a);
}

function extensionSuffix(platform: string): string {
  if (platform === "win32") return "dll";
  if (platform === "darwin") return "dylib";
  return "so";
}

function platformPackageName(platform: string, arch: string): string {
  const os = platform === "win32" ? "windows" : platform;
  return `sqlite-vss-${os}-${arch}`;
}

async function loadablePathResolver(name: string): Promise<string> {
  const { platform, arch } = await import("process");

  if (!validPlatform(platform, arch)) {
    throw new Error(
      `Unsupported platform for sqlite-vss, on a ${platform}-${arch} machine, but not in supported platforms (${supportedPlatforms
        .map(([p, a]) => `${p}-${a}`)
        .join(",")}). Consult the sqlite-vss NPM package README for details.`,
    );
  }

  const { join } = await import("path");
  const { statSync } = await import("fs");

  const packageName = platformPackageName(platform, arch);
  let loadablePath = join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "node_modules",
    packageName,
    "lib",
    `${name}.${extensionSuffix(platform)}`,
  );

  // if loadable path doesn't exist, check path2
  if (!statSync(loadablePath, { throwIfNoEntry: false })) {
    loadablePath = join(
      __dirname,
      "..",
      "..",
      "..",
      packageName,
      "lib",
      `${name}.${extensionSuffix(platform)}`,
    );
  }

  if (!statSync(loadablePath, { throwIfNoEntry: false })) {
    throw new Error(
      `Loadable extension for sqlite-vss not found. Was the ${packageName} package installed? Avoid using the --no-optional flag, as the optional dependencies for sqlite-vss are required.`,
    );
  }

  return loadablePath;
}

export async function getVectorLoadablePath(): Promise<string> {
  return loadablePathResolver("vector0");
}

export async function getVssLoadablePath(): Promise<string> {
  return loadablePathResolver("vss0");
}

export async function loadVector(db: Database): Promise<void> {
  const loadablePath = await getVectorLoadablePath();
  db.loadExtension(loadablePath);
}

export async function loadVss(db: Database): Promise<void> {
  const loadablePath = await getVssLoadablePath();
  db.loadExtension(loadablePath);
}

export async function load(db: Database): Promise<void> {
  await loadVector(db);
  await loadVss(db);
}
