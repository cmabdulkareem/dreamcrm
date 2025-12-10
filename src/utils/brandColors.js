import tinycolor from "tinycolor2";

/**
 * Updates the CSS variables for the brand color palette based on a base color.
 * Generates shades from 25 to 950.
 * 
 * @param {string} baseColor - The base hex color (e.g., "#ED1164")
 */
export const updateBrandTheme = (baseColor) => {
  if (!baseColor || !tinycolor(baseColor).isValid()) {
    return;
  }

  const root = document.documentElement;
  const primary = tinycolor(baseColor);

  // Define shades mapping
  const shades = {
    25: primary.clone().lighten(45).toRgbString(),
    50: primary.clone().lighten(40).toRgbString(),
    100: primary.clone().lighten(30).toRgbString(),
    200: primary.clone().lighten(20).toRgbString(),
    300: primary.clone().lighten(10).toRgbString(),
    400: primary.clone().lighten(5).toRgbString(),
    500: primary.toRgbString(),
    600: primary.clone().darken(5).toRgbString(),
    700: primary.clone().darken(10).toRgbString(),
    800: primary.clone().darken(20).toRgbString(),
    900: primary.clone().darken(30).toRgbString(),
    950: primary.clone().darken(40).toRgbString(),
  };

  Object.entries(shades).forEach(([shade, colorValue]) => {
    // Extract RGB values for Tailwind alpha opacity support if needed, 
    // but for now we'll just set the full color string or specific format.
    // Tailwind v4 variable support is flexible, but v3 often likes `R G B` for opacity support.
    // Let's stick to standard CSS variables for now.
    
    // However, the implementation plan mentioned `rgba(var(--color-brand-500), <alpha-value>)` in tailwind config.
    // To support that, we need to store just the `r g b` values.
    
    const rgb = tinycolor(colorValue).toRgb();
    // Set variable --color-brand-{shade} to "r g b"
    root.style.setProperty(`--color-brand-${shade}`, `${rgb.r} ${rgb.g} ${rgb.b}`);
  });
};
