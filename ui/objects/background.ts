import { BOARD_WIDTH, BOARD_HEIGHT } from "../../shared/constants";

export class Background {
    private img: HTMLImageElement;
    private loaded: boolean = false;

    constructor() {
        this.img = new Image();
        this.img.onload = () => {
            this.loaded = true;
        };
        this.draw = this.draw.bind(this);
    }

    createQuadrants(context: CanvasRenderingContext2D) {
        const opacity = 0.15;
        context.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        context.fillRect(0, 0, BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
        context.fillStyle = `rgba(0, 255, 0, ${opacity})`;
        context.fillRect(BOARD_WIDTH / 2, 0, BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
        context.fillStyle = `rgba(0, 0, 255, ${opacity})`;
        context.fillRect(
            0,
            BOARD_HEIGHT / 2,
            BOARD_WIDTH / 2,
            BOARD_HEIGHT / 2
        );
        context.fillStyle = `rgba(255, 255, 0, ${opacity})`;
        context.fillRect(
            BOARD_WIDTH / 2,
            BOARD_HEIGHT / 2,
            BOARD_WIDTH / 2,
            BOARD_HEIGHT / 2
        );
    }

    createStars(context: CanvasRenderingContext2D) {
        const starPadding = 40;
        const starDiameter = 2;
        for (let i = 0; i < BOARD_WIDTH; i += starPadding) {
            for (let j = 0; j < BOARD_HEIGHT; j += starPadding) {
                const x = i + starPadding * Math.random();
                const y = j + starPadding * Math.random();
                context.fillStyle =
                    "hsl(" + 360 * Math.random() + ", 50%, 50%)";
                context.fillRect(x, y, starDiameter, starDiameter);
            }
        }
        // for (let i = 0; i < BOARD_WIDTH; i += COL_THICKNESS) {
        //   context.beginPath();
        //   context.strokeStyle =  "white"
        //   context.moveTo(i, 0);
        //   context.lineTo(i, BOARD_HEIGHT);
        //   context.stroke();
        // }
        // for (let i = 0; i < BOARD_HEIGHT; i += ROW_THICKNESS) {
        //   context.beginPath();
        //   context.moveTo(0, i);
        //   context.lineTo(BOARD_WIDTH, i);
        //   context.stroke();
        // }
    }

    create(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        context.fillStyle = "black";
        context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
        this.createQuadrants(context);
        this.createStars(context);
        this.img.src = canvas.toDataURL();
    }

    draw(
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        canvasWidth: number,
        canvasHeight: number
    ) {
        if (!this.loaded) {
            console.error("This image has not loaded yet");
            return;
        }
        context.save();
        context.drawImage(
            this.img,
            x,
            y,
            canvasWidth,
            canvasHeight,
            0,
            0,
            canvasWidth,
            canvasHeight
        );
        context.restore();
    }

    isLoaded(): boolean {
        return this.loaded;
    }
}
