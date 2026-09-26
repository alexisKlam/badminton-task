import { MAX_PEOPLE } from "./config.js";

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

// Renders an editable list of names (chips + add field) into `container` and mutates `people` in place.
export function renderPeopleEditor(container, people) {
  const input = el("input", { placeholder: "Prénom", maxLength: 40, enterKeyHint: "done" });
  const add = el("button", { type: "button", className: "ghost", textContent: "Ajouter" });
  const chips = el("div", { className: "chips" });

  function renderChips() {
    chips.replaceChildren(...people.map((name, index) => {
      const remove = el("button", { type: "button", textContent: "✕", ariaLabel: `Retirer ${name}` });
      remove.addEventListener("click", () => { people.splice(index, 1); renderChips(); });
      return el("span", { className: "chip" }, name, remove);
    }));
  }

  function addPerson() {
    const name = input.value.trim();
    if (name && people.includes(name) === false && people.length < MAX_PEOPLE) {
      people.push(name);
      renderChips();
    }
    input.value = "";
    input.focus();
  }

  add.addEventListener("click", addPerson);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPerson();
    }
  });
  renderChips();
  container.replaceChildren(chips, el("div", { className: "add-item" }, input, add));
}
