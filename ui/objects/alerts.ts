import { Alert } from "../types";

const fontSize = 14;
const padding = fontSize;
export class Alerts {
    private alerts: Alert[] = [];
    push(alert: Alert) {
        this.alerts.push(alert);
    }

    draw(context: CanvasRenderingContext2D, halfCanvasWidth: number, halfCanvasHeight: number) {
        const nextAlerts = [];
        const now = new Date();
        let y = 0, x = 0;
        context.font = `${fontSize}px Arial`;
        context.fillStyle = "white";

        for (const alert of this.alerts) {
            if (now < alert.expires) {
                nextAlerts.push(alert);
                y += padding + fontSize;
                x = halfCanvasWidth - (0.5 * context.measureText(alert.message).width)
                context.fillText(alert.message, x, y);
            }
        }

    }
}