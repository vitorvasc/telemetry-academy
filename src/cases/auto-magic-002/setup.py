# app.py - DON'T MODIFY THIS FILE
from fastapi import FastAPI
import requests

app = FastAPI()

@app.get("/users/{user_id}")
def get_user(user_id: int):
    # This endpoint sometimes fails
    response = requests.get(f"https://api.external.com/users/{user_id}")
    return response.json()

# TODO: Configure auto-instrumentation
# Hint: Use the opentelemetry-instrument command
# Example: opentelemetry-instrument --traces_exporter otlp python app.py
