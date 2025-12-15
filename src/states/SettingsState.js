import State from '../../lib/State.js';
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

export default class SettingsState extends State {
	constructor() {
		super();
		
		// Panel dimensions
		this.panelWidth = 960;
		this.panelHeight = 600;
		this.panelX = (CANVAS_WIDTH - this.panelWidth) / 2;
		this.panelY = (CANVAS_HEIGHT - this.panelHeight) / 2;
		
		// Settings values (loaded from localStorage)
		this.masterVolume = 0.75;
		this.musicVolume = 0.5;
		this.soundEffectsEnabled = true;
		
		// Slider interaction
		this.draggingSlider = null; // 'master' or 'music' when dragging
		
		// Buttons
		this.backButton = null;
		this.saveButton = null;
		this.soundEffectsToggle = null;
		
		// Sliders
		this.masterVolumeSlider = null;
		this.musicVolumeSlider = null;
	}

	enter() {
		this.loadSettings();
		this.calculateUIPositions();
	}

	exit() {
		// Nothing to clean up
	}

	loadSettings() {
		try {
			const savedSettings = localStorage.getItem('headSoccerSettings');
			if (savedSettings) {
				const settings = JSON.parse(savedSettings);
				this.masterVolume = settings.masterVolume ?? 0.75;
				this.musicVolume = settings.musicVolume ?? 0.5;
				this.soundEffectsEnabled = settings.soundEffectsEnabled ?? true;
			}
		} catch (e) {
			console.log('Could not load settings, using defaults');
		}
	}

	saveSettings() {
		try {
			const settings = {
				masterVolume: this.masterVolume,
				musicVolume: this.musicVolume,
				soundEffectsEnabled: this.soundEffectsEnabled
			};
			localStorage.setItem('headSoccerSettings', JSON.stringify(settings));
			
			// Apply settings immediately
			this.applySettings();
			
		} catch (e) {
			console.log('Could not save settings');
		}
	}

	applySettings() {
		// Apply master volume to all sounds
		Object.values(sounds.sounds).forEach(soundPool => {
			soundPool.pool.forEach(audio => {
				audio.volume = soundPool.volume * this.masterVolume;
			});
		});
		
		// Apply music volume specifically to background music
		const bgMusic = sounds.get(SoundName.BackgroundMusic);
		if (bgMusic) {
			bgMusic.pool.forEach(audio => {
				audio.volume = bgMusic.volume * this.musicVolume * this.masterVolume;
			});
		}
		
		// Mute/unmute sound effects
		if (!this.soundEffectsEnabled) {
			// Mute all non-music sounds
			Object.keys(sounds.sounds).forEach(soundName => {
				if (soundName !== SoundName.BackgroundMusic) {
					sounds.get(soundName).pool.forEach(audio => {
						audio.volume = 0;
					});
				}
			});
		}
	}

	calculateUIPositions() {
		// Setting rows
		const rowHeight = 80;
		const rowSpacing = 20;
		const startY = this.panelY + 140;
		
		// Slider dimensions - move to the left and adjust positioning
		const sliderWidth = 240;
		const sliderHeight = 8;
		const sliderX = this.panelX + 500;
		
		// Master Volume slider
		this.masterVolumeSlider = {
			x: sliderX,
			y: startY + 40,
			width: sliderWidth,
			height: sliderHeight,
			knobRadius: 14
		};
		
		// Music Volume slider
		this.musicVolumeSlider = {
			x: sliderX,
			y: startY + rowHeight + rowSpacing + 40,
			width: sliderWidth,
			height: sliderHeight,
			knobRadius: 14
		};
		
		// Sound Effects toggle
		this.soundEffectsToggle = {
			x: sliderX + 170,
			y: startY + (rowHeight + rowSpacing) * 2 + 20,
			width: 60,
			height: 30
		};
		
		// Buttons
		const buttonWidth = 180;
		const buttonHeight = 50;
		const buttonY = this.panelY + this.panelHeight - 80;
		const buttonSpacing = 40;
		
		this.backButton = {
			x: this.panelX + (this.panelWidth / 2) - buttonWidth - (buttonSpacing / 2),
			y: buttonY,
			width: buttonWidth,
			height: buttonHeight
		};
		
		this.saveButton = {
			x: this.panelX + (this.panelWidth / 2) + (buttonSpacing / 2),
			y: buttonY,
			width: buttonWidth,
			height: buttonHeight
		};
	}

	isPointInButton(x, y, button) {
		return x >= button.x && x <= button.x + button.width &&
		       y >= button.y && y <= button.y + button.height;
	}

	isPointInSlider(x, y, slider) {
		return x >= slider.x - slider.knobRadius && 
		       x <= slider.x + slider.width + slider.knobRadius &&
		       y >= slider.y - slider.knobRadius && 
		       y <= slider.y + slider.height + slider.knobRadius;
	}

	isPointInToggle(x, y, toggle) {
		return x >= toggle.x && x <= toggle.x + toggle.width &&
		       y >= toggle.y && y <= toggle.y + toggle.height;
	}

	handleSliderDrag(mouseX, slider) {
		const relativeX = mouseX - slider.x;
		const percentage = Math.max(0, Math.min(1, relativeX / slider.width));
		return percentage;
	}

	update(dt) {
		const mousePos = input.getMousePosition();
		const mouseDown = input.isMouseButtonHeld(0);
		const mousePressed = input.isMouseButtonPressed(0);
		
		// Handle slider dragging
		if (mouseDown && this.draggingSlider) {
			if (this.draggingSlider === 'master') {
				this.masterVolume = this.handleSliderDrag(mousePos.x, this.masterVolumeSlider);
			} else if (this.draggingSlider === 'music') {
				this.musicVolume = this.handleSliderDrag(mousePos.x, this.musicVolumeSlider);
			}
		} else {
			this.draggingSlider = null;
		}
		
		// Handle mouse press
		if (mousePressed) {
			// Check sliders
			if (this.isPointInSlider(mousePos.x, mousePos.y, this.masterVolumeSlider)) {
				this.draggingSlider = 'master';
				this.masterVolume = this.handleSliderDrag(mousePos.x, this.masterVolumeSlider);
				sounds.play(SoundName.Click);
			} else if (this.isPointInSlider(mousePos.x, mousePos.y, this.musicVolumeSlider)) {
				this.draggingSlider = 'music';
				this.musicVolume = this.handleSliderDrag(mousePos.x, this.musicVolumeSlider);
				sounds.play(SoundName.Click);
			}
			// Check toggle
			else if (this.isPointInToggle(mousePos.x, mousePos.y, this.soundEffectsToggle)) {
				this.soundEffectsEnabled = !this.soundEffectsEnabled;
				sounds.play(SoundName.Click);
			}
			// Check buttons
			else if (this.isPointInButton(mousePos.x, mousePos.y, this.backButton)) {
				sounds.play(SoundName.Click);
				stateMachine.change(GameStateName.Title);
			} else if (this.isPointInButton(mousePos.x, mousePos.y, this.saveButton)) {
				sounds.play(SoundName.Click);
				this.saveSettings();
				stateMachine.change(GameStateName.Title);
			}
		}
	}

	render() {
		const mousePos = input.getMousePosition();
		
		// Background
		context.fillStyle = '#1a1d2e';
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		
		// Main panel
		context.fillStyle = '#16213e';
		context.fillRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
		
		// Panel border
		context.strokeStyle = '#3b82f6';
		context.lineWidth = 4;
		context.strokeRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
		
		// Title
		context.save();
		context.font = '48px "Press Start 2P", monospace';
		context.fillStyle = '#e94560';
		context.textAlign = 'center';
		context.textBaseline = 'top';
		context.fillText('⚙ SETTINGS', CANVAS_WIDTH / 2, this.panelY + 50);
		context.restore();
		
		// Setting rows
		this.renderSettingRow(0, '🔊 Master Volume', this.masterVolume, true);
		this.renderSettingRow(1, '🎵 Music Volume', this.musicVolume, true);
		this.renderSettingRow(2, '💥 Sound Effects', this.soundEffectsEnabled, false);
		
		// Buttons
		this.renderButtons(mousePos.x, mousePos.y);
	}

	renderSettingRow(index, label, value, isSlider) {
		const rowHeight = 80;
		const rowSpacing = 20;
		const startY = this.panelY + 140;
		const rowY = startY + index * (rowHeight + rowSpacing);
		
		// Row background
		context.fillStyle = '#1e3a5f';
		context.fillRect(this.panelX + 40, rowY, this.panelWidth - 80, rowHeight);
		
		// Row border
		context.strokeStyle = '#2d5a8f';
		context.lineWidth = 2;
		context.strokeRect(this.panelX + 40, rowY, this.panelWidth - 80, rowHeight);
		
		// Label
		context.save();
		context.font = '24px Roboto, sans-serif';
		context.fillStyle = '#ffffff';
		context.textAlign = 'left';
		context.textBaseline = 'middle';
		context.fillText(label, this.panelX + 80, rowY + rowHeight / 2);
		context.restore();
		
		if (isSlider) {
			// Render slider
			const slider = index === 0 ? this.masterVolumeSlider : this.musicVolumeSlider;
			this.renderSlider(slider, value);
			
			// Percentage text
			context.save();
			context.font = '20px Roboto, sans-serif';
			context.fillStyle = '#ffffff';
			context.textAlign = 'right';
			context.textBaseline = 'middle';
			context.fillText(`${Math.round(value * 100)}%`, this.panelX + this.panelWidth - 80, rowY + rowHeight / 2);
			context.restore();
		} else {
			// Render toggle (only sound effects now)
			this.renderToggle(this.soundEffectsToggle, value);
		}
	}

	renderSlider(slider, value) {
		// Slider track background (full width)
		context.fillStyle = '#475569';
		context.fillRect(slider.x, slider.y, slider.width, slider.height);
		
		// Slider track filled portion
		const filledWidth = slider.width * value;
		context.fillStyle = '#e94560';
		context.fillRect(slider.x, slider.y, filledWidth, slider.height);
		
		// Slider knob - position at the END of filled portion
		const knobX = slider.x + (slider.width * value);
		const knobY = slider.y + (slider.height / 2);
		
		// Knob shadow/glow
		context.shadowBlur = 10;
		context.shadowColor = 'rgba(233, 69, 96, 0.5)';
		
		context.fillStyle = '#ffffff';
		context.beginPath();
		context.arc(knobX, knobY, slider.knobRadius, 0, Math.PI * 2);
		context.fill();
		
		// Reset shadow
		context.shadowBlur = 0;
		
		// Knob border
		context.strokeStyle = '#e94560';
		context.lineWidth = 3;
		context.beginPath();
		context.arc(knobX, knobY, slider.knobRadius, 0, Math.PI * 2);
		context.stroke();
	}

	renderToggle(toggle, enabled) {
		// Toggle background
		context.fillStyle = enabled ? '#4ecca3' : '#475569';
		context.beginPath();
		context.roundRect(toggle.x, toggle.y, toggle.width, toggle.height, toggle.height / 2);
		context.fill();
		
		// Toggle knob
		const knobRadius = toggle.height / 2 - 4;
		const knobX = enabled ? toggle.x + toggle.width - knobRadius - 4 : toggle.x + knobRadius + 4;
		const knobY = toggle.y + toggle.height / 2;
		
		context.fillStyle = '#ffffff';
		context.beginPath();
		context.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
		context.fill();
	}

	renderButtons(mouseX, mouseY) {
		// Back button
		const backHovered = this.isPointInButton(mouseX, mouseY, this.backButton);
		context.fillStyle = backHovered ? '#374151' : '#2d3748';
		context.fillRect(this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
		context.strokeStyle = '#3b82f6';
		context.lineWidth = 2;
		context.strokeRect(this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
		
		context.save();
		context.font = 'bold 20px Roboto, sans-serif';
		context.fillStyle = '#ffffff';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(
			'← BACK',
			this.backButton.x + this.backButton.width / 2,
			this.backButton.y + this.backButton.height / 2
		);
		context.restore();
		
		// Save button
		const saveHovered = this.isPointInButton(mouseX, mouseY, this.saveButton);
		context.fillStyle = saveHovered ? '#dc2626' : '#e94560';
		context.fillRect(this.saveButton.x, this.saveButton.y, this.saveButton.width, this.saveButton.height);
		context.strokeStyle = '#3b82f6';
		context.lineWidth = 2;
		context.strokeRect(this.saveButton.x, this.saveButton.y, this.saveButton.width, this.saveButton.height);
		
		context.save();
		context.font = 'bold 20px Roboto, sans-serif';
		context.fillStyle = '#ffffff';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(
			'💾 SAVE',
			this.saveButton.x + this.saveButton.width / 2,
			this.saveButton.y + this.saveButton.height / 2
		);
		context.restore();
	}
}