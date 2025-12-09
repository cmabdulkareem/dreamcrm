/**
 * Adjusts the brightness of a hex color
 * @param {string} hex - The hex color code (e.g., "#ED1164")
 * @param {number} factor - The factor to adjust by (-1 to 1)
 * @returns {string} - The adjusted hex color
 */
const adjustBrightness = (hex, factor) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const newR = Math.round(r + (255 - r) * factor);
    const newG = Math.round(g + (255 - g) * factor);
    const newB = Math.round(b + (255 - b) * factor);

    const adjust = (val) => Math.min(Math.max(val, 0), 255);

    return `#${adjust(newR).toString(16).padStart(2, '0')}${adjust(newG).toString(16).padStart(2, '0')}${adjust(newB).toString(16).padStart(2, '0')}`;
};

/**
 * Generates a Tailwind-like color palette from a single hex color
 * @param {string} baseColor - The base hex color
 * @returns {object} - An object with keys 50, 100, ..., 950 mapped to hex colors
 */
export const generatePalette = (baseColor) => {
    // This is a simplified palette generation logic.
    // Ideally, we would use a library like 'chroma-js' or 'tinycolor2' but we want to avoid extra deps if possible.
    // We will generate tints (lighter) and shades (darker).

    // We assume the baseColor is roughly the '500' shade.
    // 50-400 are lighter (mixed with white)
    // 600-950 are darker (mixed with black)

    // Helper to mix colors
    const mix = (c1, c2, weight) => {
        const d2h = (d) => d.toString(16).padStart(2, '0');
        const h2d = (h) => parseInt(h, 16);

        let color = "#";
        for (let i = 1; i < 7; i += 2) {
            const v1 = h2d(c1.substr(i, 2));
            const v2 = h2d(c2.substr(i, 2));
            const val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)));
            color += val;
        }
        return color;
    };

    const white = "#ffffff";
    const black = "#000000";

    return {
        25: mix(white, baseColor, 95),
        50: mix(white, baseColor, 90),
        100: mix(white, baseColor, 80),
        200: mix(white, baseColor, 60),
        300: mix(white, baseColor, 40),
        400: mix(white, baseColor, 20),
        500: baseColor,
        600: mix(black, baseColor, 10),
        700: mix(black, baseColor, 30),
        800: mix(black, baseColor, 50),
        900: mix(black, baseColor, 70),
        950: mix(black, baseColor, 85),
    };
};

/**
 * Converts a hex color to an RGB string (e.g., "237, 17, 100")
 * Useful if we switched to using RGB variables for tailwind opacity support
 * @param {string} hex 
 * @returns {string}
 */
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};
