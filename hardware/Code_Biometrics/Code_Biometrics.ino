// BIOMETRIA AFS — Sistema de presença.
// SISTEMA CONTÉM SENSOR BIOMÉTRICO + DIPLAY + BUZZER + LEDs + SERVIDOR NTP DATA/HORA + CONECXÃO COM API

// BIBLIOTECAS NECESSÁRIAS
#include <Adafruit_Fingerprint.h>
#include <SPI.h>
#include <TFT_eSPI.h>
#include <WiFi.h>
#include <time.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>
#include <freertos/semphr.h>

// DEFINIÇÃO DISPLAY
TFT_eSPI tft = TFT_eSPI();

// Mutex para acesso ao display — evita corrupção entre tasks
SemaphoreHandle_t displayMutex;

// DEFINIÇÃO PINOS
#define BUZZER         15
#define LED_WIFI        2
#define LED_BIOMETRIA  36
#define RXD_BIO        17
#define TXD_BIO        18

// DEFINIÇÃO WIFI
const char* ssid     = "ASUS Vivobook Go 14/15";
const char* password = "123456789";

volatile bool wifiConectado = false;

// DEFINIÇÃO SERVIDOR NTP
const char* ntpServer       = "time.google.com";
const long  gmtOffset_sec   = -3 * 3600;
const int   daylightOffset_sec = 0;

// DEFINIÇÃO DA URL DA API
const char* API_URL = "https://biometriaafs.onrender.com";

// Timeout explícito para evitar bloqueio infinito (ms)
#define HTTP_TIMEOUT_MS 4000

// FILA DE NOTIFICAÇÕES HTTP

// Tipos de notificação
enum NotifType { NOTIF_LEITURA, NOTIF_FALHA };

struct HttpNotif {
  NotifType tipo;
  int biometriaId;
};

// Fila com capacidade para 8 notificações pendentes
QueueHandle_t httpQueue;

// Task de HTTP
void taskHttpWorker(void* param) {
  HttpNotif notif;
  for (;;) {
    // Aguarda próxima notificação
    if (xQueueReceive(httpQueue, &notif, portMAX_DELAY) == pdTRUE) {
      if (WiFi.status() != WL_CONNECTED) continue;

      HTTPClient http;
      http.setTimeout(HTTP_TIMEOUT_MS);

      if (notif.tipo == NOTIF_LEITURA) {
        http.begin(String(API_URL) + "/alunos/biometria/leitura");
        http.addHeader("Content-Type", "application/json");
        String body = "{\"biometria\":" + String(notif.biometriaId) + "}";
        http.POST(body);

      } else {  // NOTIFICAÇÃO_FALHA
        http.begin(String(API_URL) + "/alunos/biometria/falha");
        http.addHeader("Content-Type", "application/json");
        http.POST("{}");
      }

      http.end();
    }
  }
}

// Enfileira uma notificação sem bloquear o loop de biometria
void notificarBackend(int id) {
  HttpNotif n = { NOTIF_LEITURA, id };
  xQueueSend(httpQueue, &n, 0);  // 0 = não espera se fila cheia
}

void notificarBackendFalha() {
  HttpNotif n = { NOTIF_FALHA, 0 };
  xQueueSend(httpQueue, &n, 0);
}

// FILA DE POLLING DE CADASTRO (task separada no Core 0)
// Tipos de ação recebida do backend
enum AcaoBackend { ACAO_NENHUMA, ACAO_CADASTRAR, ACAO_DELETAR };

struct SolicitacaoBackend {
  AcaoBackend acao;
  int         id;
};

QueueHandle_t solicitacaoQueue;

// Intervalo de polling
#define POLLING_INTERVAL_MS 2000

void taskPollingCadastro(void* param) {
  TickType_t lastWake = xTaskGetTickCount();

  for (;;) {
    // Aguarda o próximo intervalo sem usar delay()
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(POLLING_INTERVAL_MS));

    if (WiFi.status() != WL_CONNECTED) continue;

    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.begin(String(API_URL) + "/alunos/biometria/solicitacao");

    int code = http.GET();
    if (code == 200) {
      String payload = http.getString();

      SolicitacaoBackend sol = { ACAO_NENHUMA, 0 };

      // Cadastrar
      if (payload.indexOf("\"cadastrar\":true") != -1) {
        int idx = payload.indexOf("\"id\":");
        if (idx != -1) {
          int ini = idx + 5;
          int fim = payload.indexOf(",", ini);
          if (fim == -1) fim = payload.indexOf("}", ini);
          if (fim != -1) {
            int id = payload.substring(ini, fim).toInt();
            if (id > 0) { sol = { ACAO_CADASTRAR, id }; }
          }
        }
      }
      // Deletar
      else if (payload.indexOf("\"deletar\":true") != -1) {
        int idx = payload.indexOf("\"id\":");
        if (idx != -1) {
          int ini = idx + 5;
          int fim = payload.indexOf(",", ini);
          if (fim == -1) fim = payload.indexOf("}", ini);
          if (fim != -1) {
            int id = payload.substring(ini, fim).toInt();
            if (id > 0) { sol = { ACAO_DELETAR, id }; }
          }
        }
      }

      if (sol.acao != ACAO_NENHUMA) {
        // Envia para o loop principal processar (com display e sensor)
        xQueueSend(solicitacaoQueue, &sol, 0);
      }
    }

    http.end();
  }
}

// CONFIGURAÇÃO SENSOR BIOMÉTRICO
HardwareSerial mySerial(1);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// CONFIGURAÇÃO BUZZER
void beep(int freq, int durMs) {
  ledcWriteTone(BUZZER, freq);
  vTaskDelay(pdMS_TO_TICKS(durMs));  // não bloqueia outras tasks
  ledcWriteTone(BUZZER, 0);
}

void somSucesso() {
  beep(1000, 100);
  vTaskDelay(pdMS_TO_TICKS(80));
  beep(1300, 180);
}

void somDuplo() {
  beep(1000, 100);
  vTaskDelay(pdMS_TO_TICKS(80));
  beep(1000, 100);
}

void somErro() {
  beep(250, 500);
}

// CONFIGURAÇÃO SERVIDOR DATA E HORA
String obterDataHora() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "Sem horario";
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%d/%m/%Y %H:%M:%S", &timeinfo);
  return String(buffer);
}

// DISPLAY - TELA INICIAL 
void telaMensagem(const char* titulo, const char* msg, uint16_t cor = TFT_WHITE) {
  xSemaphoreTake(displayMutex, portMAX_DELAY);
  tft.fillScreen(TFT_BLACK);
  tft.setTextSize(3);
  tft.setTextColor(cor, TFT_BLACK);
  tft.setCursor(10, 10);
  tft.println(titulo);
  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 60);
  tft.println(msg);
  xSemaphoreGive(displayMutex);
}

void telaIniciando()   { telaMensagem("Biometria AFS", "Iniciando...",        TFT_CYAN); }
void telaAguardando()  { telaMensagem("Biometria AFS", "Aguardando digital...", TFT_CYAN); }

void telaAcessoLiberado(int id) {
  String dataHora = obterDataHora();

  xSemaphoreTake(displayMutex, portMAX_DELAY);
  tft.fillScreen(TFT_BLACK);
  tft.setTextSize(3);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.setCursor(10, 10);
  tft.println("ACESSO LIBERADO");
  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 90);
  tft.print("ID: ");
  tft.println(id);
  tft.setCursor(10, 120);
  tft.println(dataHora);
  xSemaphoreGive(displayMutex);

  Serial.printf("\n===== ACESSO LIBERADO =====\nID: %d\nData/Hora: %s\n===========================\n",
                id, dataHora.c_str());
}

void telaAcessoNegado() {
  xSemaphoreTake(displayMutex, portMAX_DELAY);
  tft.fillScreen(TFT_BLACK);
  tft.setTextSize(3);
  tft.setTextColor(TFT_RED, TFT_BLACK);
  tft.setCursor(10, 10);
  tft.println("ACESSO NEGADO");
  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 60);
  tft.println("DIGITAL NAO RECONHECIDA");
  xSemaphoreGive(displayMutex);
}

// WIFI — Tenta reconectar o WIFI
void taskWiFiManager(void* param) {
  bool conectadoAnterior = false;

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  for (;;) {
    bool conectado = (WiFi.status() == WL_CONNECTED);

    if (conectado && !conectadoAnterior) {
      // Recém conectado
      wifiConectado = true;
      digitalWrite(LED_WIFI, HIGH);
      configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

      Serial.printf("WiFi conectado! IP: %s\n", WiFi.localIP().toString().c_str());

      xSemaphoreTake(displayMutex, portMAX_DELAY);
      tft.fillScreen(TFT_BLACK);
      tft.setTextSize(3);
      tft.setTextColor(TFT_GREEN, TFT_BLACK);
      tft.setCursor(10, 10); tft.println("WiFi");
      tft.setCursor(10, 40); tft.println("Conectado!");
      tft.setTextSize(2);
      tft.setTextColor(TFT_WHITE, TFT_BLACK);
      tft.setCursor(10, 90);  tft.print("IP:");
      tft.setCursor(10, 110); tft.println(WiFi.localIP());
      xSemaphoreGive(displayMutex);

      beep(1200, 120);
      vTaskDelay(pdMS_TO_TICKS(80));
      beep(1600, 180);
      vTaskDelay(pdMS_TO_TICKS(2500));
      telaAguardando();

    } else if (!conectado && conectadoAnterior) {
      // Recém desconectado
      wifiConectado = false;
      digitalWrite(LED_WIFI, LOW);
      Serial.println("WiFi desconectado. Reconectando...");
      WiFi.disconnect();
      vTaskDelay(pdMS_TO_TICKS(100));
      WiFi.begin(ssid, password);

    } else if (!conectado) {
      // Ainda tentando — mostra somente na primeira vez ou a cada 10s
    }

    conectadoAnterior = conectado;

    // Verifica a cada 3s 
    vTaskDelay(pdMS_TO_TICKS(3000));
  }
}

// CADASTRO E EXCLUSÃO
int gerarNovoID() {
  for (int i = 1; i <= 127; i++) {
    if (finger.loadModel(i) != FINGERPRINT_OK) return i;
  }
  return -1;
}

void enviarAckCadastro() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(String(API_URL) + "/alunos/biometria/solicitacao/ack");
  http.addHeader("Content-Type", "application/json");
  http.POST("{}");
  http.end();
}

void cadastrarDigitalComID(int novoID) {
  if (novoID == -1) {
    telaMensagem("Erro", "Memoria cheia", TFT_RED);
    somErro();
    return;
  }

  telaMensagem("Cadastro", "Aguardando digital", TFT_CYAN);
  Serial.printf("Novo ID: %d\n", novoID);

  // Aguarda dedo sem delay()
  while (finger.getImage() != FINGERPRINT_OK) {
    vTaskDelay(pdMS_TO_TICKS(20));
  }

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    telaMensagem("Erro", "Falha na leitura", TFT_RED);
    somErro();
    return;
  }

  // Verifica duplicidade
  if (finger.fingerFastSearch() == FINGERPRINT_OK) {
    xSemaphoreTake(displayMutex, portMAX_DELAY);
    tft.fillScreen(TFT_BLACK);
    tft.setTextSize(3);
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.setCursor(10, 10); tft.println("DIGITAL EXISTENTE");
    tft.setTextSize(2);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.setCursor(10, 90);
    tft.print("Cadastrada no ID: ");
    tft.println(finger.fingerID);
    xSemaphoreGive(displayMutex);

    somErro();
    Serial.printf("Digital ja cadastrada no ID: %d\n", finger.fingerID);
    notificarBackend(finger.fingerID);
    vTaskDelay(pdMS_TO_TICKS(1500));
    telaAguardando();
    return;
  }

  telaMensagem("Remova", "Retire a digital", TFT_YELLOW);
  vTaskDelay(pdMS_TO_TICKS(1000));
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    vTaskDelay(pdMS_TO_TICKS(20));
  }

  telaMensagem("Verificacao", "Mesma digital", TFT_CYAN);
  while (finger.getImage() != FINGERPRINT_OK) {
    vTaskDelay(pdMS_TO_TICKS(20));
  }

  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    telaMensagem("Erro", "Falha leitura", TFT_RED);
    somErro();
    return;
  }

  if (finger.createModel() != FINGERPRINT_OK) {
    telaMensagem("Erro", "Digitais diferentes", TFT_RED);
    somErro();
    vTaskDelay(pdMS_TO_TICKS(1200));
    telaAguardando();
    return;
  }

  if (finger.storeModel(novoID) == FINGERPRINT_OK) {
    telaMensagem("Sucesso", "Cadastro Realizado", TFT_GREEN);
    Serial.println("Cadastro realizado!");
    digitalWrite(LED_BIOMETRIA, HIGH);
    somSucesso();
    vTaskDelay(pdMS_TO_TICKS(1200));
    digitalWrite(LED_BIOMETRIA, LOW);
    notificarBackend(novoID);  // assíncrono — não bloqueia
  } else {
    telaMensagem("Erro", "Falha ao salvar", TFT_RED);
    somErro();
  }

  telaAguardando();
}

void cadastrarDigital() {
  cadastrarDigitalComID(gerarNovoID());
}

void listarDigitais() {
  Serial.println("\nIDs cadastrados:");
  bool encontrou = false;
  for (int i = 1; i <= 127; i++) {
    if (finger.loadModel(i) == FINGERPRINT_OK) {
      Serial.printf("ID: %d\n", i);
      encontrou = true;
    }
  }
  if (!encontrou) Serial.println("Nenhuma digital cadastrada.");
}

void apagarDigital() {
  telaMensagem("Apagar", "Digite ID no Serial", TFT_YELLOW);
  Serial.println("Digite o ID:");
  while (!Serial.available()) { vTaskDelay(pdMS_TO_TICKS(10)); }
  int id = Serial.parseInt();
  if (finger.deleteModel(id) == FINGERPRINT_OK) {
    telaMensagem("Sucesso", "Digital apagada", TFT_GREEN);
    Serial.println("Digital apagada.");
    beep(700, 150);
  } else {
    telaMensagem("Erro", "Falha ao apagar", TFT_RED);
    somErro();
  }
  vTaskDelay(pdMS_TO_TICKS(2000));
  telaAguardando();
}

void apagarTodasDigitais() {
  telaMensagem("ATENCAO", "Apagar todas? S/N", TFT_YELLOW);
  Serial.println("Apagar todas? S/N");
  while (!Serial.available()) { vTaskDelay(pdMS_TO_TICKS(10)); }
  String resp = Serial.readStringUntil('\n');
  resp.trim(); resp.toUpperCase();

  if (resp == "S") {
    if (finger.emptyDatabase() == FINGERPRINT_OK) {
      telaMensagem("Sucesso", "Todas as digitais foram apagadas", TFT_GREEN);
      Serial.println("Todas as digitais foram apagadas.");
      beep(700, 150);
      vTaskDelay(pdMS_TO_TICKS(100));
      beep(700, 150);
      vTaskDelay(pdMS_TO_TICKS(3000));
    } else {
      telaMensagem("Erro", "Falha ao apagar", TFT_RED);
      somErro();
      vTaskDelay(pdMS_TO_TICKS(2000));
    }
  } else {
    telaMensagem("Cancelado", "Operacao cancelada", TFT_YELLOW);
    Serial.println("Operacao cancelada.");
    vTaskDelay(pdMS_TO_TICKS(2000));
  }
  telaAguardando();
}

void mostrarMenu() {
  Serial.println("\n===== MENU =====");
  Serial.println("1 - Cadastrar");
  Serial.println("2 - Listar");
  Serial.println("3 - Apagar");
  Serial.println("4 - Apagar Tudo");
  Serial.println("================");
}

// MÁQUINA DE ESTADOS — substitui delay() na tela de resultado
enum EstadoBio {
  AGUARDANDO_DEDO,
  MOSTRANDO_RESULTADO,
  PROCESSANDO_CADASTRO
};

EstadoBio estadoAtual       = AGUARDANDO_DEDO;
unsigned long inicioEstado  = 0;
#define TEMPO_RESULTADO_MS  2500 

// SETUP
void setup() {
  Serial.begin(115200);

  pinMode(LED_WIFI,       OUTPUT);
  pinMode(LED_BIOMETRIA,  OUTPUT);
  digitalWrite(LED_WIFI,      LOW);
  digitalWrite(LED_BIOMETRIA, LOW);

  // Buzzer
  ledcAttach(BUZZER, 2000, 8);

  // Mutex do display
  displayMutex = xSemaphoreCreateMutex();

  // Filas
  httpQueue        = xQueueCreate(8, sizeof(HttpNotif));
  solicitacaoQueue = xQueueCreate(4, sizeof(SolicitacaoBackend));

  // Display
  tft.init();
  tft.setRotation(1);
  telaIniciando();

  // Sensor
  mySerial.begin(57600, SERIAL_8N1, RXD_BIO, TXD_BIO);
  finger.begin(57600);
  delay(500);

  if (!finger.verifyPassword()) {
    telaMensagem("Erro", "Sensor nao encontrado", TFT_RED);
    Serial.println("Sensor nao encontrado!");
    while (1) delay(1);
  }

  finger.setSecurityLevel(3);
  Serial.println("Sistema iniciado!");
  beep(900, 100); delay(100); beep(1200, 150);

  // Tasks FreeRTOS
  // Core 0: WiFi stack + HTTP worker + polling
  xTaskCreatePinnedToCore(taskWiFiManager,     "WiFiMgr",    4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(taskHttpWorker,      "HttpWorker", 4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(taskPollingCadastro, "Polling",    4096, NULL, 1, NULL, 0);
  // Core 1: loop() principal — exclusivo para biometria

  telaAguardando();
  mostrarMenu();
}

// LOOP — Core 1, dedicado ao sensor biométrico
// Sem delay(), sem HTTP, sem WiFi: latência mínima garantida
void loop() {
  // ── Verifica solicitações do backend
  SolicitacaoBackend sol;
  if (xQueueReceive(solicitacaoQueue, &sol, 0) == pdTRUE) {
    estadoAtual = PROCESSANDO_CADASTRO;

    if (sol.acao == ACAO_CADASTRAR) {
      Serial.printf("Solicitacao de cadastro para ID: %d\n", sol.id);
      enviarAckCadastro();
      cadastrarDigitalComID(sol.id);
    } else if (sol.acao == ACAO_DELETAR) {
      Serial.printf("Solicitacao de exclusao para ID: %d\n", sol.id);
      String msg = "ID Sensor: " + String(sol.id);
      telaMensagem("Apagando", msg.c_str(), TFT_YELLOW);

      if (finger.deleteModel(sol.id) == FINGERPRINT_OK) {
        telaMensagem("Sucesso", "Digital apagada", TFT_GREEN);
        Serial.println("Digital apagada com sucesso.");
        beep(700, 150);
      } else {
        telaMensagem("Erro", "Erro ao apagar", TFT_RED);
        somErro();
      }
      vTaskDelay(pdMS_TO_TICKS(1200));
      telaAguardando();
    }

    estadoAtual = AGUARDANDO_DEDO;
  }

  // Máquina de estados do resultado
  if (estadoAtual == MOSTRANDO_RESULTADO) {
    if (millis() - inicioEstado >= TEMPO_RESULTADO_MS) {
      // Tempo de exibição esgotado — volta a aguardar
      digitalWrite(LED_BIOMETRIA, LOW);
      telaAguardando();
      estadoAtual = AGUARDANDO_DEDO;
    }
    // Ainda mostrando resultado — não tenta ler novo dedo
    return;
  }

  // Leitura biométrica (caminho crítico — sem bloqueios)
  uint8_t p = finger.getImage();

  if (p != FINGERPRINT_OK) {
    // Sem dedo ou erro transitório — volta imediatamente
    taskYIELD();
    goto serial_check;
  }

  // Dedo detectado 
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) goto serial_check;

  // Busca no banco biométrico do sensor
  p = finger.fingerFastSearch();

  if (p == FINGERPRINT_OK) {
    // ACESSO LIBERADO 
    telaAcessoLiberado(finger.fingerID);
    notificarBackend(finger.fingerID); 

    digitalWrite(LED_BIOMETRIA, HIGH);
    somDuplo();

    // Timer não-bloqueante
    estadoAtual  = MOSTRANDO_RESULTADO;
    inicioEstado = millis();

  } else if (p == FINGERPRINT_NOTFOUND) {
    // ACESSO NEGADO
    telaAcessoNegado();
    Serial.println("ACESSO NEGADO");
    somErro();
    notificarBackendFalha();

    estadoAtual  = MOSTRANDO_RESULTADO;
    inicioEstado = millis();
  }

serial_check:
  // Comandos via Serial
  if (Serial.available()) {
    String entrada = Serial.readStringUntil('\n');
    entrada.trim();

    if      (entrada == "1") cadastrarDigital();
    else if (entrada == "2") listarDigitais();
    else if (entrada == "3") apagarDigital();
    else if (entrada == "4") apagarTodasDigitais();
    else                     Serial.println("Opcao invalida");

    telaAguardando();
    mostrarMenu();
  }

  taskYIELD();
}
