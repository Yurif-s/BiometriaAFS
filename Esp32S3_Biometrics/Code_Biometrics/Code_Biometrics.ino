// BIOMETRIA AFS — Display + Sensor Biométrico + WiFi + Data/Hora

#include <Adafruit_Fingerprint.h>
#include <SPI.h>
#include <TFT_eSPI.h>
#include <WiFi.h>
#include <time.h>

// ── DISPLAY ──────────────────────────────────────────────
TFT_eSPI tft = TFT_eSPI();

// ── PINOS ────────────────────────────────────────────────
#define BUZZER         15
#define LED_WIFI        2
#define LED_BIOMETRIA  36

#define RXD_BIO        17
#define TXD_BIO        18

// ── WIFI ────────────────────────────────────────────────
const char* ssid = "Sua_Rede_WiFi";
const char* password = "Sua_Senha_WiFi";

bool wifiConectado = false;
unsigned long ultimoTesteWifi = 0;

// ── NTP / DATA E HORA ──────────────────────────────────
const char* ntpServer = "time.google.com";
const long gmtOffset_sec = -3 * 3600;
const int daylightOffset_sec = 0;

// ── SENSOR BIOMÉTRICO ───────────────────────────────────
HardwareSerial mySerial(1);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// ────────────────────────────────────────────────────────
// BUZZER
// ────────────────────────────────────────────────────────

void beep(int freq, int durMs) {
  ledcWriteTone(BUZZER, freq);
  delay(durMs);
  ledcWriteTone(BUZZER, 0);
}

void somSucesso() {
  beep(1000, 100);
  delay(80);
  beep(1300, 180);
}

void somDuplo() {
  beep(1000, 100);
  delay(80);
  beep(1000, 100);
}

void somErro() {
  beep(250, 500);
}

// ────────────────────────────────────────────────────────
// DATA E HORA
// ────────────────────────────────────────────────────────

String obterDataHora() {

  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    return "Sem horario";
  }

  char buffer[30];

  strftime(buffer, sizeof(buffer), "%d/%m/%Y %H:%M:%S", &timeinfo);

  return String(buffer);
}

// ────────────────────────────────────────────────────────
// WIFI
// ────────────────────────────────────────────────────────

void conectarWiFi() {

  // JÁ CONECTADO
  if (WiFi.status() == WL_CONNECTED) {

    if (!wifiConectado) {

      wifiConectado = true;

      Serial.println("WiFi conectado!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());

      digitalWrite(LED_WIFI, HIGH);

      // DISPLAY
      tft.fillScreen(TFT_BLACK);

      tft.setTextSize(3);
      tft.setTextColor(TFT_GREEN, TFT_BLACK);

      tft.setCursor(10, 10);
      tft.println("WiFi");

      tft.setCursor(10, 40);
      tft.println("Conectado!");

      tft.setTextSize(2);

      tft.setTextColor(TFT_WHITE, TFT_BLACK);

      tft.setCursor(10, 90);
      tft.print("IP:");

      tft.setCursor(10, 110);
      tft.println(WiFi.localIP());

      // SOM
      beep(1200, 120);
      delay(80);
      beep(1600, 180);

      delay(2500);

      telaAguardando();
    }

    return;
  }

  // DESCONECTADO
  wifiConectado = false;

  digitalWrite(LED_WIFI, LOW);

  // TENTA RECONECTAR
  if (millis() - ultimoTesteWifi >= 3000) {

    ultimoTesteWifi = millis();

    Serial.println("Tentando conectar no WiFi...");

    // DISPLAY
    tft.fillScreen(TFT_BLACK);

    tft.setTextSize(3);
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);

    tft.setCursor(10, 10);
    tft.println("WiFi");

    tft.setCursor(10, 40);
    tft.println("Conectando...");

    tft.setTextSize(2);

    tft.setTextColor(TFT_WHITE, TFT_BLACK);

    tft.setCursor(10, 90);
    tft.println(ssid);

    WiFi.disconnect();

    delay(100);

    WiFi.begin(ssid, password);
  }
}

// ────────────────────────────────────────────────────────
// DISPLAY
// ────────────────────────────────────────────────────────

void telaMensagem(const char* titulo, const char* msg, uint16_t cor = TFT_WHITE) {

  tft.fillScreen(TFT_BLACK);

  tft.setTextSize(3);
  tft.setTextColor(cor, TFT_BLACK);

  tft.setCursor(10, 10);
  tft.println(titulo);

  tft.setTextSize(2);

  tft.setTextColor(TFT_WHITE, TFT_BLACK);

  tft.setCursor(10, 60);
  tft.println(msg);
}

void telaIniciando() {
  telaMensagem("Biometria AFS", "Iniciando...", TFT_CYAN);
}

void telaAguardando() {
  telaMensagem("Biometria AFS", "Aguardando dedo...", TFT_CYAN);
}

// ────────────────────────────────────────────────────────
// ACESSO LIBERADO
// ────────────────────────────────────────────────────────

void telaAcessoLiberado(int id) {

  String dataHora = obterDataHora();

  tft.fillScreen(TFT_BLACK);

  // TITULO
  tft.setTextSize(3);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);

  tft.setCursor(10, 10);
  tft.println("ACESSO LIBERADO");

  // INFO
  tft.setTextSize(2);

  tft.setTextColor(TFT_WHITE, TFT_BLACK);

  // ID
  tft.setCursor(10, 90);
  tft.print("ID: ");
  tft.println(id);

  // DATA E HORA
  tft.setCursor(10, 120);
  tft.println(dataHora);

  // SERIAL
  Serial.println("\n===== ACESSO LIBERADO =====");

  Serial.print("ID: ");
  Serial.println(id);

  Serial.print("Data/Hora: ");
  Serial.println(dataHora);

  Serial.println("===========================");
}

// ────────────────────────────────────────────────────────
// ACESSO NEGADO
// ────────────────────────────────────────────────────────

void telaAcessoNegado() {

  tft.fillScreen(TFT_BLACK);

  tft.setTextSize(3);

  tft.setTextColor(TFT_RED, TFT_BLACK);

  tft.setCursor(10, 10);
  tft.println("ACESSO NEGADO");

  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 60);
  tft.println("DIGITAL NAO RECONHECIDA");
}

// ────────────────────────────────────────────────────────
// GERAR NOVO ID
// ────────────────────────────────────────────────────────

int gerarNovoID() {

  for (int i = 1; i <= 127; i++) {

    if (finger.loadModel(i) != FINGERPRINT_OK) {
      return i;
    }
  }

  return -1;
}

// ────────────────────────────────────────────────────────
// CADASTRAR DIGITAL
// ────────────────────────────────────────────────────────

void cadastrarDigital() {

  int novoID = gerarNovoID();

  if (novoID == -1) {

    telaMensagem("Erro", "Memoria cheia", TFT_RED);

    somErro();

    return;
  }

  telaMensagem("Cadastro", "Coloque o dedo", TFT_CYAN);

  Serial.print("Novo ID: ");
  Serial.println(novoID);

  while (finger.getImage() != FINGERPRINT_OK);

  if (finger.image2Tz(1) != FINGERPRINT_OK) {

    telaMensagem("Erro", "Falha leitura", TFT_RED);

    somErro();

    return;
  }

  // Verifica duplicidade
if (finger.fingerFastSearch() == FINGERPRINT_OK) {

  tft.fillScreen(TFT_BLACK);

  tft.setTextSize(3);
  tft.setTextColor(TFT_RED, TFT_BLACK);

  tft.setCursor(10, 10);
  tft.println("DIGITAL JA EXISTE");

  tft.setTextSize(2.5);

  tft.setTextColor(TFT_WHITE, TFT_BLACK);

  tft.setCursor(10, 90);
  tft.print("Cadastrada no ID: ");
  tft.println(finger.fingerID);

  Serial.print("Digital ja cadastrada no ID: ");
  Serial.println(finger.fingerID);

  somErro();

  delay(3000);

  telaAguardando();

  return;
}
  telaMensagem("Remova", "Retire o dedo", TFT_YELLOW);

  delay(2000);

  while (finger.getImage() != FINGERPRINT_NOFINGER);

  // Segunda verificacao
  telaMensagem("Verificacao", "Mesmo dedo novamente", TFT_CYAN);

  while (finger.getImage() != FINGERPRINT_OK);

  if (finger.image2Tz(2) != FINGERPRINT_OK) {

    telaMensagem("Erro", "Falha leitura", TFT_RED);

    somErro();

    return;
  }

  if (finger.createModel() != FINGERPRINT_OK) {

    telaMensagem("Erro", "Digitais diferentes", TFT_RED);

    somErro();

    delay(2000);

    telaAguardando();

    return;
  }

  // Salva
  if (finger.storeModel(novoID) == FINGERPRINT_OK) {

    telaMensagem("Sucesso", "Cadastro Realizado", TFT_GREEN);

    Serial.println("Cadastro realizado!");

    digitalWrite(LED_BIOMETRIA, HIGH);

    somSucesso();

    delay(2500);

    digitalWrite(LED_BIOMETRIA, LOW);

  } else {

    telaMensagem("Erro", "Falha ao salvar", TFT_RED);

    somErro();
  }

  telaAguardando();
}

// ────────────────────────────────────────────────────────
// LISTAR DIGITAIS
// ────────────────────────────────────────────────────────

void listarDigitais() {

  Serial.println("\nIDs cadastrados:");

  bool encontrou = false;

  for (int i = 1; i <= 127; i++) {

    if (finger.loadModel(i) == FINGERPRINT_OK) {

      Serial.print("ID: ");
      Serial.println(i);

      encontrou = true;
    }
  }

  if (!encontrou) {
    Serial.println("Nenhuma digital cadastrada.");
  }
}

// ────────────────────────────────────────────────────────
// APAGAR DIGITAL
// ────────────────────────────────────────────────────────

void apagarDigital() {

  telaMensagem("Apagar", "Digite ID no Serial", TFT_YELLOW);

  Serial.println("Digite o ID:");

  while (!Serial.available());

  int id = Serial.parseInt();

  if (finger.deleteModel(id) == FINGERPRINT_OK) {

    telaMensagem("Sucesso", "Digital apagada", TFT_GREEN);

    Serial.println("Digital apagada.");

    beep(700, 150);

  } else {

    telaMensagem("Erro", "Falha ao apagar", TFT_RED);

    somErro();
  }

  delay(2000);

  telaAguardando();
}

// ────────────────────────────────────────────────────────
// APAGAR TODAS
// ────────────────────────────────────────────────────────

void apagarTodasDigitais() {

  telaMensagem("ATENCAO", "Apagar todas? S/N", TFT_YELLOW);

  Serial.println("Apagar todas? S/N");

  while (!Serial.available());

  String resp = Serial.readStringUntil('\n');

  resp.trim();
  resp.toUpperCase();

  if (resp == "S") {

    if (finger.emptyDatabase() == FINGERPRINT_OK) {

      telaMensagem(
        "Sucesso",
        "Todas as digitais foram  apagadas",
        TFT_GREEN
      );

      Serial.println("Todas as digitais foram apagadas.");

      beep(700, 150);
      delay(100);
      beep(700, 150);

      delay(3000);

    } else {

      telaMensagem("Erro", "Falha ao apagar", TFT_RED);

      somErro();

      delay(2000);
    }

  } else {

    telaMensagem("Cancelado", "Operacao cancelada", TFT_YELLOW);

    Serial.println("Operacao cancelada.");

    delay(2000);
  }

  telaAguardando();
}

// ────────────────────────────────────────────────────────
// MENU
// ────────────────────────────────────────────────────────

void mostrarMenu() {

  Serial.println("\n===== MENU =====");

  Serial.println("1 - Cadastrar");
  Serial.println("2 - Listar");
  Serial.println("3 - Apagar");
  Serial.println("4 - Apagar Tudo");

  Serial.println("================");
}

// ────────────────────────────────────────────────────────
// SETUP
// ────────────────────────────────────────────────────────

void setup() {

  Serial.begin(115200);

  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_BIOMETRIA, OUTPUT);

  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_BIOMETRIA, LOW);

  // BUZZER
  ledcAttach(BUZZER, 2000, 8);

  // WIFI
  WiFi.mode(WIFI_STA);

  WiFi.begin(ssid, password);

  // CONFIGURA DATA E HORA
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  // DISPLAY
  tft.init();
  tft.setRotation(1);

  telaIniciando();

  // SENSOR
  mySerial.begin(57600, SERIAL_8N1, RXD_BIO, TXD_BIO);

  finger.begin(57600);

  delay(500);

  if (!finger.verifyPassword()) {

    telaMensagem("Erro", "Sensor nao encontrado", TFT_RED);

    Serial.println("Sensor nao encontrado!");

    while (1) {
      delay(1);
    }
  }

  finger.setSecurityLevel(3);

  Serial.println("Sistema iniciado!");

  beep(900, 100);
  delay(100);
  beep(1200, 150);

  telaAguardando();

  mostrarMenu();
}

// ────────────────────────────────────────────────────────
// LOOP
// ────────────────────────────────────────────────────────

void loop() {

  conectarWiFi();

  uint8_t p = finger.getImage();

  if (p == FINGERPRINT_OK) {

    p = finger.image2Tz(1);

    if (p == FINGERPRINT_OK) {

      p = finger.fingerFastSearch();

      if (p == FINGERPRINT_OK) {

        telaAcessoLiberado(finger.fingerID);

        digitalWrite(LED_BIOMETRIA, HIGH);

        somDuplo();

        delay(3000);

        digitalWrite(LED_BIOMETRIA, LOW);

        telaAguardando();

      } else if (p == FINGERPRINT_NOTFOUND) {

        telaAcessoNegado();

        Serial.println("ACESSO NEGADO");

        somErro();

        delay(2000);

        telaAguardando();
      }
    }
  }

  // COMANDOS SERIAL
  if (Serial.available()) {

    String entrada = Serial.readStringUntil('\n');

    entrada.trim();

    if (entrada == "1") {

      cadastrarDigital();

    } else if (entrada == "2") {

      listarDigitais();

    } else if (entrada == "3") {

      apagarDigital();

    } else if (entrada == "4") {

      apagarTodasDigitais();

    } else {

      Serial.println("Opcao invalida");
    }

    telaAguardando();

    mostrarMenu();
  }

  delay(50);
}