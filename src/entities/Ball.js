import Circle from './Circle.js';
import BodyType from '../enums/BodyType.js';
import GameEntity from './GameEntity.js';
import Sprite from '../../lib/Sprite.js';
import ImageName from '../enums/ImageName.js';
import { matter, images, context } from '../globals.js';

export default class Ball extends Circle {
	static RADIUS = 15;
	
	// All 8 frames from the soccer ball sprite sheet (1024 x 136)
	static BALL_SPRITE_MEASUREMENTS = [
		{ x: 0,   y: 4, width: 128, height: 128 },   // Frame 0
		{ x: 128, y: 4, width: 128, height: 128 },   // Frame 1
		{ x: 256, y: 4, width: 128, height: 128 },   // Frame 2
		{ x: 384, y: 4, width: 128, height: 128 },   // Frame 3
		{ x: 512, y: 4, width: 128, height: 128 },   // Frame 4
		{ x: 640, y: 4, width: 128, height: 128 },   // Frame 5
		{ x: 768, y: 4, width: 128, height: 128 },   // Frame 6
		{ x: 896, y: 4, width: 128, height: 128 },   // Frame 7
	];

	constructor(x, y) {
		super(x, y, Ball.RADIUS, {
			label: BodyType.Ball,
			density: 0.003,
			restitution: 0.9,
			friction: 0.1,
		});

		// Generate sprites
		this.sprites = Ball.generateBallSprites();
		this.currentFrame = 0;
		
		this.renderOffset = { x: -Ball.RADIUS, y: -Ball.RADIUS };
		
		// Animation timing
		this.animationTimer = 0;
		this.animationSpeed = 0.08; // Time between frames
	}

	static generateBallSprites() {
		// Use the same pattern as Angry Birds entities
		return Ball.BALL_SPRITE_MEASUREMENTS.map(measurement =>
			new Sprite(
				images.get(ImageName.SoccerBall),
				measurement.x,
				measurement.y,
				measurement.width,
				measurement.height
			)
		);
	}

	update(dt) {
		super.update(dt);
		
		// Animate the ball when it's moving
		const velocity = this.body.velocity;
		const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
		
		// Only animate if ball is moving
		if (speed > 0.5) {
			this.animationTimer += dt;
			
			if (this.animationTimer >= this.animationSpeed) {
				this.animationTimer = 0;
				this.currentFrame = (this.currentFrame + 1) % this.sprites.length;
			}
		}
		
		// Prevent ball from going too fast (anti-tunneling)
		const maxSpeed = 50;
		
		if (speed > maxSpeed) {
			// Scale velocity down to max speed
			const scale = maxSpeed / speed;
			matter.Body.setVelocity(this.body, {
				x: velocity.x * scale,
				y: velocity.y * scale
			});
		}

		// Anti-stuck mechanism: if ball is moving very slowly at high altitude, give it a lil nudge
		const isHighUp = this.body.position.y < 400; // Upper half of screen
		if (speed < 0.5 && isHighUp && Math.abs(velocity.y) < 0.3) {
			// Ball is nearly stationary up high, give it a nudge to keep it moving
			matter.Body.applyForce(this.body, this.body.position, {
				x: (Math.random() - 0.5) * 0.003,
				y: -0.002 // Slight upward nudge
			});
		}
	}

	reset(x, y) {
		// Reset ball to center after goal
		matter.Body.setPosition(this.body, { x, y });
		matter.Body.setVelocity(this.body, { x: 0, y: 0 });
		matter.Body.setAngularVelocity(this.body, 0);
		this.currentFrame = 0; // Reset animation to first frame
		this.animationTimer = 0;
	}

	render() {
		// Custom render that scales the 128x128 sprite to match hitbox
		context.save();
		context.translate(this.body.position.x, this.body.position.y);
		context.rotate(this.body.angle);
		
		// Calculate scale, make sprite slightly bigger to better match visual appearance
		const spriteSize = 128; // Original sprite width/height
		const targetSize = Ball.RADIUS * 2.4; // Bigger visual size to match hitbox better
		const scale = targetSize / spriteSize;
		
		// Apply scale
		context.scale(scale, scale);
		
		// Draw sprite centered (sprite is 128x128, so offset by -64, -64)
		const spriteOffset = -spriteSize / 2;
		
		if (this.sprites && this.sprites[this.currentFrame]) {
			this.sprites[this.currentFrame].render(spriteOffset, spriteOffset);
		} else {
			// Fallback if sprite fails to load
			this.renderFallback();
		}
		
		context.restore();
	}

	renderFallback() {
		// Simple white circle fallback (shouldnt ever be needed though)
		context.fillStyle = '#FFFFFF';
		context.beginPath();
		context.arc(0, 0, Ball.RADIUS, 0, Math.PI * 2);
		context.fill();
		context.strokeStyle = '#000000';
		context.lineWidth = 2;
		context.stroke();
	}
}