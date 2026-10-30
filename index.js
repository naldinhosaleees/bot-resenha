
const http = require("http");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const mensagens = {};

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("BOT RESENHA está funcionando!");
});

server.listen(process.env.PORT || 3000);

async function iniciarBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("BOT RESENHA conectado!");
    }

    if (connection === "close") {
      const codigo =
        lastDisconnect?.error?.output?.statusCode;

      if (codigo !== DisconnectReason.loggedOut) {
        console.log("Reconectando...");
        setTimeout(iniciarBot, 5000);
      } else {
        console.log("Sessão encerrada. Será necessário vincular novamente.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages: lista }) => {
    for (const msg of lista) {
      if (!msg.message || msg.key.fromMe) continue;

      const grupo = msg.key.remoteJid;
      if (!grupo || !grupo.endsWith("@g.us")) continue;

      const participante = msg.key.participant;
      if (!participante) continue;

      mensagens[participante] =
        (mensagens[participante] || 0) + 1;

      const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (texto === "/ajuda") {
        await sock.sendMessage(grupo, {
          text: "🤖 BOT RESENHA\n/ranking - Ver ranking\n/ajuda - Ver comandos"
        });
      }

      if (texto === "/ranking") {
        const ranking = Object.entries(mensagens)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map((item, i) =>
            `${i + 1}º ${item[0].split("@")[0]} — ${item[1]} mensagens`
          )
          .join("\n");

        await sock.sendMessage(grupo, {
          text: "🏆 RANKING DA RESENHA\n\n" +
            (ranking || "Ainda sem mensagens!")
        });
      }
    }
  });
}

iniciarBot().catch(console.error);
