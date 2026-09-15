// TurmasManager.jsx — com confirmação de exclusão e suporte a showToast
import { useState } from "react";
import { FaPlus, FaTrash, FaChalkboardTeacher, FaPen } from "react-icons/fa";
import EditTurmaModal from "./EditTurmaModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import Feedback from './Feedback';

const emptyForm = { nome: "", ano: new Date().getFullYear() };
const emptyErrors = { nome: false, ano: false };

export default function TurmasManager({
    turmas,
    onAdd,
    onUpdate,
    onDelete,
    turmaExists,
    showToast,
}) {
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState(emptyErrors);
    const [errorMsg, setErrorMsg] = useState("");
    const [addAnim, setAddAnim] = useState(false);

    const [editingTurma, setEditingTurma] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const openEditModal = (turma) => {
        setEditingTurma(turma);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingTurma(null);
    };

    const handleDeleteClick = (turma) => {
        setDeleteTarget(turma);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true);
        try {
            await onDelete(deleteTarget.id);
            const nome = deleteTarget.nome;
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            if (showToast) showToast(`Turma "${nome}" removida com sucesso.`);
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Erro ao excluir turma';
            if (showToast) showToast(msg, 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteTarget(null);
        setShowDeleteConfirm(false);
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: false }));
        setErrorMsg("");
    };

    const handleAdd = async () => {
        setAddAnim(true);
        setTimeout(() => setAddAnim(false), 300);

        const missing = {
            nome: !formData.nome.trim(),
            ano: !formData.ano || isNaN(Number(formData.ano)),
        };

        if (missing.nome || missing.ano) {
            setErrors(missing);
            return;
        }

        if (turmaExists(formData.nome)) {
            setErrorMsg(`Turma "${formData.nome}" já cadastrada.`);
            setErrors((prev) => ({ ...prev, nome: true }));
            return;
        }

        try {
            const nomeTurma = formData.nome.trim();
            await onAdd({ nome: nomeTurma, ano: Number(formData.ano) });
            setFormData(emptyForm);
            if (showToast) showToast(`Turma "${nomeTurma}" adicionada com sucesso!`);
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Erro ao adicionar turma';
            setErrorMsg(msg);
        }
    };

    return (
        <section className="card">
            <div className="section-heading">
                <div className="section-heading-icon">
                    <FaChalkboardTeacher aria-hidden="true" />
                </div>
                <h3 style={{ margin: 0 }}>Gerenciar Turmas</h3>
            </div>

            <div className="form-grid turma-grid turma-form">
                <div className="input-group span-2">
                    <label htmlFor="turma-nome">Nome da turma</label>
                    <input
                        id="turma-nome"
                        type="text"
                        placeholder="Ex: 1ª Informática"
                        value={formData.nome}
                        onChange={(e) => handleChange("nome", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        className={errors.nome ? "input-error" : ""}
                    />
                    {errors.nome && <small className="error-msg">{errorMsg || "Campo obrigatório"}</small>}
                </div>

                <div className="input-group">
                    <label htmlFor="turma-ano">Ano</label>
                    <input
                        id="turma-ano"
                        type="number"
                        placeholder="Ex: 2025"
                        value={formData.ano}
                        onChange={(e) => handleChange("ano", e.target.value)}
                        className={errors.ano ? "input-error" : ""}
                        min="2000"
                        max="2099"
                    />
                    {errors.ano && <small className="error-msg">Ano inválido</small>}
                </div>
            </div>

            <div className="buttons turma-actions">
                <button
                    type="button"
                    className={`salvar ${addAnim ? "clicked" : ""}`}
                    onClick={handleAdd}
                >
                    <FaPlus /> Adicionar Turma
                </button>
            </div>

            {turmas.length === 0 ? (
                <Feedback title="Nenhuma turma cadastrada">Adicione a primeira turma para começar a cadastrar os alunos.</Feedback>
            ) : (
                <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Nome da Turma</th>
                            <th>Ano</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {turmas.map((turma) => (
                            <tr key={turma.id}>
                                <td>{turma.nome}</td>
                                <td>{turma.ano}</td>
                                <td>
                                    <div className="acoes">
                                        <button
                                            type="button"
                                            className="editar"
                                            aria-label={`Editar turma ${turma.nome}`}
                                            onClick={() => openEditModal(turma)}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            type="button"
                                            className="excluir"
                                            aria-label={`Excluir turma ${turma.nome}`}
                                            onClick={() => handleDeleteClick(turma)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}

            <EditTurmaModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                turma={editingTurma}
                onSave={onUpdate}
                turmaExists={turmaExists}
            />

            {showDeleteConfirm && (
                <DeleteConfirmModal
                    target={deleteTarget}
                    loading={deleteLoading}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    type="turma"
                />
            )}
        </section>
    );
}
