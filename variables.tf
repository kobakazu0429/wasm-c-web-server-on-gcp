variable "project_id" {
  default = "wasm-c-web"
}

variable "default_region" {
  description = "Tokyo"
  default     = "asia-northeast1"
}

variable "compiler_image_url" {
  default = "asia-northeast1-docker.pkg.dev/wasm-c-web/gcr/compiler:latest"
}

variable "lsp_image_url" {
  default = "asia-northeast1-docker.pkg.dev/wasm-c-web/gcr/lsp:latest"
}

variable "metrics_image_url" {
  default = "asia-northeast1-docker.pkg.dev/wasm-c-web/gcr/metrics:latest"
}
