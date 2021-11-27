import { ISection } from "../../shared/types";
import { COL_THICKNESS, NUM_COLUMNS, NUM_ROWS, ROW_THICKNESS } from "../../shared/util";

const getSectionKey = (row: number, col: number) => `${row},${col}`;
export class Section implements ISection {
    public readonly row: number;
    public readonly col: number;
    public readonly key: string;
    public minX: number;
    public maxX: number;
    public minY: number;
    public maxY: number;

    constructor(row: number, col: number) {
        if (row < 0 || row >= NUM_ROWS) {
            throw new Error(`Row out of range: ${row}`);
        }

        if (col < 0 || col >= NUM_COLUMNS) {
            throw new Error(`Column out of range: ${col}`);
        }

        this.row = row;
        this.col = col;
        this.minX = this.col * COL_THICKNESS;
        this.maxX = this.minX + COL_THICKNESS;
        this.minY = this.row * ROW_THICKNESS;
        this.maxY = this.minY + ROW_THICKNESS;
        this.key = getSectionKey(row, col);
    }

}