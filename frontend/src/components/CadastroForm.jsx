import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowAltCircleRight, FaFingerprint, FaTrash } from "react-icons/fa";
import StatusBanner from "./StatusBanner";
import { useWebSocket } from "../hooks/useWebSocket";
import { cancelarCadastroBiometria, iniciarCadastroBiometria } from "../services/api";

import { criarColetaBiometrica } from "../utils/coletaBiometrica";

const emptyForm = { nome: "", matricula: "", turma: "", biometria: "" };
const emptyErrors = { nome: false, matricula: false, turma: false };

export default function CadastroForm({ turmaOptions, onSave, showStatus, statusMessage, showToast }) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [step, setStep] = useState(1);
  const [savingAnim, setSavingAnim] = useState(false);
  const [clearingAnim, setClearingAnim] = useState(false);
  const [coleta, setColeta] = useState({ estado: 'idle', mensagem: '' });
  const [salvando, setSalvando] = useState(false);
  const sessao = useRef(null);
  const aguardandoBio = ['starting', 'waiting', 'cancelling'].includes(coleta.estado);

  useEffect(() => {
    const atual = criarColetaBiometrica({
      iniciar: iniciarCadastroBiometria,
      cancelar: cancelarCadastroBiometria,
      atualizar: setColeta,
      confirmar: (id) => {
        setFormData(prev => ({ ...prev, biometria: id }));
        setStep(3);
      },
    });
    sessao.current = atual;
    return () => { atual.descartar(); sessao.current = null; };
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
    setStep(formData.biometria ? 3 : 2);
  };

  const handleBiometriaRecebida = useCallback(data => sessao.current?.receber(data), []);
  const handleBiometriaFalha = useCallback(() => sessao.current?.falhar(), []);
  const connection = useWebSocket(handleBiometriaRecebida, handleBiometriaFalha);
  useEffect(() => {
    if (connection === 'disconnected') sessao.current?.desconectar();
  }, [connection, coleta.estado]);

  const handleCollectDigital = () => sessao.current?.iniciar();

  const handleFinalSave = async () => {
    if (salvando) return;
    setSalvando(true);
    try {
      const success = await onSave(formData);
      if (success) {
        sessao.current?.concluir();
        setFormData(emptyForm);
        setStep(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const handleClear = () => {
    setClearingAnim(true);
    setTimeout(() => setClearingAnim(false), 250);
    void sessao.current?.cancelar();
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
          {coleta.mensagem && <p role={coleta.estado === 'error' ? 'alert' : 'status'}>{coleta.mensagem}</p>}
          {connection !== 'connected' && <p role="status">Aguardando conexão com o servidor para iniciar a coleta.</p>}
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
              disabled={aguardandoBio || connection !== 'connected'}
            >
              {aguardandoBio ? (coleta.estado === 'cancelling' ? 'Cancelando…' : 'Aguardando Digital…') : coleta.estado === 'error' ? 'Tentar novamente' : 'Coletar Digital'}
            </button>
            <button type="button" className="limpar" disabled={coleta.estado === 'starting' || coleta.estado === 'cancelling'} onClick={async () => {
              await sessao.current?.cancelar();
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
            <button type="button" className="limpar" disabled={salvando} onClick={() => setStep(1)}>
              Editar
            </button>
            <button type="button" className="salvar" disabled={salvando} onClick={handleFinalSave}>
              {salvando ? "Salvando…" : "Salvar Cadastro"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
