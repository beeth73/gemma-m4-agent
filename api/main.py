from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from core.engine import GemmaEngine
from core.tools import search_web
import json
import asyncio

# 1. Initialize the FastAPI App
app = FastAPI()

# 2. Configure CORS (Allows your React Frontend to talk to this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Initialize the Gemma M4 Engine
# This loads the model weights into Unified RAM once when the server starts
engine = GemmaEngine()

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    prompt = data.get("prompt")
    system_instruction = data.get("system_instruction", "")
    temperature = data.get("temperature", 0.7)
    max_tokens = data.get("max_tokens", 4096) # Respect the UI slider
    use_web = data.get("use_web", False)

    context = ""
    if use_web:
        from core.tools import search_web
        context = search_web(prompt)

    # Use the new robust engine methods
    full_prompt = engine.format_prompt(system_instruction, context, prompt)

    async def event_generator():
        try:
            # Pass everything to the new generator
            for chunk in engine.generate_stream(full_prompt, temp=temperature, max_tokens=max_tokens):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
                await asyncio.sleep(0.01)
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'text': f'Inference Error: {str(e)}'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)