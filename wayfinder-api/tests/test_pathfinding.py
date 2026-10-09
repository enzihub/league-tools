"""Pathfinding tests on small synthetic grids (no network needed)."""

import math

from app.league_wayfinder.constants import GRID_SIZE, GRID_TO_GAME_UNITS
from app.league_wayfinder.utils import PathFinder


def open_grid():
    return [[True] * GRID_SIZE for _ in range(GRID_SIZE)]


def test_straight_line():
    path, distance, time, _ = PathFinder.calculate_path(open_grid(), (10, 10), (20, 10), 345)
    assert path[0] == (10, 10) and path[-1] == (20, 10)
    assert len(path) == 11
    assert math.isclose(distance, 10 * GRID_TO_GAME_UNITS)
    assert math.isclose(time, distance / 345)


def test_routes_around_a_wall():
    grid = open_grid()
    for y in range(0, 90):
        grid[50][y] = False  # vertical wall with a gap at the bottom
    path, _, _, _ = PathFinder.calculate_path(grid, (40, 10), (60, 10))
    assert path, "a path should exist through the gap"
    assert all(grid[x][y] for x, y in path)
    assert max(y for _, y in path) >= 90


def test_no_diagonal_corner_cutting():
    grid = open_grid()
    grid[11][10] = False
    grid[10][11] = False
    path, *_ = PathFinder.calculate_path(grid, (10, 10), (11, 11))
    assert (10, 10) in path and (11, 11) in path
    assert len(path) > 2


def test_unreachable_returns_empty():
    grid = open_grid()
    for y in range(GRID_SIZE):
        grid[50][y] = False
    path, distance, time, _ = PathFinder.calculate_path(grid, (10, 10), (90, 10))
    assert path == [] and distance == 0 and time == 0
