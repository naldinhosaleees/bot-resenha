
const mensagens = {};
const advertencias = {};

console.log("🤖 BOT RESENHA iniciado!");

function registrarMensagem(nome) {
  mensagens[nome] = (mensagens[nome] || 0) + 1;
}

function gerarRanking() {
  const lista = Object.entries(mensagens)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (lista.length === 0) {
    return "Ainda não temos mensagens registradas!";
  }

  return lista.map((p, i) =>
    `${i + 1}º ${p[0]} — ${p[1]} mensagens`
  ).join("\n");
}

function advertir(nome) {
  advertencias[nome] = (advertencias[nome] || 0) + 1;

  return advertencias[nome] >= 3
    ? `🚫 ${nome} atingiu 3 advertências.`
    : `⚠️ ${nome}, advertência ${advertencias[nome]}/3. Respeita a tropa!`;
}

function responder(comando) {
  if (comando === "/ranking") {
    return "🏆 RANKING DA RESENHA\n" + gerarRanking();
  }

  if (comando === "/ajuda") {
    return "🤖 BOT RESENHA\n/ranking - Ver ranking\n/ajuda - Comandos";
  }

  return "😂 Fala, tropa!";
}

module.exports = {
  registrarMensagem,
  gerarRanking,
  advertir,
  responder
};
