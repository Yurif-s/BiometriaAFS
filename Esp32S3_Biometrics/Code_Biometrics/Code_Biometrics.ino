// BIOMETRIA + WIFI + LED + BUZZER — VERSÃO CORRIGIDA

#include <WiFi.h>
#include <Adafruit_Fingerprint.h>
#include <time.h>

// WIFI 
const char* ssid     = "Nome_Rede";
const char* password = "Senha_Rede";

// NTP
const char* ntpServer    = "pool.ntp.org";
long        gmtOffset_sec      = -3 * 3600;
int         daylightOffset_sec = 0;

// PINOS
#define BUZZER         4
#define LED_WIFI       2
#define LED_BIOMETRIA 36
#define RXD2          16
#define TXD2          17

// SENSOR 
HardwareSerial       mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// CONTROLE 
// CORREÇÃO 3: flags independentes para estado do dedo e autenticação
bool dedoPresente   = false;   // true enquanto o dedo está apoiado
bool autenticado    = false;   // true somente após matching bem-sucedido
int  ultimoIDAutenticado = -1; // armazena o ID para exibição

// SONS 
int melodia[]      = {988, 1319};
int duracaoNotas[] = {120, 200};

void tocarMario() {
  for (int i = 0; i < 2; i++) {
    tone(BUZZER, melodia[i]);
    delay(duracaoNotas[i]);
    noTone(BUZZER);
    delay(50);
  }
}

void somWifi() {
  tone(BUZZER, 500); delay(100); noTone(BUZZER);
  delay(50);
  tone(BUZZER, 500); delay(150); noTone(BUZZER);
}

void somErro() {
  tone(BUZZER, 250); delay(300); noTone(BUZZER);
}

// DATA E HORA 
void imprimirDataHora() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("[NTP] Erro ao obter data/hora");
    return;
  }
  Serial.print("[NTP] Data/Hora: ");
  Serial.println(&timeinfo, "%d/%m/%Y %H:%M:%S");
}

// WIFI 
void conectarWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("[WiFi] Conectando");
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Conectado! IP: " + WiFi.localIP().toString());
    digitalWrite(LED_WIFI, HIGH);
    somWifi();
  } else {
    Serial.println("\n[WiFi] Falha na conexão — operando offline");
    digitalWrite(LED_WIFI, LOW);
  }
}

// MENU 
void mostrarMenu() {
  Serial.println("\n===== MENU =====");
  Serial.println("1 - Cadastrar digital");
  Serial.println("2 - Listar digitais");
  Serial.println("3 - Apagar digital");
  Serial.println("================");
}

// GERAR NOVO ID 

int gerarNovoID() {
  Serial.println("[ID] Procurando slot livre...");
  for (int i = 1; i <= 127; i++) {
    // loadModel é seguro aqui porque ainda não capturamos nenhuma imagem.
    // Retorna FINGERPRINT_OK se o slot i tem modelo salvo.
    uint8_t resultado = finger.loadModel(i);
    if (resultado != FINGERPRINT_OK) {
      Serial.print("[ID] Slot livre encontrado: ");
      Serial.println(i);
      return i;
    }
  }
  Serial.println("[ID] Memória cheia (127/127 slots ocupados)");
  return -1; // Memória cheia
}

// CADASTRAR DIGITAL 
void cadastrarDigital() {
  uint8_t p;

  // ── PASSO 0: Reservar o ID ANTES de qualquer captura ──────
  // CORREÇÃO 2 (continuação): O ID é gerado ANTES de capturar imagens,
  // evitando que loadModel() sobrescreva os CharBuffers durante o processo.
  int novoID = gerarNovoID();
  if (novoID == -1) {
    Serial.println("[CAD] Memória cheia. Apague digitais antigas.");
    somErro();
    return;
  }
  Serial.print("[CAD] ID reservado para esta digital: ");
  Serial.println(novoID);

  // PASSO 1: Primeira leitura
  Serial.println("[CAD] Coloque o dedo para 1ª leitura...");
  p = FINGERPRINT_NOFINGER;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
    if (p != FINGERPRINT_OK) {
      Serial.print("[CAD] Erro na 1ª captura, código: ");
      Serial.println(p);
      somErro();
      return;
    }
  }
  Serial.println("[CAD] Imagem 1 capturada.");

  // Converte para CharBuffer 1
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.print("[CAD] Erro ao converter imagem 1, código: ");
    Serial.println(p);
    somErro();
    return;
  }
  Serial.println("[CAD] CharBuffer 1 preenchido.");

  // ── PASSO 2: Verificar duplicidade ANTES de prosseguir ─────
  // Usa fingerFastSearch que compara CharBuffer 1 contra todo o banco
  p = finger.fingerFastSearch();
  if (p == FINGERPRINT_OK) {
    Serial.print("[CAD] Digital já cadastrada no ID: ");
    Serial.print(finger.fingerID);
    Serial.print(" | Confiança: ");
    Serial.println(finger.confidence);
    somErro();
    return;
  }
  if (p != FINGERPRINT_NOTFOUND) {
    Serial.print("[CAD] Erro na verificação de duplicidade, código: ");
    Serial.println(p);
    somErro();
    return;
  }
  Serial.println("[CAD] Digital nova — sem duplicidade.");

  // PASSO 3: Remover dedo 
  Serial.println("[CAD] Remova o dedo...");
  delay(500);
  while (finger.getImage() != FINGERPRINT_NOFINGER) delay(100);
  delay(300);

  // PASSO 4: Segunda leitura 
  Serial.println("[CAD] Coloque o MESMO dedo novamente para 2ª leitura...");
  p = FINGERPRINT_NOFINGER;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
    if (p != FINGERPRINT_OK) {
      Serial.print("[CAD] Erro na 2ª captura, código: ");
      Serial.println(p);
      somErro();
      return;
    }
  }
  Serial.println("[CAD] Imagem 2 capturada.");

  // Converte para CharBuffer 2
  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.print("[CAD] Erro ao converter imagem 2, código: ");
    Serial.println(p);
    somErro();
    return;
  }
  Serial.println("[CAD] CharBuffer 2 preenchido.");

  // PASSO 5: Criar modelo combinando CharBuffer 1 + 2 
  p = finger.createModel();
  if (p == FINGERPRINT_ENROLLMISMATCH) {
    Serial.println("[CAD] ERRO: As duas leituras não coincidem. Tente novamente.");
    somErro();
    return;
  }
  if (p != FINGERPRINT_OK) {
    Serial.print("[CAD] Erro ao criar modelo, código: ");
    Serial.println(p);
    somErro();
    return;
  }
  Serial.println("[CAD] Modelo criado com sucesso.");

  // PASSO 6: Salvar no slot reservado
  // CORREÇÃO 2: novoID já foi calculado na etapa 0, antes de qualquer
  // captura — os CharBuffers não foram tocados desde então.
  p = finger.storeModel(novoID);
  if (p == FINGERPRINT_OK) {
    Serial.print("[CAD] ✔ Digital cadastrada com sucesso! ID: ");
    Serial.println(novoID);
    imprimirDataHora();
    digitalWrite(LED_BIOMETRIA, HIGH);
    tocarMario();
    delay(300);
    digitalWrite(LED_BIOMETRIA, LOW);
  } else {
    Serial.print("[CAD] Erro ao salvar no slot ");
    Serial.print(novoID);
    Serial.print(", código: ");
    Serial.println(p);
    somErro();
  }
}

// AUTENTICAR DIGITAL 
void autenticarDigital() {
  uint8_t p = finger.getImage();

  // Dedo ausente 
  if (p == FINGERPRINT_NOFINGER) {
    if (dedoPresente) {
      // O dedo foi removido: resetar todos os estados
      dedoPresente        = false;
      autenticado         = false;
      ultimoIDAutenticado = -1;
      Serial.println("[AUTH] Dedo removido — aguardando...");
    }
    return; // nada a fazer sem dedo
  }

  // Erro real na captura da imagem
  if (p != FINGERPRINT_OK) {
    Serial.print("[AUTH] Erro na captura de imagem, código: ");
    Serial.println(p);
    return;
  }

  // Dedo detectado
  if (!dedoPresente) {
    dedoPresente = true;
    Serial.println("[AUTH] Dedo detectado — processando...");
  }

  // Se já autenticado este evento de toque, não reprocessa
  if (autenticado) return;

  // Converter imagem para CharBuffer 1 
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.print("[AUTH] Erro na conversão da imagem, código: ");
    Serial.println(p);
    return;
  }

  // Busca rápida em TODO o banco do sensor
  p = finger.fingerFastSearch();

  if (p == FINGERPRINT_OK) {
    // MATCH ENCONTRADO 
    autenticado         = true;
    ultimoIDAutenticado = finger.fingerID;

    Serial.println("\n[AUTH] ✔ DIGITAL RECONHECIDA!");
    Serial.print("[AUTH] ID do usuário: ");
    Serial.println(finger.fingerID);
    Serial.print("[AUTH] Score de confiança: ");
    Serial.print(finger.confidence);
    Serial.println(" (0–300, quanto maior melhor)");
    imprimirDataHora();

    digitalWrite(LED_BIOMETRIA, HIGH);
    tocarMario();
    delay(300);
    digitalWrite(LED_BIOMETRIA, LOW);

  } else if (p == FINGERPRINT_NOTFOUND) {
    // NENHUM MATCH 
    // Não resetar dedoPresente aqui — o dedo ainda está apoiado.
    // Apenas informar. O reset ocorre quando o dedo for removido.
    Serial.println("[AUTH] ✘ Digital não reconhecida.");
    somErro();

  } else {
    // ERRO NO SENSOR
    Serial.print("[AUTH] Erro no fingerFastSearch, código: ");
    Serial.println(p);
  }
}

// LISTAR 
void listarDigitais() {
  Serial.println("\n--- IDs cadastrados ---");
  bool algumEncontrado = false;
  int  total = 0;

  for (int i = 1; i <= 127; i++) {
    // loadModel é seguro aqui pois não está em processo de cadastro
    if (finger.loadModel(i) == FINGERPRINT_OK) {
      Serial.print("  Slot ");
      Serial.println(i);
      algumEncontrado = true;
      total++;
    }
  }

  if (!algumEncontrado) {
    Serial.println("  Nenhuma digital cadastrada.");
  } else {
    Serial.print("  Total: ");
    Serial.print(total);
    Serial.println(" digital(is)");
  }
  Serial.println("----------------------");
}

// APAGAR 
void apagarDigital() {
  Serial.println("[DEL] Digite o ID para apagar (1–127):");
  while (!Serial.available()) delay(10);
  int id = Serial.parseInt();
  Serial.read(); // consumir '\n' residual

  if (id < 1 || id > 127) {
    Serial.println("[DEL] ID inválido. Use valores entre 1 e 127.");
    return;
  }

  if (finger.deleteModel(id) == FINGERPRINT_OK) {
    Serial.print("[DEL] ID ");
    Serial.print(id);
    Serial.println(" apagado com sucesso.");
  } else {
    Serial.print("[DEL] Erro ao apagar ID ");
    Serial.print(id);
    Serial.println(". O slot pode já estar vazio.");
  }
}

// SETUP
void setup() {
  Serial.begin(115200);

  pinMode(BUZZER,        OUTPUT);
  pinMode(LED_WIFI,      OUTPUT);
  pinMode(LED_BIOMETRIA, OUTPUT);
  digitalWrite(LED_WIFI,      LOW);
  digitalWrite(LED_BIOMETRIA, LOW);

  conectarWiFi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  mySerial.begin(57600, SERIAL_8N1, RXD2, TXD2);
  finger.begin(57600);

  if (!finger.verifyPassword()) {
    Serial.println("[SENSOR] SENSOR NÃO ENCONTRADO — verifique conexão e alimentação.");
    while (1) delay(1000);
  }

  // CORREÇÃO 1: Security Level ajustado de 5 → 3
  // O AS608/R307 suporta 5 níveis de segurança. O nível define o
  // threshold mínimo de score para aceitar um match em fingerFastSearch

  finger.setSecurityLevel(3);

  // Informações do sensor
  finger.getParameters();
  Serial.println("\n[SENSOR] Sensor inicializado com sucesso.");
  Serial.print("[SENSOR] Capacidade máxima: ");
  Serial.print(finger.capacity);
  Serial.println(" digitais");

  // Contagem de templates já armazenados
  finger.getTemplateCount();
  Serial.print("[SENSOR] Digitais cadastradas: ");
  Serial.println(finger.templateCount);

  Serial.println("[SENSOR] Security Level: 3 (threshold ~35/300)");
  Serial.println("[SISTEMA] Pronto para uso!");

  mostrarMenu();
}

// LOOP
void loop() {
  // Autenticação contínua em background
  autenticarDigital();

  // Comandos via Serial
  if (Serial.available()) {
    String entrada = Serial.readStringUntil('\n');
    entrada.trim();

    if (entrada == "1")
      cadastrarDigital();
    else if (entrada == "2")
      listarDigitais();
    else if (entrada == "3")
      apagarDigital();
    else {
      Serial.print("[MENU] Opção inválida: '");
      Serial.print(entrada);
      Serial.println("'");
    }

    mostrarMenu();
  }

  delay(50);
}
