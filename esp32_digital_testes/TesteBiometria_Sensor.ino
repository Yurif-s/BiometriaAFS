#include <Adafruit_Fingerprint.h>

HardwareSerial mySerial(2);

#define RXD2 16
#define TXD2 17

Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// ---------------- SETUP ----------------

void setup() {
  Serial.begin(115200);
  mySerial.begin(57600, SERIAL_8N1, RXD2, TXD2);
  finger.begin(57600);

  if (!finger.verifyPassword()) {
    Serial.println("Sensor nao encontrado");
    while (1);
  }

  Serial.println("Sistema pronto!");
  mostrarMenu();
}

// ---------------- LOOP ----------------

void loop() {
  if (Serial.available()) {
    String entrada = Serial.readStringUntil('\n');
    entrada.trim();

    if (entrada == "1")      cadastrarDigital();
    else if (entrada == "2") listarDigitais();
    else if (entrada == "3") apagarDigital();
    else                     Serial.println("Opcao invalida");

    mostrarMenu();
  }
}

// ---------------- MENU ----------------

void mostrarMenu() {
  Serial.println("\n===== MENU =====");
  Serial.println("1 - Cadastrar digital");
  Serial.println("2 - Listar digitais");
  Serial.println("3 - Apagar digital");
  Serial.println("================");
}

// ---------------- GERAR ID AUTOMATICO ----------------

int gerarNovoID() {
  // getTemplateCount() retorna quantos templates estão gravados,
  // mas não informa os IDs livres. Varremos slot a slot com loadModel
  // apenas para checar ocupação — sem usar o buffer de imagem.
  for (int i = 1; i <= 127; i++) {
    uint8_t p = finger.loadModel(i);
    // FINGERPRINT_OK  → slot ocupado
    // qualquer outro  → slot livre
    if (p != FINGERPRINT_OK) {
      return i;
    }
  }
  return -1; // memória cheia
}

// ---------------- CADASTRAR ----------------

void cadastrarDigital() {
  uint8_t p;

  // ── PASSO 1: primeira leitura (usada tanto para checar duplicidade
  //            quanto como primeira amostra do cadastro) ──────────────
  Serial.println("\nColoque o dedo para iniciar o cadastro...");

  p = FINGERPRINT_NOFINGER;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
    if (p != FINGERPRINT_OK) {
      Serial.println("Erro ao capturar imagem. Tente novamente.");
      return;
    }
  }

  // Converte para template no slot 1
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("Erro ao processar imagem. Tente novamente.");
    return;
  }

  // ── PASSO 2: verifica duplicidade ANTES de continuar ─────────────
  p = finger.fingerFastSearch();
  if (p == FINGERPRINT_OK) {
    Serial.print("ERRO: Digital ja cadastrada no ID ");
    Serial.println(finger.fingerID);
    Serial.println("Cadastro cancelado.");
    return;
  }
  // FINGERPRINT_NOTFOUND é o retorno esperado quando não é duplicata
  // Qualquer outro erro inesperado também cancela por segurança
  if (p != FINGERPRINT_NOTFOUND) {
    Serial.println("Erro na verificacao de duplicidade.");
    return;
  }

  Serial.println("Digital nao encontrada na base. Prosseguindo...");

  // ── PASSO 3: aguarda remover o dedo ──────────────────────────────
  Serial.println("Remova o dedo...");
  delay(500);
  while (finger.getImage() != FINGERPRINT_NOFINGER);
  delay(300);

  // ── PASSO 4: segunda leitura (confirmação) ────────────────────────
  Serial.println("Coloque o mesmo dedo novamente...");

  p = FINGERPRINT_NOFINGER;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
    if (p != FINGERPRINT_OK) {
      Serial.println("Erro na segunda leitura. Tente novamente.");
      return;
    }
  }

  // Converte para template no slot 2
  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println("Erro ao processar segunda imagem.");
    return;
  }

  // ── PASSO 5: cria modelo combinando slots 1 e 2 ──────────────────
  p = finger.createModel();
  if (p == FINGERPRINT_ENROLLMISMATCH) {
    Serial.println("ERRO: Os dois dedos nao sao iguais. Tente novamente.");
    return;
  }
  if (p != FINGERPRINT_OK) {
    Serial.println("Erro ao criar modelo.");
    return;
  }

  // ── PASSO 6: grava na memória com ID automático ───────────────────
  int novoID = gerarNovoID();
  if (novoID == -1) {
    Serial.println("Memoria cheia! Apague digitais antes de cadastrar.");
    return;
  }

  p = finger.storeModel(novoID);
  if (p == FINGERPRINT_OK) {
    Serial.print("✔ Digital cadastrada com sucesso! ID atribuido: ");
    Serial.println(novoID);
  } else {
    Serial.println("Erro ao salvar na memoria.");
  }
}

// ---------------- LISTAR ----------------

void listarDigitais() {
  Serial.println("\n--- IDs cadastrados ---");
  bool algumEncontrado = false;

  for (int i = 1; i <= 127; i++) {
    if (finger.loadModel(i) == FINGERPRINT_OK) {
      Serial.print("  ID: ");
      Serial.println(i);
      algumEncontrado = true;
    }
  }

  if (!algumEncontrado) {
    Serial.println("  Nenhuma digital cadastrada.");
  }
  Serial.println("----------------------");
}

// ---------------- APAGAR ----------------

void apagarDigital() {
  Serial.println("Digite o ID para apagar e pressione Enter:");

  while (!Serial.available());
  int id = Serial.parseInt();

  if (id < 1 || id > 127) {
    Serial.println("ID invalido. Use valores entre 1 e 127.");
    return;
  }

  if (finger.deleteModel(id) == FINGERPRINT_OK) {
    Serial.print("Digital ID ");
    Serial.print(id);
    Serial.println(" apagada com sucesso.");
  } else {
    Serial.println("Erro ao apagar. Verifique se o ID existe.");
  }
}