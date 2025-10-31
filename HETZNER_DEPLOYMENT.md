# 🚀 Guía de Deployment en Hetzner con OpenAI

Esta guía completa te ayudará a desplegar **Open Notebook** en un servidor Hetzner usando **OpenAI** como proveedor de IA.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Opción 1: Deployment Rápido (Sin Dominio)](#opción-1-deployment-rápido-sin-dominio)
- [Opción 2: Deployment Profesional (Con Dominio y SSL)](#opción-2-deployment-profesional-con-dominio-y-ssl)
- [Configuración de Modelos OpenAI](#configuración-de-modelos-openai)
- [Mantenimiento y Monitoreo](#mantenimiento-y-monitoreo)
- [Troubleshooting](#troubleshooting)
- [Optimización de Costos](#optimización-de-costos)

---

## 📋 Requisitos Previos

### 1. Servidor Hetzner

**Plan Mínimo Recomendado: CPX21**
- 3 vCPU
- 4 GB RAM
- 80 GB SSD
- ~€5.83/mes

**Plan Óptimo: CPX31**
- 4 vCPU
- 8 GB RAM
- 160 GB SSD
- ~€11.05/mes

### 2. API Key de OpenAI

1. Ve a [platform.openai.com](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Navega a **API Keys**
4. Crea una nueva clave secreta
5. Copia la clave (comienza con `sk-`)
6. **Agrega al menos $5 de crédito** a tu cuenta

### 3. Dominio (Opcional pero Recomendado)

- Un dominio propio (ej: `notebook.tudominio.com`)
- Acceso al panel DNS de tu proveedor de dominio

---

## 🚀 Opción 1: Deployment Rápido (Sin Dominio)

### Paso 1: Crear Servidor en Hetzner

1. Ve a [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Crea un nuevo proyecto: "Open Notebook"
3. Crea un servidor con estas especificaciones:
   - **Location**: Nuremberg, Germany (o el más cercano)
   - **Image**: Ubuntu 22.04
   - **Type**: CPX21 o superior
   - **SSH Key**: Agrega tu clave SSH pública

4. **Configura el Firewall**:
   - Permite puerto 22 (SSH)
   - Permite puerto 80 (HTTP)
   - Permite puerto 443 (HTTPS)
   - Permite puerto 8502 (Frontend temporalmente)
   - Permite puerto 5055 (API temporalmente)

### Paso 2: Conectar al Servidor

```bash
# Obtén la IP de tu servidor desde la consola de Hetzner
ssh root@YOUR_SERVER_IP
```

### Paso 3: Instalar Docker y Docker Compose

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y curl git ca-certificates gnupg

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalación
docker --version
docker compose version
```

### Paso 4: Clonar el Repositorio

```bash
# Ir al directorio home
cd /root

# Clonar el repositorio
git clone https://github.com/lfnovo/open-notebook.git
cd open-notebook

# O si tienes tu fork
# git clone https://github.com/tu-usuario/open-notebook-español.git
# cd open-notebook-español
```

### Paso 5: Configurar Variables de Entorno

```bash
# Copiar archivo de configuración para Hetzner
cp .env.hetzner .env

# Editar configuración
nano .env
```

**Configura estas variables OBLIGATORIAS**:

```bash
# Reemplaza con la IP de tu servidor Hetzner
API_URL=http://YOUR_SERVER_IP:5055

# Establece una contraseña segura
OPEN_NOTEBOOK_PASSWORD=tu_contraseña_super_segura_123

# Tu API key de OpenAI
OPENAI_API_KEY=sk-tu-api-key-real-de-openai

# Base de datos (ya configurado correctamente)
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=root
SURREAL_NAMESPACE=open_notebook
SURREAL_DATABASE=production
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

### Paso 6: Crear Directorios de Datos

```bash
# Crear directorios para persistencia
mkdir -p data/notebook_data data/surreal_data

# Dar permisos
chmod -R 755 data/
```

### Paso 7: Iniciar Open Notebook

```bash
# Iniciar con docker-compose
docker compose -f docker-compose.hetzner.yml up -d

# Ver logs para verificar que todo está bien
docker compose -f docker-compose.hetzner.yml logs -f
```

Espera a ver estos mensajes:
- `✓ Next.js started on http://localhost:8502`
- `✓ FastAPI started on http://0.0.0.0:5055`
- `✓ SurrealDB started`

Presiona `Ctrl+C` para salir de los logs.

### Paso 8: Acceder a Open Notebook

Abre tu navegador y ve a:

```
http://YOUR_SERVER_IP:8502
```

1. Ingresa la contraseña que configuraste
2. ¡Listo! Ya puedes usar Open Notebook

---

## 🏆 Opción 2: Deployment Profesional (Con Dominio y SSL)

### Prerequisitos Adicionales

- Un dominio (ej: `tudominio.com`)
- Acceso al DNS del dominio

### Paso 1-3: Mismo que Opción 1

Sigue los pasos 1-3 de la Opción 1 (crear servidor, conectar, instalar Docker).

### Paso 4: Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.):

1. Crea un registro **A** apuntando a tu IP de Hetzner:
   ```
   notebook.tudominio.com  →  YOUR_SERVER_IP
   ```

2. Espera 5-10 minutos para propagación DNS

3. Verifica con:
   ```bash
   ping notebook.tudominio.com
   ```

### Paso 5: Instalar Certbot para SSL

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Instalar Nginx
apt install -y nginx
```

### Paso 6: Configurar Nginx como Reverse Proxy

```bash
# Crear configuración de Nginx
nano /etc/nginx/sites-available/open-notebook
```

**Pega esta configuración** (reemplaza `notebook.tudominio.com` con tu dominio):

```nginx
# HTTP - Redirige a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name notebook.tudominio.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Configuración principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name notebook.tudominio.com;

    # Certificados SSL (se generarán con Certbot)
    ssl_certificate /etc/letsencrypt/live/notebook.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/notebook.tudominio.com/privkey.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Tamaño máximo de subida (para PDFs y archivos grandes)
    client_max_body_size 100M;

    # Timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Proxy a Open Notebook
    location / {
        proxy_pass http://localhost:8502;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

```bash
# Habilitar el sitio
ln -s /etc/nginx/sites-available/open-notebook /etc/nginx/sites-enabled/

# Deshabilitar sitio default
rm /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t
```

### Paso 7: Generar Certificado SSL

```bash
# Detener Nginx temporalmente
systemctl stop nginx

# Generar certificado SSL (reemplaza con tu dominio y email)
certbot certonly --standalone \
  -d notebook.tudominio.com \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email

# Iniciar Nginx
systemctl start nginx
systemctl enable nginx

# Verificar auto-renovación
certbot renew --dry-run
```

### Paso 8: Configurar Open Notebook

```bash
# Clonar repositorio
cd /root
git clone https://github.com/lfnovo/open-notebook.git
cd open-notebook

# Copiar configuración
cp .env.hetzner .env

# Editar configuración
nano .env
```

**Configura con tu dominio**:

```bash
# IMPORTANTE: Usa tu dominio con HTTPS
API_URL=https://notebook.tudominio.com

# Contraseña segura
OPEN_NOTEBOOK_PASSWORD=tu_contraseña_super_segura_123

# API Key de OpenAI
OPENAI_API_KEY=sk-tu-api-key-real-de-openai

# Base de datos
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=root
SURREAL_NAMESPACE=open_notebook
SURREAL_DATABASE=production
```

### Paso 9: Iniciar Open Notebook

```bash
# Crear directorios
mkdir -p data/notebook_data data/surreal_data
chmod -R 755 data/

# Iniciar contenedor
docker compose -f docker-compose.hetzner.yml up -d

# Ver logs
docker compose -f docker-compose.hetzner.yml logs -f
```

### Paso 10: Ajustar Firewall

```bash
# Como ahora usamos Nginx, cerramos los puertos directos
# Solo necesitamos SSH, HTTP y HTTPS

# En Hetzner Cloud Console:
# - Permite: 22 (SSH)
# - Permite: 80 (HTTP)
# - Permite: 443 (HTTPS)
# - BLOQUEA: 8502 (ya no necesario)
# - BLOQUEA: 5055 (ya no necesario)
```

### Paso 11: Acceder a Open Notebook

Abre tu navegador y ve a:

```
https://notebook.tudominio.com
```

¡Listo! Ahora tienes Open Notebook con HTTPS profesional.

---

## 🤖 Configuración de Modelos OpenAI

Una vez que accedas a Open Notebook:

### 1. Ir a Configuración de Modelos

1. Haz clic en **"⚙️ Settings"** en la barra lateral
2. Haz clic en **"🤖 Models"**

### 2. Configurar Modelos Recomendados

#### Modelo de Lenguaje (Language Model)

**Para uso general y económico**:
- **Proveedor**: OpenAI
- **Modelo**: `gpt-4o-mini`
- **Uso**: Chat, transformaciones, insights

**Para tareas complejas**:
- **Proveedor**: OpenAI
- **Modelo**: `gpt-4o`
- **Uso**: Análisis profundos, generación de podcasts

#### Modelo de Embeddings (Obligatorio)

**Recomendado**:
- **Proveedor**: OpenAI
- **Modelo**: `text-embedding-3-small`
- **Uso**: Búsqueda semántica

**Más potente pero más caro**:
- **Proveedor**: OpenAI
- **Modelo**: `text-embedding-3-large`

#### Text-to-Speech (Para Podcasts)

**Económico**:
- **Proveedor**: OpenAI
- **Modelo**: `tts-1`

**Alta calidad**:
- **Proveedor**: OpenAI
- **Modelo**: `tts-1-hd`

#### Speech-to-Text (Para Transcripciones)

- **Proveedor**: OpenAI
- **Modelo**: `whisper-1`

### 3. Guardar Configuración

Haz clic en **"Save"** después de configurar todos los modelos.

---

## 🔧 Mantenimiento y Monitoreo

### Ver Logs en Tiempo Real

```bash
# Logs de todos los servicios
docker compose -f docker-compose.hetzner.yml logs -f

# Solo logs de Open Notebook
docker compose -f docker-compose.hetzner.yml logs -f open_notebook

# Últimas 100 líneas
docker compose -f docker-compose.hetzner.yml logs --tail=100
```

### Reiniciar Servicio

```bash
# Reiniciar todo
docker compose -f docker-compose.hetzner.yml restart

# Solo reiniciar Open Notebook
docker compose -f docker-compose.hetzner.yml restart open_notebook
```

### Detener Servicio

```bash
# Detener (los datos se mantienen)
docker compose -f docker-compose.hetzner.yml down

# Detener y eliminar volúmenes (PELIGRO: borra datos)
docker compose -f docker-compose.hetzner.yml down -v
```

### Actualizar a Nueva Versión

```bash
# Ir al directorio del proyecto
cd /root/open-notebook

# Actualizar código (si clonaste el repo)
git pull

# Descargar nueva imagen
docker compose -f docker-compose.hetzner.yml pull

# Reiniciar con nueva versión
docker compose -f docker-compose.hetzner.yml up -d

# Ver logs para verificar
docker compose -f docker-compose.hetzner.yml logs -f
```

### Backup de Datos

```bash
# Crear backup completo
cd /root/open-notebook
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz data/

# Copiar backup a tu máquina local
# Desde tu computadora local:
scp root@YOUR_SERVER_IP:/root/open-notebook/backup-*.tar.gz ./
```

### Restaurar desde Backup

```bash
# Detener servicio
docker compose -f docker-compose.hetzner.yml down

# Restaurar datos
cd /root/open-notebook
tar -xzf backup-20250131-120000.tar.gz

# Reiniciar servicio
docker compose -f docker-compose.hetzner.yml up -d
```

### Monitoreo de Recursos

```bash
# Ver uso de CPU y RAM en tiempo real
docker stats

# Ver espacio en disco
df -h

# Ver logs del sistema
journalctl -u docker -f
```

---

## 🔍 Troubleshooting

### Error: "Unable to connect to server"

**Causa**: Frontend no puede conectarse al backend.

**Solución**:
```bash
# 1. Verificar que el contenedor esté corriendo
docker ps

# 2. Verificar logs
docker compose -f docker-compose.hetzner.yml logs open_notebook

# 3. Verificar variable API_URL
docker exec open-notebook env | grep API_URL

# 4. Probar endpoint de health
curl http://localhost:5055/health
```

### Error: "OpenAI API key not found"

**Solución**:
```bash
# 1. Verificar que la API key esté en .env
grep OPENAI_API_KEY .env

# 2. Reiniciar contenedor
docker compose -f docker-compose.hetzner.yml restart

# 3. Si persiste, editar .env y volver a iniciar
nano .env
docker compose -f docker-compose.hetzner.yml down
docker compose -f docker-compose.hetzner.yml up -d
```

### Error: "Insufficient credits" o "Rate limit exceeded"

**Causa**: Sin créditos en OpenAI o límite de requests excedido.

**Solución**:
1. Ve a [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. Verifica tu balance
3. Agrega más créditos si es necesario
4. Revisa límites en [platform.openai.com/account/limits](https://platform.openai.com/account/limits)

### Contenedor se Reinicia Constantemente

**Solución**:
```bash
# Ver qué está causando el reinicio
docker compose -f docker-compose.hetzner.yml logs --tail=50 open_notebook

# Revisar uso de memoria
docker stats

# Si es por memoria, aumenta el límite en docker-compose.hetzner.yml
nano docker-compose.hetzner.yml
# Aumenta memory de 3G a 4G o 6G
```

### Certificado SSL No Renueva Automáticamente

**Solución**:
```bash
# Verificar estado de renovación
certbot certificates

# Renovar manualmente
certbot renew

# Si falla, regenerar
certbot delete --cert-name notebook.tudominio.com
certbot certonly --nginx -d notebook.tudominio.com
```

### Puerto ya en uso

**Solución**:
```bash
# Ver qué está usando el puerto 8502 o 5055
lsof -i :8502
lsof -i :5055

# Si es otro contenedor, detenerlo
docker stop [container_id]

# O cambiar puertos en docker-compose.hetzner.yml
# Por ejemplo: "9502:8502" en lugar de "8502:8502"
```

---

## 💰 Optimización de Costos

### Costos Estimados Mensuales

**Infraestructura Hetzner**:
- CPX21: €5.83/mes
- CPX31: €11.05/mes

**OpenAI API**:
- **GPT-4o-mini**: ~$0.15 por 1M tokens de entrada, ~$0.60 por 1M tokens de salida
- **GPT-4o**: ~$2.50 por 1M tokens de entrada, ~$10.00 por 1M tokens de salida
- **Embeddings**: ~$0.02 por 1M tokens
- **TTS**: ~$15 por 1M caracteres
- **Whisper**: ~$0.006 por minuto

**Uso típico para 1 persona (uso moderado)**:
- Chat y análisis: ~$5-10/mes
- Embeddings: ~$1-2/mes
- Podcasts (2-3 al mes): ~$2-5/mes
- **Total**: ~€25-40/mes (servidor + OpenAI)

### Tips para Reducir Costos

1. **Usa GPT-4o-mini para la mayoría de tareas**:
   ```bash
   # En Settings > Models, usa gpt-4o-mini como default
   ```

2. **Considera alternativas gratuitas/baratas**:
   - **Groq**: Inferencia rápida y gratuita (limitada)
   - **Ollama local**: Si tienes GPU en tu servidor
   - **OpenRouter**: Acceso a modelos más baratos

3. **Agrega más proveedores en .env**:
   ```bash
   # Groq (gratuito con límites)
   GROQ_API_KEY=gsk_your-groq-key

   # Usa Groq para chat, OpenAI solo para embeddings
   ```

4. **Configura límites en OpenAI**:
   - Ve a [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
   - Establece un límite de gasto mensual

5. **Monitorea uso**:
   - Revisa [platform.openai.com/usage](https://platform.openai.com/usage) semanalmente

---

## 📞 Soporte

### Recursos

- **Documentación**: `/docs` en el repositorio
- **Discord**: [discord.gg/37XJPXfz2w](https://discord.gg/37XJPXfz2w)
- **GitHub Issues**: [github.com/lfnovo/open-notebook/issues](https://github.com/lfnovo/open-notebook/issues)

### Logs de Ayuda

Si necesitas ayuda, incluye:

```bash
# Versión de Docker
docker --version

# Estado de contenedores
docker ps -a

# Logs recientes
docker compose -f docker-compose.hetzner.yml logs --tail=100

# Configuración (SIN API KEYS)
cat .env | grep -v "API_KEY"
```

---

## ✅ Checklist Final

- [ ] Servidor Hetzner creado (CPX21 o superior)
- [ ] Docker y Docker Compose instalados
- [ ] Dominio apuntando al servidor (opcional)
- [ ] Certificado SSL configurado (opcional)
- [ ] Archivo `.env` configurado con tu API key de OpenAI
- [ ] Contraseña segura establecida en `OPEN_NOTEBOOK_PASSWORD`
- [ ] Open Notebook corriendo: `docker ps` muestra contenedor activo
- [ ] Acceso web funcionando
- [ ] Modelos configurados en Settings > Models
- [ ] Primer notebook creado y probado

---

¡Felicidades! 🎉 Ya tienes Open Notebook corriendo profesionalmente en Hetzner con OpenAI.
