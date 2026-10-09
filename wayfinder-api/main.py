"""FastAPI version of League Wayfinder: A* pathfinding on Summoner's Rift.

The minimap is fetched from Riot's public Data Dragon CDN when the server
starts. No Riot artwork is stored in this repository.
"""

import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.league_wayfinder.constants import CHAMPION_SPEED, GRID_SIZE, GRID_TO_GAME_UNITS, MAX_SPEED, MIN_SPEED
from app.league_wayfinder.utils import GridProcessor, PathFinder

STATE: dict = {"grid": None, "map_url": None}


@asynccontextmanager
async def lifespan(_: FastAPI):
    STATE["grid"], STATE["map_url"] = GridProcessor.load()
    yield


app = FastAPI(title="League Wayfinder API", lifespan=lifespan)
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))


def _check_speed(speed: int) -> None:
    if not MIN_SPEED <= speed <= MAX_SPEED:
        raise HTTPException(400, f"champion_speed must be between {MIN_SPEED} and {MAX_SPEED}")


def _check_point(x: int, y: int) -> None:
    if not (0 <= x < GRID_SIZE and 0 <= y < GRID_SIZE):
        raise HTTPException(400, f"Invalid coordinates: ({x}, {y})")
    if not STATE["grid"][x][y]:
        raise HTTPException(400, f"Point ({x}, {y}) is not walkable")


@app.get("/", include_in_schema=False)
async def index():
    return RedirectResponse("/wayfinder")


@app.get("/wayfinder", response_class=HTMLResponse)
async def wayfinder_page(request: Request):
    return templates.TemplateResponse(
        request,
        "wayfinder.html",
        {
            "grid_size": GRID_SIZE,
            "grid_to_game_units": GRID_TO_GAME_UNITS,
            "champion_speed": CHAMPION_SPEED,
            "map_url": STATE["map_url"] or "",
        },
    )


@app.get("/api/health")
async def health():
    return {"ok": True, "map_loaded": STATE["map_url"] is not None}


@app.get("/api/map-data")
async def get_map_data():
    """Walkability grid indexed ``grid[x][y]`` (1 = walkable)."""
    return {"grid": [[1 if c else 0 for c in col] for col in STATE["grid"]], "map_url": STATE["map_url"]}


@app.post("/api/calculate-path")
async def calculate_path(
    start_x: int = Form(...),
    start_y: int = Form(...),
    end_x: int = Form(...),
    end_y: int = Form(...),
    champion_speed: int = Form(CHAMPION_SPEED),
):
    _check_speed(champion_speed)
    _check_point(start_x, start_y)
    _check_point(end_x, end_y)
    path, distance, time, explored = PathFinder.calculate_path(
        STATE["grid"], (start_x, start_y), (end_x, end_y), champion_speed
    )
    return {
        "path": path,
        "path_distance": round(distance, 1),
        "travel_time": round(time, 2),
        "explored": explored,
        "champion_speed": champion_speed,
    }


@app.post("/api/calculate-multi-path")
async def calculate_multi_path(waypoints: str = Form(...), champion_speed: int = Form(CHAMPION_SPEED)):
    """Chain A* through every waypoint. ``waypoints`` is a JSON list of {x, y}."""
    _check_speed(champion_speed)
    try:
        points = [(int(wp["x"]), int(wp["y"])) for wp in json.loads(waypoints)]
    except (ValueError, KeyError, TypeError):
        raise HTTPException(400, "waypoints must be a JSON list of {x, y} objects")
    if len(points) < 2:
        raise HTTPException(400, "At least two waypoints are required")
    for x, y in points:
        _check_point(x, y)

    paths, segment_times = [], []
    total_distance = total_time = 0.0
    for a, b in zip(points, points[1:]):
        path, distance, time, _ = PathFinder.calculate_path(STATE["grid"], a, b, champion_speed)
        if path:
            paths.append(path)
            total_distance += distance
            total_time += time
            segment_times.append(round(time, 2))

    return {
        "paths": paths,
        "total_distance": round(total_distance, 1),
        "total_time": round(total_time, 2),
        "champion_speed": champion_speed,
        "segment_times": segment_times,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")))
