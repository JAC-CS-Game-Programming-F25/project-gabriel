import { matter, input, context, world, images } from '../globals.js';
import BodyType from '../enums/BodyType.js';
import Input from '../../lib/Input.js';
import { CANVAS_HEIGHT } from '../globals.js';
import Ground from './Ground.js';
import Sprite from '../../lib/Sprite.js';
import ImageName from '../enums/ImageName.js';
import FaceSprite from '../enums/FaceSprite.js';

const { Bodies, Body, Composite, Constraint } = matter;

export default class Player {
	static HEAD_RADIUS = 30;
	static BOOT_WIDTH = 60;
	static BOOT_HEIGHT = 20;

	// All 12 face sprites from your sprite sheet (4 characters × 3 expressions)
	static FACE_SPRITE_MEASUREMENTS = [
		// Ale
		{ x: 0, y: 0, width: 200, height: 200 },       // 0: Ale Happy
		{ x: 200, y: 0, width: 200, height: 200 },     // 1: Ale Normal
		{ x: 400, y: 0, width: 200, height: 200 },     // 2: Ale Wincing
		
		// Cody
		{ x: 600, y: 0, width: 200, height: 200 },     // 3: Cody Happy
		{ x: 0, y: 200, width: 200, height: 200 },     // 4: Cody Normal
		{ x: 200, y: 200, width: 200, height: 200 },   // 5: Cody Wincing
		
		// Nik
		{ x: 400, y: 200, width: 200, height: 200 },   // 6: Nik Happy
		{ x: 600, y: 200, width: 200, height: 200 },   // 7: Nik Normal
		{ x: 0, y: 400, width: 200, height: 200 },     // 8: Nik Wincing
		
		// Sef
		{ x: 200, y: 400, width: 200, height: 200 },   // 9: Sef Happy
		{ x: 400, y: 400, width: 200, height: 200 },   // 10: Sef Normal
		{ x: 600, y: 400, width: 200, height: 200 },   // 11: Sef Wincing
	];

	/**
	 * A player character composed of a head (circle) and boot (rectangle).
	 * Player 1 faces RIGHT (head on left side of boot).
	 * Player 2 faces LEFT (head on right side of boot).
	 * Boot is locked from rotation to prevent rolling.
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @param {number} playerNumber 1 or 2
	 * @param {string} character 'Ale', 'Cody', 'Nik', or 'Sef'
	 */
	constructor(x, y, playerNumber = 1, character = 'Cody') {
		this.playerNumber = playerNumber;
		this.character = character;
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
				friction: 0.01, // Very low friction for smooth movement
				frictionStatic: 0.01, // Very low static friction
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
		
		// Generate face sprites
		this.faceSprites = Player.generateFaceSprites();
		
		// Load shoe sprite
		this.shoeSprite = new Sprite(
			images.get(ImageName.Shoe),
			0,
			0,
			34,
			34
		);
		
		// Set current sprite based on character
		this.normalFaceIndex = this.getNormalFaceIndex();
		this.happyFaceIndex = this.getHappyFaceIndex();
		this.wincingFaceIndex = this.getWincingFaceIndex();
		
		// Start with normal face
		this.currentFaceSprite = this.normalFaceIndex;
		
		// Face expression state
		this.faceExpressionTimer = 0;
		
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
/**
	 * Generate Sprite objects from the face sprite sheet.
	 * Returns an array of all 12 face sprites.
	 */
	static generateFaceSprites() {
		return Player.FACE_SPRITE_MEASUREMENTS.map(measurement =>
			new Sprite(
				images.get(ImageName.Faces),
				measurement.x,
				measurement.y,
				measurement.width,
				measurement.height
			)
		);
	}

	/**
	 * Get the sprite index for this character's normal/default face.
	 * @returns {number} Index in the faceSprites array
	 */
	getNormalFaceIndex() {
		switch(this.character) {
			case 'Ale': return FaceSprite.AleNormal;
			case 'Cody': return FaceSprite.CodyNormal;
			case 'Nik': return FaceSprite.NikNormal;
			case 'Sef': return FaceSprite.SefNormal;
			default: return FaceSprite.AleNormal;
		}
	}

	/**
	 * Get the sprite index for this character's happy face (shown after scoring).
	 * @returns {number} Index in the faceSprites array
	 */
	getHappyFaceIndex() {
		switch(this.character) {
			case 'Ale': return FaceSprite.AleHappy;
			case 'Cody': return FaceSprite.CodyHappy;
			case 'Nik': return FaceSprite.NikHappy;
			case 'Sef': return FaceSprite.SefHappy;
			default: return FaceSprite.AleHappy;
		}
	}

	/**
	 * Get the sprite index for this character's wincing face (shown after getting scored on).
	 * @returns {number} Index in the faceSprites array
	 */
	getWincingFaceIndex() {
		switch(this.character) {
			case 'Ale': return FaceSprite.AleWincing;
			case 'Cody': return FaceSprite.CodyWincing;
			case 'Nik': return FaceSprite.NikWincing;
			case 'Sef': return FaceSprite.SefWincing;
			default: return FaceSprite.AleWincing;
		}
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
		this.updateFaceExpression(dt);
	}

	updateFaceExpression(dt) {
		if (this.currentFaceSprite !== this.normalFaceIndex) {
			this.faceExpressionTimer -= dt;
			
			if (this.faceExpressionTimer <= 0) {
				this.currentFaceSprite = this.normalFaceIndex;
				this.faceExpressionTimer = 0;
			}
		}
	}

	showHappyFace(duration = 2.0) {
		this.currentFaceSprite = this.happyFaceIndex;
		this.faceExpressionTimer = duration;
	}

	showWincingFace(duration = 2.0) {
		this.currentFaceSprite = this.wincingFaceIndex;
		this.faceExpressionTimer = duration;
	}

	handleMovement() {
		const baseSpeed = 0.04; // Increased for more responsive movement
		const speedMultiplier = this.hasSpeedBoost ? 1.8 : 1.0; // 80% faster with speed boost
		const onGround = this.isOnGround();
		
		// Reduce air control so only 30% of ground control when in air
		const airControlMultiplier = onGround ? 1.0 : 0.3;
		const speed = baseSpeed * speedMultiplier * airControlMultiplier;
		const maxSpeed = 7 * speedMultiplier; 
		
		const bootVelocity = this.boot.velocity;
		
		// Left movement
		if (input.isKeyHeld(this.controls.left)) {
			if (bootVelocity.x > -maxSpeed) {
				Body.applyForce(this.boot, this.boot.position, { x: -speed, y: 0 });
			}
		}
		
		// Right movement
		if (input.isKeyHeld(this.controls.right)) {
			if (bootVelocity.x < maxSpeed) {
				Body.applyForce(this.boot, this.boot.position, { x: speed, y: 0 });
			}
		}
		
		// Jump
		if (input.isKeyPressed(this.controls.jump) && onGround) {
			this.jump();
		}
		
		// Kick
		if (input.isKeyPressed(this.controls.kick) && !this.isKicking) {
			this.kick();
		}
	}

	jump() {
		// Apply jump force to both head and boot
		Body.applyForce(this.head, this.head.position, { x: 0, y: -0.35 });
		Body.applyForce(this.boot, this.boot.position, { x: 0, y: -0.35 });
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
			let baseKickPower = 0.15;
			const velocityBonus = Math.abs(this.boot.velocity.x) * 0.02; 
			
			// Apply super kick multiplier if active
			if (this.hasSuperKick) {
				baseKickPower *= 3.0; 
				this.hasSuperKick = false; // Consumed after one use
				console.log(`Player ${this.playerNumber} used SUPER KICK!`);
			}
			
			const totalPower = baseKickPower + velocityBonus;
			
			matter.Body.applyForce(this.ball.body, this.ball.body.position, {
				x: kickDirection * totalPower,
				y: -0.08, 
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
		
		// Stabilize on ground
		if (this.isOnGround()) {
			// Snap to ground level and kill downward velocity
			const groundY = CANVAS_HEIGHT - Ground.GRASS.height - Player.BOOT_HEIGHT / 2;
			Body.setPosition(this.boot, {
				x: this.boot.position.x,
				y: groundY
			});
			
			Body.setVelocity(this.boot, {
				x: this.boot.velocity.x,
				y: 0
			});
			Body.setVelocity(this.head, {
				x: this.head.velocity.x,
				y: 0
			});
		}
	}

	isOnGround() {
		const groundY = CANVAS_HEIGHT - Ground.GRASS.height - Player.BOOT_HEIGHT / 2;
		return this.boot.position.y >= groundY - 2;
	}

	addScore() {
		this.score++;
	}

	render() {
		const renderYOffset = -10; // Shift both head and shoe up by 15 pixels
		
		// Render boot first (behind head)
		context.save();
		context.translate(this.boot.position.x, this.boot.position.y + renderYOffset);
		
		const kickOffset = this.isKicking ? 8 : 0;
		const shoeScale = 2.0;
		const shoeSize = 34;
		
		if (!this.facingRight) {
			context.scale(-shoeScale, shoeScale);
			context.translate(-kickOffset / shoeScale, 0);
		} else {
			context.scale(shoeScale, shoeScale);
			context.translate(kickOffset / shoeScale, 0);
		}
		
		const shoeOffset = -shoeSize / 2;
		this.shoeSprite.render(shoeOffset, shoeOffset);
		
		context.restore();

		// Render head second (in front of shoe)
		context.save();
		context.translate(this.head.position.x, this.head.position.y + renderYOffset);
		context.rotate(this.head.angle);

		const headScale = this.hasBigHead ? 2.0 : 1.0;
		const scaledRadius = Player.HEAD_RADIUS * headScale;
		
		const spriteSize = Player.FACE_SPRITE_MEASUREMENTS[0].width;
		const targetSize = scaledRadius * 4.2;
		const scale = targetSize / spriteSize;
		
		if (!this.facingRight) {
			context.scale(-scale, scale);
		} else {
			context.scale(scale, scale);
		}
		
		const spriteOffset = -spriteSize / 2;
		this.faceSprites[this.currentFaceSprite].render(spriteOffset, spriteOffset);

		context.restore();
	}
}