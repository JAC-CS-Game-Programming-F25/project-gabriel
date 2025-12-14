/**
 * Head Soccer
 * A soccer game where two players compete head-to-head using oversized heads
 * to hit a soccer ball into their opponent's goal.
 */

import GameStateName from './enums/GameStateName.js';
import Game from '../lib/Game.js';
import {
	canvas,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	context,
	fonts,
	images,
	input,
	sounds,
	stateMachine,
} from './globals.js';
import TitleScreenState from './states/TitleScreenState.js';
import CharacterSelectState from './states/CharacterSelectState.js';
import PlayState from './states/PlayState.js';
import GameOverState from './states/GameOverState.js';
import VictoryState from './states/VictoryState.js';
import PauseState from './states/PauseState.js';
import SettingsState from './states/SettingsState.js';

// Set the dimensions of the play area.
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.setAttribute('tabindex', '1'); // Allows the canvas to receive user input.

// Now that the canvas element has been prepared, we can add it to the DOM.
document.body.appendChild(canvas);

// Fetch the asset definitions from config.json.
const {
	images: imageDefinitions,
	fonts: fontDefinitions,
	sounds: soundDefinitions,
} = await fetch('./src/config.json').then((response) => response.json());

// Load all the assets from their definitions.
images.load(imageDefinitions);
fonts.load(fontDefinitions);
sounds.load(soundDefinitions);

// Add all the states to the state machine.
stateMachine.add(GameStateName.Title, new TitleScreenState());
stateMachine.add(GameStateName.CharacterSelect, new CharacterSelectState());
stateMachine.add(GameStateName.GameOver, new GameOverState());
stateMachine.add(GameStateName.Victory, new VictoryState());
stateMachine.add(GameStateName.Play, new PlayState());
stateMachine.add(GameStateName.Pause, new PauseState());
stateMachine.add(GameStateName.Settings, new SettingsState());

// Start with title screen
stateMachine.change(GameStateName.Title);

const game = new Game(stateMachine, context, canvas.width, canvas.height);

game.start();

// Focus the canvas so that the player doesn't have to click on it.
canvas.focus();