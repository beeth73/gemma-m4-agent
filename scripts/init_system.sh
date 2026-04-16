#!/bin/bash
echo "🛠️ Initializing Gemma-M4-Agent System..."

# 1. Install Python Dependencies
pip install -r requirements.txt

# 2. Setup Pendrive Structure
PD_DATA="/Volumes/Macintosh PD/gemma_data"
mkdir -p "$PD_DATA"/{vector_db,workspace,logs}

# 3. Create a dummy README in the pendrive workspace
echo "Drop your .c and .py files here to index them" > "$PD_DATA/workspace/README.txt"

echo "✅ Initialization Complete."