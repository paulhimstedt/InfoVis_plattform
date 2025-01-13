# AniVision: Interactive Visualization Platform

## Overview
This is a web-based interactive tool to visualize the AniVision dataset (movies and segments) via time-series plots and a map. It is designed for researchers, teachers, and students to explore historical animation film metadata.

## Installation
1. Clone or download this repository.
2. Ensure you have a local server set up (any static server or Node-based server).
3. Place `movies.csv` and `segments.csv` in the `data/` folder.  
4. (Optional) Place `world-geo.json` or the appropriate GeoJSON in `data/`.

## Running
- Start a simple local server (e.g., `npx http-server .` if you have Node.js installed or use `python -m http.server 8080` in Python).
- Navigate to `http://localhost:8080/index.html` in your browser.
- Interact with filters to update the time series and map visualization.
- Compare two movies for a side-by-side difference analysis (simple alert pop-up in this template).

## Dependencies
- [D3.js v7+](https://d3js.org)
- A valid GeoJSON file for geographic rendering.

## Notes
- The map requires coordinates for each organization’s location. You will likely need to preprocess or geocode `organizations_location`.
- For advanced usage, you can adapt the code to show animation styles, transitions, or other aggregated segment data.
