
const mensagens = {};
const advertencias = {};

function registrarMensagem(nome) {
  mensagens[nome] = (mensagens[nome] || 0) + 1;
}

function ranking() {
  return Object.entries(mensagens)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((p, i) => `${i + 1}º ${p[0]} - ${p[1]} mensagens`)
    .join("\n");
}

function advertir(nome) {
  advertencias[nome] = (advertencias[nome] || 0) + 1;

  if (advertencias[nome] >= 3) {
    return `🚫 ${nome} atingiu 3 advertências. Remoção necessária pelos administradores.`;
  }

  return `⚠️ ${nome}, advertência ${advertencias[nome]}/3. Respeita as regras, tropa!`;
}

function responder(comando) {
  if (comando === "/ranking") {
    return "🏆 RANKING DA RESENHA\n" + (ranking() || "Ainda sem mensagens!");
  }

  if (comando === "/ajuda") {
    return "🤖 BOT RESENHA\n/ranking - Ver ranking\n/ajuda - Ajuda";
  }

  return "😂 Fala, tropa! Manda /ajuda para conhecer os comandos.";
}

console.log("🤖 BOT RESENHA iniciado!");
console.log("Sistema de ranking preparado.");
