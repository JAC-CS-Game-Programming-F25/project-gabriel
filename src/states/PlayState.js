import State from '../../lib/State.js';
import Input from '../../lib/Input.js';
import GameStateName from '../enums/GameStateName.js';
import SoundName from '../enums/SoundName.js';
import Match from '../objects/Match.js';
import GameStateManager from '../services/GameStateManager.js';
import { engine, input, matter, sounds, stateMachine, world } from '../globals.js';

const { Composite, Engine, Body } = matter;

export default class PlayState extends State {
	constructor() {
		super();
		this.autoSaveTimer = 0;
	}

	enter(parameters = {}) {
		console.log('=== ENTERING PLAY STATE ===');
		console.log('Parameters:', parameters);
		
		// Check if we're restoring from saved state
		if (parameters.restoreState) {
			console.log('RESTORING FROM SAVED STATE');
			const savedMatch = parameters.restoreState.match;
			
			// Clean up any existing match/bodies first
			if (this.match) {
				console.log("Cleaning up old match before restoring...");
				this.match.cleanup();
			}
			
			const bodiesToRemove = Composite.allBodies(world);
			console.log(`Removing ${bodiesToRemove.length} bodies from world`);
			bodiesToRemove.forEach((body) => {
				Composite.remove(world, body);
			});
			Composite.clear(world, false);
			
			// Create match with saved characters
			const char1 = savedMatch.player1.character;
			const char2 = savedMatch.player2.character;
			
			console.log(`Creating match for restore: ${char1} vs ${char2}`);
			this.match = new Match(char1, char2);
			
			// Restore match state after match is created
			const restored = GameStateManager.restoreMatch(this.match, savedMatch);
			
			if (restored) {
				console.log('Game resumed from saved state!');
				console.log(`Score: P1 ${this.match.player1.score} - P2 ${this.match.player2.score}`);
				console.log(`Time remaining: ${this.match.timeRemaining}s`);
			} else {
				console.error('Failed to restore match state');
			}
			
			sounds.play(SoundName.BackgroundMusic);
		}
		// If resuming from pause, use the existing match
		else if (parameters.match) {
			console.log('▶RESUMING FROM PAUSE');
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
		} 
		// Starting new match
		else {
			console.log('STARTING NEW MATCH');
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
			const player1Character = parameters.player1Character || 'Cody';
			const player2Character = parameters.player2Character || 'Ale';
			
			// Create fresh match
			console.log(`Creating new match: ${player1Character} vs ${player2Character}`);
			this.match = new Match(player1Character, player2Character);
		}
		
		// Reset auto-save timer
		this.autoSaveTimer = 0;
	}

	exit() {
		// If match is still in progress, save it
		if (this.match && this.match.matchStarted && this.match.matchTime < this.match.matchDuration) {
			this.saveCurrentState();
			console.log('Game saved on exit');
		} else if (this.match && this.match.isMatchOver()) {
			// Match is over, clear saved state
			GameStateManager.clearGameState();
			console.log('Saved game cleared (match ended)');
		}
	}

	/**
	 * Save complete game state to localStorage
	 */
	saveCurrentState() {
		if (!this.match) return;
		
		const gameState = {
			currentStateName: GameStateName.Play,
			match: this.match,
			selectedCharacters: {
				player1: this.match.player1.character,
				player2: this.match.player2.character
			}
		};
		
		const saved = GameStateManager.saveGameState(gameState);
		if (saved) {
			console.log('Game auto-saved');
		}
	}

	update(dt) {
		// Auto-save every 5 seconds (but not during countdown or if match over)
		if (this.match && this.match.matchStarted && !this.match.isMatchOver()) {
			this.autoSaveTimer += dt;
			if (this.autoSaveTimer >= 5.0) {
				this.saveCurrentState();
				this.autoSaveTimer = 0;
			}
		}
		
		// Check for pause key
		if (input.isKeyPressed(Input.KEYS.P)) {
			// Save before pausing
			this.saveCurrentState();
			
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
			
			// Clear saved game (match is complete)
			GameStateManager.clearGameState();
			
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