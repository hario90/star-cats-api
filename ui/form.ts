const NICKNAME = "star-cats-nickname";
const DEFAULT_NICKNAME = "Unknown Vigilante";
export const createForm = (
    parentEl: HTMLDivElement,
    setName: (name: string) => void
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
    const keydownListener = (e: KeyboardEvent) => {
        if (e.code.toLowerCase() === "enter") {
            let name;

            if (input.value) {
                name = input.value;
            } else {
                name = DEFAULT_NICKNAME;
            }
            if (name !== DEFAULT_NICKNAME)
            localStorage.setItem(NICKNAME, name)
            setName(name);
            parentEl.removeChild(formContainer);
            document.removeEventListener("keydown", keydownListener);
        }
    };
    document.addEventListener("keydown", keydownListener);
    const hint = document.createElement("p");
    hint.appendChild(document.createTextNode("[Press Enter to play]"));
    formContainer.appendChild(title);
    formContainer.appendChild(input);
    formContainer.appendChild(hint);
    parentEl.appendChild(formContainer);
    return formContainer;
};
