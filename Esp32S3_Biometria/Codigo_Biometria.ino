// BIOMETRIA + WIFI + LED + BUZZER

#include <WiFi.h>
#include <Adafruit_Fingerprint.h>
#include <time.h>

// WIFI

const char* ssid = "ASUS Vivobook Go 14/15";
const char* password = "123456789";

// NTP

const char* ntpServer = "pool.ntp.org";

long gmtOffset_sec = -3 * 3600;

int daylightOffset_sec = 0;

// PINOS

#define BUZZER 4
#define LED_WIFI 2
#define LED_BIOMETRIA 36

#define RXD2 16
#define TXD2 17

// SENSOR DIGITAL

HardwareSerial mySerial(2);

Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// CONTROLE

bool autenticado = false;

// SONS

// Vinheta detecção
int melodia[] = {988, 1319};
int duracaoNotas[] = {120, 200};

void tocarMario() {

  for (int i = 0; i < 2; i++) {

    tone(BUZZER, melodia[i]);

    delay(duracaoNotas[i]);

    noTone(BUZZER);

    delay(50);
  }
}

// Som WiFi
void somWifi() {

  tone(BUZZER, 500);

  delay(100);

  noTone(BUZZER);

  delay(50);

  tone(BUZZER, 500);

  delay(150);

  noTone(BUZZER);
}

// Som erro
void somErro() {

  tone(BUZZER, 250);

  delay(300);

  noTone(BUZZER);
}

// DATA E HORA

void imprimirDataHora() {

  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {

    Serial.println("Erro ao obter data/hora");

    return;
  }

  Serial.print("Data/Hora: ");

  Serial.print(&timeinfo, "%d/%m/%Y %H:%M:%S");

  Serial.println();
}

// WIFI

void conectarWiFi() {

  WiFi.begin(ssid, password);

  Serial.print("Conectando ao WiFi");

  int tentativas = 0;

  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {

    delay(500);

    Serial.print(".");

    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("\nWiFi conectado!");

    digitalWrite(LED_WIFI, HIGH);

    somWifi();
  }
  else {

    Serial.println("\nFalha ao conectar no WiFi");

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

// GERAR ID

int gerarNovoID() {

  for (int i = 1; i <= 127; i++) {

    uint8_t p = finger.loadModel(i);

    if (p != FINGERPRINT_OK) {

      return i;
    }
  }

  return -1;
}

// CADASTRAR DIGITAL

void cadastrarDigital() {

  uint8_t p;

  Serial.println("\nColoque o dedo para iniciar cadastro...");

  p = FINGERPRINT_NOFINGER;

  while (p != FINGERPRINT_OK) {

    p = finger.getImage();

    if (p == FINGERPRINT_NOFINGER)
      continue;

    if (p != FINGERPRINT_OK) {

      Serial.println("Erro ao capturar imagem.");

      somErro();

      return;
    }
  }

  p = finger.image2Tz(1);

  if (p != FINGERPRINT_OK) {

    Serial.println("Erro ao converter imagem.");

    somErro();

    return;
  }

  // VERIFICAR DUPLICIDADE

  p = finger.fingerFastSearch();

  if (p == FINGERPRINT_OK) {

    Serial.print("Digital ja cadastrada no ID ");

    Serial.println(finger.fingerID);

    somErro();

    return;
  }

  if (p != FINGERPRINT_NOTFOUND) {

    Serial.println("Erro na verificacao.");

    somErro();

    return;
  }

  Serial.println("Digital nova detectada.");

  Serial.println("Remova o dedo...");

  delay(1000);

  while (finger.getImage() != FINGERPRINT_NOFINGER);

  delay(500);

  Serial.println("Coloque o MESMO dedo novamente...");

  p = FINGERPRINT_NOFINGER;

  while (p != FINGERPRINT_OK) {

    p = finger.getImage();

    if (p == FINGERPRINT_NOFINGER)
      continue;

    if (p != FINGERPRINT_OK) {

      Serial.println("Erro segunda leitura.");

      somErro();

      return;
    }
  }

  p = finger.image2Tz(2);

  if (p != FINGERPRINT_OK) {

    Serial.println("Erro ao converter segunda imagem.");

    somErro();

    return;
  }

  p = finger.createModel();

  if (p == FINGERPRINT_ENROLLMISMATCH) {

    Serial.println("Os dedos nao coincidem.");

    somErro();

    return;
  }

  if (p != FINGERPRINT_OK) {

    Serial.println("Erro ao criar modelo.");

    somErro();

    return;
  }

  int novoID = gerarNovoID();

  if (novoID == -1) {

    Serial.println("Memoria cheia.");

    somErro();

    return;
  }

  p = finger.storeModel(novoID);

  if (p == FINGERPRINT_OK) {

    Serial.print("Digital cadastrada! ID: ");

    Serial.println(novoID);

    imprimirDataHora();

    digitalWrite(LED_BIOMETRIA, HIGH);

    tocarMario();

    delay(300);

    digitalWrite(LED_BIOMETRIA, LOW);
  }
  else {

    Serial.println("Erro ao salvar.");

    somErro();
  }
}

// AUTENTICAR DIGITAL

void autenticarDigital() {

  uint8_t p = finger.getImage();

  if (p != FINGERPRINT_OK)
    return;

  p = finger.image2Tz(1);

  if (p != FINGERPRINT_OK)
    return;

  p = finger.fingerFastSearch();

  if (p == FINGERPRINT_OK && !autenticado) {

    Serial.println("\nDIGITAL RECONHECIDA!");

    Serial.print("ID: ");

    Serial.println(finger.fingerID);

    Serial.print("Confianca: ");

    Serial.println(finger.confidence);

    imprimirDataHora();

    digitalWrite(LED_BIOMETRIA, HIGH);

    tocarMario();

    delay(300);

    digitalWrite(LED_BIOMETRIA, LOW);

    autenticado = true;
  }

  if (p != FINGERPRINT_OK) {

    autenticado = false;
  }
}

// LISTAR

void listarDigitais() {

  Serial.println("\n--- IDs cadastrados ---");

  bool algumEncontrado = false;

  for (int i = 1; i <= 127; i++) {

    if (finger.loadModel(i) == FINGERPRINT_OK) {

      Serial.print("ID: ");

      Serial.println(i);

      algumEncontrado = true;
    }
  }

  if (!algumEncontrado) {

    Serial.println("Nenhuma digital cadastrada.");
  }

  Serial.println("----------------------");
}

// APAGAR

void apagarDigital() {

  Serial.println("Digite o ID para apagar:");

  while (!Serial.available());

  int id = Serial.parseInt();

  if (id < 1 || id > 127) {

    Serial.println("ID invalido.");

    return;
  }

  if (finger.deleteModel(id) == FINGERPRINT_OK) {

    Serial.print("ID ");

    Serial.print(id);

    Serial.println(" apagado.");
  }
  else {

    Serial.println("Erro ao apagar.");
  }
}

// SETUP

void setup() {

  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);

  pinMode(LED_WIFI, OUTPUT);

  pinMode(LED_BIOMETRIA, OUTPUT);

  digitalWrite(LED_WIFI, LOW);

  digitalWrite(LED_BIOMETRIA, LOW);

  conectarWiFi();

  // CONFIGURAR NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  mySerial.begin(57600, SERIAL_8N1, RXD2, TXD2);

  finger.begin(57600);

  if (!finger.verifyPassword()) {

    Serial.println("Sensor nao encontrado");

    while (1);
  }

  finger.setSecurityLevel(5);

  Serial.println("Sistema pronto!");

  mostrarMenu();
}

// LOOP

void loop() {

  autenticarDigital();

  if (Serial.available()) {

    String entrada = Serial.readStringUntil('\n');

    entrada.trim();

    if (entrada == "1")
      cadastrarDigital();

    else if (entrada == "2")
      listarDigitais();

    else if (entrada == "3")
      apagarDigital();

    else
      Serial.println("Opcao invalida");

    mostrarMenu();
  }

  delay(50);
}