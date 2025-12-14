import State from '../../lib/State.js';
import Input from '../../lib/Input.js';
import GameStateName from '../enums/GameStateName.js';
import SoundName from '../enums/SoundName.js';
import {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	context,
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
		this.calculateButtonPositions();
	}

	exit() {
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
			stateMachine.change(GameStateName.Play);
		}
		if (input.isKeyPressed(Input.KEYS.Q) || input.isKeyPressed(Input.KEYS.ESCAPE)) {
			sounds.stop(SoundName.BackgroundMusic);
			stateMachine.change(GameStateName.Title);
		}
	}

	handleSelection() {
		switch (this.selectedOption) {
			case 0:
				stateMachine.change(GameStateName.Play, {
					match: this.match,
				});
				break;
			case 1:
				stateMachine.change(GameStateName.Play);
				break;
			case 2:
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
		context.fillStyle = 'rgba(0, 0, 0, 0.7)';
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		const panelWidth = 960;
		const panelHeight = 520;
		const panelX = (CANVAS_WIDTH - panelWidth) / 2;
		const panelY = (CANVAS_HEIGHT - panelHeight) / 2;

		context.fillStyle = '#1e293b';
		context.fillRect(panelX, panelY, panelWidth, panelHeight);

		context.strokeStyle = '#ef4444';
		context.lineWidth = 6;
		context.strokeRect(panelX, panelY, panelWidth, panelHeight);

		context.fillStyle = '#ef4444';
		context.font = '80px "Press Start 2P", monospace';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText('II PAUSED', CANVAS_WIDTH / 2, panelY + 70);

		context.fillStyle = '#94a3b8';
		context.font = '24px Roboto, sans-serif';
		context.fillText('Game is paused', CANVAS_WIDTH / 2, panelY + 130);

		// Draw buttons with hover effect
		for (const button of this.buttons) {
			const isHovered = this.isPointInButton(mousePos.x, mousePos.y, button);

			if (isHovered) {
				context.fillStyle = '#ef4444';
				context.fillRect(button.x, button.y, button.width, button.height);
			} else {
				context.strokeStyle = '#ef4444';
				context.lineWidth = 3;
				context.strokeRect(button.x, button.y, button.width, button.height);
			}

			context.fillStyle = isHovered ? 'white' : '#ef4444';
			context.font = '28px "Press Start 2P", monospace';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			
			let icon = '';
			if (button.index === 0) icon = '▶ ';
			else if (button.index === 1) icon = '🔄 ';
			else if (button.index === 2) icon = '🏠 ';
			
			context.fillText(icon + this.options[button.index], CANVAS_WIDTH / 2, button.y + button.height / 2);
		}

		// Score section - much smaller and at the very bottom
		const scoreY = panelY + panelHeight - 90;
		context.fillStyle = '#94a3b8';
		context.font = '14px Roboto, sans-serif';
		context.fillText('PLAYER 1', CANVAS_WIDTH / 2 - 150, scoreY);
		context.fillText('VS', CANVAS_WIDTH / 2, scoreY);
		context.fillText('PLAYER 2', CANVAS_WIDTH / 2 + 150, scoreY);

		context.font = 'bold 32px "Press Start 2P", monospace';
		context.fillStyle = '#4ade80';
		context.fillText(this.match.player1.score, CANVAS_WIDTH / 2 - 150, scoreY + 32);
		context.fillStyle = '#ef4444';
		context.fillText('vs', CANVAS_WIDTH / 2, scoreY + 32);
		context.fillStyle = '#3b82f6';
		context.fillText(this.match.player2.score, CANVAS_WIDTH / 2 + 150, scoreY + 32);

		const timeRemaining = Math.max(0, Math.floor(this.match.timeRemaining));
		const minutes = Math.floor(timeRemaining / 60);
		const seconds = timeRemaining % 60;
		const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		
		context.fillStyle = '#fbbf24';
		context.font = '18px "Press Start 2P", monospace';
		context.fillText(`Time: ${timeString}`, CANVAS_WIDTH / 2, scoreY + 65);

		context.fillStyle = '#64748b';
		context.font = '14px Roboto, sans-serif';
		context.fillText('Hover to select | Click to confirm | P: Resume | R: Restart | Q/Esc: Quit', 
			CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

		context.restore();
	}
}