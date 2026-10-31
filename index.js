const qrcode = require("qrcode-terminal");
const http = require("http");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("🤖 BOT RESENHA está online!");
});

server.listen(process.env.PORT || 3000);

function inicioPeriodo(tipo) {
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  agora.setUTCHours(0, 0, 0, 0);

  if (tipo === "semanal") {
    const dia = agora.getUTCDay();
    agora.setUTCDate(agora.getUTCDate() - ((dia + 6) % 7));
  }

  if (tipo === "mensal") {
    agora.setUTCDate(1);
  }

  return new Date(agora.getTime() + 3 * 60 * 60 * 1000);
}

async function registrarMensagem(grupo, participante) {
  const { error } = await supabase
    .from("bot_eventos")
    .insert({
      grupo_id: grupo,
      participante_id: participante
    });

  if (error) console.error("Erro ao registrar:", error);
}

async function gerarRanking(grupo, tipo) {
  const inicio = inicioPeriodo(tipo);

  const { data, error } = await supabase
    .from("bot_eventos")
    .select("participante_id")
    .eq("grupo_id", grupo)
    .gte("criado_em", inicio.toISOString())
    .limit(10000);

  if (error) {
    console.error(error);
    return "Não consegui consultar o ranking.";
  }

  const contagem = {};

  for (const item of data) {
    contagem[item.participante_id] =
      (contagem[item.participante_id] || 0) + 1;
  }

  const ranking = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((item, i) =>
      `${i + 1}º ${item[0].split("@")[0]} — ${item[1]} mensagens`
    );

  return ranking.length
    ? `🏆 RANKING ${tipo.toUpperCase()}\n\n${ranking.join("\n")}`
    : "Ainda não temos mensagens nesse período!";
}

async function iniciarBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {

  if (qr) {
    console.log("📲 ESCANEIE O QR CODE ABAIXO:");
    qrcode.generate(qr, { small: true });
  }

  if (connection === "open") {
    console.log("🤖 BOT RESENHA CONECTADO!");
  }

  if (connection === "close") {
    const codigo =
      lastDisconnect?.error?.output?.statusCode;

    console.log("Conexão encerrada:", codigo);

    if (codigo !== DisconnectReason.loggedOut) {
      setTimeout(iniciarBot, 5000);
    } else {
      console.log("Sessão encerrada. Vincule novamente.");
    }
  }

});
    if (connection === "open") {
      console.log("BOT RESENHA conectado!");
    }

    if (connection === "close") {
      const codigo =
        lastDisconnect?.error?.output?.statusCode;

      if (codigo !== DisconnectReason.loggedOut) {
        setTimeout(iniciarBot, 5000);
      } else {
        console.log("Sessão encerrada. Vincule novamente.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const grupo = msg.key.remoteJid;
      const participante = msg.key.participant;

      if (!grupo?.endsWith("@g.us") || !participante) continue;

      await registrarMensagem(grupo, participante);

      const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const comandos = {
        "/diario": "diario",
        "/semanal": "semanal",
        "/mensal": "mensal",
        "/ranking": "mensal"
      };

      if (comandos[texto]) {
        const resposta = await gerarRanking(
          grupo,
          comandos[texto]
        );

        await sock.sendMessage(grupo, { text: resposta });
      }

      if (texto === "/ajuda") {
        await sock.sendMessage(grupo, {
          text: "🤖 BOT RESENHA\n/diario - Ranking do dia\n/semanal - Ranking da semana\n/mensal - Ranking do mês\n/ajuda - Ajuda"
        });
      }
    }
  });
}

iniciarBot().catch(console.error);
