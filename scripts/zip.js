// Builds dist/job-fit-extension.zip with only the files Chrome needs.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

mkdirSync("dist", { recursive: true });
rmSync("dist/job-fit-extension.zip", { force: true });
// bsdtar ships with Windows 10+ and macOS; -a picks zip from the extension.
execFileSync("tar", ["-a", "-c", "-f", "dist/job-fit-extension.zip", "manifest.json", "options.html", "options.js", "src"], { stdio: "inherit" });
console.log("dist/job-fit-extension.zip");
