import { GameObjectDTO } from "../../shared/types";
import { ImageComponent } from "../component";
import { Canvas } from "../game-engine/canvas";

const parser = new DOMParser();

type SubTexture = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

let textureMap: ReadonlyMap<string, SubTexture> | undefined = undefined;

function createTextureAtlas(rawXML: string) {
    if (textureMap) {
        return textureMap;
    }

    const doc = parser.parseFromString(rawXML, "text/xml");

    const textures = new Map<string, SubTexture>();

    for (const element of doc.getElementsByTagName("SubTexture")) {
        const name = element.getAttribute("name");

        if (!name) {
            continue;
        }

        textures.set(name, {
            name,
            x: Number(element.getAttribute("x")),
            y: Number(element.getAttribute("y")),
            width: Number(element.getAttribute("width")),
            height: Number(element.getAttribute("height")),
        });
    }

    return textures;
}

export const getImageComponentFromXML = (
    allAssets: any, // TODO
    rawXML: string,
    objectName: string,
    props: GameObjectDTO & { canvas: Canvas }
): ImageComponent | undefined => {
    const atlas = createTextureAtlas(rawXML);
    const subTexture = atlas.get(objectName);
    if (!subTexture) {
        return undefined;
    }
   
    return new ImageComponent({
        ...props,
        src: allAssets,
        srcWidth: subTexture.width,
        srcHeight: subTexture.height,
        frame: 0,
        frameLocations: [[subTexture.x, subTexture.y]],
    });
};
