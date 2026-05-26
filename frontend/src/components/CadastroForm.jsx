import { useState, useCallback, useEffect } from "react";
import { FaSave, FaUndo, FaFingerprint, FaArrowAltCircleRight, FaTrash } from "react-icons/fa";
import StatusBanner from "./StatusBanner";
import { useWebSocket } from "../hooks/useWebSocket";

const emptyForm = { nome: "", matricula: "", turma: "", biometria: "" };
const emptyErrors = { nome: false, matricula: false, turma: false };

export default function CadastroForm({ turmaOptions, onSave, showStatus, statusMessage, showToast }) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [step, setStep] = useState(1);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [savingAnim, setSavingAnim] = useState(false);
  const [clearingAnim, setClearingAnim] = useState(false);
  const [aguardandoBio, setAguardandoBio] = useState(false);
  const [reservedBioId, setReservedBioId] = useState(null);

  const cancelarCadastroDigital = useCallback(async (id) => {
    if (!id) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      await fetch(`${baseUrl}/alunos/biometria/cancelar-cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id) }),
      });
      console.log(`Cadastro cancelado para o ID biométrico: ${id}`);
    } catch (error) {
      console.error("Erro ao cancelar cadastro digital:", error);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (reservedBioId && step === 2) {
        cancelarCadastroDigital(reservedBioId);
      }
    };
  }, [reservedBioId, step, cancelarCadastroDigital]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (reservedBioId && step === 2) {
        const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const url = `${baseUrl}/alunos/biometria/cancelar-cadastro`;
        const headers = { type: 'application/json' };
        const blob = new Blob([JSON.stringify({ id: Number(reservedBioId) })], headers);
        navigator.sendBeacon(url, blob);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [reservedBioId, step]);

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
      if (showToast) showToast(`Digital já pertence a ${alunoNome}`, 'error');
      setAguardandoBio(false);
      return;
    }
    // Se o ID recebido for diferente do reservado originalmente (reuso de digital órfã),
    // cancela a reserva original para liberá-la no sensor
    if (reservedBioId && reservedBioId !== biometriaId) {
      cancelarCadastroDigital(reservedBioId);
    }
    setReservedBioId(biometriaId);
    setFormData(prev => ({ ...prev, biometria: biometriaId }));
    setAguardandoBio(false);
    setStep(3);
  }, [aguardandoBio, showToast, reservedBioId, cancelarCadastroDigital]);

  useWebSocket(handleBiometriaRecebida);

  const handleCollectDigital = async () => {
    setAguardandoBio(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/alunos/biometria/iniciar-cadastro`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Erro ao iniciar cadastro de biometria");
      }
      const data = await response.json();
      setReservedBioId(data.id);
      if (showToast) {
        showToast(`Sensor ativado! Grave a digital no ID: ${data.id}`, "info");
      }
    } catch (error) {
      console.error(error);
      if (showToast) {
        showToast("Erro ao iniciar cadastro no sensor biométrico", "error");
      }
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

  const selectedTurmaName = turmaOptions.find(t => String(t.id) === String(formData.turma))?.nome ?? formData.turma;

  return (
    <section className="card">
      {showStatus && <StatusBanner message={statusMessage} />}

      {step === 1 && (
        <>
          <h3>Cadastrar Aluno</h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Nome</label>
              <input
                type="text"
                placeholder="Nome completo do aluno"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                className={errors.nome ? "input-error" : ""}
              />
              {errors.nome && <small className="error-msg">Campo obrigatório</small>}
            </div>

            <div className="input-group">
              <label>Matrícula</label>
              <input
                type="text"
                placeholder="Número da matrícula"
                value={formData.matricula}
                onChange={(e) => handleInputChange("matricula", e.target.value)}
                className={errors.matricula ? "input-error" : ""}
              />
              {errors.matricula && <small className="error-msg">Campo obrigatório</small>}
            </div>

            <div className="input-group">
              <label>Turma</label>
              <select
                value={formData.turma}
                onChange={(e) => handleInputChange("turma", e.target.value)}
                className={errors.turma ? "input-error" : ""}
              >
                <option value="">Selecione a turma</option>
                {turmaOptions.map((turma) => (
                  <option key={turma.id} value={turma.id}>{turma.nome}</option>
                ))}
              </select>
              {errors.turma && <small className="error-msg">Campo obrigatório</small>}
            </div>
          </div>

          <div className="buttons">
            <button
              type="button"
              className={`salvar ${savingAnim ? "clicked" : ""}`}
              onClick={handleSave}
            >
              Prosseguir
              <FaArrowAltCircleRight />
            </button>
            <button
              type="button"
              className={`limpar ${clearingAnim ? "clicked" : ""}`}
              onClick={handleClear}
            >
              Limpar
              <FaTrash />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="biometric-card">
          <h3>Leitura Biométrica</h3>
          <p className="biometric-text">
            Posicione o dedo no sensor para coletar a digital do aluno
          </p>
          <div className="biometric-preview">
            <div className={`fingerprint-icon ${aguardandoBio ? "loading" : ""}`}>
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
                cancelarCadastroDigital(reservedBioId);
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
          <h3>Confirmação</h3>
          <div className="confirm-content">
            <div className="confirm-row">
              <span className="confirm-label">Nome</span>
              <strong>{formData.nome}</strong>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Matrícula</span>
              <strong>{formData.matricula}</strong>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Turma</span>
              <strong>{selectedTurmaName}</strong>
            </div>
            <div className="status-chip">Digital cadastrada (ID: {formData.biometria}) ✅</div>
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