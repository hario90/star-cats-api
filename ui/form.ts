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
    input.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.code.toLowerCase() === "enter") {
            if (e.target && (<HTMLInputElement>e.target).value) {
                setName((<HTMLInputElement>e.target).value);
            } else {
                setName("Unknown Vigilante");
            }
            parentEl.removeChild(formContainer);
        }
    });
    const hint = document.createElement("p");
    hint.appendChild(document.createTextNode("[Press Enter to play]"));
    formContainer.appendChild(title);
    formContainer.appendChild(input);
    formContainer.appendChild(hint);
    parentEl.appendChild(formContainer);
    return formContainer;
};
