#!/bin/bash

echo "Pulling latest code..."
git pull

echo "Building new Docker image..."
docker build -t kpi-api:latest .

echo "Ensuring overlay network exists..."
docker network create -d overlay kpi_network 2>/dev/null || true

echo "Deploying stack..."
export $(grep -v '^#' .env | xargs)
docker stack deploy -c docker.api.yml kpi_api

echo "Forcing service update to apply new image..."
docker service update --force kpi_api_api

echo "Deploy API completed!"
echo ""
echo "Nếu cần reset mật khẩu admin trên server (sau deploy image mới):"
echo "  1) Đảm bảo ADMIN_PASSWORD đã có trong file .env trên server"
echo "  2) Chạy:"
echo "     docker exec \$(docker ps -q -f name=kpi_api_api | head -n1) node dist/scripts/reset-admin.js"
