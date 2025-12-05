import Stadium from "./Stadium.js";
import Ground from "../entities/Ground.js";
import Player from "../entities/Player.js";
import Ball from "../entities/Ball.js";
import Goal from "../entities/Goal.js";
import { context, CANVAS_WIDTH, CANVAS_HEIGHT, matter, engine } from "../globals.js";
import BodyType from "../enums/BodyType.js";

const { Events } = matter;

export default class Match {
	/**
	 * Represents a single Head Soccer match between two players.
	 * Includes the field, players, ball, goals, timer, and scoring.
	 */
	constructor() {
		this.stadium = new Stadium();
		this.ground = new Ground();
		
		// Create goals at both ends
		this.goal1 = new Goal(50, CANVAS_HEIGHT - Ground.GRASS.height - Goal.HEIGHT / 2, 1);
		this.goal2 = new Goal(CANVAS_WIDTH - 50, CANVAS_HEIGHT - Ground.GRASS.height - Goal.HEIGHT / 2, 2);
		
		// Create 2 players on opposite sides
		this.player1 = new Player(300, CANVAS_HEIGHT - Ground.GRASS.height - 100, 1);
		this.player2 = new Player(CANVAS_WIDTH - 300, CANVAS_HEIGHT - Ground.GRASS.height - 100, 2);
		
		// Create ball at center
		this.ball = new Ball(CANVAS_WIDTH / 2, CANVAS_HEIGHT - Ground.GRASS.height - 200);
		
		// Match timer (90 seconds)
		this.timeRemaining = 90;
		this.matchTimer = 0;
		
		// Setup collision detection
		this.setupCollisions();
	}

	setupCollisions() {
		// Listen for collision events on the engine, not world.engine
		Events.on(engine, 'collisionStart', (event) => {
			event.pairs.forEach((pair) => {
				const { bodyA, bodyB } = pair;
				
				// Check if ball entered a goal
				if (this.isBallGoalCollision(bodyA, bodyB)) {
					this.handleGoal(bodyA, bodyB);
				}
			});
		});
	}

	isBallGoalCollision(bodyA, bodyB) {
		return (bodyA.label === BodyType.Ball && bodyB.label === BodyType.Goal) || (bodyB.label === BodyType.Ball && bodyA.label === BodyType.Goal);
	}

	handleGoal(bodyA, bodyB) {
		// figure out which goal was scored on
		const goalBody = bodyA.label === BodyType.Goal ? bodyA : bodyB;
		const goalEntity = goalBody.entity;
		
		// Award point to the other player (if goal 1 is scored on, player 2 scores)
		if (goalEntity.playerNumber === 1) {
			this.player2.addScore();
			console.log("Player 2 scored!");
		} else {
			this.player1.addScore();
			console.log("Player 1 scored!");
		}
		
		// Reset ball to center
		this.ball.reset(CANVAS_WIDTH / 2, CANVAS_HEIGHT - Ground.GRASS.height - 200);
		
		// TODO: Play goal sound, show celebration animation
	}

	update(dt) {
		this.player1.update(dt);
		this.player2.update(dt);
		this.ball.update(dt);
		
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
		this.ground.render();
	}

	renderUI() {
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