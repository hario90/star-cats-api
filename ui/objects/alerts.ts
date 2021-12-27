import { Canvas } from "../game-engine/canvas";
import { Alert } from "../types";

const fontSize = 14;
const padding = fontSize;
const ALERT_MESSAGE_DURATION = 8;
export class Alerts {
    private alerts: Alert[] = [];

    constructor(private canvas: Canvas) {}

    push(message: string, expires?: Date) {
        const defaultExpires = new Date();
        defaultExpires.setSeconds(
            defaultExpires.getSeconds() + ALERT_MESSAGE_DURATION
        );
        expires = expires ?? defaultExpires;
        this.alerts.push({ message, expires });
    }

    draw(context: CanvasRenderingContext2D) {
        const halfCanvasWidth = this.canvas.halfWidth;
        const nextAlerts = [];
        const now = new Date();
        let y = 0,
            x = 0;
        context.font = `${fontSize}px Arial`;
        context.fillStyle = "white";

        for (const alert of this.alerts) {
            if (now < alert.expires) {
                nextAlerts.push(alert);
                y += padding + fontSize;
                x =
                    halfCanvasWidth -
                    0.5 * context.measureText(alert.message).width;
                context.fillText(alert.message, x, y);
            }
        }
    }
}
