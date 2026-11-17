/*
   registro.js — Painel de registro de atividades.
   Cada operação gera uma linha: data/hora — ação — resultado.
*/

const registros = [];

function registrarAtividade(acao, resultado, sucesso = true) {
  registros.unshift({
    dataHora: formatarDataHora(new Date()),
    acao: acao,
    resultado: resultado,
    sucesso: sucesso
  });

  if (registros.length > MAX_REGISTROS_LOG) registros.pop();
  renderizarRegistro();
}

function renderizarRegistro() {
  const lista = document.getElementById("lista-registro");
  const vazio = document.getElementById("registro-vazio");
  if (!lista) return;

  lista.replaceChildren();
  if (vazio) vazio.hidden = registros.length > 0;

  registros.forEach((registro) => {
    const linha = document.createElement("li");
    linha.className = registro.sucesso ? "registro-ok" : "registro-erro";

    const hora = document.createElement("time");
    hora.textContent = registro.dataHora;

    const acao = document.createElement("strong");
    acao.textContent = registro.acao;

    const resultado = document.createElement("span");
    resultado.textContent = registro.resultado;

    linha.append(hora, " — ", acao, " — ", resultado);
    lista.appendChild(linha);
  });
}