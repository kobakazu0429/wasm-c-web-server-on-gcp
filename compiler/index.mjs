import fastify from "fastify";
import cors from "@fastify/cors";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import url from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception: ", err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

const WASI_SDK_PATH = process.env.WASI_SDK_PATH;
const pExec = promisify(exec);
const tmpDir = os.tmpdir();

const CODE = {
  OK: 0,
  ERROR: 10,
  UNKNOWN: 90,
};

const compileToWasm = async (src) => {
  const id = crypto.randomUUID();
  const tmp = path.join(tmpDir, id);
  // const tmp = tmpDir;
  await fs.mkdir(tmp);

  const rawFileName = `main.c`;
  const wasmFileName = `main.wasm`;
  const asyncWasmFileName = `main.async.wasm`;

  const rawFilePath = path.resolve(path.join(tmp, rawFileName));
  const wasmFilePath = path.resolve(path.join(tmp, wasmFileName));
  const asyncWasmFilePath = path.resolve(path.join(tmp, asyncWasmFileName));

  await fs.writeFile(rawFilePath, src);

  const compileLog = await pExec(
    [
      `/${WASI_SDK_PATH}/bin/clang`,
      `-I ${WASI_SDK_PATH}/lib/clang/11.0.0/include`,
      `--sysroot=${WASI_SDK_PATH}/share/wasi-sysroot`,

      // The file size is generally 1.3 to almost 2 times larger.
      "-Wl,--export-all",
      rawFilePath,
      `-o`,
      wasmFilePath,
      "-v",
    ].join(" ")
  );

  await pExec(`wasm-opt --asyncify ${wasmFilePath} -o ${asyncWasmFilePath}`);

  const binary = await fs.readFile(asyncWasmFilePath);
  return { compileLog, binary };
};

const build = async () => {
  const server = fastify({
    logger: {
      serializers: {
        res(reply) {
          return {
            statusCode: reply.statusCode,
            req: reply.request,
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
    const { src } = request.body;
    try {
      const { compileLog, binary } = await compileToWasm(src);
      // request.log.info({ src, compileLog, binarySize: binary.length });
      reply.send({
        code: CODE.OK,
        binary,
        compileLog,
      });
    } catch (error) {
      request.log.error({ src, error });
      const message = error.stderr;

      reply.send({
        code: CODE.ERROR,
        message,
      });
    }
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
