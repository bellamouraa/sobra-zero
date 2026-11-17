/*
   datas.js — Funções para trabalhar com datas.
   As validades são guardadas como texto "AAAA-MM-DD".
*/

function hojeSemHora() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

// Converte "AAAA-MM-DD" em Date (horário local). Retorna null se for inválida.
function textoParaData(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto));
  if (!partes) return null;

  const ano = Number(partes[1]);
  const mes = Number(partes[2]) - 1;
  const dia = Number(partes[3]);
  const data = new Date(ano, mes, dia);

  // Rejeita datas que o JavaScript "corrige" sozinho (ex.: 31/02)
  const mudou = data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== dia;
  return mudou ? null : data;
}

// Quantos dias faltam para a validade (negativo = já venceu).
function diasAteVencer(validade) {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round((textoParaData(validade) - hojeSemHora()) / MS_POR_DIA);
}

function dois(numero) {
  return String(numero).padStart(2, "0");
}

function formatarDataBR(texto) {
  const data = textoParaData(texto);
  if (!data) return "";
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()}`;
}

function formatarDataHora(data) {
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()} ` +
         `${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

// Data de hoje + N dias, no formato "AAAA-MM-DD" (usada nos exemplos do mural).
function dataDaquiADias(dias) {
  const data = hojeSemHora();
  data.setDate(data.getDate() + dias);
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}

/* ---------- Situação do item em relação à validade ----------
   (ficam aqui porque o planejador, as receitas e o mural usam) */

function statusDoItem(item) {
  const dias = diasAteVencer(item.validade);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_ALERTA) return "atencao";
  return "ok";
}

function textoDoPrazo(dias) {
  if (dias < -1) return `Vencido há ${-dias} dias`;
  if (dias === -1) return "Venceu ontem";
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence amanhã";
  return `Vence em ${dias} dias`;
}