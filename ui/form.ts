import { PlayerShipColor } from "../shared/types";

const NICKNAME = "star-cats-nickname";
const DEFAULT_NICKNAME = "Unknown Vigilante";
export const createForm = (
    parentEl: HTMLDivElement,
    startGame: (name: string, shipColor: PlayerShipColor, useRobots?: boolean) => void
) => {
    const formContainer = document.createElement("div");
    formContainer.className = "name-form";
    const title = document.createElement("h1");
    const titleText = document.createTextNode("Star Cats");
    title.appendChild(titleText);
    const input = document.createElement("input");
    input.id = "name-input";
    input.setAttribute("placeholder", "Type a nickname");
    const nickName = localStorage.getItem(NICKNAME);
    if (input && nickName) {
        input.value = nickName;
    }
    // checkbox
    const checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("check", "true");
    checkbox.setAttribute("id", "useRobot");
    const checkboxLabel = document.createElement("label");
    checkboxLabel.setAttribute("for", "useRobot");
    checkboxLabel.innerText = "Use robots";

    const keydownListener = (e: KeyboardEvent) => {
        if (e.code.toLowerCase() === "enter") {
            let name;

            if (input.value) {
                name = input.value;
            } else {
                name = DEFAULT_NICKNAME;
            }
            if (name !== DEFAULT_NICKNAME) localStorage.setItem(NICKNAME, name);
            startGame(name, PlayerShipColor.Blue, checkbox.checked);
            parentEl.removeChild(formContainer);
            document.removeEventListener("keydown", keydownListener);
        }
    };
    document.addEventListener("keydown", keydownListener);
    const hint = document.createElement("p");
    hint.appendChild(document.createTextNode("[Press Enter to play]"));
    const formElements = [title, input, hint, checkbox, checkboxLabel];
    for (const el of formElements) {
        formContainer.appendChild(el);
    }

    parentEl.appendChild(formContainer);
    return formContainer;
};
