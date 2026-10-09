"""Constants for the League Wayfinder A* pathfinding API."""

import os

# The map is split into GRID_SIZE x GRID_SIZE cells.
GRID_SIZE = 100

# Default champion movement speed (units per second).
CHAMPION_SPEED = 345
MIN_SPEED = 100
MAX_SPEED = 1000

# Summoner's Rift is about 14,870 game units across, so one cell is ~150 units.
GRID_TO_GAME_UNITS = 148.7

# A cell is walkable when at least WALKABLE_SHARE of its pixels are brighter
# than BRIGHTNESS_THRESHOLD (0-255 average of RGB). Walls are near-black.
WALKABLE_SHARE = 0.6
BRIGHTNESS_THRESHOLD = 40

# Riot Data Dragon. The minimap is fetched at runtime and never stored here.
DDRAGON_BASE = os.getenv("DDRAGON_BASE", "https://ddragon.leagueoflegends.com").rstrip("/")
DDRAGON_VERSION = os.getenv("DDRAGON_VERSION", "")
