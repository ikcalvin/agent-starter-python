#!/bin/bash

# Redeploy script for SolarX Agent
# Run this on your Google VM to pull latest changes and restart the container

set -e  # Exit on any error

echo "🔄 Starting agent redeploy..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull

# Build new Docker image
echo "🔨 Building Docker image..."
docker build -t solarx-agent .

# Stop and remove existing container (ignore errors if not running)
echo "🛑 Stopping existing container..."
docker stop solarx-agent 2>/dev/null || true
docker rm solarx-agent 2>/dev/null || true

# Start new container
echo "🚀 Starting new container..."
docker run -d \
  --name solarx-agent \
  --restart unless-stopped \
  --env-file .env.local \
  solarx-agent

# Show logs
echo "✅ Redeploy complete! Showing logs (Ctrl+C to exit)..."
docker logs -f solarx-agent
