import { matter, input, context, world } from '../globals.js';
import BodyType from '../enums/BodyType.js';
import Input from '../../lib/Input.js';
import { CANVAS_HEIGHT } from '../globals.js';
import Ground from './Ground.js';

const { Bodies, Body, Composite, Constraint } = matter;

export default class Player {
	static HEAD_RADIUS = 25;
	static BOOT_WIDTH = 25;
	static BOOT_HEIGHT = 15;

	/**
	 * A player character composed of a head (circle) and boot (rectangle).
	 * Both parts have hitboxes and the boot is used for ground contact and kicking.
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @param {number} playerNumber 1 or 2
	 */
	constructor(x, y, playerNumber = 1) {
		this.playerNumber = playerNumber;
		this.score = 0;
		this.facingRight = playerNumber === 2;
		this.shouldCleanUp = false;

		// Create the head (upper body)
		this.head = Bodies.circle(x, y - Player.HEAD_RADIUS / 2, Player.HEAD_RADIUS, {
			label: BodyType.Player,
			density: 0.005,
			restitution: 0.3,
			friction: 0.1,
		});

		// Create the boot (the lower body) that touches the ground
		this.boot = Bodies.rectangle(
			x,
			y + Player.HEAD_RADIUS + Player.BOOT_HEIGHT / 2 - 5,
			Player.BOOT_WIDTH,
			Player.BOOT_HEIGHT,
			{
				label: BodyType.Player,
				density: 0.01,
				restitution: 0.1,
				friction: 1.0, // High friction for good traction
			}
		);

		// Create composite body
		this.body = Composite.create({
			bodies: [this.head, this.boot],
		});

		// Constraint to keep head and boot together but allow some flexibility
		const constraint = Constraint.create({
			bodyA: this.head,
			bodyB: this.boot,
			pointA: { x: 0, y: Player.HEAD_RADIUS * 0.8 },
			pointB: { x: 0, y: -Player.BOOT_HEIGHT / 2 },
			stiffness: 0.9,
			length: 5,
		});

		Composite.add(this.body, constraint);

		// Add to world
		Composite.add(world, this.body);

		// Store reference to this player on both bodies
		this.head.entity = this;
		this.boot.entity = this;
		
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

		this.isKicking = false;
		this.kickTimer = 0;
		this.kickDuration = 0.15;
	}

	update(dt) {
		if (this.shouldCleanUp) {
			Composite.remove(world, this.body);
			return;
		}

		this.handleMovement();
		this.updateKick(dt);
		this.updateOrientation();
	}

	handleMovement() {
		const speed = 0.01;
		const maxSpeed = 6;
		
		const bootVelocity = this.boot.velocity;
		
		// Left movement
		if (input.isKeyHeld(this.controls.left)) {
			if (bootVelocity.x > -maxSpeed) {
				Body.applyForce(this.boot, this.boot.position, { x: -speed, y: 0 });
			}
			this.facingRight = false;
		}
		
		// Right movement
		if (input.isKeyHeld(this.controls.right)) {
			if (bootVelocity.x < maxSpeed) {
				Body.applyForce(this.boot, this.boot.position, { x: speed, y: 0 });
			}
			this.facingRight = true;
		}
		
		// Jump
		if (input.isKeyPressed(this.controls.jump) && this.isOnGround()) {
			this.jump();
		}
		
		// Kick
		if (input.isKeyPressed(this.controls.kick) && !this.isKicking) {
			this.kick();
		}
	}

	jump() {
		// Apply jump force to both head and boot
		Body.applyForce(this.head, this.head.position, { x: 0, y: -0.25 });
		Body.applyForce(this.boot, this.boot.position, { x: 0, y: -0.25 });
	}

	kick() {
		this.isKicking = true;
		this.kickTimer = 0;
		
		// Apply kick force to boot
		const kickForce = this.facingRight ? 0.03 : -0.03;
		Body.applyForce(this.boot, this.boot.position, { x: kickForce, y: 0 });
	}

	updateKick(dt) {
		if (this.isKicking) {
			this.kickTimer += dt;
			if (this.kickTimer >= this.kickDuration) {
				this.isKicking = false;
				this.kickTimer = 0;
			}
		}
	}

	updateOrientation() {
		// Keep the boot upright (prevent rotation)
		Body.setAngle(this.boot, 0);
		Body.setAngularVelocity(this.boot, 0);
		
		// Limit head rotation
		if (Math.abs(this.head.angle) > Math.PI / 6) {
			Body.setAngle(this.head, Math.sign(this.head.angle) * Math.PI / 6);
		}
	}

	isOnGround() {
		return this.boot.position.y >= CANVAS_HEIGHT - Ground.GRASS.height - Player.BOOT_HEIGHT / 2 - 1;
	}

	addScore() {
		this.score++;
	}

	render() {
		// Render head
		context.save();
		context.translate(this.head.position.x, this.head.position.y);
		context.rotate(this.head.angle);
		
		// Draw head circle
		context.fillStyle = this.playerNumber === 1 ? '#FF6B9D' : '#4ECDC4';
		context.beginPath();
		context.arc(0, 0, Player.HEAD_RADIUS, 0, Math.PI * 2);
		context.fill();
		context.strokeStyle = 'black';
		context.lineWidth = 3;
		context.stroke();
		
		// Draw face 
		const eyeOffsetX = this.facingRight ? 8 : -8;
		
		// Eye
		context.fillStyle = 'white';
		context.beginPath();
		context.arc(eyeOffsetX, -5, 6, 0, Math.PI * 2);
		context.fill();
		context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.stroke();
		
		// Pupil
		context.fillStyle = 'black';
		context.beginPath();
		context.arc(eyeOffsetX + (this.facingRight ? 2 : -2), -5, 3, 0, Math.PI * 2);
		context.fill();
		
		// Mouth
		context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.beginPath();
		context.arc(0, 8, 10, 0, Math.PI);
		context.stroke();
		
		context.restore();

		// Render boot
		context.save();
		context.translate(this.boot.position.x, this.boot.position.y);
		context.rotate(this.boot.angle);
		
		// Boot extends forward when kicking
		const kickOffset = this.isKicking ? (this.facingRight ? 8 : -8) : 0;
		
		context.fillStyle = this.playerNumber === 1 ? '#8B4513' : '#2C3E50';
		context.fillRect(
			-Player.BOOT_WIDTH / 2 + kickOffset,
			-Player.BOOT_HEIGHT / 2,
			Player.BOOT_WIDTH,
			Player.BOOT_HEIGHT
		);
		context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.strokeRect(
			-Player.BOOT_WIDTH / 2 + kickOffset,
			-Player.BOOT_HEIGHT / 2,
			Player.BOOT_WIDTH,
			Player.BOOT_HEIGHT
		);
		
		// Draw boot detail
		context.fillStyle = 'rgba(0, 0, 0, 0.3)';
		const toeX = this.facingRight ? Player.BOOT_WIDTH / 2 - 8 : -Player.BOOT_WIDTH / 2;
		context.fillRect(
			toeX + kickOffset,
			-Player.BOOT_HEIGHT / 2,
			8,
			Player.BOOT_HEIGHT
		);
		
		context.restore();
	}
}