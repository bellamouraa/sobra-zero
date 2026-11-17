/*
   validacao.js — Regras de validação dos dados do item.
   Duas camadas:
   1) validação nativa do HTML5 (required, minlength, pattern...)
      lida pela Constraint Validation API (checkValidity);
   2) validação em JavaScript, que não confia no HTML.
*/

// Letras (com acento), números, espaço e hífen.
const REGEX_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9 \-]*$/;

// Bairro: só letras, espaço e hífen. SEM números, para ninguém digitar
// endereço, CEP ou telefone sem querer (LGPD: coleta mínima).
const REGEX_BAIRRO = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ \-]*$/;

// Tira espaços das pontas e reduz espaços repetidos.
function limparTexto(texto) {
  return String(texto ?? "").trim().replace(/\s+/g, " ");
}

function converterQuantidade(valor) {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "").trim().replace(",", ".");
  return texto === "" ? NaN : Number(texto);
}

// Valida os dados de um item (sem depender da tela).
// Retorna um objeto { campo: "mensagem" }; vazio = tudo certo.
// "permitirDataAntiga" é usado para itens do histórico, que podem ter validade antiga.
function validarDadosItem(dados, permitirDataAntiga = false) {
  const erros = {};

  const nome = limparTexto(dados.nome);
  if (nome.length < LIMITES.nomeMin) {
    erros.nome = `Digite o nome do alimento (mínimo ${LIMITES.nomeMin} letras).`;
  } else if (nome.length > LIMITES.nomeMax) {
    erros.nome = `O nome pode ter no máximo ${LIMITES.nomeMax} caracteres.`;
  } else if (!REGEX_NOME.test(nome)) {
    erros.nome = "Use apenas letras, números, espaços e hífen.";
  }

  if (!CATEGORIAS.includes(dados.categoria)) {
    erros.categoria = "Escolha uma categoria da lista.";
  }

  const quantidade = converterQuantidade(dados.quantidade);
  if (!Number.isFinite(quantidade)) {
    erros.quantidade = "Informe a quantidade usando números.";
  } else if (quantidade < LIMITES.quantidadeMin || quantidade > LIMITES.quantidadeMax) {
    erros.quantidade = `A quantidade deve ficar entre ${LIMITES.quantidadeMin} e ${LIMITES.quantidadeMax}.`;
  }

  if (!UNIDADES.includes(dados.unidade)) {
    erros.unidade = "Escolha uma unidade da lista.";
  }

  if (textoParaData(dados.validade) === null) {
    erros.validade = "Informe uma data de validade válida.";
  } else {
    const dias = diasAteVencer(dados.validade);
    if (dias < -LIMITES.diasPassadoMax && !permitirDataAntiga) {
      erros.validade = "Esta data é muito antiga. Confira o ano.";
    } else if (dias > LIMITES.diasFuturoMax) {
      erros.validade = "Esta data é muito distante. Confira o ano.";
    }
  }

  // Bairro só é exigido (e validado) quando o item é oferecido para doação.
  if (dados.doacao === true) {
    const bairro = limparTexto(dados.bairro);
    if (bairro.length < LIMITES.bairroMin) {
      erros.bairro = "Informe o bairro para a retirada.";
    } else if (bairro.length > LIMITES.bairroMax) {
      erros.bairro = `O bairro pode ter no máximo ${LIMITES.bairroMax} caracteres.`;
    } else if (!REGEX_BAIRRO.test(bairro)) {
      erros.bairro = "Use apenas letras, espaços e hífen (sem números).";
    }
  }

  return erros;
}

// Traduz o estado de validação nativa do navegador para uma mensagem em português.
function mensagemNativa(campo) {
  const estado = campo.validity;
  if (estado.valueMissing) return "Preencha este campo.";
  if (estado.tooShort) return `Use pelo menos ${campo.minLength} caracteres.`;
  if (estado.tooLong) return `Use no máximo ${campo.maxLength} caracteres.`;
  if (estado.patternMismatch) {
    return campo.name === "bairro"
      ? "Use apenas letras, espaços e hífen (sem números)."
      : "Use apenas letras, números, espaços e hífen.";
  }
  if (estado.rangeUnderflow) return `O valor mínimo é ${campo.min}.`;
  if (estado.rangeOverflow) return `O valor máximo é ${campo.max}.`;
  if (estado.stepMismatch) return "Use no máximo uma casa decimal.";
  if (estado.badInput || estado.typeMismatch) return "Valor em formato inválido.";
  return "";
}

// Valida o formulário inteiro.
// Retorna { valido, erros, dados } — "dados" já vem limpo e convertido.
function validarFormulario(campos) {
  const dados = {
    nome: campos.nome.value,
    categoria: campos.categoria.value,
    quantidade: campos.quantidade.value,
    unidade: campos.unidade.value,
    validade: campos.validade.value,
    doacao: campos.doacao.checked,
    bairro: campos.bairro.value
  };

  const erros = validarDadosItem(dados);

  // A mensagem da validação nativa tem prioridade quando o campo é inválido.
  Object.keys(campos).forEach((nome) => {
    if (!campos[nome].checkValidity()) {
      erros[nome] = mensagemNativa(campos[nome]) || erros[nome] || "Valor inválido.";
    }
  });

  return {
    valido: Object.keys(erros).length === 0,
    erros: erros,
    dados: {
      nome: limparTexto(dados.nome),
      categoria: dados.categoria,
      quantidade: converterQuantidade(dados.quantidade),
      unidade: dados.unidade,
      validade: dados.validade,
      doacao: dados.doacao,
      bairro: dados.doacao ? limparTexto(dados.bairro) : ""
    }
  };
}