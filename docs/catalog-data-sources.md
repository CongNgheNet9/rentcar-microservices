# Vehicle catalog demo data and sources

## Current demo seed

`verhicle-rental-system-be/scripts/seed-demo.ps1` provisions 30 demo inventory records across 9 vehicle categories and 3 pickup locations. `DEMO-*` plates and rental prices are synthetic UI/business-flow fixtures; they are not claims about actual fleet inventory, exact vehicle trims, or market prices. Re-running the script is intended to update the same sample vehicles by plate.

The current Vehicle API stores a single `ImageUrl` and vehicle-level rental fields. It does not model vehicle make/model master data, trim-specific manufacturer specifications, or image author/license/attribution metadata. Images therefore remain optional; do not attach guessed car photos to real makes as though they were official product photos.

## Data sources evaluated

- **Makes, models, and selected manufacturer-reported specifications:** [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/Home/Index) is a free public API. Its catalog is oriented to vehicles submitted to NHTSA and is primarily suitable for the US market; it does not provide vehicle photography. Treat it as an import source with source/year fields, not as a globally complete catalog.
- **Brand marks in the home marquee:** [Simple Icons](https://github.com/simple-icons/simple-icons) provides SVGs and a CDN endpoint. The project repository is CC0, but its disclaimer says this does not mean every contained brand mark is CC0. Check per-icon license and brand usage guidance before shipping each mark. The UI currently requests a monochrome SVG through `cdn.simpleicons.org` and falls back to the brand name if that mark is unavailable.
- **Car photography:** Wikimedia Commons is a possible source because each file page states the applicable license and creator credit, but the license and attribution must be preserved per image. [Unsplash API](https://unsplash.com/documentation) is also possible, but API images must be hotlinked and displayed with required attribution; generic stock car photos should not be represented as exact model photos.

## Suggested next data-model step

Keep rental inventory (`Vehicle`) separate from a reusable make/model/trim catalog, and add an image asset record with `url`, `sourcePage`, `creator`, `license`, and `attribution`. Import verified specifications into the model catalog with `source` and `modelYear`; keep demo-only prices, location, availability, and plate on inventory records. This avoids presenting fixture data as authoritative manufacturer specifications and lets the FE use the same API contract later.
