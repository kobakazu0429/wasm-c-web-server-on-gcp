import fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import * as rpc from "vscode-ws-jsonrpc";
import * as server from "vscode-ws-jsonrpc/server";
import * as lsp from "vscode-languageserver";
import url from "node:url";
import cp from "node:child_process";

// from: vscode-ws-jsonrpc/server
function createServerProcess(serverName, command, args, options, traceId) {
  const serverProcess = cp.spawn(command, args || [], options || {});
  serverProcess.on("error", (error) =>
    console.error(`Launching Server failed: ${error}`)
  );
  if (serverProcess.stderr !== null) {
    serverProcess.stderr.on("data", (data) => {
      console.error({
        lspLog: data.toString(),
        "logging.googleapis.com/trace": traceId
          ? `projects/wasm-c-web/traces/${traceId}`
          : undefined,
      });
    });
  }
  return server.createProcessStreamConnection(serverProcess);
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception: ", err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

const CLANGD = process.env.CLANGD;
if (!CLANGD) throw new Error("CLANGD not set");

/** @type {(socket: rpc.IWebSocket) => void} */
const launch = (socket, traceId) => {
  const reader = new rpc.WebSocketMessageReader(socket);
  const writer = new rpc.WebSocketMessageWriter(socket);

  const socketConnection = server.createConnection(reader, writer, () => {
    socket.dispose();
  });

  const serverConnection = createServerProcess(
    "c",
    CLANGD,
    ["--log=verbose", "--pretty"],
    {},
    traceId
  );
  if (!serverConnection) {
    throw new Error("serverConnection is undefined.");
  }

  server.forward(socketConnection, serverConnection, (message) => {
    // console.log("message:", message);

    if (lsp.Message.isRequest(message)) {
      if (message.method === lsp.InitializeRequest.type.method) {
        /** @type {lsp.InitializeParams} */
        const initializeParams = message.params;
        initializeParams.processId = process.pid;
      }
    }
    return message;
  });
};

const build = async () => {
  const server = fastify({
    logger: true,
  });
  await server.register(cors, {
    origin: "*",
  });
  await server.register(websocket);

  server.route({
    method: "GET",
    url: "/",
    handler: (_req, reply) => {
      reply.send("pong");
    },
    wsHandler: (connection, req) => {
      // X-Cloud-Trace-Context: TRACE_ID/SPAN_ID;o=TRACE_TRUE
      const trace = req.headers["x-cloud-trace-context"];
      const [, traceId, _spanId, _traceTrue] =
        /([a-f0-9]+)\/([a-f0-9]+);o=(0|1)/.exec(trace ?? "") ?? [];

      /** @type {rpc.IWebSocket} */
      const socket = {
        send: (content) => {
          connection.socket.send(content, (error) => {
            if (error) throw error;
          });
        },
        onMessage: (cb) => {
          connection.socket.on("message", (data) => {
            // console.log("onMessage: ", data);
            cb(data);
          });
        },
        onError: (cb) => {
          connection.socket.on("error", (reason) => {
            // console.log("error:", reason);
            cb(reason);
          });
        },
        onClose: (cb) => {
          // console.log("close");
          connection.socket.on("close", cb);
        },
        dispose: () => {
          // console.log("dispose");
          connection.socket.close();
        },
      };

      // launch the server when the web socket is opened
      if (connection.socket.readyState === connection.socket.OPEN) {
        // console.log("readyState: ", connection.socket.readyState);
        // console.log("connection.socket.OPEN:", connection.socket.OPEN);
        launch(socket, traceId);
      } else {
        // console.log("readyState: ", connection.socket.readyState);
        connection.socket.on("open", () => launch(socket, traceId));
      }
    },
  });

  return server;
};

const start = async () => {
  // Google Cloud Run will set this environment variable for you, so
  // you can also use it to detect if you are running in Cloud Run
  // const IS_GOOGLE_CLOUD_RUN = process.env.K_SERVICE !== undefined;

  // You must listen on the port Cloud Run provides
  const port = process.env.PORT || 8080;

  // You must listen on all IPV4 addresses in Cloud Run
  // const host = IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : undefined;
  const host = "0.0.0.0";

  try {
    const server = await build();
    const address = await server.listen({ port, host });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const self = url.fileURLToPath(import.meta.url);
if (process.argv[1] === self) {
  start();
}
