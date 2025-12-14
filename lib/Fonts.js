export default class Fonts {
	constructor() {
		this.fonts = {};
	}

	load(fontDefinitions) {
		fontDefinitions.forEach((fontDefinition) => {
			// Handle Google Fonts differently 
			if (fontDefinition.isGoogleFont) {
				// Create link element to load Google Font
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = fontDefinition.path;
				document.head.appendChild(link);
				
				// Store the font name for reference
				this.fonts[fontDefinition.name] = { loaded: true, isGoogleFont: true };
			} else {
				// Handle local fonts with FontFace API
				const font = new FontFace(
					fontDefinition.name,
					`url(${fontDefinition.path})`
				);

				this.fonts[fontDefinition.name] = font;

				font.load().then(font => {
					document.fonts.add(font);
				});
			}
		});
	}

	get(name) {
		return this.fonts[name];
	}
}