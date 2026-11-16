#!/bin/bash

echo "Pulling latest code..."
git pull

echo "Building new Docker image..."
docker build -t kpi-api:latest .

echo "Ensuring overlay network exists..."
# --attachable: cho phép chạy one-off container nếu cần; reset admin ưu tiên docker exec
docker network create -d overlay --attachable kpi_network 2>/dev/null || true

echo "Deploying stack..."
export $(grep -v '^#' .env | xargs)
docker stack deploy -c docker.api.yml kpi_api

echo "Forcing service update to apply new image..."
docker service update --force kpi_api_api

echo "Deploy API completed!"
echo ""
echo "Nếu cần reset mật khẩu admin trên server:"
echo "  1) Đảm bảo ADMIN_PASSWORD / MONGODB_URI có trong .env"
echo "  2) Host:  ADMIN_PASSWORD='...' npm run reset:admin"
echo "  3) Docker: docker exec \$(docker ps -q -f name=kpi_api_api | head -n1) node scripts/reset-admin.cjs"
