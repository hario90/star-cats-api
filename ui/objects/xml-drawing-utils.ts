import { GameObjectDTO } from "../../shared/types";
import { ImageComponent } from "../component";
import { Canvas } from "../game-engine/canvas";

const parser = new DOMParser();
export const getImageComponentFromXML = (
    allAssets: any, // TODO
    rawXML: string,
    objectName: string,
    props: GameObjectDTO & { canvas: Canvas }
) => {
    const xmlDoc = parser.parseFromString(rawXML, "text/xml");
    const xmlElementMatches = xmlDoc.getElementsByName(objectName);
    if (!xmlElementMatches.length) {
        return undefined;
    }

    const objectEl = xmlElementMatches[0];
    const xStr = objectEl.getAttribute("x");
    const yStr = objectEl.getAttribute("y");
    const heightStr = objectEl.getAttribute("height");
    const widthStr = objectEl.getAttribute("width");
    if (heightStr && widthStr && xStr && yStr) {
        const height = parseInt(heightStr, 10);
        const width = parseInt(widthStr, 10);
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        return new ImageComponent({
            ...props,
            src: allAssets,
            srcWidth: width,
            srcHeight: height,
            frame: 0,
            frameLocations: [[x, y]],
        });
    }

    return undefined;
};
