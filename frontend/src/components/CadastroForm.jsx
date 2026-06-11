import { useCallback, useState } from "react";
import { FaArrowAltCircleRight, FaFingerprint, FaTrash } from "react-icons/fa";
import StatusBanner from "./StatusBanner";
import { useWebSocket } from "../hooks/useWebSocket";
import { cancelarCadastroBiometria, iniciarCadastroBiometria } from "../services/api";

const emptyForm = { nome: "", matricula: "", turma: "", biometria: "" };
const emptyErrors = { nome: false, matricula: false, turma: false };

export default function CadastroForm({ turmaOptions, onSave, showStatus, statusMessage, showToast }) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [step, setStep] = useState(1);
  const [savingAnim, setSavingAnim] = useState(false);
  const [clearingAnim, setClearingAnim] = useState(false);
  const [aguardandoBio, setAguardandoBio] = useState(false);
  const [reservedBioId, setReservedBioId] = useState(null);

  const cancelarCadastroDigital = useCallback(async (id, reason = "unknown") => {
    if (!id) return;
    try {
      await cancelarCadastroBiometria(id, reason);
    } catch (error) {
      console.error("Erro ao cancelar cadastro digital:", error);
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleSave = () => {
    setSavingAnim(true);
    setTimeout(() => setSavingAnim(false), 300);

    const missing = {
      nome: !formData.nome.trim(),
      matricula: !formData.matricula.trim(),
      turma: !formData.turma.trim(),
    };

    if (missing.nome || missing.matricula || missing.turma) {
      setErrors(missing);
      return;
    }

    setErrors(emptyErrors);
    setStep(2);
  };

  const handleBiometriaRecebida = useCallback(({ biometriaId, alunoNome }) => {
    if (!aguardandoBio) return;
    if (alunoNome) {
      if (showToast) showToast(`Digital ja pertence a ${alunoNome}`, "error");
      setAguardandoBio(false);
      return;
    }

    if (reservedBioId && Number(reservedBioId) !== Number(biometriaId)) {
      cancelarCadastroDigital(reservedBioId, "id_mismatch");
    }

    setReservedBioId(biometriaId);
    setFormData((prev) => ({ ...prev, biometria: biometriaId }));
    setAguardandoBio(false);
    setStep(3);
  }, [aguardandoBio, cancelarCadastroDigital, reservedBioId, showToast]);

  useWebSocket(handleBiometriaRecebida);

  const handleCollectDigital = async () => {
    setAguardandoBio(true);
    try {
      const data = await iniciarCadastroBiometria();
      setReservedBioId(data.id);
      if (showToast) showToast(`Sensor ativado! Grave a digital no ID: ${data.id}`, "info");
    } catch (error) {
      console.error(error);
      if (showToast) showToast("Erro ao iniciar cadastro no sensor biometrico", "error");
      setAguardandoBio(false);
    }
  };

  const handleFinalSave = async () => {
    try {
      const success = await onSave(formData);
      if (success) {
        setReservedBioId(null);
        setFormData(emptyForm);
        setStep(1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = () => {
    setClearingAnim(true);
    setTimeout(() => setClearingAnim(false), 250);
    setFormData(emptyForm);
    setErrors(emptyErrors);
  };

  const selectedTurmaName = turmaOptions.find((turma) => String(turma.id) === String(formData.turma))?.nome ?? formData.turma;

  return (
    <section className="card" aria-labelledby="cadastro-aluno-title">
      {showStatus && <StatusBanner message={statusMessage} />}

      {step === 1 && (
        <>
          <h3 id="cadastro-aluno-title">Cadastrar Aluno</h3>
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="aluno-nome">Nome</label>
              <input
                id="aluno-nome"
                type="text"
                placeholder="Nome completo do aluno"
                value={formData.nome}
                onChange={(event) => handleInputChange("nome", event.target.value)}
                className={errors.nome ? "input-error" : ""}
                aria-invalid={errors.nome}
                aria-describedby={errors.nome ? "aluno-nome-error" : undefined}
              />
              {errors.nome && <small id="aluno-nome-error" className="error-msg">Campo obrigatorio</small>}
            </div>

            <div className="input-group">
              <label htmlFor="aluno-matricula">Matricula</label>
              <input
                id="aluno-matricula"
                type="text"
                placeholder="Numero da matricula"
                value={formData.matricula}
                onChange={(event) => handleInputChange("matricula", event.target.value)}
                className={errors.matricula ? "input-error" : ""}
                aria-invalid={errors.matricula}
                aria-describedby={errors.matricula ? "aluno-matricula-error" : undefined}
              />
              {errors.matricula && <small id="aluno-matricula-error" className="error-msg">Campo obrigatorio</small>}
            </div>

            <div className="input-group">
              <label htmlFor="aluno-turma">Turma</label>
              <select
                id="aluno-turma"
                value={formData.turma}
                onChange={(event) => handleInputChange("turma", event.target.value)}
                className={errors.turma ? "input-error" : ""}
                aria-invalid={errors.turma}
                aria-describedby={errors.turma ? "aluno-turma-error" : undefined}
              >
                <option value="">Selecione a turma</option>
                {turmaOptions.map((turma) => (
                  <option key={turma.id} value={turma.id}>{turma.nome}</option>
                ))}
              </select>
              {errors.turma && <small id="aluno-turma-error" className="error-msg">Campo obrigatorio</small>}
            </div>
          </div>

          <div className="buttons">
            <button
              type="button"
              className={`salvar ${savingAnim ? "clicked" : ""}`}
              onClick={handleSave}
            >
              Prosseguir
              <FaArrowAltCircleRight aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`limpar ${clearingAnim ? "clicked" : ""}`}
              onClick={handleClear}
            >
              Limpar
              <FaTrash aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="biometric-card" aria-live="polite">
          <h3>Leitura Biometrica</h3>
          <p className="biometric-text">
            Posicione o dedo no sensor para coletar a digital do aluno
          </p>
          <div className="biometric-preview">
            <div className={`fingerprint-icon ${aguardandoBio ? "loading" : ""}`} aria-hidden="true">
              <FaFingerprint />
            </div>
          </div>
          <div className="buttons">
            <button
              type="button"
              className="salvar"
              onClick={handleCollectDigital}
              disabled={aguardandoBio}
            >
              {aguardandoBio ? "Aguardando Digital..." : "Coletar Digital"}
            </button>
            <button type="button" className="limpar" onClick={() => {
              if (reservedBioId) {
                cancelarCadastroDigital(reservedBioId, "user_cancelled_voltar");
                setReservedBioId(null);
              }
              setAguardandoBio(false);
              setStep(1);
            }}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="confirmation-card">
          <h3>Confirmacao</h3>
          <div className="confirm-content">
            <div className="confirm-row">
              <span className="confirm-label">Nome</span>
              <strong>{formData.nome}</strong>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Matricula</span>
              <strong>{formData.matricula}</strong>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Turma</span>
              <strong>{selectedTurmaName}</strong>
            </div>
            <div className="status-chip">Digital cadastrada (ID: {formData.biometria})</div>
          </div>
          <div className="buttons">
            <button type="button" className="limpar" onClick={() => setStep(1)}>
              Editar
            </button>
            <button type="button" className="salvar" onClick={handleFinalSave}>
              Salvar Cadastro
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
