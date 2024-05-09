import os from "os";
import * as path from "path";

import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

interface Inputs {
  version: string;
}

function getPlatform(rawPlatform: string): string {
  switch (rawPlatform) {
    case "linux":
      return "linux";
  }

  throw new Error(`platform ${rawPlatform} not supported`);
}

function getArch(rawArch: string): string {
  switch (rawArch) {
    case "x64":
      return "amd64";
    case "arm64":
      return "arm64";
  }

  throw new Error(`architecture ${rawArch} not supported`);
}

async function getLatestVersion(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/vincenthsh/gamma/releases/latest",
    {
      headers: {
        "User-Agent": "vincenthsh/setup-gamma",
      },
    }
  );
  const data = await response.json();
  // The substring() method will return a new string starting
  // from index 1, effectively removing the 'v' at start
  return data.tag_name.substring(1);
}

async function getInputs(): Promise<Inputs> {
  let version = core.getInput("version");
  if (version === "") {
    version = await getLatestVersion();
    return {
      version,
    };
  }

  if (version.startsWith("v")) {
    throw new Error("'version' input should not be prefixed with 'v'");
  }

  const versionRegex =
    /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/i;

  if (!versionRegex.test(version)) {
    throw new Error(
      "incorrect 'version' specified, it should include all parts of the version e.g 11.0.1"
    );
  }

  return {
    version,
  };
}

const toolName = "gamma";

async function run(): Promise<void> {
  const inputs = await getInputs();
  core.info(`Installing Gamma ${inputs.version}`);

  const toolPath = tc.find(toolName, inputs.version);
  if (toolPath !== "") {
    core.info("Gamma binaries found in cache.");
    core.addPath(toolPath);

    return;
  }

  const platform = getPlatform(os.platform());
  const arch = getArch(os.arch());
  const downloadUrl = `https://github.com/vincenthsh/gamma/releases/download/v${inputs.version}/gamma_${inputs.version}_${platform}_${arch}.tar.gz`;

  core.info(`Downloading: ${downloadUrl}`);
  const downloadPath = await tc.downloadTool(downloadUrl);
  const extractedFolder = await tc.extractTar(downloadPath);

  const cachedPath = await tc.cacheFile(
    path.join(extractedFolder, toolName),
    toolName,
    toolName,
    inputs.version
  );

  core.addPath(cachedPath);

  core.info("Done!");
}

run().catch(core.setFailed);
