import { BLUE, BROWN, CREAM, GREEN, GREY, INK, PINK, YELLOW, type Variant } from "../art";

export const writing: Variant[] = [
	// pencil writing lines onto a sheet of paper
	(f, pose) => {
		pose.eyes = "down";
		const p = f % 24; // progress through the page
		pose.ex = p % 12 < 6 ? 0 : 1;
		return {
			props: ({ rect }) => {
				rect(6, 11, 12, 5, CREAM);
				const l1 = Math.min(p, 10);
				const l2 = Math.max(0, Math.min(p - 12, 8));
				if (l1) rect(7, 12, l1, 1, GREY);
				if (l2) rect(7, 14, l2, 1, GREY);
				const px = p < 12 ? 7 + l1 : 7 + l2; // pencil follows the line being written
				const py = p < 12 ? 9 : 11;
				rect(px, py, 1, 2, YELLOW);
				rect(px, py + 2, 1, 1, INK); // lead
			},
		};
	},
	// dipping a quill in the ink pot, then writing a line
	(f, pose) => {
		pose.eyes = "down";
		const p = f % 12;
		const dip = p < 3;
		const n = dip ? 0 : p - 2; // letters written so far
		const [qx, qy] = dip ? [17, 13 - (p % 2)] : [6 + n, 12];
		pose.ex = dip ? 1 : n < 5 ? -1 : 0;
		return {
			props: ({ rect, sprite }) => {
				rect(5, 12, 11, 5, CREAM);
				if (n) rect(6, 13, n, 1, INK);
				rect(16, 13, 3, 4, BLUE); // ink pot
				rect(17, 13, 1, 1, INK);
				sprite(qx, qy - 4, ["..##", ".###", ".##.", "#...", "#..."], CREAM);
				rect(qx, qy, 1, 1, INK); // nib
			},
		};
	},
	// clacking away on a typewriter, carriage creeping left, ding at the end
	(f, pose) => {
		const c = f % 8; // carriage position
		pose.ex = c < 4 ? 0 : -1;
		return {
			props: ({ rect }) => {
				rect(9 - c, 10, 7, 2, CREAM); // paper
				if (c) rect(10 - c, 11, Math.min(c, 5), 1, GREY);
				rect(7 - c, 12, 11, 1, INK); // roller
				rect(5, 13, 14, 4, GREY);
				for (let x = 6; x < 18; x += 2) rect(x, 14, 1, 1, x === 6 + (f * 6) % 12 ? INK : CREAM); // keys
				if (c === 7) rect(19, 10, 2, 2, YELLOW); // ding!
			},
		};
	},
	// painting on a canvas, brush leaving coloured strokes
	(f, pose) => {
		pose.eyes = "down";
		const p = f % 20;
		const strokes = [PINK, BLUE, GREEN, YELLOW];
		const k = Math.min(3, Math.floor(p / 4)); // stroke being painted
		const len = p < 16 ? (p % 4) * 2 + 2 : 8;
		const bx = 7 + len;
		pose.ex = len < 5 ? -1 : 1;
		return {
			props: ({ rect }) => {
				rect(6, 11, 12, 6, CREAM);
				for (let i = 0; i < k; i++) rect(7, 12 + i, 9, 1, strokes[i]);
				if (p < 16) rect(7, 12 + k, len, 1, strokes[k]);
				rect(bx, 10 + k, 1, 2, BROWN); // brush handle
				rect(bx, 12 + k, 1, 1, strokes[k]);
			},
		};
	},
];
