#!/bin/bash

# ===================================================================
# OPEN NOTEBOOK - SCRIPT DE INSTALACIÓN AUTOMATIZADA PARA HETZNER
# ===================================================================
# Este script automatiza la instalación de Open Notebook en un
# servidor Hetzner con OpenAI como proveedor de IA
# ===================================================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root. Usa: sudo bash install-hetzner.sh"
    exit 1
fi

# Banner
clear
cat << "EOF"
 ╔═══════════════════════════════════════════════════════════╗
 ║                                                           ║
 ║              OPEN NOTEBOOK - HETZNER INSTALLER            ║
 ║                                                           ║
 ║          Instalación automatizada para servidores        ║
 ║                  Hetzner con OpenAI                       ║
 ║                                                           ║
 ╚═══════════════════════════════════════════════════════════╝
EOF

echo ""
print_info "Este script instalará:"
echo "  • Docker y Docker Compose"
echo "  • Open Notebook"
echo "  • Configuración optimizada para producción"
echo ""
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_warning "Instalación cancelada."
    exit 1
fi

# ===================================================================
# PASO 1: RECOLECTAR INFORMACIÓN
# ===================================================================
print_header "PASO 1: CONFIGURACIÓN INICIAL"

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)
print_success "IP del servidor detectada: $SERVER_IP"

# Preguntar sobre dominio
echo ""
read -p "¿Tienes un dominio configurado? (s/n): " -n 1 -r
echo
USE_DOMAIN=false
if [[ $REPLY =~ ^[Ss]$ ]]; then
    USE_DOMAIN=true
    read -p "Ingresa tu dominio (ej: notebook.tudominio.com): " DOMAIN
    print_info "Dominio configurado: $DOMAIN"
    API_URL="https://$DOMAIN"
else
    print_info "Usaremos la IP del servidor: $SERVER_IP"
    API_URL="http://$SERVER_IP:5055"
fi

# Solicitar API Key de OpenAI
echo ""
print_warning "Necesitas una API key de OpenAI. Obtén una en: https://platform.openai.com/api-keys"
read -p "Ingresa tu API key de OpenAI (sk-...): " OPENAI_KEY

if [[ ! $OPENAI_KEY =~ ^sk- ]]; then
    print_error "API key inválida. Debe comenzar con 'sk-'"
    exit 1
fi

# Solicitar contraseña
echo ""
read -sp "Establece una contraseña segura para Open Notebook: " PASSWORD
echo
read -sp "Confirma la contraseña: " PASSWORD_CONFIRM
echo

if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
    print_error "Las contraseñas no coinciden."
    exit 1
fi

print_success "Configuración inicial completa"

# ===================================================================
# PASO 2: ACTUALIZAR SISTEMA
# ===================================================================
print_header "PASO 2: ACTUALIZANDO SISTEMA"

apt update -qq
apt upgrade -y -qq
print_success "Sistema actualizado"

# ===================================================================
# PASO 3: INSTALAR DEPENDENCIAS
# ===================================================================
print_header "PASO 3: INSTALANDO DEPENDENCIAS"

apt install -y -qq curl git ca-certificates gnupg lsb-release ufw
print_success "Dependencias instaladas"

# ===================================================================
# PASO 4: INSTALAR DOCKER
# ===================================================================
print_header "PASO 4: INSTALANDO DOCKER"

if command -v docker &> /dev/null; then
    print_warning "Docker ya está instalado"
    docker --version
else
    print_info "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh > /dev/null 2>&1
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    print_success "Docker instalado correctamente"
    docker --version
fi

# Verificar Docker Compose
if docker compose version &> /dev/null; then
    print_success "Docker Compose disponible"
    docker compose version
else
    print_error "Docker Compose no está disponible"
    exit 1
fi

# ===================================================================
# PASO 5: CONFIGURAR FIREWALL
# ===================================================================
print_header "PASO 5: CONFIGURANDO FIREWALL"

ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

if [ "$USE_DOMAIN" = false ]; then
    ufw allow 8502/tcp  # Frontend
    ufw allow 5055/tcp  # API
fi

print_success "Firewall configurado"

# ===================================================================
# PASO 6: INSTALAR NGINX (SI SE USA DOMINIO)
# ===================================================================
if [ "$USE_DOMAIN" = true ]; then
    print_header "PASO 6: INSTALANDO NGINX Y CERTBOT"

    apt install -y -qq nginx certbot python3-certbot-nginx

    # Crear configuración temporal de Nginx
    cat > /etc/nginx/sites-available/open-notebook << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 100M;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    location / {
        proxy_pass http://localhost:8502;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Habilitar sitio
    ln -sf /etc/nginx/sites-available/open-notebook /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    print_success "Nginx configurado"

    # Obtener certificado SSL
    print_info "Obteniendo certificado SSL..."
    systemctl stop nginx

    read -p "Ingresa tu email para notificaciones de SSL: " EMAIL

    certbot certonly --standalone \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    if [ $? -eq 0 ]; then
        print_success "Certificado SSL obtenido correctamente"
        systemctl start nginx
        systemctl enable nginx
    else
        print_error "Error al obtener certificado SSL"
        print_warning "Puedes obtenerlo manualmente después con: certbot certonly --nginx -d $DOMAIN"
        systemctl start nginx
    fi
else
    print_header "PASO 6: OMITIENDO NGINX (SIN DOMINIO)"
    print_info "No se instalará Nginx porque no se configuró un dominio"
fi

# ===================================================================
# PASO 7: DESCARGAR OPEN NOTEBOOK
# ===================================================================
print_header "PASO 7: DESCARGANDO OPEN NOTEBOOK"

INSTALL_DIR="/opt/open-notebook"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Descargar archivos necesarios
print_info "Descargando archivos de configuración..."

# Descargar docker-compose.hetzner.yml
curl -sL https://raw.githubusercontent.com/lfnovo/open-notebook/main/docker-compose.single.yml -o docker-compose.yml

print_success "Archivos descargados"

# ===================================================================
# PASO 8: CREAR CONFIGURACIÓN
# ===================================================================
print_header "PASO 8: CREANDO CONFIGURACIÓN"

# Crear archivo .env
cat > .env << EOF
# ===================================================================
# OPEN NOTEBOOK - CONFIGURACIÓN PARA HETZNER
# Generado automáticamente el $(date)
# ===================================================================

# API Configuration
API_URL=$API_URL

# Security
OPEN_NOTEBOOK_PASSWORD=$PASSWORD

# OpenAI API
OPENAI_API_KEY=$OPENAI_KEY

# Database (SurrealDB)
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=root
SURREAL_NAMESPACE=open_notebook
SURREAL_DATABASE=production

# Timeouts
API_CLIENT_TIMEOUT=300
ESPERANTO_LLM_TIMEOUT=60
EOF

print_success "Archivo .env creado"

# Crear directorios de datos
mkdir -p data/notebook_data data/surreal_data
chmod -R 755 data/

print_success "Directorios de datos creados"

# ===================================================================
# PASO 9: INICIAR OPEN NOTEBOOK
# ===================================================================
print_header "PASO 9: INICIANDO OPEN NOTEBOOK"

docker compose pull
docker compose up -d

print_info "Esperando a que los servicios inicien..."
sleep 10

# Verificar que está corriendo
if docker ps | grep -q "open-notebook\|open_notebook"; then
    print_success "Open Notebook iniciado correctamente"
else
    print_error "Error al iniciar Open Notebook"
    print_info "Verifica los logs con: docker compose logs"
    exit 1
fi

# ===================================================================
# PASO 10: RESUMEN FINAL
# ===================================================================
print_header "¡INSTALACIÓN COMPLETA! 🎉"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║          OPEN NOTEBOOK INSTALADO CORRECTAMENTE            ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

print_info "📋 INFORMACIÓN DE ACCESO:"
echo ""
if [ "$USE_DOMAIN" = true ]; then
    echo -e "  ${BLUE}🌐 URL:${NC} https://$DOMAIN"
else
    echo -e "  ${BLUE}🌐 URL:${NC} http://$SERVER_IP:8502"
fi
echo -e "  ${BLUE}🔒 Contraseña:${NC} $PASSWORD"
echo -e "  ${BLUE}🤖 Proveedor IA:${NC} OpenAI"
echo ""

print_info "📁 UBICACIÓN DE ARCHIVOS:"
echo ""
echo -e "  ${BLUE}Instalación:${NC} $INSTALL_DIR"
echo -e "  ${BLUE}Datos:${NC} $INSTALL_DIR/data/"
echo -e "  ${BLUE}Configuración:${NC} $INSTALL_DIR/.env"
echo ""

print_info "🔧 COMANDOS ÚTILES:"
echo ""
echo -e "  Ver logs:        ${BLUE}cd $INSTALL_DIR && docker compose logs -f${NC}"
echo -e "  Reiniciar:       ${BLUE}cd $INSTALL_DIR && docker compose restart${NC}"
echo -e "  Detener:         ${BLUE}cd $INSTALL_DIR && docker compose down${NC}"
echo -e "  Actualizar:      ${BLUE}cd $INSTALL_DIR && docker compose pull && docker compose up -d${NC}"
echo -e "  Crear backup:    ${BLUE}cd $INSTALL_DIR && tar -czf backup-\$(date +%Y%m%d).tar.gz data/${NC}"
echo ""

print_info "📖 PRÓXIMOS PASOS:"
echo ""
echo "  1. Abre tu navegador y accede a la URL mostrada arriba"
echo "  2. Ingresa la contraseña configurada"
echo "  3. Ve a Settings > Models y configura:"
echo "     - Language Model: gpt-4o-mini (económico)"
echo "     - Embedding Model: text-embedding-3-small (obligatorio)"
echo "     - Text-to-Speech: tts-1 (para podcasts)"
echo "     - Speech-to-Text: whisper-1 (para transcripciones)"
echo "  4. Crea tu primer notebook y comienza a trabajar"
echo ""

print_info "📚 DOCUMENTACIÓN:"
echo ""
echo "  Guía completa:   $INSTALL_DIR/HETZNER_DEPLOYMENT.md"
echo "  Discord:         https://discord.gg/37XJPXfz2w"
echo "  GitHub:          https://github.com/lfnovo/open-notebook"
echo ""

print_warning "💡 IMPORTANTE:"
echo ""
echo "  • Guarda tu contraseña en un lugar seguro"
echo "  • Monitorea tu uso de OpenAI en: https://platform.openai.com/usage"
echo "  • Haz backups regulares de la carpeta $INSTALL_DIR/data/"
if [ "$USE_DOMAIN" = true ]; then
    echo "  • Los certificados SSL se renuevan automáticamente"
fi
echo ""

print_success "¡Disfruta usando Open Notebook! 🚀"
echo ""

# Guardar información en archivo
cat > "$INSTALL_DIR/INSTALLATION_INFO.txt" << EOF
Open Notebook - Información de Instalación
==========================================

Fecha de instalación: $(date)
Servidor IP: $SERVER_IP
$([ "$USE_DOMAIN" = true ] && echo "Dominio: $DOMAIN" || echo "Sin dominio")
URL de acceso: $([ "$USE_DOMAIN" = true ] && echo "https://$DOMAIN" || echo "http://$SERVER_IP:8502")

Ubicación: $INSTALL_DIR

Contraseña: $PASSWORD
(¡GUARDA ESTA INFORMACIÓN EN UN LUGAR SEGURO!)

Proveedor IA: OpenAI

Comandos útiles:
- Ver logs: cd $INSTALL_DIR && docker compose logs -f
- Reiniciar: cd $INSTALL_DIR && docker compose restart
- Detener: cd $INSTALL_DIR && docker compose down
- Actualizar: cd $INSTALL_DIR && docker compose pull && docker compose up -d

Para soporte: https://discord.gg/37XJPXfz2w
EOF

print_info "Información de instalación guardada en: $INSTALL_DIR/INSTALLATION_INFO.txt"
