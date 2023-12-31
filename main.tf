provider "google" {
  credentials = file("key.json")
  project     = var.project_id
  region      = var.default_region
}

resource "google_cloud_run_v2_service" "compiler" {
  name     = "compiler"
  location = var.default_region
  ingress  = "INGRESS_TRAFFIC_ALL"
  # ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY"
  template {
    max_instance_request_concurrency = 150
    session_affinity                 = false
    timeout                          = "300s"

    containers {
      image = var.compiler_image_url

      resources {
        cpu_idle = true
        limits = {
          "cpu"    = "2000m"
          "memory" = "1Gi"
        }
        startup_cpu_boost = true
      }

      ports {
        container_port = 8080
        name           = "http1"
      }

      startup_probe {
        failure_threshold     = 1
        initial_delay_seconds = 0
        period_seconds        = 240
        timeout_seconds       = 240

        tcp_socket {
          port = 8080
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }
}

resource "google_cloud_run_v2_service" "lsp" {
  name     = "lsp"
  location = var.default_region
  ingress  = "INGRESS_TRAFFIC_ALL"
  # ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY"
  template {
    max_instance_request_concurrency = 150
    session_affinity                 = false
    timeout                          = "300s"

    containers {
      image = var.lsp_image_url

      resources {
        cpu_idle = true
        limits = {
          "cpu"    = "4000m"
          "memory" = "4Gi"
        }
        startup_cpu_boost = true
      }

      ports {
        container_port = 8080
        name           = "http1"
      }

      startup_probe {
        failure_threshold     = 1
        initial_delay_seconds = 0
        period_seconds        = 240
        timeout_seconds       = 240

        tcp_socket {
          port = 8080
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }
  }
}

resource "google_cloud_run_v2_service" "metrics" {
  name     = "metrics"
  location = var.default_region
  ingress  = "INGRESS_TRAFFIC_ALL"
  # ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY"
  template {
    max_instance_request_concurrency = 150
    session_affinity                 = false
    timeout                          = "300s"

    containers {
      image = var.metrics_image_url

      resources {
        cpu_idle = true
        limits = {
          "cpu"    = "2000m"
          "memory" = "1Gi"
        }
        startup_cpu_boost = true
      }

      ports {
        container_port = 8080
        name           = "http1"
      }

      startup_probe {
        failure_threshold     = 1
        initial_delay_seconds = 0
        period_seconds        = 240
        timeout_seconds       = 240

        tcp_socket {
          port = 8080
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
  }
}

resource "google_cloud_run_domain_mapping" "compiler-kaz-dev" {
  name     = "compiler.kaz.dev"
  location = var.default_region
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.compiler.name
  }
}

resource "google_cloud_run_domain_mapping" "lsp-kaz-dev" {
  name     = "lsp.kaz.dev"
  location = var.default_region
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.lsp.name
  }
}

resource "google_cloud_run_domain_mapping" "metrics-kaz-dev" {
  name     = "metrics.kaz.dev"
  location = var.default_region
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.metrics.name
  }
}
