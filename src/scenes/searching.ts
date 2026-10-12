import { BLUE, CREAM, GREY, INK, SILVER, YELLOW, type Variant } from "../art";

const LENS = [".##.", "#..#", "#..#", ".##."];

export const searching: Variant[] = [
	// magnifying glass sweeping back and forth, eyes following it
	(f, pose) => {
		pose.eyes = "down";
		const step = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1][f % 12];
		pose.ex = step < 3 ? -1 : step > 3 ? 1 : 0;
		return {
			props: ({ rect, sprite }) => {
				sprite(6 + step, 10, LENS, CREAM);
				rect(10 + step, 14, 1, 1, GREY); // handle
				rect(11 + step, 15, 1, 1, GREY);
			},
		};
	},
	// binoculars held up to the eyes, panning left and right
	(f, pose) => {
		pose.arms = [true, true];
		const o = [0, -1, -1, 0, 1, 1][f % 6];
		pose.ex = o;
		return {
			props: ({ rect }) => {
				rect(6 + o, 7, 5, 4, GREY); // barrels
				rect(13 + o, 7, 5, 4, GREY);
				rect(11 + o, 8, 2, 2, SILVER); // bridge
				rect(7 + o, 8, 2, 2, BLUE); // lens glint
				rect(14 + o, 8, 2, 2, BLUE);
			},
		};
	},
	// flashlight on a raised claw, its spot sweeping the dark until it finds a bug
	(f, pose) => {
		pose.eyes = "up";
		pose.arms = [false, true];
		const sx = [1, 4, 7, 10, 13, 10, 7, 4][f % 8];
		pose.ex = sx < 6 ? -1 : sx > 9 ? 1 : 0;
		return {
			props: ({ rect, sprite }) => {
				sprite(sx, 0, [".###.", "#####", "#####", ".###."], YELLOW);
				for (const t of [0.3, 0.6]) rect(Math.round(sx + 2 + (16 - sx) * t), Math.round(4 - 2 * (1 - t)) + 1, 1, 1, YELLOW); // beam
				if (sx < 5) rect(3, 1, 2, 2, INK), rect(2, 1, 1, 1, INK), rect(5, 2, 1, 1, INK); // bug!
				rect(18, 5, 2, 2, GREY); // torch
				rect(18, 5, 2, 1, SILVER);
			},
		};
	},
	// rummaging in a box, tossing a Rubik's cube out over its shoulder
	(f, pose) => {
		pose.eyes = "down";
		pose.legShift = f % 2;
		const t = f % 6;
		const dir = Math.floor(f / 6) % 2 ? 1 : -1;
		const faces = ["#E5534B", YELLOW, BLUE, "#5DA34A", CREAM, "#F08A3C"];
		return {
			dy: t % 2,
			props: ({ rect }) => {
				if (t) {
					const x = 11 + dir * t * 2;
					const y = [10, 6, 3, 2, 3, 5][t];
					for (let i = 0; i < 9; i++) rect(x + (i % 3), y + Math.floor(i / 3), 1, 1, faces[(i + f) % 6]);
				}
				rect(6, 12, 12, 5, "#C9A06A"); // box
				rect(6, 12, 12, 1, "#8C6A3F");
			},
		};
	},
];
