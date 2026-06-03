const btn = document.getElementById("init");
const status = document.getElementById("status");

async function getActiveProfessorTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

function isAllowedPage(url) {
    return url.includes("professor.seduc.ce.gov.br") || url.includes("/ScriptBiometriaAFS/index.html");
}

async function executeContentScript(tabId) {
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript(
            {
                target: { tabId },
                files: ["config.js","content.js"]
            },
            () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve();
            }
        );
    });
}

async function sendInitMessage(tabId) {
    return new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, { type: "INIT_FALTOSOS" }, response => {
            resolve({ response, error: chrome.runtime.lastError });
        });
    });
}

btn.onclick = async () => {
    const tab = await getActiveProfessorTab();

    if (!tab?.url || !isAllowedPage(tab.url)) {
        status.textContent = "Abra o Professor Online.";
        return;
    }

    let result = await sendInitMessage(tab.id);
    if (result.error || !result.response?.ok) {
        try {
            await executeContentScript(tab.id);
        } catch (err) {
            console.error(err);
            status.textContent = "Erro ao injetar content script.";
            return;
        }

        result = await sendInitMessage(tab.id);
    }

    if (result.error || !result.response?.ok) {
        status.textContent = "Erro ao iniciar.";
        return;
    }

    status.textContent = "Sistema iniciado.";

    setTimeout(() => {
        window.close();
    }, 300);
};

