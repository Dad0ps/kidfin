#!/bin/bash
# KidFin LXC Setup Script for Proxmox
# Run this on your Proxmox host (not inside an LXC)
#
# Usage: bash setup-lxc.sh
#
# Prerequisites:
#   - Proxmox VE with pveam available
#   - An existing network bridge (default: vmbr0)
#   - The KidFin repo: https://github.com/Dad0ps/kidfin.git

# --- Configuration (edit these to match your environment) ---
CTID=210
HOSTNAME="kidfin"
MEMORY=512
SWAP=256
DISK=4
CORES=1
BRIDGE="vmbr0"
STORAGE="local-lvm"
TEMPLATE_STORAGE="local"
IP="192.168.0.204/24"
GATEWAY="192.168.0.1"
# -----------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}[STEP]${NC} $1"; }
info() { echo -e "${YELLOW}  -->  ${NC}$1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

echo ""
echo "========================================="
echo "  KidFin LXC Setup"
echo "  Container: $CTID | IP: $IP"
echo "========================================="

# --- Destroy existing container if present ---
if pct status "$CTID" &>/dev/null; then
    step "Container $CTID already exists, destroying it..."
    pct stop "$CTID" 2>/dev/null || true
    sleep 2
    pct destroy "$CTID" --purge
    info "Old container removed"
fi

# --- Template ---
step "Updating template catalog..."
pveam update || fail "Could not update template list"

step "Finding latest Debian 12 template..."
TEMPLATE=$(pveam available --section system | grep "debian-12-standard" | awk '{print $2}' | sort -V | tail -n1)
if [ -z "$TEMPLATE" ]; then
    fail "No Debian 12 template found. Check your Proxmox repository config."
fi
info "Found: $TEMPLATE"

if ! pveam list "$TEMPLATE_STORAGE" | grep -q "$TEMPLATE"; then
    step "Downloading template..."
    pveam download "$TEMPLATE_STORAGE" "$TEMPLATE" || fail "Template download failed"
else
    info "Template already downloaded"
fi

# --- Create LXC ---
step "Creating LXC container $CTID..."

if [ "$IP" = "dhcp" ]; then
    NETCONFIG="name=eth0,bridge=${BRIDGE},ip=dhcp"
else
    NETCONFIG="name=eth0,bridge=${BRIDGE},ip=${IP},gw=${GATEWAY}"
fi

pct create "$CTID" "${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}" \
    --hostname "$HOSTNAME" \
    --memory "$MEMORY" \
    --swap "$SWAP" \
    --cores "$CORES" \
    --rootfs "${STORAGE}:${DISK}" \
    --net0 "$NETCONFIG" \
    --unprivileged 1 \
    --features nesting=1 \
    --onboot 1 \
    --start 0 || fail "Container creation failed"
info "Container created"

# --- Start ---
step "Starting container..."
pct start "$CTID" || fail "Container failed to start"
sleep 5

# Verify it's running
if [ "$(pct status "$CTID" | awk '{print $2}')" != "running" ]; then
    fail "Container is not running"
fi
info "Container is running"

# --- DNS ---
step "Configuring DNS..."
pct exec "$CTID" -- bash -c 'cat > /etc/resolv.conf <<EOF
nameserver 8.8.8.8
nameserver 1.1.1.1
EOF'
info "DNS set (8.8.8.8, 1.1.1.1)"

# --- Network check ---
step "Checking network connectivity..."
pct exec "$CTID" -- ping -c 2 -W 3 8.8.8.8 > /dev/null 2>&1 || fail "Container has no internet access. Check bridge/gateway config."
pct exec "$CTID" -- bash -c 'apt-get update -qq > /dev/null 2>&1' || fail "DNS resolution failed. Container cannot reach package repos."
info "Network and DNS OK"

# --- Install packages ---
step "Updating packages..."
pct exec "$CTID" -- apt-get update -qq || fail "apt-get update failed"
info "Package list updated"

step "Installing git, curl, ca-certificates..."
pct exec "$CTID" -- apt-get install -y -qq git curl ca-certificates gnupg || fail "Package install failed"
info "Packages installed"

# --- Docker ---
step "Installing Docker..."
pct exec "$CTID" -- bash -c 'curl -fsSL https://get.docker.com | sh' || fail "Docker install failed"
info "Docker installed"

step "Starting Docker daemon..."
pct exec "$CTID" -- systemctl enable docker > /dev/null 2>&1
pct exec "$CTID" -- systemctl start docker || fail "Docker failed to start"
sleep 3

pct exec "$CTID" -- docker info > /dev/null 2>&1 || fail "Docker is not responding"
info "Docker is running"

# --- Clone repo ---
step "Cloning KidFin repo..."
pct exec "$CTID" -- git clone https://github.com/Dad0ps/kidfin.git /opt/kidfin || fail "Git clone failed. Is the repo public?"
info "Repo cloned to /opt/kidfin"

# --- Build and run ---
step "Building Docker image (this may take a minute)..."
pct exec "$CTID" -- bash -c 'cd /opt/kidfin && docker compose build --no-cache 2>&1' || fail "Docker build failed"
info "Image built"

step "Starting KidFin container..."
pct exec "$CTID" -- bash -c 'cd /opt/kidfin && docker compose up -d 2>&1' || fail "Docker compose up failed"
sleep 3

# --- Verify ---
step "Verifying KidFin is responding..."
TRIES=0
MAX_TRIES=10
while [ $TRIES -lt $MAX_TRIES ]; do
    if pct exec "$CTID" -- curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q "200"; then
        break
    fi
    TRIES=$((TRIES + 1))
    sleep 2
done

if [ $TRIES -eq $MAX_TRIES ]; then
    echo ""
    info "Docker container status:"
    pct exec "$CTID" -- docker ps -a
    echo ""
    info "Docker logs:"
    pct exec "$CTID" -- docker compose -f /opt/kidfin/docker-compose.yml logs --tail=20
    fail "KidFin is not responding on port 3000 after 20 seconds"
fi
info "KidFin is live"

# --- Done ---
CONTAINER_IP=$(pct exec "$CTID" -- hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  KidFin is running${NC}"
echo -e "${GREEN}  http://${CONTAINER_IP}:3000${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Useful commands:"
echo "  pct enter $CTID                                                              # shell into LXC"
echo "  pct exec $CTID -- docker compose -f /opt/kidfin/docker-compose.yml logs -f   # view logs"
echo "  pct exec $CTID -- docker compose -f /opt/kidfin/docker-compose.yml restart    # restart"
echo ""
echo "To update KidFin later:"
echo "  pct enter $CTID"
echo "  cd /opt/kidfin && git pull && docker compose up -d --build"
