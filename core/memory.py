import os
import yaml
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

class AgentMemory:
    def __init__(self, config_path="config/paths.yaml"):
        with open(config_path, 'r') as f:
            self.paths = yaml.safe_load(f)
            
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_db = Chroma(
            persist_directory=self.paths['vector_db_path'], 
            embedding_function=self.embeddings
        )

    def get_context(self, query):
        try:
            docs = self.vector_db.similarity_search(query, k=3)
            return "\n".join([f"Source: {d.metadata.get('source')}\n{d.page_content}" for d in docs])
        except:
            return ""