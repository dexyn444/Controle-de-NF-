// Obtém a data de trabalho atual (Formato: DD/MM/AAAA)
const hoje = new Date().toLocaleDateString('pt-BR');
document.getElementById('current-work-date').textContent = hoje;

// Banco de dados persistente carregado com base na Data de Trabalho atual
let queue = JSON.parse(localStorage.getItem(`nfs_${hoje}`)) || [];

const entryForm = document.getElementById('nf-entry-form');
const nfInput = document.getElementById('nf-input');
const rowsContainer = document.getElementById('nf-rows');
const clearDoneBtn = document.getElementById('btn-clear-done');

// Elementos da IA e Modos
const modeToggle = document.getElementById('mode-toggle');
const modeLabel = document.getElementById('mode-label');
const scannerIndicator = document.getElementById('scanner-indicator');
const inputLabel = document.getElementById('input-label');
const inputHint = document.getElementById('input-hint');
const btnSubmit = document.getElementById('btn-submit');
const inputSection = document.querySelector('.input-section');
const iaInput = document.getElementById('ia-input');
const btnIaCmd = document.getElementById('btn-ia-cmd');

const mTotal = document.getElementById('metric-total');
const mPending = document.getElementById('metric-pending');
const mEfficiency = document.getElementById('metric-efficiency');
const iaInsights = document.getElementById('ia-insights');

let isScannerMode = false;

// Salva dados no LocalStorage isolados por dia
function salvarDados() {
    localStorage.setItem(`nfs_${hoje}`, JSON.stringify(queue));
}

// Chaveador de Modos (Manual/Bipe)
modeToggle.addEventListener('change', function() {
    isScannerMode = this.checked;
    if (isScannerMode) {
        modeLabel.textContent = "Modo Bipe (Leitor)";
        scannerIndicator.classList.remove('hidden');
        inputSection.classList.add('scanner-mode-active');
        inputLabel.textContent = "Aponte o leitor e Bipe o código";
        inputHint.textContent = "Modo Bipe Ativo: Salvamento automático instantâneo.";
        btnSubmit.classList.add('hidden');
        nfInput.placeholder = "Pode bipar agora...";
        nfInput.focus();
    } else {
        modeLabel.textContent = "Modo Manual";
        scannerIndicator.classList.add('hidden');
        inputSection.classList.remove('scanner-mode-active');
        inputLabel.textContent = "Inserir Número da NF";
        inputHint.textContent = "Modo Manual: Digite a nota e clique em Registrar.";
        btnSubmit.classList.remove('hidden');
        nfInput.placeholder = "Digite o número e clique em Registrar...";
    }
    processarIA('', false, 'mudanca_modo');
});

document.addEventListener('click', (e) => {
    // Só prende o foco se estiver no Modo Bipe e não estiver digitando na caixa da IA
    if (isScannerMode && document.activeElement !== iaInput) {
        nfInput.focus();
    }
});

// Registro de Nota (Manual ou Bipe)
entryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let rawValue = nfInput.value.trim();
    if (!rawValue) return;

    let cleanNumber = rawValue.replace(/\D/g, '');

    if (cleanNumber.length === 44) {
        const numeroExtraido = cleanNumber.substring(25, 34);
        cleanNumber = parseInt(numeroExtraido, 10).toString();
    }

    let duplicada = false;

    if (cleanNumber.length > 0) {
        if (queue.some(item => item.numero === cleanNumber)) {
            duplicada = true;
        } else {
            queue.push({
                id: Date.now() + Math.random(),
                numero: cleanNumber,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                impresso: false
            });
            salvarDados();
        }
    }

    nfInput.value = '';
    render();
    processarIA(cleanNumber, duplicada);
});

function marcarImpresso(id) {
    const item = queue.find(x => x.id === id);
    if (item) {
        item.impresso = true;
        salvarDados();
        render();
        processarIA('', false, 'impressao');
    }
}

clearDoneBtn.addEventListener('click', () => {
    // Mantém no banco do dia, mas remove visualmente limpando a exibição imediata se quiser
    // Para um fluxo contínuo profissional, filtramos apenas as não impressas da tela atual
    queue = queue.filter(item => !item.impresso);
    salvarDados();
    render();
    processarIA('', false, 'limpeza');
});

// INTERPRETAÇÃO DE COMANDOS DA IA (PROCESSAMENTO DE LINGUAGEM NATURAL SIMULADO)
function executarComandoIA() {
    const comando = iaInput.value.toLowerCase().trim();
    if (!comando) return;

    // Procura por números dentro da frase digitada (Ex: "exclua a nota 4020")
    const numerosEncontrados = comando.match(/\d+/);

    if (numerosEncontrados) {
        const numeroNota = numerosEncontrados[0];
        
        // Verifica se o comando possui palavras-chave de exclusão
        if (comando.includes('excluir') || comando.includes('apagar') || comando.includes('remover') || comando.includes('deletar')) {
            const indice = queue.findIndex(item => item.numero === numeroNota);
            
            if (indice !== -1) {
                queue.splice(indice, 1); // Remove a nota da lista
                salvarDados();
                render();
                iaInsights.innerHTML = `💥 <strong>Ação IA:</strong> Entendido! Localizei a nota <strong>#${numeroNota}</strong> no banco de dados de hoje e efetuei a exclusão permanente conforme solicitado.`;
            } else {
                iaInsights.innerHTML = `🔍 <strong>Ação IA:</strong> Você pediu para excluir a nota #${numeroNota}, mas não encontrei nenhuma nota com esse número registrada no dia de hoje (<strong>${hoje}</strong>).`;
            }
        } else {
            iaInsights.innerHTML = `🤖 <strong>Dica da IA:</strong> Você mencionou o número #${numeroNota}. Se deseja que eu apague, digite algo como: <em>"excluir nota ${numeroNota}"</em>.`;
        }
    } else {
        iaInsights.innerHTML = `❓ <strong>Comando não reconhecido:</strong> Tente comandos diretos como: "excluir nota 123" ou "apagar 450".`;
    }
    iaInput.value = '';
}

// Ouvintes de evento da caixa da IA
btnIaCmd.addEventListener('click', executarComandoIA);
iaInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') executarComandoIA(); });

function render() {
    rowsContainer.innerHTML = '';
    let total = queue.length;
    let pendentes = 0;

    queue.forEach(item => {
        if (!item.impresso) pendentes++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: monospace; color: var(--text-muted);">${item.timestamp}</td>
            <td style="font-family: monospace; font-weight: 700; font-size: 1.1rem; color: var(--accent);">#${item.numero}</td>
            <td>
                <span class="badge ${item.impresso ? 'badge-success' : 'badge-pending'}">
                    ${item.impresso ? 'Impresso' : 'Pendente'}
                </span>
            </td>
            <td class="text-right">
                ${!item.impresso ? `<button class="btn-action-ok" onclick="marcarImpresso(${item.id})">✔ Confirmar Impressão</button>` : '<span style="color: var(--success); font-size: 0.85rem; font-weight:600;">✓ Processado</span>'}
            </td>
        `;
        rowsContainer.appendChild(tr);
    });

    mTotal.textContent = total;
    mPending.textContent = pendentes;
    const ef = total > 0 ? Math.round(((total - pendentes) / total) * 100) : 100;
    mEfficiency.textContent = `${ef}%`;
}

function processarIA(numeroNota, foiDuplicada, gatilho = '') {
    const totalPendentes = queue.filter(x => !x.impresso).length;
    let log = "";

    if (gatilho === 'mudanca_modo') {
        log = isScannerMode 
            ? `🤖 <strong>Modo Bipe Ativado:</strong> Travado para entrada de leitor. Dados salvos no lote do dia <strong>${hoje}</strong>.`
            : `🤖 <strong>Modo Manual Ativado:</strong> Digite o número da nota e confirme. Tudo ficará salvo no histórico de hoje.`;
        iaInsights.innerHTML = log;
        return;
    }

    if (foiDuplicada) {
        log += `🚨 <strong>Duplicidade:</strong> A nota <strong>#${numeroNota}</strong> já foi registrada hoje. Bloqueado para segurança. <br><br>`;
    } else if (numeroNota) {
        log += `📥 <strong>Arquivado:</strong> Nota <strong>#${numeroNota}</strong> salva com sucesso na pasta do dia de hoje.`;
    } else if (gatilho === 'impressao') {
        log += `✓ <strong>Despacho:</strong> Item marcado como impresso no banco diário.`;
    } else if (gatilho === 'limpeza') {
        log += `🧹 <strong>Filtro aplicado:</strong> Ocultando notas já impressas para despoluir sua visão de trabalho.`;
    }

    if (totalPendentes > 8) {
        log += `<br><br>⚠️ <strong>Atenção:</strong> Volume de notas acumuladas está alto para o dia de hoje. Considere dar vazão às impressões.`;
    }
    iaInsights.innerHTML = log;
}

// Renderização inicial ao abrir a página
render();