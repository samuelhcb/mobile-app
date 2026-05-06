# Ponto SaaS - Aplicativo Mobile

Aplicativo Android para funcionários registrarem ponto pelo celular com **reconhecimento facial**.

## Funcionalidades

- ✅ Login com email e senha
- ✅ **Reconhecimento facial** para bater ponto
- ✅ Validação de permissão (`permite_mobile`) no sistema principal
- ✅ Bater ponto (Entrada, Intervalo, Retorno, Saída)
- ✅ Geolocalização do registro
- ✅ Histórico de pontos do dia
- ✅ Verificação se funcionário está liberado para usar o app

## Requisitos do Sistema Principal

No sistema web (cadastro de funcionário), o campo `permite_mobile` deve estar **true**:

```javascript
// No cadastro do funcionário
{
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "permite_mobile": true,  // ← DEVE ESTAR TRUE
  "face_cadastrada": true  // ← Recomendado para reconhecimento facial
}
```

## Fluxo do App

1. **Login** → Funcionário entra com email e senha
2. **Verificação** → App verifica se `permite_mobile = true`
3. **Home** → Mostra status e botão para bater ponto
4. **Reconhecimento Facial** → Câmera frontal detecta rosto e captura foto
5. **Registro** → Foto + localização são enviadas para a API
6. **Confirmação** → Ponto registrado com sucesso

## Gerar APK

### Opção 1: EAS Cloud (Recomendado)

```bash
cd /var/www/ponto-saas/mobile-app

# Instalar EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar projeto (primeira vez)
eas build:configure

# Gerar APK
eas build -p android --profile preview

# Ou gerar AAB para Play Store
eas build -p android --profile production
```

O APK será gerado na nuvem e você receberá um link para download.

### Opção 2: Build Local

```bash
cd /var/www/ponto-saas/mobile-app

# Instalar dependências
npm install

# Build local (requer Android SDK)
./build-local.sh
```

**Requisitos para build local:**
- Android SDK instalado
- Variável `ANDROID_HOME` configurada
- Java JDK 11+

### Opção 3: Script Automático

```bash
cd /var/www/ponto-saas/mobile-app
./build-apk.sh
```

## Instalação do APK no Dispositivo

### Via ADB:
```bash
adb install apk-builds/ponto-saas-XXXXXX.apk
```

### Via download:
1. Transfira o APK para o dispositivo
2. Abra o arquivo no dispositivo
3. Permitir instalação de fontes desconhecidas
4. Instalar

## Configuração da API

Edite `src/services/api.ts`:

```typescript
const API_URL = 'https://ponto.samuelinformatica.com.br/api';
```

## Permissões Necessárias

O app solicita:
- **Câmera**: Para reconhecimento facial
- **Localização**: Para validar local do registro

## Estrutura

```
mobile-app/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx         # Autenticação
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Navegação
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Login
│   │   ├── HomeScreen.tsx          # Home com verificação
│   │   └── FaceRecognitionScreen.tsx  # Reconhecimento facial
│   └── services/
│       └── api.ts                  # API
├── build-apk.sh                    # Script build EAS
├── build-local.sh                  # Script build local
├── download-apk.sh                 # Script download
├── App.tsx
├── app.json
└── eas.json
```

## Como Funciona o Reconhecimento Facial

1. **Detecção**: App detecta rosto na câmera frontal
2. **Validação**: Verifica posição e tamanho do rosto
3. **Contagem**: Contagem regressiva de 3 segundos
4. **Captura**: Foto automática quando rosto está posicionado
5. **Envio**: Foto é enviada junto com o registro de ponto

## Verificação de Permissão

O app verifica o campo `permite_mobile` do funcionário:

- **Se true**: Mostra botão para bater ponto
- **Se false**: Mostra mensagem de acesso negado

Isso é configurado no sistema principal (web) no cadastro do funcionário.

## Publicação na Play Store

1. Criar conta de desenvolvedor Google Play ($25)
2. Gerar AAB: `eas build -p android --profile production`
3. Fazer upload na Play Store Console
4. Configurar ficha do app (screenshots, descrição)
5. Publicar

## Scripts Disponíveis

```bash
# Build via EAS Cloud
./build-apk.sh

# Build local
./build-local.sh

# Instruções de download
./download-apk.sh
```

## Suporte

Para suporte: suporte@samuelinformatica.com.br
