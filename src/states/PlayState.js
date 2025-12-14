import State from '../../lib/State.js';
import Input from '../../lib/Input.js';
import GameStateName from '../enums/GameStateName.js';
import SoundName from '../enums/SoundName.js';
import Match from '../objects/Match.js';
import { engine, input, matter, sounds, stateMachine, world } from '../globals.js';

const { Composite, Engine } = matter;

export default class PlayState extends State {
	constructor() {
		super();
	}

	enter(parameters = {}) {
		// If resuming from pause, use the existing match
		if (parameters.match) {
			this.match = parameters.match;
			sounds.play(SoundName.BackgroundMusic);
		} else {
			// Starting new match - clean up any existing physics bodies first
			Composite.allBodies(world).forEach((body) =>
				Composite.remove(world, body)
			);
			
			sounds.play(SoundName.BackgroundMusic);
			
			// Pass character selections to Match
			const player1Character = parameters.player1Character || 'CODY';
			const player2Character = parameters.player2Character || 'ALE';
			
			this.match = new Match(player1Character, player2Character);
		}
	}

	exit() {
		// Only clean up if we're not pausing
		// Pausing will preserve the match state
	}

	update(dt) {
		// Check for pause key
		if (input.isKeyPressed(Input.KEYS.P)) {
			stateMachine.change(GameStateName.Pause, {
				match: this.match,
				stadium: this.match.stadium,
			});
			return;
		}

		Engine.update(engine);
		this.match.update(dt);
		
		// Check if match is over
		if (this.match.isMatchOver()) {
			// Clean up physics bodies before transitioning
			Composite.allBodies(world).forEach((body) =>
				Composite.remove(world, body)
			);
			
			const winner = this.match.getWinner();
			if (winner === 0) {
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