#!/bin/bash
# Frontend Dependencies Installation Script
# Run inside frontend container: docker-compose exec frontend sh < scripts/install-frontend-deps.sh
# Date: February 1, 2026
set -e
echo "Installing frontend dependencies..."
npm install --save react react-dom react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled axios @tanstack/react-query react-hook-form yup
npm install --save-dev @vitejs/plugin-react vite typescript @types/react @types/react-dom @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
echo "✅ Frontend dependencies installed"
