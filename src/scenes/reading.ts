import { BLUE, BROWN, CREAM, GREY, INK, SILVER, type Variant } from "../art";

export const reading: Variant[] = [
	// open book in front, eyes scanning the lines, a page turning now and then
	(f, pose) => {
		pose.eyes = "down";
		pose.ex = [-1, 0, 1, 0][f % 4];
		return {
			props: ({ rect }) => {
				rect(5, 11, 7, 5, CREAM);
				rect(12, 11, 7, 5, CREAM);
				rect(4, 16, 16, 1, BROWN); // cover
				rect(11, 11, 1, 5, SILVER); // spine
				for (const [x, y, w] of [
					[6, 12, 5],
					[6, 14, 4],
					[13, 12, 5],
					[13, 14, 3],
				])
					rect(x, y, w, 1, GREY);
				if (f % 16 >= 14) rect(12, 10, 6, 6, CREAM); // page turning
			},
		};
	},
	// unrolling a long scroll from left to right, eyes following the text
	(f, pose) => {
		pose.eyes = "down";
		const len = [2, 4, 6, 8, 10, 12, 12, 12][f % 8];
		pose.ex = len < 6 ? -1 : len < 10 ? 0 : 1;
		return {
			props: ({ rect }) => {
				rect(6, 11, len, 5, CREAM);
				for (let x = 7; x < 5 + len; x += 3) rect(x, 12, 2, 1, GREY), rect(x, 14, 2, 1, GREY);
				rect(4, 10, 2, 7, BROWN); // rolls
				rect(6 + len, 10, 2, 7, BROWN);
			},
		};
	},
	// little glasses on, reading the morning newspaper
	(f, pose) => {
		if (f % 10 === 9) pose.eyes = "closed"; // blink
		return {
			props: ({ rect, sprite }) => {
				sprite(7, 7, ["###....###", "#.######.#", "#.#....#.#", "###....###"], SILVER); // glasses
				const flip = f % 12 >= 10;
				rect(flip ? 6 : 5, 11, flip ? 12 : 14, 6, CREAM);
				rect(6, 12, 12, 1, INK); // headline
				for (const x of [6, 10, 14]) rect(x, 14, 3, 2, GREY);
			},
		};
	},
	// scrolling through a tablet, thumb flicking the content upward
	(f, pose) => {
		pose.eyes = "down";
		return {
			props: ({ rect }) => {
				rect(9, 9, 6, 8, GREY);
				rect(10, 10, 4, 6, BLUE);
				for (let k = 0; k < 3; k++) rect(10, 10 + ((k * 2 - f) % 6 + 6) % 6, k % 2 ? 2 : 3, 1, CREAM);
				rect(13, 10 + (f % 5), 1, 2, INK); // scrollbar
			},
		};
	},
];
