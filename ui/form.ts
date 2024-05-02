import { PlayerShipColor } from "../shared/types";

const NICKNAME = "star-cats-nickname";
const DEFAULT_NICKNAME = "Unknown Vigilante";

const createLabelledInput = (label: string, required: boolean, placeholder?: string): { label: HTMLLabelElement, input: HTMLInputElement } => {
    const inputLabel = document.createElement("label");
    inputLabel.appendChild(document.createTextNode(label));
    const input = document.createElement("input");
    input.setAttribute("required", `${required}`);
    if (placeholder) {
        input.setAttribute("placeholder", placeholder);

    }
    inputLabel.appendChild(input);
    return { input, label: inputLabel }
};

export const createForm = (
    parentEl: HTMLDivElement,
    startGame: (name: string, useRobots?: boolean) => void
) => {
    const formContainer = document.createElement("div");
    formContainer.className = "name-form";
    const title = document.createElement("h1");
    const titleText = document.createTextNode("Star Cats");
    title.appendChild(titleText);

    // Name input
    const { label: nameInputLabel, input: nameInput } = createLabelledInput("Name", true, "Type a nickname");

    const nickName = localStorage.getItem(NICKNAME);
    if (nameInput && nickName) {
        nameInput.value = nickName;
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
            const name = nameInput.value ?? DEFAULT_NICKNAME;
            if (name !== DEFAULT_NICKNAME) localStorage.setItem(NICKNAME, name);
            startGame(name, checkbox.checked);
            parentEl.removeChild(formContainer);
            document.removeEventListener("keydown", keydownListener);
        }
    };
    document.addEventListener("keydown", keydownListener);
    const hint = document.createElement("p");
    hint.appendChild(document.createTextNode("[Press Enter to play]"));
    
    const formElements = [title, nameInputLabel, checkbox, checkboxLabel, hint];
    for (const el of formElements) {
        formContainer.appendChild(el);
    }

    parentEl.appendChild(formContainer);
    return formContainer;
};
