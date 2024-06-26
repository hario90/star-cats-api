import { Stats } from "../types";

const pointsFontSize = 14;
const padding = 1.5 * pointsFontSize;
const lineHeight = pointsFontSize + 4;

export function drawStats(
    context: CanvasRenderingContext2D,
    halfCanvasWidth: number,
    stats: Stats
) {
    const { points, lives, healthPoints } = stats;
    let y = padding;
    const canvasWidth = 2 * halfCanvasWidth;
    context.font = `${pointsFontSize}px Ken`;
    context.fillStyle = "white";
    const pointsMessage = `Points: ${points}`;
    context.fillText(
        pointsMessage,
        canvasWidth - context.measureText(pointsMessage).width - padding,
        y
    );
    y += lineHeight;
    const hpMessage = `Health: ${healthPoints}`;
    context.fillText(
        hpMessage,
        canvasWidth - context.measureText(hpMessage).width - padding,
        y
    );
    y += lineHeight;
    const livesText = `Lives: ${lives}`;
    context.fillText(
        livesText,
        canvasWidth - context.measureText(livesText).width - padding,
        y
    );
}
