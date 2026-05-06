#!/bin/bash

# ============================================
# BUILD LOCAL DO APK (sem EAS Cloud)
# ============================================

set -e

INSTALL_DIR="/var/www/ponto-saas"
APK_OUTPUT_DIR="$INSTALL_DIR/mobile-app/apk-builds"

echo "=========================================="
echo "  BUILD LOCAL APK - Ponto SaaS Mobile"
echo "=========================================="
echo ""

cd $INSTALL_DIR/mobile-app

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se Android SDK está instalado
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME não configurado!"
    echo ""
    echo "Instale o Android SDK:"
    echo "  sudo apt-get install android-sdk"
    echo ""
    echo "Ou configure manualmente:"
    echo "  export ANDROID_HOME=/usr/lib/android-sdk"
    echo "  export PATH=\$PATH:\$ANDROID_HOME/tools:\$ANDROID_HOME/platform-tools"
    exit 1
fi

echo "🔧 Configurando build local..."

# Prebuild (gera pasta android)
npx expo prebuild --platform android

# Entrar na pasta android
cd android

# Dar permissão ao gradlew
chmod +x gradlew

# Build do APK
echo "🚀 Compilando APK..."
./gradlew assembleRelease

# Copiar APK para pasta de saída
mkdir -p $APK_OUTPUT_DIR

APK_SOURCE="app/build/outputs/apk/release/app-release.apk"
APK_DEST="$APK_OUTPUT_DIR/ponto-saas-$(date +%Y%m%d-%H%M%S).apk"

if [ -f "$APK_SOURCE" ]; then
    cp "$APK_SOURCE" "$APK_DEST"
    echo ""
    echo "✅ APK gerado com sucesso!"
    echo ""
    echo "Local: $APK_DEST"
    echo ""
    echo "Para instalar no dispositivo:"
    echo "  adb install $APK_DEST"
else
    echo "❌ Erro: APK não encontrado"
    exit 1
fi
