(function () {
    "use strict";

    // Estado global utilizado pelo script
    window.BASE_TEMP = null;
    window.__ak_guard = null;
    window.__ak_panel = null;
    window.__ak_turmas = [];
    window.__ak_selectedTurmaId = null;

    // Configurações principais
    const API_BASE = "http://localhost:3000";
    const LS_DATA = "ak_faltosos_num_nome_data_v6";
    const SEL_FREQ = /frequencia_chamada(\?|$)/;

    // Normaliza texto para comparação
    const norm = s =>
        (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();

    // Atalhos para querySelector
    const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));
    const $ = (s, root = document) => root.querySelector(s);

    // Delay simples
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // Verifica se está na tela de frequência
    const isFreq = () => SEL_FREQ.test(location.pathname + location.search);

    // Faz requisição GET para API
    async function fetchApi(path) {
        const response = await fetch(`${API_BASE}${path}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`API retornou ${response.status}`);
        }

        return response.json();
    }

    // Carrega lista de turmas
    async function carregarTurmas() {

        const status = $("#ak-panel .status");

        if (status) {
            status.textContent = "Buscando turmas...";
        }

        let turmas = [];

        try {

            const response = await fetchApi("/turmas");

            console.log("RESPOSTA TURMAS:", response);

            if (Array.isArray(response) && response.length) {

                turmas = response.map(t => ({
                    id: t.id || t.turma_id || t.id_turma,
                    nome: t.nome || t.name || `Turma ${t.id || t.turma_id || t.id_turma}`
                }));
            }

        } catch (err) {

            console.warn("Falha ao buscar /turmas, tentando /alunos", err);
        }

        // Fallback usando lista de alunos
        if (!turmas.length) {

            try {

                const alunos = await fetchApi("/alunos");

                if (Array.isArray(alunos) && alunos.length) {

                    const ids = [
                        ...new Set(
                            alunos
                                .map(aluno =>
                                    aluno.turmaId ||
                                    aluno.turma_id ||
                                    aluno.turma ||
                                    aluno.id_turma
                                )
                                .filter(Boolean)
                        )
                    ];

                    turmas = ids.map(id => ({
                        id,
                        nome: `Turma ${id}`
                    }));
                }

            } catch (err) {

                console.error("Falha ao buscar /alunos", err);
            }
        }

        console.log("TURMAS PROCESSADAS:", turmas);

        window.__ak_turmas = Array.isArray(turmas) ? turmas : [];

        const select = $("#ak-turma-select");

        // Atualiza select de turmas
        if (select) {

            select.innerHTML = `
                <option value="">Selecione turma</option>
                ${window.__ak_turmas
                    .map(t => `
                        <option value="${t.id}">
                            ${t.nome || t.name || t.id}
                        </option>
                    `)
                    .join("")}
            `;
        }

        // Atualiza status
        if (status) {

            status.textContent = window.__ak_turmas.length
                ? `Turmas carregadas: ${window.__ak_turmas.length}`
                : "Nenhuma turma encontrada";
        }
    }

    // Carrega faltosos de uma turma específica
    async function carregarFaltososTurma(turmaId) {

        if (!turmaId) {
            return false;
        }

        const dados = await fetchApi(
            `/alunos/turma/${encodeURIComponent(turmaId)}`
        );

        return carregarBaseJson(dados);
    }

    // Aguarda carregamento da página
    async function esperaCarregar(maxMs = 4000) {

        const t0 = Date.now();

        while (Date.now() - t0 < maxMs) {

            if (
                document.body &&
                document.querySelectorAll(
                    '.col-xs-9.col-sm-8.col-md-10 .toggle'
                ).length
            ) {
                return true;
            }

            await sleep(80);
        }

        return !!document.body;
    }

    // Obtém matrícula do card
    function getMatricula(card) {

        const txt = card.textContent || "";
        const m = txt.match(/\((\d{7})\)/);

        return m ? m[1] : null;
    }

    // Obtém número do aluno
    function getNumero(card) {

        const el = card.querySelector("#numero");

        return el
            ? parseInt(el.textContent.trim(), 10)
            : null;
    }

    // Obtém nome do aluno
    function getNome(card) {

        const txt = card.textContent;

        const m = txt.match(
            /([A-ZÁÉÍÓÚÂÊÔÃÕÇ ]+)\s*\(\d{7}\)/i
        );

        return m ? m[1].trim() : "";
    }

    // Obtém tempos selecionados no select
    function getTemposSelecionados() {

        const select = document.querySelector("#aulas");

        if (!select) {
            return [];
        }

        return Array.from(select.selectedOptions)
            .map(opt => Number(opt.value));
    }

    // Mapeia toggles por período
    function getTogglesPorPeriodo(card) {

        const map = new Map();

        const blocos = card.querySelectorAll(
            '[data-containter-itens="true"]'
        );

        blocos.forEach(b => {

            const periodoEl = b.querySelector(
                'small[data-periodo]'
            );

            const toggle = b.querySelector(".toggle");

            if (!periodoEl || !toggle) {
                return;
            }

            const periodo = parseInt(
                periodoEl.dataset.periodo,
                10
            );

            map.set(periodo, toggle);
        });

        return map;
    }

    // Gera horários das aulas
    function gerarAulas() {

        const aulas = [];

        function add(periodo, inicio, fim) {

            aulas.push({
                periodo,
                inicio,
                fim
            });
        }

        add(1, "07:20", "08:10");
        add(2, "08:10", "09:00");

        add(3, "09:15", "10:05");
        add(4, "10:05", "10:55");
        add(5, "10:55", "11:45");

        add(6, "13:00", "13:50");
        add(7, "13:50", "14:40");

        add(8, "14:55", "15:45");
        add(9, "15:45", "16:35");

        return aulas;
    }

    // Converte HH:MM para minutos
    function toMin(h) {

        if (!h) {
            return null;
        }

        const [hh, mm] = h.split(":").map(Number);

        return hh * 60 + mm;
    }

    // Calcula períodos faltados
    function calcularTempos(entrada, saida, aulas) {

        const ent = toMin(entrada);
        const sai = toMin(saida);

        // Sem horários = falta em todos
        if (ent === null && sai === null) {

            return aulas.map(aula => aula.periodo);
        }

        const tempos = [];

        aulas.forEach(aula => {

            const ini = toMin(aula.inicio);
            const fim = toMin(aula.fim);

            // Presença se houve interseção
            const presente = ent < fim && sai > ini;

            if (!presente) {
                tempos.push(aula.periodo);
            }
        });

        return tempos;
    }

    // Retorna base atual
    async function carregarBase() {

        return window.BASE_TEMP || [];
    }

    // Marca faltas no card
    async function marcarF(card, tempos) {

        const togglesMap = getTogglesPorPeriodo(card);
        const temposAtivos = getTemposSelecionados();

        let alterados = 0;

        for (const periodo of tempos) {

            // Ignora períodos não ativos
            if (!temposAtivos.includes(periodo)) {
                continue;
            }

            const tg = togglesMap.get(periodo);

            if (!tg) {
                continue;
            }

            const input = tg.querySelector(
                'input[type="checkbox"]'
            );

            // Marca apenas se ainda estiver presente
            if (input && input.checked) {

                tg.click();

                await sleep(120);

                alterados++;
            }
        }

        return alterados > 0;
    }

    // Aplica faltas na tela
    async function colarFaltosos() {

        const base = await carregarBase();

        if (!base.length) {

            alert("Nenhuma base carregada.");
            return;
        }

        const aulas = gerarAulas();

        const data = {
            nomes: base.map(aluno => ({
                matricula: aluno.matricula,
                nome: aluno.nome,
                tempos: calcularTempos(
                    aluno.entrada,
                    aluno.saida,
                    aulas
                )
            }))
        };

        if (
            !data ||
            !Array.isArray(data.nomes) ||
            !data.nomes.length
        ) {
            alert("Nenhuma lista salva.");
            return;
        }

        await esperaCarregar();

        const cards = document.querySelectorAll(
            ".col-xs-9.col-sm-8.col-md-10"
        );

        const byNum = new Map();
        const byNome = new Map();
        const byMatricula = new Map();

        // Indexa cards
        for (const c of cards) {

            const n = getNumero(c);

            if (n != null) {
                byNum.set(n, c);
            }

            const nm = getNome(c);

            if (nm) {
                byNome.set(norm(nm), c);
            }

            const mat = getMatricula(c);

            if (mat) {
                byMatricula.set(mat, c);
            }
        }

        let ok = 0;

        // Procura e aplica faltas
        for (const it of data.nomes) {

            let card = null;

            if (
                it.matricula &&
                byMatricula.has(it.matricula)
            ) {

                card = byMatricula.get(it.matricula);

            } else if (
                it.numero != null &&
                byNum.has(Number(it.numero))
            ) {

                card = byNum.get(Number(it.numero));

            } else if (it.nome) {

                card = byNome.get(norm(it.nome));
            }

            if (!card) {
                continue;
            }

            card.scrollIntoView({
                block: "center"
            });

            await sleep(70);

            if (await marcarF(card, it.tempos)) {
                ok++;
            }
        }

        alert(`Aplicados ${ok} F.`);
    }

    // Monta painel principal
    function montarUI() {

        if ($("#ak-panel")) {
            return;
        }

        // CSS do painel
        const css = document.createElement("style");

        css.textContent = `
#ak-panel{
    position:fixed;
    right:12px;
    top:12px;
    z-index:2147483647;
    background:#fff;
    border:1px solid #ddd;
    border-radius:12px;
    box-shadow:0 8px 28px rgba(0,0,0,.22);
    width:260px;
    font:13px system-ui
}

#ak-panel .head{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:10px;
    border-bottom:1px solid #eee;
    font-weight:700
}

#ak-panel .grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    padding:10px
}

#ak-panel .btn{
    padding:10px;
    border:0;
    border-radius:9px;
    cursor:pointer;
    color:#fff;
    font-size:13px
}

#ak-panel .btn.load{
    background:#3b82f6
}

#ak-panel .paste{
    background:#16a34a
}

#ak-panel .closebtn{
    background:#ef4444
}

#ak-panel select{
    width:calc(100% - 20px);
    margin:10px;
    border:1px solid #ccc;
    border-radius:8px;
    padding:8px 10px;
    font-size:13px
}

#ak-panel .status{
    padding:0 10px 12px;
    font-size:12px;
    color:#444
}`;

        document.head.appendChild(css);

        // Estrutura do painel
        const box = document.createElement("div");

        box.id = "ak-panel";

        box.innerHTML = `
<div class="head">Faltosos</div>

<div class="grid">
    <button class="btn load">
        Carregar turmas
    </button>

    <button class="btn paste">
        Aplicar faltas
    </button>

    <button class="btn closebtn" style="grid-column:1/3">
        Fechar
    </button>
</div>

<select id="ak-turma-select">
    <option value="">
        Selecione turma
    </option>
</select>

<div class="status">
    Salvos: 0
</div>`;

        document.body.appendChild(box);

        window.__ak_panel = box;

        // Carrega turmas
        box.querySelector(".load").onclick = carregarTurmas;

        // Aplica faltas
        box.querySelector(".paste").onclick = async () => {

            await esperaCarregar();

            const selectedTurma =
                $("#ak-turma-select")?.value;

            if (selectedTurma) {

                const ok =
                    await carregarFaltososTurma(
                        selectedTurma
                    );

                if (!ok) {

                    alert(
                        "Não foi possível carregar faltosos dessa turma."
                    );

                    return;
                }

            } else if (
                !(window.BASE_TEMP && window.BASE_TEMP.length)
            ) {

                alert(
                    "Selecione uma turma antes de aplicar."
                );

                return;
            }

            await colarFaltosos();
        };

        // Fecha painel
        box.querySelector(".closebtn").onclick = () => {

            try {

                window.__ak_guard &&
                    window.__ak_guard.disconnect();

            } catch { }

            try {

                window.__ak_panel &&
                    window.__ak_panel.remove();

            } catch { }

            window.__ak_panel = null;
        };

        atualizarStatus();
    }

    // Atualiza texto de status
    function atualizarStatus() {

        const s = $("#ak-panel .status");

        if (!s) {
            return;
        }

        const base = window.BASE_TEMP || [];

        const select = $("#ak-turma-select");

        const selectedName =
            select?.selectedOptions?.[0]?.textContent;

        s.textContent = base.length
            ? `${selectedName ? selectedName + " - " : ""}Carregados: ${base.length}`
            : "Nenhum carregado";
    }

    // Carrega JSON para memória temporária
    function carregarBaseJson(json) {

        if (!json || typeof json !== "object") {
            return false;
        }

        let base = [];

        if (Array.isArray(json)) {

            base = json;

        } else if (
            json.nomes &&
            Array.isArray(json.nomes)
        ) {

            base = json.nomes;

        } else if (json.matricula) {

            base = [json];

        } else {

            return false;
        }

        window.BASE_TEMP = base;

        atualizarStatus();

        return true;
    }

    console.log("CONTENT SCRIPT CARREGADO");

    // Listener de mensagens da extensão
    chrome.runtime.onMessage.addListener(

        (msg, sender, sendResponse) => {

            console.log(
                "MENSAGEM RECEBIDA:",
                msg
            );

            // Inicializa painel
            if (msg.type === "INIT_FALTOSOS") {

                (async () => {

                    console.log(
                        "INICIANDO PAINEL"
                    );

                    await esperaCarregar();

                    montarUI();

                    sendResponse({
                        ok: true
                    });

                })();

                return true;
            }

            // Carrega JSON manualmente
            if (msg.type === "LOAD_FALTOSOS_JSON") {

                const ok = carregarBaseJson(
                    msg.payload
                );

                sendResponse({
                    ok
                });

                return true;
            }
        }
    );

})();