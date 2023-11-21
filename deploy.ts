const isMain = import.meta.main;

type Image = {
  createTime: string;
  package: string;
  tags: string;
  updateTime: string;
  version: `sha256:${string}`;
};

const decoder = new TextDecoder();

const getImages = async () => {
  const reader = Deno.stdin.readable.getReader();
  const result: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    result.push(decoder.decode(value));

    if (done) {
      break;
    }
  }

  return JSON.parse(result.join("")) as Image[];
};

if (isMain) {
  const isRun = Deno.args[0] === "--yes";

  const images = await getImages();

  const packageHashes = images.map((image) => [
    image.package.split("/").at(-1),
    image.version,
  ]);

  const vars = packageHashes
    .map(([name, hash]) => [
      "-var",
      `${name}_image_url=asia-northeast1-docker.pkg.dev/wasm-c-web/gcr/${name}@${hash}`,
    ])
    .flat();

  const command = new Deno.Command("terraform", {
    args: isRun ? ["apply", ...vars, "--auto-approve"] : ["plan", ...vars],
    stdout: "inherit",
    stderr: "inherit",
  });

  command.outputSync();
}
