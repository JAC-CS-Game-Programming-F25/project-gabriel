import Circle from './Circle.js';
import BodyType from '../enums/BodyType.js';
import { matter, context } from '../globals.js';

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
		
		// Visual bobbing animation
		this.bobTimer = 0;
		this.bobSpeed = 2;
		this.bobAmount = 10;
		this.baseY = y;
	}

	update(dt) {
		super.update(dt);
		
		// Bobbing up and down animation
		this.bobTimer += dt * this.bobSpeed;
		const offset = Math.sin(this.bobTimer) * this.bobAmount;
		matter.Body.setPosition(this.body, {
			x: this.body.position.x,
			y: this.baseY + offset
		});
	}

	collect(player) {
		// Override this in subclasses
		this.collected = true;
		this.shouldCleanUp = true;
	}

	render() {
		// Will be overridden by subclasses with specific colors/icons
		context.save();
		context.translate(this.body.position.x, this.body.position.y);
		
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