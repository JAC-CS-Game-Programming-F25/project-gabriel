import State from '../../lib/State.js';
import Input from '../../lib/Input.js';
import GameStateName from '../enums/GameStateName.js';
import SoundName from '../enums/SoundName.js';
import {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	context,
	engine,
	input,
	sounds,
	stateMachine,
} from '../globals.js';

export default class PauseState extends State {
	constructor() {
		super();
		this.selectedOption = 0;
		this.options = ['RESUME', 'RESTART MATCH', 'QUIT TO MENU'];
		this.buttons = [];
	}

	enter(parameters) {
		this.match = parameters.match;
		this.stadium = parameters.stadium;
		sounds.pause(SoundName.BackgroundMusic);
		
		// Pause the physics engine completely
		// This prevents bodies from drifting while the game is paused
		engine.timing.timeScale = 0;
		
		this.calculateButtonPositions();
	}

	exit() {
		// Resume the physics engine
		// Restore normal physics simulation speed
		engine.timing.timeScale = 1;
		
		if (this.selectedOption !== 2) {
			sounds.play(SoundName.BackgroundMusic);
		}
	}

	calculateButtonPositions() {
		const panelWidth = 960;
		const panelHeight = 520;
		const panelX = (CANVAS_WIDTH - panelWidth) / 2;
		const panelY = (CANVAS_HEIGHT - panelHeight) / 2;
		
		const buttonY = panelY + 180;
		const buttonHeight = 60;
		const buttonSpacing = 15;
		const buttonWidth = panelWidth - 200;

		this.buttons = [];
		for (let i = 0; i < this.options.length; i++) {
			this.buttons.push({
				x: panelX + 100,
				y: buttonY + i * (buttonHeight + buttonSpacing),
				width: buttonWidth,
				height: buttonHeight,
				index: i
			});
		}
	}

	isPointInButton(x, y, button) {
		return x >= button.x && x <= button.x + button.width &&
		       y >= button.y && y <= button.y + button.height;
	}

	update() {
		const mousePos = input.getMousePosition();

		// Update hover state
		this.selectedOption = -1;
		for (const button of this.buttons) {
			if (this.isPointInButton(mousePos.x, mousePos.y, button)) {
				this.selectedOption = button.index;
				break;
			}
		}

		// Handle click
		if (input.isMouseButtonPressed(0)) {
			if (this.selectedOption !== -1) {
				this.handleSelection();
			}
		}

		// Quick keys
		if (input.isKeyPressed(Input.KEYS.P)) {
			stateMachine.change(GameStateName.Play, {
				match: this.match,
			});
		}
		if (input.isKeyPressed(Input.KEYS.R)) {
			// Properly cleanup old match before restarting
			if (this.match) {
				this.match.cleanup();
			}
			stateMachine.change(GameStateName.Play);
		}
		if (input.isKeyPressed(Input.KEYS.Q) || input.isKeyPressed(Input.KEYS.ESCAPE)) {
			// Cleanup match when quitting
			if (this.match) {
				this.match.cleanup();
			}
			sounds.stop(SoundName.BackgroundMusic);
			stateMachine.change(GameStateName.Title);
		}
	}

	handleSelection() {
		switch (this.selectedOption) {
			case 0:
				// Resume so just return to PlayState with existing match
				stateMachine.change(GameStateName.Play, {
					match: this.match,
				});
				break;
			case 1:
				// Cleanup old match before restarting
				if (this.match) {
					this.match.cleanup();
				}
				stateMachine.change(GameStateName.Play);
				break;
			case 2:
				// Cleanup match when quitting to menu
				if (this.match) {
					this.match.cleanup();
				}
				sounds.stop(SoundName.BackgroundMusic);
				stateMachine.change(GameStateName.Title);
				break;
		}
	}

	render() {
		this.stadium.render();
		this.match.render();

		const mousePos = input.getMousePosition();

		context.save();

		// Semi transparent overlay
		context.fillStyle = 'rgba(0, 0, 0, 0.7)';
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		// Calculate panel dimensions
		const panelWidth = 960;
		const panelHeight = 520;
		const panelX = (CANVAS_WIDTH - panelWidth) / 2;
		const panelY = (CANVAS_HEIGHT - panelHeight) / 2;

		// Main panel with border
		context.fillStyle = '#1a1a2e';
		context.strokeStyle = '#e94560';
		context.lineWidth = 6;
		context.fillRect(panelX, panelY, panelWidth, panelHeight);
		context.strokeRect(panelX, panelY, panelWidth, panelHeight);

		// Title
		context.font = '80px "Press Start 2P", monospace';
		context.fillStyle = '#e94560';
		context.textAlign = 'center';
		context.fillText('PAUSED', CANVAS_WIDTH / 2, panelY + 100);

		// Subtitle
		context.font = '28px Roboto, sans-serif';
		context.fillStyle = '#ffffff';
		context.fillText('Game is paused', CANVAS_WIDTH / 2, panelY + 145);

		// Draw buttons
		for (let i = 0; i < this.buttons.length; i++) {
			const button = this.buttons[i];
			const isHovered = this.isPointInButton(mousePos.x, mousePos.y, button);
			
			// Button background
			context.fillStyle = isHovered ? '#e94560' : '#16213e';
			context.fillRect(button.x, button.y, button.width, button.height);
			
			// Button border
			context.strokeStyle = isHovered ? '#ffffff' : '#e94560';
			context.lineWidth = 3;
			context.strokeRect(button.x, button.y, button.width, button.height);
			
			// Button text with icons
			const icons = ['▶', '🔄', '🏠'];
			context.font = '32px Roboto, sans-serif';
			context.fillStyle = isHovered ? '#ffffff' : '#ffffff';
			context.textAlign = 'center';
			context.fillText(
				`${icons[i]} ${this.options[i]}`,
				button.x + button.width / 2,
				button.y + button.height / 2 + 10
			);
		}

		// Divider line
		context.strokeStyle = '#e94560';
		context.lineWidth = 2;
		context.beginPath();
		context.moveTo(panelX + 100, panelY + 400);
		context.lineTo(panelX + panelWidth - 100, panelY + 400);
		context.stroke();

		// Score display
		context.font = '36px Roboto, sans-serif';
		context.fillStyle = '#ffffff';
		context.textAlign = 'left';
		context.fillText('PLAYER 1', panelX + 150, panelY + 445);
		context.fillStyle = '#4ecca3';
		context.font = 'bold 50px Roboto, sans-serif';
		context.fillText(this.match.player1.score, panelX + 200, panelY + 490);
		
		context.fillStyle = '#ffffff';
		context.font = '36px Roboto, sans-serif';
		context.textAlign = 'right';
		context.fillText('PLAYER 2', panelX + panelWidth - 150, panelY + 445);
		context.fillStyle = '#4ecca3';
		context.font = 'bold 50px Roboto, sans-serif';
		context.fillText(this.match.player2.score, panelX + panelWidth - 200, panelY + 490);
		
		// VS
		context.fillStyle = '#e94560';
		context.font = 'bold 40px Roboto, sans-serif';
		context.textAlign = 'center';
		context.fillText('VS', CANVAS_WIDTH / 2, panelY + 470);
		
		// Time Remaining
		const minutes = Math.floor(this.match.timeRemaining / 60);
		const seconds = this.match.timeRemaining % 60;
		const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		context.fillStyle = '#ffffff';
		context.font = '24px Roboto, sans-serif';
		context.fillText(`Time Remaining: ${timeString}`, CANVAS_WIDTH / 2, panelY + 505);

		context.restore();
	}
}