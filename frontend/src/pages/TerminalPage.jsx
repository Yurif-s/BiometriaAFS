import React from "react";
import TerminalAcesso from "../components/TerminalAcesso";
import { useNavigate } from "react-router-dom";

export default function TerminalPage({ showToast }) {
  const navigate = useNavigate();
  return (
    <TerminalAcesso
      onGoToCadastro={() => navigate("/dashboard/gestao")}
      onGoToAdmin={() => navigate("/dashboard")}
      showToast={showToast}
    />
  );
}
