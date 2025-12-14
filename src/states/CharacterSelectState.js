import State from '../../lib/State.js';
import GameStateName from '../enums/GameStateName.js';
import FaceSprite from '../enums/FaceSprite.js';
import ImageName from '../enums/ImageName.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, context, images, input, stateMachine } from '../globals.js';

export default class CharacterSelectState extends State {
	constructor() {
		super();
		
		// Character data - names match FaceSprite normal states
		this.characters = [
			{ name: 'Ale', sprite: FaceSprite.AleNormal, displayName: 'ALE' },
			{ name: 'Cody', sprite: FaceSprite.CodyNormal, displayName: 'CODY' },
			{ name: 'Nik', sprite: FaceSprite.NikNormal, displayName: 'NIK' },
			{ name: 'Sef', sprite: FaceSprite.SefNormal, displayName: 'SEF' },
		];
		
		// Selection state
		this.player1Selected = null;
		this.player2Selected = null;
		
		// UI Layout
		this.panelWidth = 1100;
		this.panelHeight = 620;
		this.panelX = (CANVAS_WIDTH - this.panelWidth) / 2;
		this.panelY = (CANVAS_HEIGHT - this.panelHeight) / 2;
		
		// Character button layout (2x2 grid)
		this.buttonSize = 140;
		this.buttonSpacing = 25;
		this.gridStartX = 80;
		this.gridStartY = 140;
		
		// Colors
		this.bgColor = '#1a1d2e';
		this.panelColor = '#1e293b';
		this.borderColor = '#3b82f6';
		this.player1Color = '#ef4444';
		this.player2Color = '#3b82f6';
		this.textColor = '#ffffff';
		this.buttonBgColor = '#2d3748';
		this.buttonHoverColor = '#374151';
		this.selectedColor = '#4ade80';
		
		// Button areas for click detection
		this.player1Buttons = [];
		this.player2Buttons = [];
		this.backButton = null;
		this.startButton = null;
	}

	enter() {
		// Reset selection state
		this.player1Selected = null;
		this.player2Selected = null;
		
		// Calculate button positions
		this.calculateButtonPositions();
	}

	exit() {
		// Nothing to clean up
	}

	calculateButtonPositions() {
		this.player1Buttons = [];
		this.player2Buttons = [];
		
		// Player 1 buttons (left side)
		const p1BaseX = this.panelX + this.gridStartX;
		const p1BaseY = this.panelY + this.gridStartY;
		
		for (let i = 0; i < 4; i++) {
			const col = i % 2;
			const row = Math.floor(i / 2);
			this.player1Buttons.push({
				x: p1BaseX + col * (this.buttonSize + this.buttonSpacing),
				y: p1BaseY + row * (this.buttonSize + this.buttonSpacing),
				width: this.buttonSize,
				height: this.buttonSize,
				characterIndex: i
			});
		}
		
		// Player 2 buttons (right side)
		const p2BaseX = this.panelX + this.panelWidth - this.gridStartX - 2 * (this.buttonSize + this.buttonSpacing) + this.buttonSpacing;
		const p2BaseY = this.panelY + this.gridStartY;
		
		for (let i = 0; i < 4; i++) {
			const col = i % 2;
			const row = Math.floor(i / 2);
			this.player2Buttons.push({
				x: p2BaseX + col * (this.buttonSize + this.buttonSpacing),
				y: p2BaseY + row * (this.buttonSize + this.buttonSpacing),
				width: this.buttonSize,
				height: this.buttonSize,
				characterIndex: i
			});
		}
		
		// Back button (bottom left)
		this.backButton = {
			x: this.panelX + 60,
			y: this.panelY + this.panelHeight - 70,
			width: 180,
			height: 50
		};
		
		// Start Match button (bottom right)
		this.startButton = {
			x: this.panelX + this.panelWidth - 240,
			y: this.panelY + this.panelHeight - 70,
			width: 180,
			height: 50
		};
	}

	handleClick(mouseX, mouseY) {
		// Check Player 1 character buttons
		for (const button of this.player1Buttons) {
			if (this.isPointInButton(mouseX, mouseY, button)) {
				this.player1Selected = button.characterIndex;
				return;
			}
		}
		
		// Check Player 2 character buttons
		for (const button of this.player2Buttons) {
			if (this.isPointInButton(mouseX, mouseY, button)) {
				this.player2Selected = button.characterIndex;
				return;
			}
		}
		
		// Check Back button
		if (this.backButton && this.isPointInButton(mouseX, mouseY, this.backButton)) {
			// Reset selections
			this.player1Selected = null;
			this.player2Selected = null;
			return;
		}
		
		// Check Start Match button
		if (this.startButton && this.isPointInButton(mouseX, mouseY, this.startButton)) {
			if (this.player1Selected !== null && this.player2Selected !== null) {
				// Both players selected so we can start the match!
				stateMachine.change(GameStateName.Play, {
					player1Character: this.characters[this.player1Selected].name,
					player2Character: this.characters[this.player2Selected].name,
				});
			}
			return;
		}
	}

	isPointInButton(x, y, button) {
		return x >= button.x && x <= button.x + button.width &&
		       y >= button.y && y <= button.y + button.height;
	}

	update(dt) {
		// Check for mouse click
		if (input.isMouseButtonPressed(0)) { // 0 = left mouse button
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
		
		// Draw player labels
		this.drawPlayerLabels();
		
		// Draw character selection grids
		this.drawCharacterGrid(true, mousePos.x, mousePos.y);  // Player 1
		this.drawCharacterGrid(false, mousePos.x, mousePos.y); // Player 2
		
		// Draw VS text
		this.drawVSText();
		
		// Draw status text
		this.drawStatusText();
		
		// Draw buttons
		this.drawButtons(mousePos.x, mousePos.y);
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
		context.fillStyle = this.player1Color;
		context.font = 'bold 44px Arial, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		
		const title = 'SELECT YOUR CHARACTER';
		context.fillText(title, this.panelX + this.panelWidth / 2, this.panelY + 30);
	}

	drawPlayerLabels() {
		context.font = 'bold 26px Arial, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		
		// Player 1 label (left side)
		context.fillStyle = this.player1Color;
		const p1LabelX = this.panelX + this.gridStartX + this.buttonSize + this.buttonSpacing / 2;
		context.fillText('Player 1', p1LabelX, this.panelY + 95);
		
		// Player 2 label (right side)  
		context.fillStyle = this.player2Color;
		const p2LabelX = this.panelX + this.panelWidth - this.gridStartX - this.buttonSize - this.buttonSpacing / 2;
		context.fillText('Player 2', p2LabelX, this.panelY + 95);
	}

	drawCharacterGrid(isPlayer1, mouseX, mouseY) {
		const buttons = isPlayer1 ? this.player1Buttons : this.player2Buttons;
		const selectedIndex = isPlayer1 ? this.player1Selected : this.player2Selected;
		const playerColor = isPlayer1 ? this.player1Color : this.player2Color;
		
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			const isSelected = selectedIndex === i;
			const isHovered = this.isPointInButton(mouseX, mouseY, button);
			
			// Button background
			if (isSelected) {
				context.fillStyle = playerColor;
			} else if (isHovered) {
				context.fillStyle = this.buttonHoverColor;
			} else {
				context.fillStyle = this.buttonBgColor;
			}
			
			context.fillRect(button.x, button.y, button.width, button.height);
			
			// Button border
			if (isSelected) {
				context.strokeStyle = this.selectedColor;
				context.lineWidth = 4;
			} else {
				context.strokeStyle = this.borderColor;
				context.lineWidth = 2;
			}
			context.strokeRect(button.x, button.y, button.width, button.height);
			
			// Draw character face sprite
			this.drawCharacterFace(button.x, button.y, button.width, button.height, i);
			
			// Draw character name
			context.fillStyle = this.textColor;
			context.font = 'bold 16px Arial, sans-serif';
			context.textAlign = 'center';
			context.textBaseline = 'bottom';
			context.fillText(
				this.characters[i].displayName,
				button.x + button.width / 2,
				button.y + button.height - 10
			);
		}
	}

	drawCharacterFace(x, y, width, height, characterIndex) {
		const character = this.characters[characterIndex];
		const sprite = character.sprite;
		
		// Get the Graphic object and extract the actual image
		const facesGraphic = images.get(ImageName.Faces);
		
		// Only draw if the image is loaded
		if (!facesGraphic || !facesGraphic.image || !facesGraphic.image.complete) {
			// Image not loaded yet, draw a placeholder
			context.fillStyle = '#475569';
			context.fillRect(x + 15, y + 15, width - 30, height - 45);
			return;
		}
		
		// Face sprites are 200x200 in a 4x3 grid
		const spriteWidth = 200;
		const spriteHeight = 200;
		const spritesPerRow = 4;
		
		const col = sprite % spritesPerRow;
		const row = Math.floor(sprite / spritesPerRow);
		
		const sourceX = col * spriteWidth;
		const sourceY = row * spriteHeight;
		
		// Draw face centered in button with some pading
		const padding = 15;
		const drawSize = width - padding * 2;
		const drawX = x + padding;
		const drawY = y + padding;
		
		// Use the actual image from the Graphic object
		context.drawImage(
			facesGraphic.image,
			sourceX, sourceY, spriteWidth, spriteHeight,
			drawX, drawY, drawSize, drawSize - 30 // Leave room for name
		);
	}

	drawVSText() {
		context.fillStyle = this.player1Color;
		context.font = 'bold 52px Arial, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		
		const vsX = this.panelX + this.panelWidth / 2;
		const vsY = this.panelY + this.panelHeight / 2 - 10;
		
		context.fillText('VS', vsX, vsY);
	}

	drawStatusText() {
		context.font = '18px Arial, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		
		const statusY = this.panelY + this.panelHeight - 160;
		
		// Player 1 status
		const p1StatusX = this.panelX + this.gridStartX + this.buttonSize + this.buttonSpacing / 2;
		if (this.player1Selected !== null) {
			context.fillStyle = this.selectedColor;
			context.fillText('✓ READY', p1StatusX, statusY);
			context.fillStyle = '#94a3b8';
			context.font = '14px Arial, sans-serif';
			context.fillText('Click to select character', p1StatusX, statusY + 28);
		} else {
			context.fillStyle = '#94a3b8';
			context.fillText('SELECT CHARACTER', p1StatusX, statusY);
			context.font = '14px Arial, sans-serif';
			context.fillText('Click to select character', p1StatusX, statusY + 28);
		}
		
		// Player 2 status
		const p2StatusX = this.panelX + this.panelWidth - this.gridStartX - this.buttonSize - this.buttonSpacing / 2;
		context.font = '18px Arial, sans-serif';
		if (this.player2Selected !== null) {
			context.fillStyle = this.selectedColor;
			context.fillText('✓ READY', p2StatusX, statusY);
			context.fillStyle = '#94a3b8';
			context.font = '14px Arial, sans-serif';
			context.fillText('Click to select character', p2StatusX, statusY + 28);
		} else {
			context.fillStyle = '#94a3b8';
			context.fillText('SELECT CHARACTER', p2StatusX, statusY);
			context.font = '14px Arial, sans-serif';
			context.fillText('Click to select character', p2StatusX, statusY + 28);
		}
	}

	drawButtons(mouseX, mouseY) {
		// Back button
		const backHovered = this.isPointInButton(mouseX, mouseY, this.backButton);
		context.fillStyle = backHovered ? this.buttonHoverColor : this.buttonBgColor;
		context.fillRect(this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
		context.strokeStyle = this.borderColor;
		context.lineWidth = 2;
		context.strokeRect(this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
		
		context.fillStyle = this.textColor;
		context.font = 'bold 20px Arial, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(
			'← BACK',
			this.backButton.x + this.backButton.width / 2,
			this.backButton.y + this.backButton.height / 2
		);
		
		// Start Match button
		const canStart = this.player1Selected !== null && this.player2Selected !== null;
		const startHovered = this.isPointInButton(mouseX, mouseY, this.startButton);
		
		if (!canStart) {
			context.fillStyle = '#1e293b';
		} else if (startHovered) {
			context.fillStyle = this.selectedColor;
		} else {
			context.fillStyle = this.player2Color;
		}
		
		context.fillRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
		context.strokeStyle = canStart ? this.selectedColor : '#475569';
		context.lineWidth = 2;
		context.strokeRect(this.startButton.x, this.startButton.y, this.startButton.width, this.startButton.height);
		
		context.fillStyle = canStart ? '#ffffff' : '#475569';
		context.font = 'bold 20px Arial, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(
			'START MATCH',
			this.startButton.x + this.startButton.width / 2,
			this.startButton.y + this.startButton.height / 2
		);
	}
}