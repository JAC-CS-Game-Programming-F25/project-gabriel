import Circle from './Circle.js';
import BodyType from '../enums/BodyType.js';
import { matter, context } from '../globals.js';
import StateMachine from '../../lib/StateMachine.js';
import InactiveState from '../states/powerup/InactiveState.js';
import SpawningState from '../states/powerup/SpawningState.js';
import ActiveOnFieldState from '../states/powerup/ActiveOnFieldState.js';
import CollectedState from '../states/powerup/CollectedState.js';
import EffectActiveState from '../states/powerup/EffectActiveState.js';

export default class PowerUp extends Circle {
	static RADIUS = 20;
	static DURATION = 5.0; // 5 seconds active time

	/**
	 * Base PowerUp class that other powerups inherit from.
	 * PowerUps are collectible items that give temporary abilities.
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @param {string} type - PowerUpType enum value
	 */
	constructor(x, y, type) {
		super(x, y, PowerUp.RADIUS, {
			label: BodyType.PowerUp,
			isSensor: true, // No physical collision, just detection
			isStatic: true, // Doesn't move
		});

		this.type = type;
		this.shouldCleanUp = false;
		this.collected = false;
		this.visible = true;
		this.spawning = false;
		this.activeOnField = false;
		
		// Visual bobbing animation
		this.bobTimer = 0;
		this.bobSpeed = 2;
		this.bobAmount = 10;
		this.baseY = y;

		// Initialize state machine
		this.stateMachine = new StateMachine();
		this.stateMachine.add('inactive', new InactiveState(this));
		this.stateMachine.add('spawning', new SpawningState(this));
		this.stateMachine.add('active-on-field', new ActiveOnFieldState(this));
		this.stateMachine.add('collected', new CollectedState(this));
		this.stateMachine.add('effect-active', new EffectActiveState(this));
		
		// Start directly in spawning state (since theyre created when needed)
		this.stateMachine.change('spawning');
	}

	update(dt) {
		super.update(dt);
		
		// Update state machine
		this.stateMachine.update(dt);
	}

	collect(player) {
		// Transition to collected state
		this.stateMachine.change('collected', player);
	}

	render() {
		// Don't render if not visible
		if (!this.visible) return;
		
		// Will be overridden by subclasses with specific colors/icons
		context.save();
		context.translate(this.body.position.x, this.body.position.y);
		
		// Spawn animation - scale up from 0
		if (this.spawning) {
			const spawnState = this.stateMachine.currentState;
			if (spawnState && spawnState.spawnAnimationTimer !== undefined) {
				const progress = spawnState.spawnAnimationTimer / spawnState.spawnAnimationDuration;
				const scale = Math.min(progress, 1.0);
				context.scale(scale, scale);
			}
		}
		
		// Draw circle with glow effect
		context.shadowBlur = 20;
		context.shadowColor = this.getColor();
		context.fillStyle = this.getColor();
		context.beginPath();
		context.arc(0, 0, PowerUp.RADIUS, 0, Math.PI * 2);
		context.fill();
		
		context.shadowBlur = 0;
		context.strokeStyle = 'white';
		context.lineWidth = 3;
		context.stroke();
		
		// Draw icon/symbol (override in subclasses)
		this.renderIcon();
		
		context.restore();
	}

	getColor() {
		return 'purple'; // Override in subclasses
	}

	renderIcon() {
		// Override in subclasses
	}
}