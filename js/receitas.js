/*
   receitas.js — "O que cozinhar hoje?"
   Cruza os alimentos cadastrados (principalmente os que vencem
   primeiro) com uma lista de receitas simples guardada aqui mesmo.
   Não usa internet nem API: é só comparação de listas em JavaScript.
*/

// Atalho para montar um ingrediente: rótulo exibido + palavras que o identificam.
// Ex.: ing("fruta", "banana", "mamao") aceita qualquer item com essas palavras no nome.
const ing = (rotulo, ...opcoes) => ({ rotulo, opcoes: opcoes.length ? opcoes : [rotulo] });

const FRUTAS = ["banana", "mamao", "morango", "manga", "abacate", "laranja", "maca", "pera", "uva", "abacaxi"];
const LEGUMES = ["tomate", "cenoura", "cebola", "abobrinha", "pimentao", "espinafre", "brocolis", "couve", "chuchu", "abobora"];

// Os ingredientes básicos (sal, óleo, farinha, açúcar) são considerados "já tem em casa".
const RECEITAS = [
  { nome: "Panqueca de banana", ingredientes: [ing("banana"), ing("ovo"), ing("leite")],
    preparo: "Amasse a banana, misture com o ovo, um pouco de leite e farinha, e doure na frigideira." },
  { nome: "Vitamina de frutas", ingredientes: [ing("fruta", ...FRUTAS), ing("leite ou iogurte", "leite", "iogurte")],
    preparo: "Bata a fruta madura com leite ou iogurte no liquidificador. Adoce só se precisar." },
  { nome: "Omelete de legumes", ingredientes: [ing("ovo"), ing("legume", ...LEGUMES)],
    preparo: "Pique os legumes, refogue rapidamente, junte os ovos batidos e cozinhe até firmar." },
  { nome: "Sopa de legumes", ingredientes: [ing("legume base", "cenoura", "batata", "abobora", "chuchu", "mandioca"), ing("legume", "cebola", "tomate", "abobrinha", "couve", "brocolis", "espinafre")],
    preparo: "Refogue a cebola, junte os legumes picados e água, e cozinhe até ficarem macios." },
  { nome: "Rabanada", ingredientes: [ing("pão", "pao", "paes"), ing("ovo"), ing("leite")],
    preparo: "Molhe o pão amanhecido no leite, passe no ovo batido e doure na frigideira." },
  { nome: "Pão na chapa com queijo", ingredientes: [ing("pão", "pao", "paes"), ing("queijo")],
    preparo: "Coloque o queijo no pão e aqueça na frigideira até derreter." },
  { nome: "Pão com ovo mexido", ingredientes: [ing("pão", "pao", "paes"), ing("ovo")],
    preparo: "Mexa os ovos na frigideira e sirva no pão ou ao lado das torradas." },
  { nome: "Bolinho de arroz", ingredientes: [ing("arroz"), ing("ovo")],
    preparo: "Misture o arroz sobrado com ovo e farinha, modele os bolinhos e doure na frigideira." },
  { nome: "Macarrão com legumes", ingredientes: [ing("macarrão", "macarrao", "espaguete", "massa"), ing("legume", ...LEGUMES)],
    preparo: "Cozinhe a massa, refogue os legumes e misture tudo com um fio de azeite." },
  { nome: "Salada de frutas com iogurte", ingredientes: [ing("fruta", ...FRUTAS), ing("iogurte")],
    preparo: "Pique as frutas e cubra com iogurte. Fica ótimo gelado." },
  { nome: "Bolo simples de iogurte ou leite", ingredientes: [ing("ovo"), ing("leite ou iogurte", "leite", "iogurte")],
    preparo: "Bata ovos, leite ou iogurte, açúcar e farinha, junte fermento e asse em forno médio." },
  { nome: "Refogado de frango com legumes", ingredientes: [ing("frango"), ing("legume", ...LEGUMES)],
    preparo: "Refogue o frango em cubos, junte os legumes e cozinhe até tudo ficar bem passado." },
  { nome: "Doce de banana", ingredientes: [ing("banana")],
    preparo: "Cozinhe a banana madura amassada com um pouco de açúcar até engrossar." }
];

/* ---------- Lógica (não mexe na tela) ---------- */

// Tira acentos e deixa tudo minúsculo: "Mamão" -> "mamao".
function normalizarTexto(texto) {
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// O item corresponde ao ingrediente? Compara PALAVRA por palavra
// (assim "macarrão" não é confundido com "maçã").
function itemCorresponde(item, opcoes) {
  const palavras = normalizarTexto(item.nome).split(/[\s-]+/);
  return palavras.some((palavra) =>
    opcoes.some((opcao) => palavra === opcao || palavra === opcao + "s" || palavra === opcao + "es")
  );
}

// Para uma receita, descobre o que o usuário já tem e o que falta.
function avaliarReceita(receita, itens) {
  const usados = [];
  const faltam = [];
  let urgentes = 0;

  receita.ingredientes.forEach((ingrediente) => {
    // Se houver mais de um item que serve, usa o que vence primeiro.
    const item = itens
      .filter((candidato) => itemCorresponde(candidato, ingrediente.opcoes))
      .sort((a, b) => a.validade.localeCompare(b.validade))[0];

    if (item) {
      usados.push(item);
      if (statusDoItem(item) === "atencao") urgentes++;
    } else {
      faltam.push(ingrediente.rotulo);
    }
  });

  return { receita, usados, faltam, urgentes };
}

// Devolve as melhores receitas: primeiro as que gastam itens "usar primeiro".
function sugerirReceitas(itensAtivos) {
  // Item vencido não entra: por segurança, não sugerimos cozinhar com ele.
  const disponiveis = itensAtivos.filter((item) => statusDoItem(item) !== "vencido");

  return RECEITAS
    .map((receita) => avaliarReceita(receita, disponiveis))
    .filter((r) => r.usados.length >= Math.min(2, r.receita.ingredientes.length))
    .sort((a, b) =>
      b.urgentes - a.urgentes ||
      b.usados.length - a.usados.length ||
      a.faltam.length - b.faltam.length)
    .slice(0, LIMITES.maxReceitas);
}

/* ---------- Tela ---------- */

function criarCartaoDeReceita(resultado) {
  const cartao = criarElemento("li", "receita");
  cartao.appendChild(criarElemento("h3", "receita-nome", resultado.receita.nome));

  const nomes = resultado.usados
    .map((item) => (statusDoItem(item) === "atencao" ? `${item.nome} (usar primeiro)` : item.nome))
    .join(", ");
  cartao.appendChild(criarElemento("p", "item-detalhe", `Você tem: ${nomes}`));

  const falta = resultado.faltam.length > 0
    ? `Falta: ${resultado.faltam.join(", ")}`
    : "Você já tem tudo o que precisa!";
  cartao.appendChild(criarElemento("p", "item-detalhe", falta));
  cartao.appendChild(criarElemento("p", "receita-preparo", resultado.receita.preparo));
  return cartao;
}

function renderizarReceitas(itensAtivos) {
  const lista = document.getElementById("lista-receitas");
  const vazio = document.getElementById("receitas-vazio");
  if (!lista || !vazio) return;

  const sugestoes = sugerirReceitas(itensAtivos);
  lista.replaceChildren();
  vazio.hidden = sugestoes.length > 0;
  sugestoes.forEach((resultado) => lista.appendChild(criarCartaoDeReceita(resultado)));
}