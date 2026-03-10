# collector.yaml — Fix the configuration below
# The collector is running but dropping error spans. Find and fix the problems.

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1024
  # TODO: Add tail_sampling processor to keep error spans
  # Current config drops 99% of traces including all errors!

exporters:
  logging:
    verbosity: detailed
  # TODO: Add otlp exporter to send traces to your backend
  # Without this, traces never leave the collector!

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
  # TODO: Configure service.telemetry with resource attributes
  # (service.name, deployment.environment)
