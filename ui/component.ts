import { Component } from "./types";

export interface ComponentProps {
  src: string;
  x: number;
  y: number;
}

export class ImageComponent implements Component {
  protected img: HTMLImageElement;
  protected x: number = 0;
  protected y: number = 0;
  protected loaded: boolean = false;
  protected speed: number = 0;
  protected deg: number = 0;
  protected height: number = 0;
  protected width: number = 0;

  constructor({ src, x, y }: ComponentProps) {
    this.img = new Image();
    this.img.src = src;
    this.img.onload = () => { this.loaded = true; };
    this.x = x;
    this.y = y;
    this.draw = this.draw.bind(this);
  }

  draw(context: CanvasRenderingContext2D) {
    if (!this.loaded) {
      console.error("This image has not loaded yet");
      return;
    }
    context.drawImage(this.img, this.x, this.y)
  }

  getPosition(): number[] {
    return [this.x, this.y];
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getHeading(): number {
    return this.deg;
  }

  getSpeed(): number {
    return this.speed;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  getHeight(): number {
    return this.height;
  }

  getWidth(): number {
    return this.width;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}