/*
   config.js — Constantes usadas em todo o projeto.
   Mudou uma regra? Altere aqui, em um só lugar.
*/

const CHAVE_ARMAZENAMENTO = "sobrazero.itens";
const MAX_REGISTROS_LOG = 50;
const DIAS_ALERTA = 3; // itens que vencem em até 3 dias entram em "usar primeiro"

const CATEGORIAS = [
  "Frutas",
  "Verduras e legumes",
  "Laticínios",
  "Carnes e ovos",
  "Grãos e massas",
  "Pães e bolos",
  "Sobras de refeições",
  "Outros"
];

const UNIDADES = ["un", "kg", "g", "L", "ml"];

const LIMITES = {
  nomeMin: 2,
  nomeMax: 40,
  quantidadeMin: 0.1,
  quantidadeMax: 999,
  diasPassadoMax: 365,  // aceita datas de até 1 ano atrás
  diasFuturoMax: 730,   // e de até 2 anos à frente
  maxItens: 100,        // itens ATIVOS (ainda na cozinha)
  maxHistorico: 300,    // itens já finalizados (consumido/doado/descartado)
  bairroMin: 2,
  bairroMax: 40,
  maxReceitas: 3        // quantas sugestões de receita mostrar
};

// Mensagens genéricas: o usuário nunca vê o erro técnico.
const MSG_ERRO_CARREGAR = "Não foi possível carregar os dados. Tente novamente.";
const MSG_ERRO_SALVAR = "Não foi possível salvar os dados. Tente novamente.";

// Dicas mostradas nos itens que vencem logo.
const DICAS_POR_CATEGORIA = {
  "Frutas": "Frutas maduras viram vitamina, geleia caseira ou bolo.",
  "Verduras e legumes": "Legumes podem virar sopa, refogado ou omelete.",
  "Laticínios": "Leite e iogurte podem entrar em bolos, panquecas e vitaminas.",
  "Carnes e ovos": "Se não for usar a tempo, congele em porções.",
  "Grãos e massas": "Sobras de arroz e macarrão viram bolinho ou salada.",
  "Pães e bolos": "Pão amanhecido vira torrada, farofa ou rabanada.",
  "Sobras de refeições": "Reaproveite em um novo prato ou congele em porções.",
  "Outros": "Planeje uma refeição que use este item nos próximos dias."
};

/* ---------- Destino do alimento (fim do ciclo) ----------
   Um item ATIVO tem destino "  " (vazio). Quando a pessoa usa, doa ou joga
   fora, o destino passa a ser um destes valores e o item vai para o histórico. */
const DESTINOS = ["consumido", "doado", "descartado"];
const ROTULOS_DESTINO = {
  consumido: "Consumido",
  doado: "Doado",
  descartado: "Descartado"
};

/* ---------- Estimativas do painel de impacto ----------
   ATENÇÃO: são valores ILUSTRATIVOS e aproximados, só para o protótipo.
   Não são dados oficiais. Ajuste aqui se quiser outros valores. */

// Peso médio (kg) de 1 unidade, por categoria (usado quando a unidade é "un").
const PESO_UN_KG = {
  "Frutas": 0.15,
  "Verduras e legumes": 0.3,
  "Laticínios": 0.2,
  "Carnes e ovos": 0.3,
  "Grãos e massas": 0.5,
  "Pães e bolos": 0.05,
  "Sobras de refeições": 0.4,
  "Outros": 0.3
};

// Preço médio estimado (R$ por kg), por categoria.
const PRECO_KG = {
  "Frutas": 8,
  "Verduras e legumes": 7,
  "Laticínios": 15,
  "Carnes e ovos": 25,
  "Grãos e massas": 8,
  "Pães e bolos": 14,
  "Sobras de refeições": 12,
  "Outros": 10
};

/* ---------- Mural de doação: exemplos FICTÍCIOS ----------
   Como o protótipo não tem servidor, o mural mostra os itens deste navegador
   mais estes exemplos (bairros e alimentos inventados) para demonstrar a ideia. */
const DOACOES_EXEMPLO = [
  { nome: "Pão francês", categoria: "Pães e bolos", quantidade: 6, unidade: "un", bairro: "Centro", diasValidade: 1 },
  { nome: "Banana prata", categoria: "Frutas", quantidade: 1.5, unidade: "kg", bairro: "Vila Nova", diasValidade: 2 },
  { nome: "Leite integral", categoria: "Laticínios", quantidade: 2, unidade: "L", bairro: "Jardim das Flores", diasValidade: 4 },
  { nome: "Tomate", categoria: "Verduras e legumes", quantidade: 1, unidade: "kg", bairro: "Centro", diasValidade: 3 }
];