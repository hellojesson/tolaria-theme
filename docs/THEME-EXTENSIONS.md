# Tolaria theme extensions

Theme extensions customize Tolaria's semantic colors while preserving the official **Light**, **Dark**, and **System** modes. Select the base mode in **Settings → Appearance**, then select an extension theme below it. When System changes between light and dark, the selected extension changes variant with it.

## Install a theme

1. Open **Settings → Appearance**.
2. Click **Import** next to the custom theme selector.
3. Choose a JSON theme file. A descriptive filename ending in `.tolaria-theme.json` is recommended.

Imported themes are stored only on this Tolaria installation. They do not modify or synchronize through a vault.

## Package format

Schema version 1 requires an id, display name, and both color variants. Every color must be `#RRGGBB` or `#RRGGBBAA`.

```json
{
  "schemaVersion": 1,
  "id": "example.ocean",
  "name": "Example Ocean",
  "author": "Example Author",
  "variants": {
    "light": {
      "--surface-app": "#F7FBFC",
      "--surface-sidebar": "#EAF4F6",
      "--surface-editor": "#F7FBFC",
      "--text-primary": "#27364A",
      "--text-secondary": "#587080",
      "--border-default": "#D1E3E7",
      "--accent-blue": "#168D9C",
      "--accent-blue-hover": "#0B707D",
      "--accent-blue-light": "#168D9C1F"
    },
    "dark": {
      "--surface-app": "#101A20",
      "--surface-sidebar": "#0C151B",
      "--surface-editor": "#101A20",
      "--text-primary": "#D6E6EB",
      "--text-secondary": "#A3BBC4",
      "--border-default": "#25404B",
      "--accent-blue": "#4DD2DB",
      "--accent-blue-hover": "#7BE3E9",
      "--accent-blue-light": "#4DD2DB29"
    }
  }
}
```

The nine tokens shown in each variant are required. Additional supported tokens are listed in `SUPPORTED_THEME_TOKENS` in `src/features/theme-extensions/themePackage.ts`. Unknown tokens and non-color values are rejected so a theme cannot inject CSS or load remote resources.

The three bundled packages in `src/features/theme-extensions/themes/` are complete examples and can be copied as starting points.
