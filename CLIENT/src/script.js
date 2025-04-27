let h1 = document.getElementById("result")
const form = document.querySelector("form");
const chatfield = document.getElementById("chatfield");
const submit = document.querySelector("button")
let messages = []

form.addEventListener("submit", (e) => askQuestion(e))

function disableSubmitButton(){
    if(chatfield.value.trim() == ""){
        submit.disabled = true
    }else{
        submit.disabled = false
    }
}
disableSubmitButton()
chatfield.addEventListener("input", disableSubmitButton);
async function askQuestion(e) {
    e.preventDefault()

    submit.disabled = true;
    chatfield.disabled = true;

    messages.push(["human", chatfield.value.trim()])


    chatfield.value = "";
    disableSubmitButton();
    h1.innerText = "";

    const options = {
        method: 'POST',
        mode:'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
    }
    try {
        const response = await fetch("http://localhost:8000/", options)
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let assistantReply = ""

        while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            assistantReply += chunk
            h1.innerText += chunk
        }

        messages.push(["assistant", assistantReply]);

    } catch (error) {
        console.error(error);
    } finally {
        chatfield.disabled = false;
        disableSubmitButton();
    }
}