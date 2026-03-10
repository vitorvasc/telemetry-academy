import micropip
await micropip.install('opentelemetry-instrumentation-urllib')

# TODO: Enable auto-instrumentation for urllib
# Hint: Import URLLibInstrumentor and call .instrument()
# from opentelemetry.instrumentation.urllib import URLLibInstrumentor
# URLLibInstrumentor().instrument()

import urllib.request

def checkout(user_id):
    # This HTTP call should auto-generate a span once URLLibInstrumentor is active
    # (It will fail with a network error in the sandbox — that's OK, the span is captured)
    try:
        with urllib.request.urlopen(f"https://payments.internal/charge/{user_id}") as resp:
            return resp.read()
    except Exception:
        pass  # Network errors are expected in the sandbox

checkout("user-99")
