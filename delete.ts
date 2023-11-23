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
  const images = await getImages();
  const deleteImages = images
    .filter((image) => image.tags !== "latest")
    .map((image) => {
      const name = image.package.split("/").at(-1);
      const hash = image.version;
      return `asia-northeast1-docker.pkg.dev/wasm-c-web/gcr/${name}@${hash}`;
    });

  // console.log(JSON.stringify(deleteImages, null, 2));

  for (const deleteImage of deleteImages) {
    const command = new Deno.Command("gcloud", {
      args: ["artifacts", "docker", "images", "delete", deleteImage, "--quiet"],
      stdout: "inherit",
      stderr: "inherit",
    });

    command.outputSync();
  }
}
