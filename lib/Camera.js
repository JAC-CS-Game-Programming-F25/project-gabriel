/**
 * Camera - Handles screen shake and camera effects
 */
export default class Camera {
	constructor() {
		this.shakeIntensity = 0;
		this.shakeDuration = 0;
		this.shakeTimer = 0;
		this.offsetX = 0;
		this.offsetY = 0;
	}

	/**
	 * Trigger a screen shake effect
	 * @param {number} intensity - How far the camera shakes (pixels)
	 * @param {number} duration - How long the shake lasts (seconds)
	 */
	shake(intensity, duration) {
		this.shakeIntensity = intensity;
		this.shakeDuration = duration;
		this.shakeTimer = 0;
	}

	update(dt) {
		if (this.shakeTimer < this.shakeDuration) {
			this.shakeTimer += dt;
			
			// Calculate shake amount that decreases over time
			const progress = this.shakeTimer / this.shakeDuration;
			const currentIntensity = this.shakeIntensity * (1 - progress);
			
			// Random offset
			this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
			this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
		} else {
			this.offsetX = 0;
			this.offsetY = 0;
		}
	}

	/**
	 * Apply camera transform to context
	 */
	apply(context) {
		context.translate(this.offsetX, this.offsetY);
	}

	/**
	 * Remove camera transform from context
	 */
	reset(context) {
		context.translate(-this.offsetX, -this.offsetY);
	}
}