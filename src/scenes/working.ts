import { CREAM, GREEN, GREY, INK, ORANGE, SILVER, YELLOW, type Variant } from "../art";

export const working: Variant[] = [
	// typing on a laptop (seen from behind), code scrolling above
	(f, pose) => {
		pose.eyes = "down";
		pose.arms = f % 2 ? [true, false] : [false, true];
		return {
			props: ({ rect }) => {
				for (let j = 0; j < 3; j++) rect(6, 1 + j * 2, 2 + ((f + j * 3) % 7), 1, j === 1 ? ORANGE : CREAM);
				rect(6, 11, 12, 5, SILVER);
				rect(4, 16, 16, 1, GREY);
			},
		};
	},
	// hammering on an anvil, sparks flying on each hit
	(f, pose) => {
		const up = f % 2 === 0;
		pose.eyes = "down";
		pose.ex = 1;
		pose.arms = [false, up];
		return {
			props: ({ rect, sprite }) => {
				sprite(17, 13, ["#######", ".#####.", "..###..", ".#####."], GREY);
				if (up) rect(19, 3, 1, 4, SILVER), rect(18, 1, 4, 2, GREY);
				else {
					rect(20, 10, 1, 1, SILVER), rect(20, 11, 4, 2, SILVER);
					sprite(19, 6, ["#..#.", "...##", ".#...", "....#"], YELLOW);
				}
			},
		};
	},
	// terminal window with output appearing and a blinking ">_" prompt
	(f, pose) => {
		pose.eyes = "down";
		return {
			props: ({ rect, sprite }) => {
				rect(6, 10, 12, 7, GREY);
				rect(7, 11, 10, 5, INK);
				rect(7, 10, 1, 1, ORANGE);
				rect(7, 12, Math.min(f % 6, 4) * 2, 1, CREAM);
				sprite(7, 13, ["#.", ".#", "#."], GREEN);
				if (f % 2) rect(10, 15, 2, 1, CREAM);
			},
		};
	},
];
