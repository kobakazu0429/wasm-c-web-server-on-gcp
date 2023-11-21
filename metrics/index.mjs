import fastify from "fastify";
import cors from "@fastify/cors";
import url from "node:url";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception: ", err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

const build = async () => {
  const server = fastify({
    logger: {
      serializers: {
        res(reply) {
          // console.log(reply);
          return {
            statusCode: reply.statusCode,
            req: {
              body: reply.request.body,
            },
          };
        },
        req(request) {
          return {
            method: request.method,
            url: request.url,
            parameters: request.params,
            headers: request.headers,
            version: request.headers && request.headers["accept-version"],
            hostname: request.hostname,
            remoteAddress: request.ip,
            remotePort: request.socket ? request.socket.remotePort : undefined,
          };
        },
      },
    },
  });
  await server.register(cors, {
    origin: "*",
  });

  server.get("/", async (request, reply) => {
    reply.send("pong");
  });

  server.post("/", async (request, reply) => {
    reply.send("OK");
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
