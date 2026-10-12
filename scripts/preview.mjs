// Renders every mood × variant (a few frames each) as PNGs, to check the art without a Stream Deck.
// Usage: npm run preview -- [mood] [outDir]     (macOS: uses Quick Look to make the PNG)
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rollup } from "rollup";

const [only, outDir = mkdtempSync(join(tmpdir(), "claudepet-"))] = process.argv.slice(2);
const FRAMES = [1, 4, 7];

// bundle the drawing code in memory, then import it
const entry = 'export { draw } from "./src/crab.ts"; export { SCENES } from "./src/scenes/index.ts";';
const bundle = await rollup({
	input: "entry",
	plugins: [
		{ name: "entry", resolveId: (id) => (id === "entry" ? id : null), load: (id) => (id === "entry" ? entry : null) },
		typescript({ outputToFilesystem: false }),
		nodeResolve(),
	],
	onwarn: () => {},
});
const { output } = await bundle.generate({ format: "es" });
const { draw, SCENES } = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString("base64")}`);

const rows = Object.entries(SCENES)
	.filter(([mood]) => !only || mood === only)
	.flatMap(([mood, variants]) => variants.map((_, v) => [mood, v]));
// one small image per variant: Quick Look crops large sheets unpredictably but renders small wide ones whole
const cell = 150;
const width = FRAMES.length * cell;
for (const [mood, v] of rows) {
	const frames = FRAMES.map((f, c) =>
		draw(mood, v, f, 0, "", false).replace(/^<svg[^>]*>/, `<svg x="${c * cell}" y="0" width="144" height="144" viewBox="0 0 24 24" shape-rendering="crispEdges">`),
	);
	const svgPath = join(outDir, `${mood}-${v + 1}.svg`);
	writeFileSync(svgPath, `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cell}"><rect width="100%" height="100%" fill="#fff"/>${frames.join("")}</svg>`);
	execFileSync("qlmanage", ["-t", "-s", String(width), "-o", outDir, svgPath], { stdio: "ignore" });
}
console.log(`${rows.length} variants -> ${outDir}/<mood>-<n>.svg.png`);
