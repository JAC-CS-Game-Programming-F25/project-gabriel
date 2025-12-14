import Rectangle from './Rectangle.js';
import BodyType from '../enums/BodyType.js';
import ImageName from '../enums/ImageName.js';
import { context, matter, world, images } from '../globals.js';

export default class Goal extends Rectangle {
	static WIDTH = 100;
	static HEIGHT = 300; // Original goal zone height
	
	// Sprite dimensions and calculated actual net height
	static SPRITE_WIDTH = 1308;
	static SPRITE_HEIGHT = 2059;
	static ACTUAL_NET_HEIGHT = Goal.WIDTH * (Goal.SPRITE_HEIGHT / Goal.SPRITE_WIDTH); 

	/**
	 * A goal zone that detects when the ball enters.
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @param {number} playerNumber Which player defends this goal (1 or 2)
	 */
	constructor(x, y, playerNumber) {
		// Use ACTUAL_NET_HEIGHT for the sensor body
		super(x, y + (Goal.HEIGHT - Goal.ACTUAL_NET_HEIGHT), Goal.WIDTH, Goal.ACTUAL_NET_HEIGHT, {
			label: BodyType.Goal,
			isStatic: true,
			isSensor: true, // Sensor = triggers events but doesn't collide with anything
		});

		this.playerNumber = playerNumber;
		// RenderOffset based on ACTUAL_NET_HEIGHT
		this.renderOffset = { x: -Goal.WIDTH / 2, y: -Goal.ACTUAL_NET_HEIGHT / 2 };

		// Load the soccer net sprite
		this.netSprite = images.get(ImageName.SoccerNet);

		// Create solid crossbar that ball bounces off and that is angled slightly so ball rolls off
		const crossbarThickness = 10;
		this.crossbar = matter.Bodies.rectangle(
			this.body.position.x,
			this.body.position.y - Goal.ACTUAL_NET_HEIGHT / 2 + crossbarThickness / 2,
			Goal.WIDTH,
			crossbarThickness,
			{
				label: BodyType.Wall, // Solid collision
				isStatic: true,
				restitution: 0.95, // VERY bouncy
				friction: 0.15,
				angle: playerNumber === 1 ? -0.08 : 0.08,
			}
		);
		matter.Composite.add(world, this.crossbar);
	}

	render() {
		context.save();
		context.translate(this.body.position.x, this.body.position.y);
		
		// Get the sprite image
		const netImage = this.netSprite?.image || this.netSprite;
		
		if (netImage && netImage instanceof HTMLImageElement && netImage.complete) {
			const renderWidth = Goal.WIDTH;
			const renderHeight = Goal.ACTUAL_NET_HEIGHT;
			
			// Flip both sprites horizontally (they're on wrong sides by default)
			if (this.playerNumber === 1) {
				context.scale(-1, 1);
			}
			
			// Draw the net sprite
			context.drawImage(
				netImage,
				-this.renderOffset.x - renderWidth,
				this.renderOffset.y,
				renderWidth,
				renderHeight
			);
		} else {
			// Fallback rendering if sprite not loaaded
			this.renderFallback();
		}
		
		context.restore();
	}

	renderFallback() {
		context.fillStyle = 'white';
		context.fillRect(this.renderOffset.x, this.renderOffset.y, 10, Goal.ACTUAL_NET_HEIGHT);
		context.fillRect(this.renderOffset.x + Goal.WIDTH - 10, this.renderOffset.y, 10, Goal.ACTUAL_NET_HEIGHT);
		context.fillRect(this.renderOffset.x, this.renderOffset.y, Goal.WIDTH, 10);
		
		// Draw net pattern
		context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		context.lineWidth = 2;
		for (let i = 0; i < Goal.ACTUAL_NET_HEIGHT; i += 20) {
			context.beginPath();
			context.moveTo(this.renderOffset.x, this.renderOffset.y + i);
			context.lineTo(this.renderOffset.x + Goal.WIDTH, this.renderOffset.y + i);
			context.stroke();
		}
		for (let i = 0; i < Goal.WIDTH; i += 20) {
			context.beginPath();
			context.moveTo(this.renderOffset.x + i, this.renderOffset.y);
			context.lineTo(this.renderOffset.x + i, this.renderOffset.y + Goal.ACTUAL_NET_HEIGHT);
			context.stroke();
		}
	}
}