import { BLUE, CREAM, GREEN, GREY, YELLOW, type Variant } from "../art";

const EARTH = ["..###..", ".#####.", "#######", "#######", "#######", ".#####.", "..###.."];
// continents on a 14-column strip that scrolls across the globe as it turns
const LAND = ["......##......", "..###.###.....", ".####..##..##.", "..###...##.###", "...##...#...##", "....#........#", ".............."];

export const browsing: Variant[] = [
	// holds the Earth up in the right claw, continents turning
	(f, pose) => {
		pose.eyes = "up";
		pose.ex = 1;
		pose.arms = [false, true];
		return {
			props: ({ rect, sprite }) => {
				sprite(16, 0, EARTH, BLUE);
				for (let j = 0; j < EARTH.length; j++)
					for (let i = 0; i < 7; i++)
						if (EARTH[j][i] === "#" && LAND[j][(i + f) % 14] === "#") rect(16 + i, j, 1, 1, GREEN);
			},
		};
	},
	// surfing the web: riding a board while a wave curls behind
	(f, pose) => {
		const dy = f % 4 < 2 ? 0 : -1;
		pose.arms = f % 4 < 2 ? [true, false] : [false, true];
		pose.ex = 1;
		return {
			dy,
			props: ({ rect, sprite }) => {
				rect(0, 16, 24, 1, BLUE);
				sprite(0, 8 + (f % 2), [".###.", "#...#", "#....", "#....", "##...", "###..", "####.", "#####"], BLUE);
				rect(3 + (f % 2), 7, 1, 1, CREAM); // spray
				rect(2, 16 + dy, 19, 1, YELLOW);
				rect(21, 15 + dy, 1, 1, YELLOW); // board nose
			},
		};
	},
	// antenna on its head, signal arcs pulsing out
	(f, pose) => {
		pose.eyes = "up";
		return {
			props: ({ rect }) => {
				rect(11, 3, 2, 3, GREY);
				rect(11, 1, 2, 2, YELLOW);
				for (let k = 1; k <= f % 4; k++) {
					const l = 10 - 3 * k, r = 13 + 3 * k;
					rect(l, 1, 1, 3, CREAM), rect(l + 1, 0, 1, 1, CREAM), rect(l + 1, 4, 1, 1, CREAM);
					rect(r, 1, 1, 3, CREAM), rect(r - 1, 0, 1, 1, CREAM), rect(r - 1, 4, 1, 1, CREAM);
				}
			},
		};
	},
];
