// Renders every mood × variant as an animated GIF for the README: docs/animations/<mood>-<n>.gif
// Usage: npm run gifs        (no dependencies beyond the build's: rollup bundles the TS in memory)
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { mkdirSync, writeFileSync } from "node:fs";
import { rollup } from "rollup";

const OUT = "docs/animations";
const S = 6; // 24x24 grid -> 144x144, the real key size
const PX = 24 * S;
const FRAMES = 48; // ~10s at 5 fps, enough to show each loop
const DELAY = 20; // centiseconds: the plugin's 5 fps

// bundle the drawing code in memory, then import it (same as preview.mjs)
const entry = 'export { crab, rest } from "./src/art.ts"; export { SCENES } from "./src/scenes/index.ts";';
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
const { crab, rest, SCENES } = await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString("base64")}`);

/** A raster Draw: fills `px` (palette indices) instead of building SVG. ox/oy/k place a scaled sub-drawing (the mini crabs). */
function raster(px, colours, ox = 0, oy = 0, k = 1) {
	const index = (c) => {
		if (!colours.has(c)) colours.set(c, colours.size);
		return colours.get(c);
	};
	const rect = (x, y, w, h, c = "#D97757") => {
		const i = index(c);
		const x0 = Math.max(0, Math.round((ox + x * k) * S)), x1 = Math.min(PX, Math.round((ox + (x + w) * k) * S));
		const y0 = Math.max(0, Math.round((oy + y * k) * S)), y1 = Math.min(PX, Math.round((oy + (y + h) * k) * S));
		for (let y = y0; y < y1; y++) px.fill(i, y * PX + x0, y * PX + x1);
	};
	const sprite = (x, y, rows, c) => {
		for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) if (rows[j][i] === "#") rect(x + i, y + j, 1, 1, c);
	};
	return { rect, sprite, end: () => {} };
}

/** One frame, composed exactly like crab.ts's draw(), minus the text line. */
function frame(mood, v, f, colours) {
	const px = new Uint8Array(PX * PX).fill(colours.get(mood === "sleeping" ? "#0B0B0A" : "#141413"));
	const d = raster(px, colours);
	const pose = rest();
	const scene = SCENES[mood][v](f, pose);
	if (f % 18 === 0 || f % 47 === 2) pose.eyes = "closed"; // the blink from crab.ts
	crab(d, 4 + (scene.dx ?? 0), 6 + (scene.dy ?? 0), pose);
	scene.props?.(d);
	if (mood === "delegating") {
		// two busy subagent minis, laid out like crab.ts does
		const n = 2, w = 16 * 0.3;
		for (let i = 0; i < n; i++) {
			const busy = rest();
			busy.eyes = i % 2 ? "open" : "down";
			busy.arms = (f + i) % 2 ? [true, false] : [false, true];
			crab(raster(px, colours, (24 - n * w - (n - 1) * 1.2) / 2 + i * (w + 1.2), 16.6, 0.3), 0, 0, busy);
		}
	}
	return px;
}

/** GIF variable-length LZW, packed into 255-byte sub-blocks. */
function lzw(minSize, data) {
	const clear = 1 << minSize, eoi = clear + 1;
	const bytes = [];
	let size, next, dict, cur = 0, bits = 0;
	const emit = (c) => {
		cur |= c << bits;
		bits += size;
		while (bits >= 8) bytes.push(cur & 255), (cur >>>= 8), (bits -= 8);
	};
	const reset = () => ((size = minSize + 1), (next = eoi + 1), (dict = new Map()));
	reset();
	emit(clear);
	let prefix = data[0];
	for (let i = 1; i < data.length; i++) {
		const k = data[i], key = (prefix << 8) | k;
		if (dict.has(key)) {
			prefix = dict.get(key);
			continue;
		}
		emit(prefix);
		if (next === 4096) emit(clear), reset();
		else {
			if (next >= 1 << size) size++;
			dict.set(key, next++);
		}
		prefix = k;
	}
	emit(prefix);
	emit(eoi);
	if (bits) bytes.push(cur & 255);
	const out = [minSize];
	for (let i = 0; i < bytes.length; i += 255) out.push(Math.min(255, bytes.length - i), ...bytes.slice(i, i + 255));
	out.push(0);
	return out;
}

const u16 = (n) => [n & 255, n >> 8];

function gif(frames, colours) {
	const bitsPer = Math.max(1, Math.ceil(Math.log2(colours.size)));
	const table = [];
	for (const c of colours.keys()) table.push(parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16));
	while (table.length < 3 << bitsPer) table.push(0);
	const out = [...Buffer.from("GIF89a"), ...u16(PX), ...u16(PX), 0xf0 | (bitsPer - 1), 0, 0, ...table];
	out.push(0x21, 0xff, 11, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0); // loop forever
	for (const px of frames) {
		out.push(0x21, 0xf9, 4, 0, ...u16(DELAY), 0, 0);
		out.push(0x2c, 0, 0, 0, 0, ...u16(PX), ...u16(PX), 0, ...lzw(Math.max(2, bitsPer), px));
	}
	out.push(0x3b);
	return Buffer.from(out);
}

mkdirSync(OUT, { recursive: true });
let count = 0;
for (const [mood, variants] of Object.entries(SCENES))
	for (let v = 0; v < variants.length; v++) {
		const colours = new Map([["#141413", 0], ["#0B0B0A", 1]]);
		const frames = Array.from({ length: FRAMES }, (_, f) => frame(mood, v, f, colours));
		writeFileSync(`${OUT}/${mood}-${v + 1}.gif`, gif(frames, colours));
		count++;
	}
console.log(`${count} GIFs -> ${OUT}/<mood>-<n>.gif`);
