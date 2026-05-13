// Código Clone
#include <WiFi.h>

// Credenciais WiFi
const char* ssid = "ASUS Vivobook Go 14/15";
const char* password = "123456789";

// Definição dos pinos
#define TRIG 5
#define ECHO 18
#define BUZZER 4
#define LED_WIFI 2
#define LED_PRESENCA 36

long duracao;
float distancia;

bool tocou = false;

// Vinheta de detecção
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

// Conectar WiFi
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

  } else {
    Serial.println("\nFalha ao conectar no WiFi");
    digitalWrite(LED_WIFI, LOW);
  }
}

void setup() {

  Serial.begin(115200);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);

  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_PRESENCA, OUTPUT);

  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_PRESENCA, LOW);

  conectarWiFi();
}

void loop() {

  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duracao = pulseIn(ECHO, HIGH);

  distancia = duracao * 0.034 / 2;

  Serial.print("Distancia: ");
  Serial.print(distancia);
  Serial.println(" cm");

  // Led pisca uma vez por detecção
  if (distancia > 0 && distancia <= 30 && !tocou) {

    digitalWrite(LED_PRESENCA, HIGH);

    tocarMario();

    delay(300);

    digitalWrite(LED_PRESENCA, LOW);

    tocou = true;
  }

  if (distancia > 30) {
    tocou = false;
  }

  delay(100);
}