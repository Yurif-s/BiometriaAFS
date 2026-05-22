import { useState } from "react";
import { FaSave, FaUndo, FaFingerprint, FaArrowAltCircleRight, FaTrash } from "react-icons/fa";
import StatusBanner from "./StatusBanner";
import { useWebSocket } from "../hooks/useWebSocket";

const emptyForm = { nome: "", matricula: "", turma: "", digital: "" };
const emptyErrors = { nome: false, matricula: false, turma: false };

export default function CadastroForm({ turmaOptions, onSave, showStatus, statusMessage }) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [step, setStep] = useState(1);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [savingAnim, setSavingAnim] = useState(false);
  const [clearingAnim, setClearingAnim] = useState(false);
  const [aguardandoBio, setAguardandoBio] = useState(false);

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
      // biometria já cadastrada — avisa e não avança
      showToast(`Digital já pertence a ${alunoNome}`, 'error');
      setAguardandoBio(false);
      return;
    }
    setFormData(prev => ({ ...prev, biometria: biometriaId }));
    setAguardandoBio(false);
    setStep(3);
  }, [aguardandoBio]);

  useWebSocket(handleBiometriaRecebida);

  const handleCollectDigital = () => {
    setAguardandoBio(true); // a tela fica "ouvindo"
  };

  const handleFinalSave = async () => {
    try {
      await addAluno({
        nome: formData.nome.trim(),
        matricula: formData.matricula.trim(),
        biometria: formData.biometria,   // número vindo do ESP32
        turma_id: Number(formData.turma_id),     // ID numérico da turma
      });
      setFormData(emptyForm);
      setStep(1);
      showToast(`Aluno "${formData.nome}" cadastrado!`);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao salvar';
      showToast(msg, 'error');
    }
  };

  const handleClear = () => {
    setClearingAnim(true);
    setTimeout(() => setClearingAnim(false), 250);
    setFormData(emptyForm);
    setErrors(emptyErrors);
  };

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
            <div className={`fingerprint-icon ${biometricLoading ? "loading" : ""}`}>
              <FaFingerprint />
            </div>
          </div>
          <div className="buttons">
            <button
              type="button"
              className="salvar"
              onClick={handleCollectDigital}
              disabled={biometricLoading}
            >
              {biometricLoading ? "Coletando..." : "Coletar Digital"}
            </button>
            <button type="button" className="limpar" onClick={() => setStep(1)}>
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
              <strong>{formData.turma}</strong>
            </div>
            <div className="status-chip">Digital cadastrada ✅</div>
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