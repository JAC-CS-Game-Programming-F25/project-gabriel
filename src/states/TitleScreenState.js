import State from '../../lib/State.js';
import GameStateName from '../enums/GameStateName.js';
import ImageName from '../enums/ImageName.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, context, images, input, stateMachine } from '../globals.js';

export default class TitleScreenState extends State {
	constructor() {
		super();
		
		// UI Layout
		this.panelWidth = 720;
		this.panelHeight = 700;
		this.panelX = (CANVAS_WIDTH - this.panelWidth) / 2;
		this.panelY = (CANVAS_HEIGHT - this.panelHeight) / 2;
		
		// Colors (matching character select screen)
		this.bgColor = '#1a1d2e';
		this.panelColor = '#1e293b';
		this.borderColor = '#3b82f6';
		this.titleColor = '#ef4444';
		this.textColor = '#ffffff';
		this.subtitleColor = '#94a3b8';
		this.buttonBgColor = '#2d3748';
		this.buttonHoverColor = '#374151';
		this.startButtonColor = '#ef4444';
		this.startButtonHoverColor = '#dc2626';
		
		// Buttons
		this.startButton = null;
		this.settingsButton = null;
		
		// Stats display at bottom
		this.showStats = true;
		this.stats = {
			matches: 0,
			wins: 0,
			losses: 0,
			goals: 0
		};
        //Soccer ball animation
        this.ballFrameCount = 8; 
        this.currentBallFrame = 0;
        this.ballAnimationTimer = 0;
        this.ballFrameDuration = 0.1;
	}

	enter() {
		// Calculate button positions
		this.calculateButtonPositions();
		
		// Load stats from localStorage if available
		this.loadStats();

        //Reset ball animation
        this.currentBallFrame = 0;
        this.ballAnimationTimer = 0;
	}

	exit() {
		// Nothing to clean up
	}

	calculateButtonPositions() {
		const buttonWidth = 240;
		const buttonHeight = 50;
		const buttonSpacing = 25;
		const startY = this.panelY + 370;
		
		// Start Game button
		this.startButton = {
			x: this.panelX + (this.panelWidth - buttonWidth) / 2,
			y: startY,
			width: buttonWidth,
			height: buttonHeight
		};
		
		// Settings button
		this.settingsButton = {
			x: this.panelX + (this.panelWidth - buttonWidth) / 2,
			y: startY + buttonHeight + buttonSpacing,
			width: buttonWidth,
			height: buttonHeight
		};
	}

	loadStats() {
		// Try to load stats from localStorage
		try {
			const savedStats = localStorage.getItem('headSoccerStats');
			if (savedStats) {
				this.stats = JSON.parse(savedStats);
			}
		} catch (e) {
			// If localStorage not available, use default stats
			console.log('Could not load stats');
		}
	}

	handleClick(mouseX, mouseY) {
		// Check Start Game button
		if (this.isPointInButton(mouseX, mouseY, this.startButton)) {
			stateMachine.change(GameStateName.CharacterSelect);
			return;
		}
		
		// Check Settings button
		if (this.isPointInButton(mouseX, mouseY, this.settingsButton)) {
			// TODO: Implement settings screen at some point
			console.log('Settings clicked');
			return;
		}
	}

	isPointInButton(x, y, button) {
		return x >= button.x && x <= button.x + button.width &&
		       y >= button.y && y <= button.y + button.height;
	}

	update(dt) {
		// Update soccer ball animation
		this.ballAnimationTimer += dt;
		if (this.ballAnimationTimer >= this.ballFrameDuration) {
			this.ballAnimationTimer = 0;
			this.currentBallFrame = (this.currentBallFrame + 1) % this.ballFrameCount;
		}
		
		// Check for mouse click
		if (input.isMouseButtonPressed(0)) {
			const mousePos = input.getMousePosition();
			this.handleClick(mousePos.x, mousePos.y);
		}
	}

	render() {
		const mousePos = input.getMousePosition();
		
		// Draw background
		context.fillStyle = this.bgColor;
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		
		// Draw main panel
		this.drawPanel();
		
		// Draw title
		this.drawTitle();
		
		// Draw subtitle
		this.drawSubtitle();
		
		// Draw soccer ball icon
		this.drawSoccerBall();
		
		// Draw buttons
		this.drawButtons(mousePos.x, mousePos.y);
		
		// Draw stats panel
		if (this.showStats) {
			this.drawStatsPanel();
		}
	}

	drawPanel() {
		// Main panel background
		context.fillStyle = this.panelColor;
		context.fillRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
		
		// Panel border
		context.strokeStyle = this.borderColor;
		context.lineWidth = 3;
		context.strokeRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
	}

	drawTitle() {
		context.fillStyle = this.titleColor;
		context.font = 'bold 60px "Press Start 2P", monospace';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		
		const title = 'HEAD SOCCER';
		context.fillText(title, this.panelX + this.panelWidth / 2, this.panelY + 60);
	}

	drawSubtitle() {
		context.fillStyle = this.subtitleColor;
		context.font = '18px Roboto, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		
		// Soccer ball emoji and som text
		const subtitle = 'Created by Gabriel Jutras';
		context.fillText(subtitle, this.panelX + this.panelWidth / 2, this.panelY + 160);
	}

	drawSoccerBall() {
		// Get the soccer ball image
		const soccerBallGraphic = images.get(ImageName.SoccerBall);
		
		if (soccerBallGraphic && soccerBallGraphic.image && soccerBallGraphic.image.complete) {
			// Soccer ball sprite sheet is 1024x128 with 8 frames 
			const frameWidth = 128;
			const frameHeight = 128;
			
			// Calculate source position for current frame
			const sourceX = this.currentBallFrame * frameWidth;
			const sourceY = 0;
			
			// Draw current frame
			const ballSize = 80;
			const ballX = this.panelX + (this.panelWidth - ballSize) / 2;
			const ballY = this.panelY + 230;
			
			context.drawImage(
				soccerBallGraphic.image,
				sourceX, sourceY, frameWidth, frameHeight,
				ballX, ballY, ballSize, ballSize
			);
		}
	}

	drawButtons(mouseX, mouseY) {
		// Start Game button
		const startHovered = this.isPointInButton(mouseX, mouseY, this.startButton);
		context.fillStyle = startHovered ? this.startButtonHoverColor : this.startButtonColor;
		context.fillRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
		context.strokeStyle = this.borderColor;
		context.lineWidth = 2;
		context.strokeRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
		
		context.fillStyle = this.textColor;
		context.font = 'bold 22px Roboto, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(
			'▶ START GAME',
			this.startButton.x + this.startButton.width / 2,
			this.startButton.y + this.startButton.height / 2
		);
		
		// Settings button
		const settingsHovered = this.isPointInButton(mouseX, mouseY, this.settingsButton);
		context.fillStyle = settingsHovered ? this.buttonHoverColor : this.buttonBgColor;
		context.fillRect(this.settingsButton.x, this.settingsButton.y, this.settingsButton.width, this.settingsButton.height);
		context.strokeStyle = this.borderColor;
		context.lineWidth = 2;
		context.strokeRect(this.settingsButton.x, this.settingsButton.y, this.settingsButton.width, this.settingsButton.height);
		
		context.fillStyle = this.textColor;
		context.font = 'bold 20px Roboto, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(
			'⚙ SETTINGS',
			this.settingsButton.x + this.settingsButton.width / 2,
			this.settingsButton.y + this.settingsButton.height / 2
		);
	}

	drawStatsPanel() {
		// Stats panel (smaller panel at bottom with more spacing)
		const statsWidth = 620;
		const statsHeight = 120;
		const statsX = this.panelX + (this.panelWidth - statsWidth) / 2;
		const statsY = this.panelY + this.panelHeight - 30 - statsHeight;
		
		// Stats panel background
		context.fillStyle = '#1e3a5f';
		context.fillRect(statsX, statsY, statsWidth, statsHeight);
		
		// Stats panel border
		context.strokeStyle = this.borderColor;
		context.lineWidth = 2;
		context.strokeRect(statsX, statsY, statsWidth, statsHeight);
		
		// Stats title
		context.fillStyle = this.titleColor;
		context.font = 'bold 16px Roboto, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		context.fillText('📋 CAREER STATS', statsX + statsWidth / 2, statsY + 12);
		
		// Stats values
		const statY = statsY + 50;
		const statSpacing = statsWidth / 4;
		
		context.fillStyle = this.textColor;
		context.font = 'bold 32px Roboto, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		
		// Matches
		context.fillText(this.stats.matches.toString(), statsX + statSpacing * 0.5, statY);
		// Wins
		context.fillText(this.stats.wins.toString(), statsX + statSpacing * 1.5, statY);
		// Losses
		context.fillText(this.stats.losses.toString(), statsX + statSpacing * 2.5, statY);
		// Goals
		context.fillText(this.stats.goals.toString(), statsX + statSpacing * 3.5, statY);
		
		// Labels
		context.fillStyle = this.subtitleColor;
		context.font = '12px Roboto, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		
		const labelY = statY + 25;
		context.fillText('MATCHES', statsX + statSpacing * 0.5, labelY);
		context.fillText('WINS', statsX + statSpacing * 1.5, labelY);
		context.fillText('LOSSES', statsX + statSpacing * 2.5, labelY);
		context.fillText('GOALS', statsX + statSpacing * 3.5, labelY);
	}
}