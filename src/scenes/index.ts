import type { Variant } from "../art";
import { browsing } from "./browsing";
import { delegating } from "./delegating";
import { attention, compacting, dancing, oops } from "./events";
import { listening, sleeping } from "./idle";
import { reading } from "./reading";
import { searching } from "./searching";
import { thinking } from "./thinking";
import { working } from "./working";
import { writing } from "./writing";

/** Every mood and its animation variants; the plugin picks one at random each time a mood starts. */
export const SCENES = {
	sleeping,
	listening,
	thinking,
	working,
	reading,
	writing,
	searching,
	browsing,
	delegating,
	oops,
	compacting,
	attention,
	dancing,
} satisfies Record<string, Variant[]>;

export type Mood = keyof typeof SCENES;
