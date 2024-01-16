function openModal() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('modal').style.display = 'none';
}

function setModalContext({ header, body, buttons = [] }) {
    const modalHeader = document.querySelector("#modal .modal-header")
    const modalBody = document.querySelector("#modal .modal-body")
    const buttonsContainer = document.querySelector("#modal .buttons-container")
    modalHeader.textContent = header
    modalBody.textContent = body
    const getButtonElement = (name) => {
        const temp = document.createElement("template")
        temp.innerHTML = `<button type="button">${name}</button>`
        return temp.content.firstChild
    }
    buttonsContainer.innerHTML = ""
    for (let btn of buttons) {
        if (!btn || !btn.name || !btn.onClick) return
        const buttonElement = getButtonElement(btn.name)
        buttonElement.addEventListener("click", btn.onClick)
        buttonsContainer.appendChild(buttonElement)
    }
}