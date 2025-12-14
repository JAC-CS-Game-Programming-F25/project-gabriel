import Stadium from "./Stadium.js";
import Ground from "../entities/Ground.js";
import Player from "../entities/Player.js";
import Ball from "../entities/Ball.js";
import Goal from "../entities/Goal.js";
import Wall from "../entities/Wall.js";
import PowerUpFactory from "./PowerUpFactory.js";
import { context, CANVAS_WIDTH, CANVAS_HEIGHT, matter, engine } from "../globals.js";
import BodyType from "../enums/BodyType.js";

const { Events } = matter;

export default class Match {
	/**
	 * Represents a single Head Soccer match between two players.
	 * Includes the field, players, ball, goals, timer, and scoring.
	 */
	constructor(player1Character = "CODY", player2Character = "ALE") {
		this.stadium = new Stadium();
		this.ground = new Ground();
		
		// Create invisible walls to keep ball/players on screen
		const wallThickness = 200;
		
		// Left wall
		this.leftWall = new Wall(
			-wallThickness,
			0,
			wallThickness,
			CANVAS_HEIGHT
		);
		
		// Right wall
		this.rightWall = new Wall(
			CANVAS_WIDTH,
			0,
			wallThickness,
			CANVAS_HEIGHT
		);
		
		// Top wall (ceiling)
		this.topWall = new Wall(
			0,
			-wallThickness,
			CANVAS_WIDTH,
			wallThickness
		);
		
		// Create goals at both edges of the screen
		this.goal1 = new Goal(0, CANVAS_HEIGHT - Ground.GRASS.height - Goal.HEIGHT, 1);
		this.goal2 = new Goal(CANVAS_WIDTH - Goal.WIDTH, CANVAS_HEIGHT - Ground.GRASS.height - Goal.HEIGHT, 2);
		
		// Create 2 players on opposite sides
		this.player1 = new Player(300, CANVAS_HEIGHT - Ground.GRASS.height - 100, 1, player1Character);
		this.player2 = new Player(CANVAS_WIDTH - 300, CANVAS_HEIGHT - Ground.GRASS.height - 100, 2, player2Character);
		
		// Create ball at center
		this.ball = new Ball(CANVAS_WIDTH / 2, CANVAS_HEIGHT - Ground.GRASS.height - 200);
		
		// Give players reference to ball for kicking
		this.player1.ball = this.ball;
		this.player2.ball = this.ball;
		
		// Match timer (90 seconds)
		this.timeRemaining = 90;
		this.matchTimer = 0;
		
		// Countdown before match starts
		this.countdownTime = 3; // 3 seconds countdown
		this.countdownTimer = 0;
		this.matchStarted = false;
		
		// Goal celebration animation
		this.showingGoal = false;
		this.goalTimer = 0;
		this.goalDuration = 2.0; // Show goal for 2 seconds
		this.lastScorer = 0; // Which player scored (1 or 2)
		
		// PowerUp spawning system
		this.powerups = []; // Array of active powerups
		this.powerupSpawnTimer = 0;
		this.powerupSpawnInterval = 15 + Math.random() * 5; // 15-20 seconds
		
		// Setup collision detection
		this.setupCollisions();
	}

	setupCollisions() {
		// Listen for collision events on the engine
		Events.on(engine, 'collisionStart', (event) => {
			event.pairs.forEach((pair) => {
				const { bodyA, bodyB } = pair;
				
				// Check if ball entered a goal
				if (this.isBallGoalCollision(bodyA, bodyB)) {
					this.handleGoal(bodyA, bodyB);
				}
				
				// Check if player kicked/headed the ball
				if (this.isPlayerBallCollision(bodyA, bodyB)) {
					this.handleKick(bodyA, bodyB);
				}
				
				// Check if player collected powerup
				if (this.isPlayerPowerUpCollision(bodyA, bodyB)) {
					this.handlePowerUpCollection(bodyA, bodyB);
				}
			});
		});
	}

	isBallGoalCollision(bodyA, bodyB) {
		return (bodyA.label === BodyType.Ball && bodyB.label === BodyType.Goal) || 
		       (bodyB.label === BodyType.Ball && bodyA.label === BodyType.Goal);
	}

	isPlayerBallCollision(bodyA, bodyB) {
		return (bodyA.label === BodyType.Player && bodyB.label === BodyType.Ball) ||
		       (bodyB.label === BodyType.Player && bodyA.label === BodyType.Ball);
	}

	handleGoal(bodyA, bodyB) {
		// figure out which goal was scored on
		const goalBody = bodyA.label === BodyType.Goal ? bodyA : bodyB;
		const ballBody = bodyA.label === BodyType.Ball ? bodyA : bodyB;
		const goalEntity = goalBody.entity;
		
		// Check if ball is below the crossbar level
		const goalTopY = goalBody.position.y - Goal.ACTUAL_NET_HEIGHT / 2;
		const ballY = ballBody.position.y;
		
		if (ballY < goalTopY + 15) {
			// Ball is at/above crossbar so crossbar will handle physics, no goal
			console.log("Ball at crossbar level! no goal!");
			return;
		}
		
		// Ball is below crossbar so GOAL!
		if (goalEntity.playerNumber === 1) {
			this.player2.addScore();
			this.lastScorer = 2;
			this.player2.showHappyFace(2.0);
			this.player1.showWincingFace(2.0);
			console.log("Player 2 scored!");
		} else {
			this.player1.addScore();
			this.lastScorer = 1;
			this.player1.showHappyFace(2.0);
			this.player2.showWincingFace(2.0);
			console.log("Player 1 scored!");
		}
		
		// Trigger goal celebration animation
		this.showingGoal = true;
		this.goalTimer = 0;
		
		// Reset ball to center
		this.ball.reset(CANVAS_WIDTH / 2, CANVAS_HEIGHT - Ground.GRASS.height - 200);
		
		// TODO: Play goal sound
	}

	handleKick(bodyA, bodyB) {
		// Determine which is the player body and which is the ball
		const playerBody = bodyA.label === BodyType.Player ? bodyA : bodyB;
		const ballBody = bodyA.label === BodyType.Ball ? bodyA : bodyB;
		
		const player = playerBody.entity;
		
		if (!player) return;
		
		// Check if it's the head that hit the ball (boot kicks are handled in Player.js)
		const isHeadHit = playerBody === player.head;
		
		if (isHeadHit) {
			// Head hit lighter touch natural physics
			// Ball gets extra bounce from head collision
			const headDirection = player.facingRight ? 1 : -1;
			matter.Body.applyForce(ballBody, ballBody.position, {
				x: headDirection * 0.1,
				y: -0.06,
			});
			console.log(`Player ${player.playerNumber} headed the ball!`);
		}
		// Boot collisions are just natural physics bumps 
	}

	isPlayerPowerUpCollision(bodyA, bodyB) {
		return (bodyA.label === BodyType.Player && bodyB.label === BodyType.PowerUp) ||
		       (bodyB.label === BodyType.Player && bodyA.label === BodyType.PowerUp);
	}

	handlePowerUpCollection(bodyA, bodyB) {
		const playerBody = bodyA.label === BodyType.Player ? bodyA : bodyB;
		const powerupBody = bodyA.label === BodyType.PowerUp ? bodyA : bodyB;
		
		const player = playerBody.entity;
		const powerup = powerupBody.entity;
		
		if (player && powerup && !powerup.collected) {
			powerup.collect(player);
			// Remove from active powerups array
			const index = this.powerups.indexOf(powerup);
			if (index > -1) {
				this.powerups.splice(index, 1);
			}
		}
	}

	spawnRandomPowerUp() {
		// Spawn in middle area of field, above ground
		const minX = 400;
		const maxX = CANVAS_WIDTH - 400;
		const x = minX + Math.random() * (maxX - minX);
		const y = CANVAS_HEIGHT - Ground.GRASS.height - 150;
		
		const powerup = PowerUpFactory.createRandom(x, y);
		this.powerups.push(powerup);
		
		console.log(`PowerUp spawned: ${powerup.type}`);
	}

	update(dt) {
		// Handle countdown before match starts
		if (!this.matchStarted) {
			this.countdownTimer += dt;
			
			if (this.countdownTimer >= 1) {
				this.countdownTime--;
				this.countdownTimer = 0;
				
				if (this.countdownTime <= 0) {
					this.matchStarted = true;
					console.log("MATCH START!");
				}
			}
			
			// Don't update players or timer during countdown
			return;
		}
		
		// Handle goal celebration animation
		if (this.showingGoal) {
			this.goalTimer += dt;
			
			if (this.goalTimer >= this.goalDuration) {
				this.showingGoal = false;
				this.goalTimer = 0;
			}
			
			// Continue updating physics even during goal celebration
			// but maybe slow it down or pause players?? idk
		}
		
		// Normal match update
		this.player1.update(dt);
		this.player2.update(dt);
		this.ball.update(dt);
		
		// Update all powerups
		this.powerups.forEach(powerup => powerup.update(dt));
		
		// Remove collected powerups
		this.powerups = this.powerups.filter(p => !p.shouldCleanUp);
		
		// Spawn powerups periodically
		this.powerupSpawnTimer += dt;
		if (this.powerupSpawnTimer >= this.powerupSpawnInterval) {
			this.spawnRandomPowerUp();
			this.powerupSpawnTimer = 0;
			this.powerupSpawnInterval = 15 + Math.random() * 5; // Random 15-20 seconds
		}
		
		// Update match timer
		this.matchTimer += dt;
		if (this.matchTimer >= 1) { // Every second
			this.timeRemaining--;
			this.matchTimer = 0;
		}
	}

	render() {
		this.stadium.render();
		this.goal1.render();
		this.goal2.render();
		this.renderUI();
		this.player1.render();
		this.player2.render();
		this.ball.render();
		this.powerups.forEach(powerup => powerup.render());
		this.ground.render();
	}

	renderUI() {
		// Render countdown if match hasn't started
		if (!this.matchStarted) {
			context.save();
			context.fillStyle = 'rgba(0, 0, 0, 0.5)';
			context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			
			// Draw countdown number or GO
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			
			if (this.countdownTime > 0) {
				// Show countdown number (3, 2, 1)
				context.font = '300px Arial';
				context.fillStyle = 'white';
				context.fillText(this.countdownTime, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
				context.strokeStyle = 'black';
				context.lineWidth = 8;
				context.strokeText(this.countdownTime, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
			} else {
				// Show GO!
				context.font = '200px Arial';
				context.fillStyle = 'limegreen';
				context.fillText('GO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
				context.strokeStyle = 'darkgreen';
				context.lineWidth = 8;
				context.strokeText('GO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
			}
			
			context.restore();
			return; // Don't render normal ui during countdown
		}
		
		// Render scores
		context.save();
		context.fillStyle = 'white';
		context.font = '60px Arial';
		context.textAlign = 'left';
		context.fillText(`P1: ${this.player1.score}`, 50, 80);
		
		context.textAlign = 'right';
		context.fillText(`P2: ${this.player2.score}`, CANVAS_WIDTH - 50, 80);
		
		// Render timer
		context.textAlign = 'center';
		const minutes = Math.floor(this.timeRemaining / 60);
		const seconds = this.timeRemaining % 60;
		const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		context.fillText(timeString, CANVAS_WIDTH / 2, 80);
		
		context.restore();
		
		// Show active powerup effects for both players
		context.save();
		context.font = '28px Arial';
		context.fillStyle = 'white';
		context.strokeStyle = 'black';
		context.lineWidth = 3;
		
		// Player 1 powerups (bottom left)
		context.textAlign = 'left';
		let p1PowerupY = CANVAS_HEIGHT - 80;
		
		if (this.player1.hasSpeedBoost) {
			const text = `⚡ Speed: ${this.player1.speedBoostTimer.toFixed(1)}s`;
			context.strokeText(text, 50, p1PowerupY);
			context.fillText(text, 50, p1PowerupY);
			p1PowerupY -= 35;
		}
		if (this.player1.hasBigHead) {
			const text = `🎈 Big Head: ${this.player1.bigHeadTimer.toFixed(1)}s`;
			context.strokeText(text, 50, p1PowerupY);
			context.fillText(text, 50, p1PowerupY);
			p1PowerupY -= 35;
		}
		if (this.player1.hasSuperKick) {
			const text = `🔥 Super Kick: ${this.player1.superKickTimer.toFixed(1)}s`;
			context.strokeText(text, 50, p1PowerupY);
			context.fillText(text, 50, p1PowerupY);
		}
		
		// Player 2 powerups (bottom right)
		context.textAlign = 'right';
		let p2PowerupY = CANVAS_HEIGHT - 80;
		
		if (this.player2.hasSpeedBoost) {
			const text = `⚡ Speed: ${this.player2.speedBoostTimer.toFixed(1)}s`;
			context.strokeText(text, CANVAS_WIDTH - 50, p2PowerupY);
			context.fillText(text, CANVAS_WIDTH - 50, p2PowerupY);
			p2PowerupY -= 35;
		}
		if (this.player2.hasBigHead) {
			const text = `🎈 Big Head: ${this.player2.bigHeadTimer.toFixed(1)}s`;
			context.strokeText(text, CANVAS_WIDTH - 50, p2PowerupY);
			context.fillText(text, CANVAS_WIDTH - 50, p2PowerupY);
			p2PowerupY -= 35;
		}
		if (this.player2.hasSuperKick) {
			const text = `🔥 Super Kick: ${this.player2.superKickTimer.toFixed(1)}s`;
			context.strokeText(text, CANVAS_WIDTH - 50, p2PowerupY);
			context.fillText(text, CANVAS_WIDTH - 50, p2PowerupY);
		}
		
		context.restore();
		
		// Render goal animation if active
		if (this.showingGoal) {
			context.save();
			
			// Pulsing effect based on timer
			const progress = this.goalTimer / this.goalDuration;
			const scale = progress < 0.2 ? 1 + progress * 2 : 1.4 - progress * 0.4;
			
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			
			// GOAL! text
			context.font = `${200 * scale}px Arial`;
			context.fillStyle = 'gold';
			context.fillText('GOAL!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
			context.strokeStyle = 'darkorange';
			context.lineWidth = 8;
			context.strokeText('GOAL!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
			
			// Player X scored text
			context.font = '80px Arial';
			context.fillStyle = 'white';
			context.fillText(`Player ${this.lastScorer} scored!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
			context.strokeStyle = 'black';
			context.lineWidth = 4;
			context.strokeText(`Player ${this.lastScorer} scored!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
			
			context.restore();
		}
	}

	isMatchOver() {
		return this.timeRemaining <= 0;
	}

	getWinner() {
		if (this.player1.score > this.player2.score) return 1;
		if (this.player2.score > this.player1.score) return 2;
		return 0; // Tie
	}
}