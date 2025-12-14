import State from '../../lib/State.js';
import GameStateName from '../enums/GameStateName.js';
import SoundName from '../enums/SoundName.js';
import Match from '../objects/Match.js';
import { engine, matter, sounds, stateMachine, world } from '../globals.js';

const { Composite, Engine } = matter;

export default class PlayState extends State {
	constructor() {
		super();
	}

	enter(parameters = {}) {
		sounds.play(SoundName.Music);
		
		// Pass character selections to Match
		const player1Character = parameters.player1Character || 'CODY';
		const player2Character = parameters.player2Character || 'ALE';
		
		this.match = new Match(player1Character, player2Character);
	}

	exit() {
		// Remove all Matter bodies from the world before exiting this state.
		Composite.allBodies(world).forEach((body) =>
			Composite.remove(world, body)
		);
	}

	update(dt) {
		Engine.update(engine);
		this.match.update(dt);
		
		// Check if match is over
		if (this.match.isMatchOver()) {
			const winner = this.match.getWinner();
			if (winner === 0) {
				// TODO: Handle tie - could go to overtime or just end
				stateMachine.change(GameStateName.GameOver, {
					stadium: this.match.stadium,
				});
			} else {
				stateMachine.change(GameStateName.Victory, {
					stadium: this.match.stadium,
					winner: winner,
					score1: this.match.player1.score,
					score2: this.match.player2.score,
				});
			}
		}
	}

	render() {
		this.match.render();
	}
}