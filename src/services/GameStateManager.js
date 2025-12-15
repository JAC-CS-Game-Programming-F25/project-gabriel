/**
 * GameStateManager - Handles saving and restoring complete game state
 * 
 * Saves everything needed to resume a match exactly where it left off:
 * - Current game state (play, pause, character select, etc.)
 * - Match timer and countdown
 * - Player positions, velocities, scores, characters
 * - Ball position and velocity
 * - Active power-ups (position, type, state)
 * - Player power-up effects (active effects and timers)
 */

import { matter } from '../globals.js';
import PowerUpFactory from '../objects/PowerUpFactory.js';

const { Body } = matter;

export default class GameStateManager {
	static STORAGE_KEY = 'head_soccer_game_state';
	static STATS_KEY = 'head_soccer_stats';

	/**
	 * Save complete game state to localStorage
	 */
	static saveGameState(gameState) {
		try {
			const stateToSave = {
				timestamp: Date.now(),
				currentStateName: gameState.currentStateName,
				match: gameState.match ? this.serializeMatch(gameState.match) : null,
				selectedCharacters: gameState.selectedCharacters || null,
			};

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
			console.log('Game state saved successfully');
			return true;
		} catch (error) {
			console.error('Failed to save game state:', error);
			return false;
		}
	}

	/**
	 * Serialize match state for storage
	 */
	static serializeMatch(match) {
		return {
			// Match timing
			timeRemaining: match.timeRemaining,
			matchTimer: match.matchTimer,
			matchStarted: match.matchStarted,
			countdownTimer: match.countdownTimer,
			countdownTime: match.countdownTime,

			// Players
			player1: this.serializePlayer(match.player1),
			player2: this.serializePlayer(match.player2),

			// Ball
			ball: this.serializeBall(match.ball),

			// Power-ups
			powerups: match.powerups.map(p => this.serializePowerUp(p)),
			powerupSpawnTimer: match.powerupSpawnTimer,
			powerupSpawnInterval: match.powerupSpawnInterval,
		};
	}

	/**
	 * Serialize player state
	 */
	static serializePlayer(player) {
		return {
			playerNumber: player.playerNumber,
			character: player.character,
			score: player.score,
			
			// Position and physics
			headPosition: { x: player.head.position.x, y: player.head.position.y },
			bootPosition: { x: player.boot.position.x, y: player.boot.position.y },
			headVelocity: { x: player.head.velocity.x, y: player.head.velocity.y },
			bootVelocity: { x: player.boot.velocity.x, y: player.boot.velocity.y },
			
			// State machine
			currentState: player.stateMachine?.currentState?.constructor?.name || 'IdleState',
			
			// Kick state
			isKicking: player.isKicking,
			kickTimer: player.kickTimer,
			
			// Power-up effects
			hasSpeedBoost: player.hasSpeedBoost,
			speedBoostTimer: player.speedBoostTimer,
			hasBigHead: player.hasBigHead,
			bigHeadTimer: player.bigHeadTimer,
			hasSuperKick: player.hasSuperKick,
			superKickTimer: player.superKickTimer,
			
			// Face expression
			currentFaceSprite: player.currentFaceSprite,
			faceExpressionTimer: player.faceExpressionTimer,
		};
	}

	/**
	 * Serialize ball state
	 */
	static serializeBall(ball) {
		return {
			position: { x: ball.body.position.x, y: ball.body.position.y },
			velocity: { x: ball.body.velocity.x, y: ball.body.velocity.y },
			angularVelocity: ball.body.angularVelocity,
			angle: ball.body.angle,
			currentFrame: ball.currentFrame || 0,
		};
	}

	/**
	 * Serialize power-up state
	 */
	static serializePowerUp(powerup) {
		return {
			type: powerup.type,
			position: { x: powerup.body.position.x, y: powerup.body.position.y },
			baseY: powerup.baseY,
			currentState: powerup.stateMachine?.currentState?.constructor?.name || 'SpawningState',
			bobTimer: powerup.bobTimer,
			visible: powerup.visible,
			spawning: powerup.spawning,
			activeOnField: powerup.activeOnField,
			collected: powerup.collected,
		};
	}

	/**
	 * Load complete game state from localStorage
	 */
	static loadGameState() {
		try {
			const savedState = localStorage.getItem(this.STORAGE_KEY);
			if (!savedState) {
				console.log('No saved game state found');
				return null;
			}

			const state = JSON.parse(savedState);
			
			// Check if state is too old (more than 24 hours)
			const ageHours = (Date.now() - state.timestamp) / (1000 * 60 * 60);
			if (ageHours > 24) {
				console.log('Saved state too old, discarding');
				this.clearGameState();
				return null;
			}

			console.log('Game state loaded successfully');
			return state;
		} catch (error) {
			console.error('Failed to load game state:', error);
			return null;
		}
	}

	/**
	 * Restore match from serialized state
	 * Call this after match is created with correct characters
	 */
	static restoreMatch(match, savedMatchState) {
		try {
			console.log('Restoring match state...');
			console.log('Saved timeRemaining:', savedMatchState.timeRemaining);
			
			// Restore timing
			match.timeRemaining = savedMatchState.timeRemaining;
			match.matchTimer = savedMatchState.matchTimer || 0;
			match.matchStarted = savedMatchState.matchStarted;
			match.countdownTimer = savedMatchState.countdownTimer || 0;
			match.countdownTime = savedMatchState.countdownTime || 3;

			// Restore players
			this.restorePlayer(match.player1, savedMatchState.player1);
			this.restorePlayer(match.player2, savedMatchState.player2);

			// Restore ball
			this.restoreBall(match.ball, savedMatchState.ball);

			// Restore power-ups
			// Clear existing powerups first
			match.powerups.forEach(p => p.shouldCleanUp = true);
			match.powerups = [];
			
			// Recreate saved powerups
			savedMatchState.powerups.forEach(powerupData => {
				const powerup = this.restorePowerUp(powerupData);
				if (powerup) {
					match.powerups.push(powerup);
				}
			});

			match.powerupSpawnTimer = savedMatchState.powerupSpawnTimer || 0;
			match.powerupSpawnInterval = savedMatchState.powerupSpawnInterval || 15;

			console.log('Match restored from saved state');
			console.log('Time remaining:', match.timeRemaining);
			return true;
		} catch (error) {
			console.error('Failed to restore match:', error);
			return false;
		}
	}

	/**
	 * Restore player from saved state
	 */
	static restorePlayer(player, savedState) {
		// Restore score
		player.score = savedState.score;

		// Restore positions
		Body.setPosition(player.head, savedState.headPosition);
		Body.setPosition(player.boot, savedState.bootPosition);

		// Restore velocities
		Body.setVelocity(player.head, savedState.headVelocity);
		Body.setVelocity(player.boot, savedState.bootVelocity);

		// Restore state machine state (map state name to actual state)
		const stateMap = {
			'IdleState': 'idle',
			'RunningState': 'running',
			'JumpingState': 'jumping',
			'FallingState': 'falling',
			'KickingState': 'kicking'
		};
		const stateName = stateMap[savedState.currentState] || 'idle';
		if (player.stateMachine) {
			player.stateMachine.change(stateName);
		}

		// Restore kick state
		player.isKicking = savedState.isKicking;
		player.kickTimer = savedState.kickTimer;

		// Restore power-up effects
		player.hasSpeedBoost = savedState.hasSpeedBoost;
		player.speedBoostTimer = savedState.speedBoostTimer;
		player.hasBigHead = savedState.hasBigHead;
		player.bigHeadTimer = savedState.bigHeadTimer;
		player.hasSuperKick = savedState.hasSuperKick;
		player.superKickTimer = savedState.superKickTimer;

		// Restore face expression
		player.currentFaceSprite = savedState.currentFaceSprite;
		player.faceExpressionTimer = savedState.faceExpressionTimer;
	}

	/**
	 * Restore ball from saved state
	 */
	static restoreBall(ball, savedState) {
		Body.setPosition(ball.body, savedState.position);
		Body.setVelocity(ball.body, savedState.velocity);
		Body.setAngularVelocity(ball.body, savedState.angularVelocity);
		Body.setAngle(ball.body, savedState.angle);
		if (ball.currentFrame !== undefined) {
			ball.currentFrame = savedState.currentFrame;
		}
	}

	/**
	 * Restore power-up from saved state
	 */
	static restorePowerUp(savedState) {
		// Create new powerup of the correct type
		const powerup = PowerUpFactory.create(
			savedState.position.x,
			savedState.position.y,
			savedState.type
		);

		// Restore state
		powerup.baseY = savedState.baseY;
		powerup.bobTimer = savedState.bobTimer;
		powerup.visible = savedState.visible;
		powerup.spawning = savedState.spawning;
		powerup.activeOnField = savedState.activeOnField;
		powerup.collected = savedState.collected;

		// Restore state machine state
		const stateMap = {
			'InactiveState': 'inactive',
			'SpawningState': 'spawning',
			'ActiveOnFieldState': 'active-on-field',
			'CollectedState': 'collected',
			'EffectActiveState': 'effect-active'
		};
		const stateName = stateMap[savedState.currentState] || 'spawning';
		if (powerup.stateMachine) {
			powerup.stateMachine.change(stateName);
		}

		return powerup;
	}

	/**
	 * Clear saved game state
	 */
	static clearGameState() {
		localStorage.removeItem(this.STORAGE_KEY);
		console.log('Game state cleared');
	}

	/**
	 * Save game statistics (separate from game state)
	 */
	static saveStats(stats) {
		try {
			localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
			return true;
		} catch (error) {
			console.error('Failed to save stats:', error);
			return false;
		}
	}

	/**
	 * Load game statistics
	 */
	static loadStats() {
		try {
			const savedStats = localStorage.getItem(this.STATS_KEY);
			if (!savedStats) {
				return {
					matchesPlayed: 0,
					player1Wins: 0,
					player2Wins: 0,
					totalGoals: 0,
				};
			}
			return JSON.parse(savedStats);
		} catch (error) {
			console.error('Failed to load stats:', error);
			return {
				matchesPlayed: 0,
				player1Wins: 0,
				player2Wins: 0,
				totalGoals: 0,
			};
		}
	}

	/**
	 * Check if there's a saved game state
	 */
	static hasSavedState() {
		const saved = localStorage.getItem(this.STORAGE_KEY) !== null;
		console.log('hasSavedState:', saved);
		return saved;
	}
}