"""A* pathfinding on an 8-connected grid."""

import heapq
import math

from app.league_wayfinder.constants import CHAMPION_SPEED, GRID_SIZE, GRID_TO_GAME_UNITS

Point = tuple[int, int]


class PathFinder:
    """Straight moves cost 10, diagonal moves 14. Diagonals may not cut wall corners."""

    @staticmethod
    def heuristic(ax: int, ay: int, bx: int, by: int) -> float:
        # Euclidean distance, scaled to the 10/14 move costs.
        return 10 * math.hypot(ax - bx, ay - by)

    @staticmethod
    def calculate_path(grid, start: Point, end: Point, champion_speed: int = CHAMPION_SPEED):
        """Return ``(path, path_distance, travel_time, explored)``."""
        (sx, sy), (ex, ey) = start, end
        if not grid[sx][sy] or not grid[ex][ey]:
            return [], 0.0, 0.0, 0

        g = {start: 0.0}
        parent: dict[Point, Point] = {}
        closed: set[Point] = set()
        h0 = PathFinder.heuristic(sx, sy, ex, ey)
        open_heap = [(h0, h0, start)]

        while open_heap:
            _, _, current = heapq.heappop(open_heap)
            if current in closed:
                continue
            closed.add(current)

            if current == end:
                path = [current]
                while path[-1] in parent:
                    path.append(parent[path[-1]])
                path.reverse()
                distance, time = PathFinder.travel_metrics(path, champion_speed)
                return path, distance, time, len(closed)

            cx, cy = current
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = cx + dx, cy + dy
                    if not (0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE) or not grid[nx][ny]:
                        continue
                    diagonal = dx != 0 and dy != 0
                    if diagonal and (not grid[cx + dx][cy] or not grid[cx][cy + dy]):
                        continue
                    nxt = (nx, ny)
                    if nxt in closed:
                        continue
                    tentative = g[current] + (14 if diagonal else 10)
                    if tentative < g.get(nxt, math.inf):
                        g[nxt] = tentative
                        parent[nxt] = current
                        h = PathFinder.heuristic(nx, ny, ex, ey)
                        heapq.heappush(open_heap, (tentative + h, h, nxt))

        return [], 0.0, 0.0, len(closed)

    @staticmethod
    def travel_metrics(path, champion_speed: int):
        """Distance in game units and travel time in seconds."""
        cells = sum(math.dist(path[i], path[i + 1]) for i in range(len(path) - 1))
        distance = cells * GRID_TO_GAME_UNITS
        return distance, distance / champion_speed
