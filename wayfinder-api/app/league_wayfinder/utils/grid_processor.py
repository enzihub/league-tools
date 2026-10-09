"""Turn the Summoner's Rift minimap into a walkability grid."""

import io
import json
import logging
import urllib.request

import numpy as np
from PIL import Image

from app.league_wayfinder.constants import (
    BRIGHTNESS_THRESHOLD,
    DDRAGON_BASE,
    DDRAGON_VERSION,
    GRID_SIZE,
    WALKABLE_SHARE,
)

log = logging.getLogger(__name__)


class GridProcessor:
    """Builds ``grid[x][y] -> bool`` (True = walkable) from a map image."""

    @staticmethod
    def map_url() -> str:
        """URL of the current Data Dragon minimap for Summoner's Rift (map 11)."""
        version = DDRAGON_VERSION
        if not version:
            with urllib.request.urlopen(f"{DDRAGON_BASE}/api/versions.json", timeout=10) as res:
                version = json.load(res)[0]
        return f"{DDRAGON_BASE}/cdn/{version}/img/map/map11.png"

    @staticmethod
    def fetch_image(url: str) -> Image.Image:
        with urllib.request.urlopen(url, timeout=15) as res:
            return Image.open(io.BytesIO(res.read())).convert("RGB")

    @staticmethod
    def grid_from_image(image: Image.Image) -> list[list[bool]]:
        """A cell is walkable when enough of its pixels are bright ground."""
        size = GRID_SIZE * 8
        lum = np.asarray(image.resize((size, size)), dtype=float).mean(axis=2)
        bright = (lum > BRIGHTNESS_THRESHOLD).reshape(GRID_SIZE, 8, GRID_SIZE, 8)
        share = bright.mean(axis=(1, 3))  # indexed [y][x]
        walk = share >= WALKABLE_SHARE
        return walk.T.tolist()  # -> [x][y]

    @staticmethod
    def open_grid() -> list[list[bool]]:
        return [[True] * GRID_SIZE for _ in range(GRID_SIZE)]

    @classmethod
    def load(cls) -> tuple[list[list[bool]], str | None]:
        """Fetch the minimap and build the grid. Falls back to an open grid offline."""
        try:
            url = cls.map_url()
            return cls.grid_from_image(cls.fetch_image(url)), url
        except Exception as exc:  # network or decode failure
            log.warning("Could not load the Data Dragon map (%s); using an open grid.", exc)
            return cls.open_grid(), None
