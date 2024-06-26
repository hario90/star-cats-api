import { GameObjectType } from "../../shared/types";
import { DrawableAsteroid } from "../objects/drawable-asteroid";
import { DrawableGem } from "../objects/drawable-gem";
import { DrawableLaserBeam } from "../objects/drawable-laser-beam";
import { DrawablePlanet } from "../objects/drawable-planet";
import { DrawableShip } from "../objects/drawable-ship";

export type DrawableObject =
    | DrawableShip
    | DrawableAsteroid
    | DrawableGem
    | DrawableLaserBeam
    | DrawablePlanet;
export const isDrawableShip = (s: DrawableObject): s is DrawableShip =>
    s.type === GameObjectType.Ship;
export const isDrawableAsteroid = (s: DrawableObject): s is DrawableAsteroid =>
    s.type === GameObjectType.Asteroid;
export const isDrawableGem = (s: DrawableObject): s is DrawableGem =>
    s.type === GameObjectType.Gem;
export const isDrawableLaserBeam = (
    s: DrawableObject
): s is DrawableLaserBeam => s.type === GameObjectType.LaserBeam;
export const isDrawablePlanet = (s: DrawableObject): s is DrawablePlanet => s.type === GameObjectType.Planet;
