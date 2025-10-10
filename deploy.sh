#!/bin/bash

echo "========================================="
echo "  Claude Max MVP - Deployment Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose found${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found!${NC}"
    echo "Creating .env from .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please edit .env and add your Anthropic API key:${NC}"
        echo "   nano .env"
        echo ""
        echo "Press Enter when ready to continue..."
        read
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
        exit 1
    fi
fi

# Check if API key is set
source .env
if [ "$ANTHROPIC_API_KEY" = "your_api_key_here" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${RED}❌ Anthropic API key not set in .env!${NC}"
    echo "Please edit .env and add your API key:"
    echo "   nano .env"
    exit 1
fi

echo -e "${GREEN}✅ Configuration looks good${NC}"
echo ""

# Pull latest images
echo "📦 Pulling Docker images..."
docker compose pull

# Build custom images
echo ""
echo "🔨 Building application..."
docker compose build

# Start services
echo ""
echo "🚀 Starting services..."
docker compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}🎉 Claude Max is now running!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "🌐 Frontend:  http://localhost:3000"
    echo "🔧 Backend:   http://localhost:8000"
    echo "📊 Health:    http://localhost:8000/health"
    echo ""
    echo "📝 View logs:     docker compose logs -f"
    echo "🔄 Restart:       docker compose restart"
    echo "🛑 Stop:          docker compose down"
    echo ""
    echo -e "${YELLOW}💡 Tip: Access from another machine using your VM's IP:${NC}"
    echo "   http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
else
    echo -e "${RED}❌ Something went wrong!${NC}"
    echo "Check logs with: docker compose logs"
    exit 1
fi
