/*
   planejador.js — Lógica da página do planejador.
   CRUD: adicionar, listar, editar e remover itens, sempre
   atualizando a página pelo DOM.
*/

let itens = [];           // lista de itens em memória
let idEmEdicao = null;    // id do item que está sendo editado (ou null)
let filtroAtual = "todos";
const el = {};            // guarda os elementos da página

const FILTROS_VALIDOS = ["todos", "atencao", "vencido", "ok"];

document.addEventListener("DOMContentLoaded", iniciar);

/* ---------- Início ---------- */

function iniciar() {
  capturarElementos();
  preencherOpcoes();
  configurarEventos();
  carregarDadosIniciais();
}

function capturarElementos() {
  el.form = document.getElementById("form-item");
  el.campos = {
    nome: document.getElementById("nome"),
    categoria: document.getElementById("categoria"),
    quantidade: document.getElementById("quantidade"),
    unidade: document.getElementById("unidade"),
    validade: document.getElementById("validade"),
    doacao: document.getElementById("doacao"),
    bairro: document.getElementById("bairro")
  };
  el.blocoBairro = document.getElementById("bloco-bairro");
  el.tituloForm = document.getElementById("titulo-form");
  el.botaoSalvar = document.getElementById("botao-salvar");
  el.botaoCancelar = document.getElementById("botao-cancelar");
  el.mensagem = document.getElementById("mensagem-status");
  el.lista = document.getElementById("lista-itens");
  el.listaVazia = document.getElementById("lista-vazia");
  el.filtro = document.getElementById("filtro");
  el.totalItens = document.getElementById("resumo-total");
  el.totalAtencao = document.getElementById("resumo-atencao");
  el.totalVencidos = document.getElementById("resumo-vencidos");
}

// Preenche os <select> a partir do config.js (evita repetir listas no HTML).
function preencherOpcoes() {
  CATEGORIAS.forEach((categoria) => adicionarOpcao(el.campos.categoria, categoria));
  UNIDADES.forEach((unidade) => adicionarOpcao(el.campos.unidade, unidade));
}

function adicionarOpcao(select, texto) {
  const opcao = document.createElement("option");
  opcao.value = texto;
  opcao.textContent = texto;
  select.appendChild(opcao);
}

function configurarEventos() {
  el.form.addEventListener("submit", aoEnviarFormulario);
  el.botaoCancelar.addEventListener("click", cancelarEdicao);
  el.lista.addEventListener("click", aoClicarNaLista);
  el.filtro.addEventListener("change", aoMudarFiltro);
  el.campos.doacao.addEventListener("change", atualizarCampoBairro);

  // Ao digitar, some o erro daquele campo.
  Object.keys(el.campos).forEach((nome) => {
    el.campos[nome].addEventListener("input", () => limparErroDoCampo(nome));
  });
}

function carregarDadosIniciais() {
  try {
    const resultado = carregarItens();
    itens = resultado.itens;
    renderizarLista();
    registrarAtividade("Listar itens", `${itensAtivos().length} item(ns) ativo(s) carregado(s)`);
    if (resultado.descartados > 0) {
      registrarAtividade("Carregar dados", `${resultado.descartados} item(ns) inválido(s) ignorado(s)`, false);
    }
  } catch (erro) {
    console.error("Falha ao carregar:", erro); // detalhe técnico só no console
    itens = [];
    renderizarLista();
    mostrarMensagem(MSG_ERRO_CARREGAR, "danger");
    registrarAtividade("Listar itens", "Falha ao carregar os dados", false);
  }
}

/* ---------- Formulário ---------- */

function aoEnviarFormulario(evento) {
  evento.preventDefault();
  limparErros();

  const resultado = validarFormulario(el.campos);
  if (!resultado.valido) {
    mostrarErros(resultado.erros);
    const qtd = Object.keys(resultado.erros).length;
    registrarAtividade(idEmEdicao ? "Editar item" : "Adicionar item", `Dados inválidos (${qtd} campo(s) com erro)`, false);
    return;
  }

  if (idEmEdicao) {
    editarItem(idEmEdicao, resultado.dados);
  } else {
    adicionarItem(resultado.dados);
  }
}

function mostrarErros(erros) {
  let primeiroComErro = null;

  Object.keys(el.campos).forEach((nome) => {
    if (!erros[nome]) return;
    el.campos[nome].classList.add("is-invalid");
    el.campos[nome].setAttribute("aria-invalid", "true");
    escreverErro(nome, erros[nome]);
    if (!primeiroComErro) primeiroComErro = el.campos[nome];
  });

  mostrarMensagem("Corrija os campos destacados e tente novamente.", "danger");
  if (primeiroComErro) primeiroComErro.focus();
}

// Escreve a mensagem de erro do campo (alguns campos, como o checkbox, não têm área de erro).
function escreverErro(nome, texto) {
  const area = document.getElementById(`erro-${nome}`);
  if (area) area.textContent = texto;
}

function limparErroDoCampo(nome) {
  el.campos[nome].classList.remove("is-invalid");
  el.campos[nome].removeAttribute("aria-invalid");
  escreverErro(nome, "");
}

// Mostra o campo "bairro" só quando a doação está marcada.
// Quando está visível ele é obrigatório; quando está escondido, é limpo.
function atualizarCampoBairro() {
  const doando = el.campos.doacao.checked;
  el.blocoBairro.hidden = !doando;
  el.campos.bairro.required = doando;
  if (!doando) {
    el.campos.bairro.value = "";
    limparErroDoCampo("bairro");
  }
}

function limparErros() {
  Object.keys(el.campos).forEach(limparErroDoCampo);
  esconderMensagem();
}

function mostrarMensagem(texto, tipo) {
  el.mensagem.className = `alert alert-${tipo} mt-3`;
  el.mensagem.textContent = texto;
  el.mensagem.hidden = false;
}

function esconderMensagem() {
  el.mensagem.hidden = true;
  el.mensagem.textContent = "";
}

/* ---------- CRUD ---------- */

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buscarItem(id) {
  return itens.find((item) => item.id === id);
}

// Itens ativos = ainda estão na cozinha (destino vazio).
// Os demais ficam no histórico e aparecem na página de Impacto.
function itensAtivos() {
  return itens.filter((item) => !item.destino);
}

// ADICIONAR
function adicionarItem(dados) {
  if (itensAtivos().length >= LIMITES.maxItens) {
    mostrarMensagem(`Limite de ${LIMITES.maxItens} itens atingido. Remova algum item.`, "warning");
    registrarAtividade("Adicionar item", "Limite de itens atingido", false);
    return;
  }

  itens.push({ id: gerarId(), ...dados, destino: "", finalizadoEm: "", criadoEm: new Date().toISOString() });
  finalizarOperacao("Adicionar item", `"${dados.nome}" adicionado com sucesso`);
  el.form.reset();
  atualizarCampoBairro();
  el.campos.nome.focus();
}

// EDITAR
function editarItem(id, dados) {
  const item = buscarItem(id);
  if (!item) {
    mostrarMensagem("Item não encontrado. Atualize a página.", "danger");
    registrarAtividade("Editar item", "Item não encontrado", false);
    return;
  }

  Object.assign(item, dados);
  finalizarOperacao("Editar item", `"${item.nome}" atualizado com sucesso`);
  sairDoModoEdicao();
}

// REMOVER
function removerItem(id) {
  const item = buscarItem(id);
  if (!item) return;

  if (!window.confirm(`Remover "${item.nome}" sem contar no impacto? Para registrar que você usou, doou ou descartou, use os outros botões.`)) {
    registrarAtividade("Remover item", "Remoção cancelada pelo usuário", true);
    return;
  }

  itens = itens.filter((outro) => outro.id !== id);
  if (idEmEdicao === id) sairDoModoEdicao();
  finalizarOperacao("Remover item", `"${item.nome}" removido com sucesso`);
}

// FINALIZAR: o alimento teve um destino (consumido, doado ou descartado).
// Ele sai da lista, deixa o mural e vai para o histórico (conta no painel de impacto).
function finalizarItem(id, destino) {
  const item = buscarItem(id);
  if (!item || !DESTINOS.includes(destino)) return;

  item.destino = destino;
  item.finalizadoEm = new Date().toISOString();
  item.doacao = false;
  item.bairro = "";
  if (idEmEdicao === id) sairDoModoEdicao();

  const rotulo = ROTULOS_DESTINO[destino].toLowerCase();
  finalizarOperacao("Finalizar item", `"${item.nome}" marcado como ${rotulo}`);
}

// Salva, atualiza a tela e registra a atividade (usado por adicionar/editar/remover).
function finalizarOperacao(acao, textoResultado) {
  const salvou = salvarItens(itens);
  renderizarLista();

  if (salvou) {
    mostrarMensagem(textoResultado, "success");
    registrarAtividade(acao, textoResultado);
  } else {
    mostrarMensagem(MSG_ERRO_SALVAR, "warning");
    registrarAtividade(acao, "Feito na tela, mas não foi possível salvar no navegador", false);
  }
}

/* ---------- Modo de edição ---------- */

function iniciarEdicao(id) {
  const item = buscarItem(id);
  if (!item) return;

  limparErros();
  idEmEdicao = id;

  el.campos.nome.value = item.nome;
  el.campos.categoria.value = item.categoria;
  el.campos.quantidade.value = item.quantidade;
  el.campos.unidade.value = item.unidade;
  el.campos.validade.value = item.validade;
  el.campos.doacao.checked = item.doacao;
  el.campos.bairro.value = item.bairro;
  atualizarCampoBairro();

  el.tituloForm.textContent = "Editar item";
  el.botaoSalvar.textContent = "Salvar alterações";
  el.botaoCancelar.hidden = false;
  el.form.scrollIntoView({ behavior: "smooth", block: "start" });
  el.campos.nome.focus();
}

function cancelarEdicao() {
  sairDoModoEdicao();
  limparErros();
  registrarAtividade("Editar item", "Edição cancelada pelo usuário", true);
}

function sairDoModoEdicao() {
  idEmEdicao = null;
  el.form.reset();
  atualizarCampoBairro();
  el.tituloForm.textContent = "Adicionar item";
  el.botaoSalvar.textContent = "Adicionar item";
  el.botaoCancelar.hidden = true;
}

/* ---------- Lista (LISTAR) ---------- */

function aoClicarNaLista(evento) {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  const id = botao.dataset.id;
  if (botao.dataset.acao === "editar") iniciarEdicao(id);
  if (botao.dataset.acao === "remover") removerItem(id);
  if (DESTINOS.includes(botao.dataset.acao)) finalizarItem(id, botao.dataset.acao);
}

function aoMudarFiltro() {
  filtroAtual = FILTROS_VALIDOS.includes(el.filtro.value) ? el.filtro.value : "todos";
  renderizarLista();
  registrarAtividade("Listar itens", `Filtro aplicado: ${el.filtro.options[el.filtro.selectedIndex].text}`);
}

function dicaDoItem(item, status) {
  if (status === "atencao") return `Use primeiro! ${DICAS_POR_CATEGORIA[item.categoria] || ""}`;
  if (status === "vencido") return "Confira aparência, cheiro e armazenamento. Na dúvida, não consuma.";
  return "";
}

function renderizarLista() {
  const visiveis = itensAtivos()
    .filter((item) => filtroAtual === "todos" || statusDoItem(item) === filtroAtual)
    .sort((a, b) => a.validade.localeCompare(b.validade)); // vence primeiro = aparece primeiro

  el.lista.replaceChildren();
  el.listaVazia.hidden = visiveis.length > 0;
  visiveis.forEach((item) => el.lista.appendChild(criarCartaoDoItem(item)));
  renderizarResumo();
  renderizarReceitas(itensAtivos()); // atualiza "O que cozinhar hoje?"
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto; // textContent: nunca interpreta HTML
  return elemento;
}

function criarCartaoDoItem(item) {
  const status = statusDoItem(item);
  const dias = diasAteVencer(item.validade);

  const cartao = criarElemento("li", `item item-${status}`);
  const quantidade = String(item.quantidade).replace(".", ",");

  const topo = criarElemento("div", "item-topo");
  topo.append(
    criarElemento("h3", "item-nome", item.nome),
    criarElemento("span", `selo selo-${status}`, textoDoPrazo(dias))
  );

  cartao.append(
    topo,
    criarElemento("p", "item-detalhe", `${quantidade} ${item.unidade} · ${item.categoria}`),
    criarElemento("p", "item-detalhe", `Validade: ${formatarDataBR(item.validade)}`)
  );

  if (item.doacao) {
    cartao.appendChild(criarElemento("p", "item-doacao", `Oferecido para doação no bairro: ${item.bairro}`));
  }

  const dica = dicaDoItem(item, status);
  if (dica) cartao.appendChild(criarElemento("p", "item-dica", dica));

  const acoes = criarElemento("div", "item-acoes");
  acoes.append(
    criarBotaoDeAcao("consumido", item, "btn-success", "Consumi", "Marcar como consumido:"),
    criarBotaoDeAcao("doado", item, "btn-outline-success", "Doei", "Marcar como doado:"),
    criarBotaoDeAcao("descartado", item, "btn-outline-warning", "Descartei", "Marcar como descartado:"),
    criarBotaoDeAcao("editar", item, "btn-outline-secondary", "Editar"),
    criarBotaoDeAcao("remover", item, "btn-outline-danger", "Remover")
  );
  cartao.appendChild(acoes);

  return cartao;
}

function criarBotaoDeAcao(acao, item, classeBootstrap, texto, descricao) {
  const botao = criarElemento("button", `btn btn-sm ${classeBootstrap}`, texto);
  botao.type = "button";
  botao.dataset.acao = acao;
  botao.dataset.id = item.id;
  botao.setAttribute("aria-label", `${descricao ?? texto} ${item.nome}`);
  return botao;
}

function renderizarResumo() {
  const ativos = itensAtivos();
  el.totalItens.textContent = ativos.length;
  el.totalAtencao.textContent = ativos.filter((item) => statusDoItem(item) === "atencao").length;
  el.totalVencidos.textContent = ativos.filter((item) => statusDoItem(item) === "vencido").length;
}