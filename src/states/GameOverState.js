import State from '../../lib/State.js';
import Input from '../../lib/Input.js';
import GameStateName from '../enums/GameStateName.js';
import {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	context,
	input,
	stateMachine,
} from '../globals.js';

export default class GameOverState extends State {
	constructor() {
		super();
	}

	enter(parameters) {
		this.stadium = parameters.stadium;
	}

	update() {
		if (input.isKeyPressed(Input.KEYS.ENTER)) {
			stateMachine.change(GameStateName.Play);
		}
	}

	render() {
		this.stadium.render();

		context.save();
		context.font = '200px Arial';
		context.fillStyle = 'black';
		context.textBaseline = 'middle';
		context.textAlign = 'center';
		context.fillText("It's a Tie!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90);
		context.fillStyle = 'orange';
		context.fillText("It's a Tie!", CANVAS_WIDTH / 2 + 5, CANVAS_HEIGHT / 2 - 85);
		
		context.font = '50px Arial';
		context.fillStyle = 'white';
		context.fillText('Press Enter to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
		context.restore();
	}
}