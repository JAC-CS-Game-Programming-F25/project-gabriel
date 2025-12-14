import State from '../../lib/State.js';
import Input from '../../lib/Input.js';
import GameStateName from '../enums/GameStateName.js';
import SoundName from '../enums/SoundName.js';
import Match from '../objects/Match.js';
import { engine, input, matter, sounds, stateMachine, world } from '../globals.js';

const { Composite, Engine, Body } = matter;

export default class PlayState extends State {
	constructor() {
		super();
	}

	enter(parameters = {}) {
		// If resuming from pause, use the existing match
		if (parameters.match) {
			this.match = parameters.match;
			
			// When resuming from pause, ensure physics state is clean
			// Reset velocities to prevent accumulated drift while paused
			Composite.allBodies(world).forEach((body) => {
				if (!body.isStatic && !body.isSensor) {
					// The physics engine pause/resume handles this now
					
					// Only reset angular velocity to prevent spinning issues
					Body.setAngularVelocity(body, 0);
				}
			});
			
			sounds.play(SoundName.BackgroundMusic);
		} else {
			// Starting new match - properly cleanup old match first
			if (this.match) {
				console.log("Cleaning up old match before creating new one...");
				this.match.cleanup();
			}
			
			// Clean up any remaining physics bodies
			const bodiesToRemove = Composite.allBodies(world);
			console.log(`Removing ${bodiesToRemove.length} bodies from world`);
			bodiesToRemove.forEach((body) => {
				Composite.remove(world, body);
			});
			
			// Clear Matter.js internal caches
			// This makes sure no ghost collisions from previous matches
			Composite.clear(world, false);
			
			sounds.play(SoundName.BackgroundMusic);
			
			// Pass character selections to Match
			const player1Character = parameters.player1Character || 'CODY';
			const player2Character = parameters.player2Character || 'ALE';
			
			// Create fresh match
			console.log(`Creating new match: ${player1Character} vs ${player2Character}`);
			this.match = new Match(player1Character, player2Character);
		}
	}

	exit() {
		// When exiting play state, we handle cleanup in the destination state
		// Pause state will preserve match, others will call cleanup
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

		// Update physics engine
		// This should only run when PlayState is active (not during pause)
		Engine.update(engine);
		
		// Update match logic
		this.match.update(dt);
		
		// Check if match is over
		if (this.match.isMatchOver()) {
			// Clean up match before transitioning
			console.log("Match over, cleaning up...");
			this.match.cleanup();
			
			// Additional safety: clean up any remaining bodies
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