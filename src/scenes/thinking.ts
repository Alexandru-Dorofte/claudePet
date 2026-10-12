import { CREAM, GREY, INK, QUESTION, SILVER, YELLOW, type Variant } from "../art";

const CLOUD = [".##.##.", "#######", "#######", ".#####."];
const BULB = [".###.", "#####", "#####", ".###."];
const GEAR = [
	["..#..", ".###.", "##.##", ".###.", "..#.."],
	["#...#", ".###.", ".#.#.", ".###.", "#...#"],
];

export const thinking: Variant[] = [
	// eyes up at a thought cloud that fills with dots
	(f, pose) => {
		pose.eyes = "up";
		pose.ex = 1;
		return {
			props: ({ rect, sprite }) => {
				rect(12, 5, 1, 1, CREAM); // bubbles rising to the cloud
				rect(13, 3, 1, 1, CREAM);
				sprite(15, 0, CLOUD, CREAM);
				for (let i = 0; i < f % 4; i++) rect(16 + i * 2, 2, 1, 1, INK);
			},
		};
	},
	// a lightbulb flickers above its head, then lights up with rays: idea!
	(f, pose) => {
		const t = f % 12;
		const lit = t >= 7 || t === 3 || t === 5;
		pose.eyes = t >= 7 ? "open" : "up";
		if (t >= 8) pose.arms = [true, true];
		return {
			props: ({ rect, sprite }) => {
				sprite(10, 0, BULB, lit ? YELLOW : GREY);
				rect(11, 4, 3, 1, SILVER); // screw base
				if (t >= 7) for (const [x, y] of [[8, 1], [16, 1], [9, 4], [15, 4]]) rect(x, y, 1, 1, YELLOW);
			},
		};
	},
	// question marks float up beside it while it taps its chin with a claw
	(f, pose) => {
		pose.eyes = "up";
		pose.ex = -1;
		pose.arms = [false, f % 4 < 2];
		return {
			props: ({ sprite }) => {
				sprite(20, 10 - (f % 11), QUESTION, CREAM);
				sprite(0, 10 - ((f + 5) % 11), QUESTION, CREAM);
			},
		};
	},
	// two little gears turning above its head
	(f, pose) => {
		pose.eyes = "up";
		pose.ex = f % 10 < 5 ? -1 : 1;
		return {
			props: ({ sprite }) => {
				sprite(7, 0, GEAR[f % 2], SILVER);
				sprite(12, 1, GEAR[(f + 1) % 2], GREY);
			},
		};
	},
];
