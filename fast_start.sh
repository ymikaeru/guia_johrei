#!/bin/bash
echo "Starting Johrei Guia Prático Server..."
echo "Opening http://localhost:8000"
open http://localhost:8000 2>/dev/null || xdg-open http://localhost:8000 2>/dev/null || echo "Please open http://localhost:8000 manually"
python3 -m http.server 8000
