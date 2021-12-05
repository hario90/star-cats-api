import { Drawable } from "../objects/drawable";
import { Section } from "../objects/section";
import { createSectionToObjectsMap } from "../util";

// The goal is to keep sectionToObjects synced with our objects at all times.
export class DrawableObjectMap<T extends Drawable> {
    private map: Map<string, T> = new Map();
    private sectionToObjects: Map<string, Set<string>> = createSectionToObjectsMap();

    public set = (key: string, value: T, prevSections?: Map<string, Section>) => {
        this.map.set(key, value);
        // sync sections
        this.sync(value, prevSections);
    }

    public sync = (value: T, prevSections?: Map<string, Section>) => {
        for (const [key] of value.sections) {
            const objectsInSection = this.sectionToObjects.get(key) || new Set();
            objectsInSection?.add(value.id);
        }

        if (prevSections) {
            for (const [prevSectionKey] of prevSections) {
                if (!value.sections.has(prevSectionKey)) {
                    const objectsInSection = this.sectionToObjects.get(prevSectionKey);
                    if (objectsInSection) {
                        objectsInSection.delete(value.id)
                    }
                }
            }
        }
    }

    public has = (key: string) => {
        return this.map.has(key);
    }

    public get = (key: string) => {
        return this.map.get(key);
    }

    public delete = (key: string) => {
        const obj = this.get(key);
        if (obj) {
            for (const [key] of obj.sections) {
                const objectsInSection = this.sectionToObjects.get(key);
                if (objectsInSection) {
                    objectsInSection.delete(key);
                }
            }
        }

        this.map.delete(key);
    }

    public values = () => {
        return this.map.values();
    }

    public getObjectsInSection = (sectionKey: string): Set<T> => {
        const objectKeysInSection = this.sectionToObjects.get(sectionKey) || [];
        const objects = new Set<T>();
        for (const key of objectKeysInSection) {
            const obj = this.map.get(key);
            if (obj) {
                objects.add(obj);
            }
        }
        return objects
    }
}