// TurmasManager.jsx — com confirmação de exclusão e suporte a showToast
import { useState } from "react";
import { FaPlus, FaTrash, FaChalkboardTeacher, FaPen } from "react-icons/fa";
import EditTurmaModal from "./EditTurmaModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

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
        <section className="card" style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                <div className="circle-icon" style={{ width: "48px", height: "48px", borderRadius: "14px" }}>
                    <FaChalkboardTeacher style={{ fontSize: "22px", color: "white" }} />
                </div>
                <h3 style={{ margin: 0 }}>Gerenciar Turmas</h3>
            </div>

            <div className="form-grid turma-grid" style={{ marginBottom: "20px" }}>
                <div className="input-group span-2">
                    <label>Nome da Turma</label>
                    <input
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
                    <label>Ano</label>
                    <input
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

            <div className="buttons" style={{ marginTop: 0, marginBottom: "28px" }}>
                <button
                    type="button"
                    className={`salvar ${addAnim ? "clicked" : ""}`}
                    onClick={handleAdd}
                >
                    <FaPlus /> Adicionar Turma
                </button>
            </div>

            {turmas.length === 0 ? (
                <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>
                    Nenhuma turma cadastrada ainda.
                </p>
            ) : (
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
                                            onClick={() => openEditModal(turma)}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            type="button"
                                            className="excluir"
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