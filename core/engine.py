import os
import yaml
import json
import inspect
from pathlib import Path
from typing import Generator
import mlx.core as mx
from mlx_lm import load, stream_generate

# Canonical Gemma Chat Template
GEMMA_CHAT_TEMPLATE = (
    "{% for message in messages %}"
    "{{ '<start_of_turn>' + message['role'] + '\\n' + message['content'] + '<end_of_turn>\\n' }}"
    "{% endfor %}"
    "{% if add_generation_prompt %}"
    "{{ '<start_of_turn>model\\n' }}"
    "{% endif %}"
)

STOP_STRINGS = ["<end_of_turn>", "<start_of_turn>", "<eos>", "user\n"]

class GemmaEngine:
    def __init__(self, config_path: str = "config/paths.yaml"):
        base_path = os.path.dirname(os.path.dirname(__file__))
        abs_config = os.path.join(base_path, config_path)
        
        with open(abs_config, "r") as f:
            self.config = yaml.safe_load(f)

        print(f"--> Loading model from: {self.config['model_path']}")
        self.model, self.tokenizer = load(self.config["model_path"])
        
        # Inject template
        if not getattr(self.tokenizer, "chat_template", None):
            self.tokenizer.chat_template = GEMMA_CHAT_TEMPLATE
        
        # Hardware Stop IDs
        self.stop_token_ids = self._resolve_stop_token_ids()
        print(f"--> Silicon-Level Stop IDs: {self.stop_token_ids}")

    def _resolve_stop_token_ids(self) -> list[int]:
        ids = set()
        for token in ["<end_of_turn>", "<eos>", "</s>"]:
            tid = self.tokenizer.convert_tokens_to_ids(token)
            if tid is not None and tid > 0: ids.add(tid)
        if hasattr(self.tokenizer, "eos_token_id"): ids.add(self.tokenizer.eos_token_id)
        return list(ids)

    def format_prompt(self, system: str, context: str, query: str) -> str:
        content = query
        if system: content = f"{system}\n\n{content}"
        if context: content = f"Context:\n{context}\n\n{content}"
        return self.tokenizer.apply_chat_template([{"role": "user", "content": content}], tokenize=False, add_generation_prompt=True)

    def generate_stream(self, prompt: str, temp: float = 0.7, max_tokens: int = 4096) -> Generator[str, None, None]:
        """
        Version-Agnostic Parameter Injector.
        Detects if mlx-lm wants 'temp' or 'temperature' at runtime.
        """
        # 1. Inspect the library signature
        sig = inspect.signature(stream_generate)
        valid_params = sig.parameters

        # 2. Build kwargs dynamically
        kwargs = {
            "model": self.model,
            "tokenizer": self.tokenizer,
            "prompt": prompt,
            "max_tokens": int(max_tokens),
        }

        # 3. Silicon-level stop tokens
        if "stop_tokens" in valid_params:
            kwargs["stop_tokens"] = self.stop_token_ids

        # 4. Handle the 'temp' vs 'temperature' collision
        if "temperature" in valid_params:
            kwargs["temperature"] = float(temp)
        elif "temp" in valid_params:
            kwargs["temp"] = float(temp)
        
        print(f"--> Inference Start | Mode: {'temperature' if 'temperature' in kwargs else 'temp'}")

        # 5. Execute Hardware-Aware Stream
        accumulated = ""
        try:
            for response in stream_generate(**kwargs):
                chunk = response.text if hasattr(response, "text") else str(response)
                if not chunk: continue
                
                accumulated += chunk
                
                # Multi-Layer Stop Check
                stop_hit = False
                for s in STOP_STRINGS:
                    if s in accumulated:
                        clean = accumulated.split(s)[0]
                        yield clean[len(accumulated)-len(chunk):]
                        stop_hit = True
                        break
                
                if stop_hit: return
                yield chunk

        except Exception as e:
            yield f"\n[Critical Engine Error: {str(e)}]"