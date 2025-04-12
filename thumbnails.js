import { basename, extname, SEPARATOR } from "jsr:@std/path";
import { $ } from "npm:zx@8.5.2-lite";

const inPath = Deno.args[0];
const outDir = Deno.args[1];
const extName = extname(inPath);
const outName = basename(inPath, extName) + "-320x180";
const outVideo = `${outDir}${SEPARATOR}${outName}.mp4`;
const outPoster = `${outDir}${SEPARATOR}${outName}.webp`;

await $`ffmpeg -i ${inPath} -s 320x180 ${outVideo}`;
await $`ffmpeg -i ${inPath} -frames:v 1 ${outPoster}`;
