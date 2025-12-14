import State from '../../lib/State.js';
import Input from '../../lib/Input.js';
import GameStateName from '../enums/GameStateName.js';
import SoundName from '../enums/SoundName.js';
import {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	context,
	input,
	stateMachine,
	sounds,
} from '../globals.js';

export default class VictoryState extends State {
	constructor() {
		super();
	}

	enter(parameters) {
		this.stadium = parameters.stadium;
		this.winner = parameters.winner;
		this.score1 = parameters.score1;
		this.score2 = parameters.score2;
		
		// Play end of game sound
		sounds.play(SoundName.EndOfGame);
	}

	update() {
		if (input.isKeyPressed(Input.KEYS.ENTER)) {
			stateMachine.change(GameStateName.Play);
		}
	}

	render() {
		this.stadium.render();

		context.save();
		context.font = '120px "Press Start 2P", monospace';
		context.fillStyle = 'black';
		context.textBaseline = 'middle';
		context.textAlign = 'center';
		context.fillText(`Player ${this.winner} Wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90);
		context.fillStyle = 'gold';
		context.fillText(`Player ${this.winner} Wins!`, CANVAS_WIDTH / 2 + 5, CANVAS_HEIGHT / 2 - 85);
		
		context.font = '80px Roboto, sans-serif';
		context.fillStyle = 'white';
		context.fillText(`${this.score1} - ${this.score2}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
		
		context.font = '50px Roboto, sans-serif';
		context.fillText('Press Enter to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
		context.restore();
	}
}