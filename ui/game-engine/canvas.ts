export class Canvas {
    private _canvasEl: HTMLCanvasElement = document.createElement("canvas");
    private _context: CanvasRenderingContext2D;
    private _halfWidth: number = 0;
    private _halfHeight: number = 0;

    public constructor(appEl: HTMLDivElement) {
        appEl.appendChild(this._canvasEl);
        const context = this._canvasEl.getContext("2d");
        if (!context) {
          throw new Error("no context");
        }
        this._context = context;
        window.addEventListener("resize", this.setHeightWidth);
        this.setHeightWidth();
    }

    public makeVisible = () => {
        this._canvasEl.className = "visible";
    }

    public get canvasEl() {
        return this._canvasEl;
    }

    public get context() {
        return this._context;
    }

    public get width() {
        return this.canvasEl.width;
    }

    public get height() {
        return this.canvasEl.height;
    }

    public get halfWidth() {
        return this._halfWidth;
    }

    public get halfHeight() {
        return this._halfHeight;
    }

    private setHeightWidth = () => {
        if (this._canvasEl) {
            this._canvasEl.height = document.body.clientHeight;
            this._canvasEl.width = document.body.clientWidth;
            this._halfWidth = Math.floor(this._canvasEl.width / 2);
            this._halfHeight = Math.floor(this._canvasEl.height / 2);
        } else {
            throw new Error("Canvas not defined!")
        }
    }
}