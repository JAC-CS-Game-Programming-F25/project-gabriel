import { matter, input, context, world } from '../globals.js';
import BodyType from '../enums/BodyType.js';
import Input from '../../lib/Input.js';
import { CANVAS_HEIGHT } from '../globals.js';
import Ground from './Ground.js';

const { Bodies, Body, Composite, Constraint } = matter;

export default class Player {
	static HEAD_RADIUS = 25;
	static BOOT_WIDTH = 60;  // Long boot
	static BOOT_HEIGHT = 20; // Tall boot

	/**
	 * A player character composed of a head (circle) and boot (rectangle).
	 * Player 1 faces RIGHT (head on left side of boot).
	 * Player 2 faces LEFT (head on right side of boot).
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @param {number} playerNumber 1 or 2
	 */
	constructor(x, y, playerNumber = 1) {
		this.playerNumber = playerNumber;
		this.score = 0;
		this.facingRight = playerNumber === 1; // P1 faces right, P2 faces left
		this.shouldCleanUp = false;
		this.ball = null;

		// Create the boot FIRST (it's the main body on the ground)
		this.boot = Bodies.rectangle(
			x,
			y,
			Player.BOOT_WIDTH,
			Player.BOOT_HEIGHT,
			{
				label: BodyType.Player,
				density: 0.015,
				restitution: 0.0, // No bounce
				friction: 0.3, // lower friction for gliding
				frictionStatic: 0.3, // Low static friction too
				inertia: Infinity, // Prevents rotation from physics
			}
		);

		// Position head on the back of boot based on facing direction
		// P1 faces right -> head on left side of boot
		// P2 faces left -> head on right side of boot
		const heelOffsetX = this.facingRight ? -Player.BOOT_WIDTH / 2 + 10 : Player.BOOT_WIDTH / 2 - 10;
		this.head = Bodies.circle(
			x + heelOffsetX,
			y - Player.BOOT_HEIGHT / 2 - Player.HEAD_RADIUS,
			Player.HEAD_RADIUS,
			{
				label: BodyType.Player,
				density: 0.005,
				restitution: 0.3,
				friction: 0.1,
				inertia: Infinity, // Lock head roation too
			}
		);

		// Create composite body
		this.body = Composite.create({
			bodies: [this.head, this.boot],
		});

		// Constraint to wweld head to the heel of the boot so it doesnt move at all
		const constraint = Constraint.create({
			bodyA: this.head,
			bodyB: this.boot,
			pointA: { x: 0, y: Player.HEAD_RADIUS },
			pointB: { x: heelOffsetX, y: -Player.BOOT_HEIGHT / 2 },
			stiffness: 1.0, // Maximum stiffness
			damping: 0.1, // Add damping to prevent oscillation
			length: 0, // Zero length = welded together
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
		
		// PowerUp effects
		this.hasSpeedBoost = false;
		this.speedBoostTimer = 0;
		this.hasBigHead = false;
		this.bigHeadTimer = 0;
		this.hasSuperKick = false;
		this.superKickTimer = 0;
	}

	update(dt) {
		if (this.shouldCleanUp) {
			Composite.remove(world, this.body);
			return;
		}

		this.handleMovement();
		this.updateKick(dt);
		this.updateOrientation();
		this.updatePowerUps(dt);
	}

	handleMovement() {
		const baseSpeed = 0.018;
		const speedMultiplier = this.hasSpeedBoost ? 1.8 : 1.0; // 80% faster with speed boost
		const speed = baseSpeed * speedMultiplier;
		const maxSpeed = 8 * speedMultiplier;
		
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
		Body.applyForce(this.head, this.head.position, { x: 0, y: -0.3 });
		Body.applyForce(this.boot, this.boot.position, { x: 0, y: -0.3 });
	}

	kick() {
		this.isKicking = true;
		this.kickTimer = 0;
		
		// Check if ball is nearby and kick it
		this.checkAndKickBall();
	}

	checkAndKickBall() {
		// Calculate distance from boot to ball
		// We need to find the ball so we'll store a reference to it
		if (!this.ball) return;
		
		const bootPos = this.boot.position;
		const ballPos = this.ball.body.position;
		
		// Calculate distance
		const dx = ballPos.x - bootPos.x;
		const dy = ballPos.y - bootPos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		// Kick range so if ball is within this distance, kick it
		const kickRange = Player.BOOT_WIDTH + this.ball.radius + 10;
		
		// Check if ball is in front of player (not behind)
		const isInFront = this.facingRight ? dx > 0 : dx < 0;
		
		if (distance < kickRange && isInFront) {
			// KICK THE BALL!
			const kickDirection = this.facingRight ? 1 : -1;
			
			// Base kick power + velocity bonus
			let baseKickPower = 0.25;
			const velocityBonus = Math.abs(this.boot.velocity.x) * 0.03;
			
			// Apply super kick multiplier if active
			if (this.hasSuperKick) {
				baseKickPower *= 3.0; // Triple power
				this.hasSuperKick = false; // Consumed after one use
				console.log(`Player ${this.playerNumber} used SUPER KICK!`);
			}
			
			const totalPower = baseKickPower + velocityBonus;
			
			Body.applyForce(this.ball.body, this.ball.body.position, {
				x: kickDirection * totalPower,
				y: -0.12, // Upward trajectory
			});
			
			console.log(`Player ${this.playerNumber} KICKED! Power: ${totalPower.toFixed(2)}`);
		}
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

	updatePowerUps(dt) {
		// Update speed boost timer
		if (this.hasSpeedBoost) {
			this.speedBoostTimer -= dt;
			if (this.speedBoostTimer <= 0) {
				this.hasSpeedBoost = false;
				this.speedBoostTimer = 0;
				console.log(`Player ${this.playerNumber} speed boost expired`);
			}
		}
		
		// Update big head timer
		if (this.hasBigHead) {
			this.bigHeadTimer -= dt;
			if (this.bigHeadTimer <= 0) {
				this.hasBigHead = false;
				this.bigHeadTimer = 0;
				console.log(`Player ${this.playerNumber} big head expired`);
			}
		}
		
		// Update super kick timer (just for display, effect is one-time)
		if (this.hasSuperKick) {
			this.superKickTimer -= dt;
			if (this.superKickTimer <= 0) {
				this.hasSuperKick = false;
				this.superKickTimer = 0;
			}
		}
	}

	updateOrientation() {
		// Force boot to stay completely flat (no rotation ever)
		Body.setAngle(this.boot, 0);
		Body.setAngularVelocity(this.boot, 0);
		
		// Force head to stay upright too
		Body.setAngle(this.head, 0);
		Body.setAngularVelocity(this.head, 0);
		
		if (this.isOnGround()) {
			Body.setVelocity(this.boot, {
				x: this.boot.velocity.x,
				y: Math.max(0, this.boot.velocity.y * 0.5) // Kill downward velocity
			});
			Body.setVelocity(this.head, {
				x: this.head.velocity.x,
				y: Math.max(0, this.head.velocity.y * 0.5)
			});
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
		
		// Kick animation extends boot forward
		const kickOffset = this.isKicking ? 12 : 0;
		
		// Draw boot extending FORWARD from heel position
		const bootStartX = this.facingRight ? -Player.BOOT_WIDTH / 2 : -Player.BOOT_WIDTH / 2;
		
		context.fillStyle = this.playerNumber === 1 ? '#8B4513' : '#2C3E50';
		context.fillRect(
			bootStartX + (this.facingRight ? kickOffset : -kickOffset),
			-Player.BOOT_HEIGHT / 2,
			Player.BOOT_WIDTH,
			Player.BOOT_HEIGHT
		);
		context.strokeStyle = 'black';
		context.lineWidth = 2;
		context.strokeRect(
			bootStartX + (this.facingRight ? kickOffset : -kickOffset),
			-Player.BOOT_HEIGHT / 2,
			Player.BOOT_WIDTH,
			Player.BOOT_HEIGHT
		);
		
		// Draw toe cap at the FRONT of boot
		context.fillStyle = 'rgba(0, 0, 0, 0.3)';
		const toeX = this.facingRight ? 
			Player.BOOT_WIDTH / 2 - 12 : 
			-Player.BOOT_WIDTH / 2;
		context.fillRect(
			toeX + (this.facingRight ? kickOffset : -kickOffset),
			-Player.BOOT_HEIGHT / 2,
			12,
			Player.BOOT_HEIGHT
		);
		
		context.restore();
	}
}