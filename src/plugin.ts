import streamDeck from "@elgato/streamdeck";

import { Activity } from "./actions/activity";
import { Pet } from "./actions/pet";
import { Quota } from "./actions/quota";

streamDeck.actions.registerAction(new Pet());
streamDeck.actions.registerAction(new Quota());
streamDeck.actions.registerAction(new Activity());

streamDeck.connect();
