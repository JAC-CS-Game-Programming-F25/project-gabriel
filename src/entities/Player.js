import { matter, input } from '../globals.js';
import BodyType from '../enums/BodyType.js';
import Circle from './Circle.js';
import Input from '../../lib/Input.js';
import GameEntity from './GameEntity.js';

export default class Player extends Circle {
	static SPRITE_MEASUREMENTS = [{ x: 903, y: 798, width: 45, height: 45 }];
	static RADIUS = 20;

	constructor(x, y, playerNumber = 1) {
		super(x, y, Player.RADIUS, {
			label: BodyType.Player,
			density: 0.01,
			restitution: 0.3,
			friction: 0.8,
		});

		this.sprites = GameEntity.generateSprites(Player.SPRITE_MEASUREMENTS);
		this.renderOffset = { x: -25, y: -23 };
		this.playerNumber = playerNumber;
		this.score = 0;
		
		// Player 1: WASD, Player 2: Arrow keys
		this.controls = playerNumber === 1 ? {
			left: Input.KEYS.A,
			right: Input.KEYS.D,
			jump: Input.KEYS.W,
			kick: Input.KEYS.S,
		} : {
			left: Input.KEYS.ARROW_LEFT,  
			right: Input.KEYS.ARROW_RIGHT,  
			jump: Input.KEYS.ARROW_UP,      
			kick: Input.KEYS.ARROW_DOWN,
		};
	}

	update(dt) {
		super.update(dt);
		this.handleMovement();
	}

	handleMovement() {
		const speed = 0.005;
		
		// Left movement
		if (input.isKeyHeld(this.controls.left)) {
			matter.Body.applyForce(this.body, this.body.position, { x: -speed, y: 0 });
		}
		
		// Right movement
		if (input.isKeyHeld(this.controls.right)) {
			matter.Body.applyForce(this.body, this.body.position, { x: speed, y: 0 });
		}
		
		// Jump
		if (input.isKeyPressed(this.controls.jump) && this.isOnGround()) {
			this.jump();
		}
		
		// Kick (TODO: implement kick mechanic)
		if (input.isKeyPressed(this.controls.kick)) {
			// TODO: Kick the ball
		}
	}

	jump() {
		matter.Body.applyForce(this.body, this.body.position, {
			x: 0.0,
			y: -0.3,
		});
	}

	addScore() {
		this.score++;
	}
}