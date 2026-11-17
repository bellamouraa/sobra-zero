/*
   armazenamento.js — Guarda os itens no localStorage do navegador.
   Os dados NÃO saem do computador do usuário.
*/

// Itens salvos em versões antigas não têm os campos de doação e destino.
// Esta função completa os campos que faltam, sem apagar nada.
function completarCamposNovos(item) {
  return {
    ...item,
    doacao: item.doacao === true,
    bairro: item.bairro ?? "",
    destino: item.destino ?? "",
    finalizadoEm: item.finalizadoEm ?? ""
  };
}

// Confere se um item lido do localStorage tem o formato esperado.
// (Quem abre o DevTools pode alterar o localStorage, então não confiamos nele.)
function itemTemFormatoValido(bruto) {
  if (bruto === null || typeof bruto !== "object") return false;

  const item = completarCamposNovos(bruto);
  if (typeof item.id !== "string" || !/^[a-z0-9]{5,30}$/.test(item.id)) return false;
  if (typeof item.criadoEm !== "string" || Number.isNaN(Date.parse(item.criadoEm))) return false;

  // Destino: vazio (item ativo) ou um dos valores permitidos.
  const finalizado = item.destino !== "";
  if (finalizado && !DESTINOS.includes(item.destino)) return false;
  if (finalizado && Number.isNaN(Date.parse(item.finalizadoEm))) return false;

  // Itens do histórico podem ter validade antiga.
  return Object.keys(validarDadosItem(item, finalizado)).length === 0;
}

// Copia só os campos conhecidos (descarta qualquer campo extra).
function normalizarItem(bruto) {
  const item = completarCamposNovos(bruto);
  const finalizado = item.destino !== "";
  return {
    id: item.id,
    nome: limparTexto(item.nome),
    categoria: item.categoria,
    quantidade: converterQuantidade(item.quantidade),
    unidade: item.unidade,
    validade: item.validade,
    doacao: finalizado ? false : item.doacao,      // só item ativo fica no mural
    bairro: !finalizado && item.doacao ? limparTexto(item.bairro) : "",
    destino: item.destino,
    finalizadoEm: finalizado ? item.finalizadoEm : "",
    criadoEm: item.criadoEm
  };
}

// Lê os itens salvos. Pode lançar erro: quem chama usa try/catch.
function carregarItens() {
  const texto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
  if (texto === null) return { itens: [], descartados: 0 };

  const lista = JSON.parse(texto);
  if (!Array.isArray(lista)) throw new Error("Formato inesperado");

  const validos = lista.filter(itemTemFormatoValido).map(normalizarItem);
  return {
    itens: validos.slice(0, LIMITES.maxItens + LIMITES.maxHistorico),
    descartados: lista.length - validos.length
  };
}

// Salva os itens. Retorna true se deu certo, false se falhou.
function salvarItens(itens) {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(itens));
    return true;
  } catch (erro) {
    console.error("Falha ao salvar:", erro); // detalhe técnico só no console
    return false;
  }
}