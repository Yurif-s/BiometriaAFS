import React, { useState } from "react";
import { FaFileCsv } from "react-icons/fa";
import { getDashboardExportCsv } from "../../services/api";
import { downloadCsv } from "../../utils/exportCsv";

export default function ExportButton({ filters, filename, onError }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csvData = await getDashboardExportCsv(filters);
      downloadCsv(csvData, filename);
    } catch (error) {
      console.error("Erro ao exportar CSV", error);
      if (onError) onError("Erro ao exportar dados. Verifique o servidor.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`btn-export-csv ${exporting ? "exporting" : ""}`}
      type="button"
    >
      <FaFileCsv className="export-icon" />
      {exporting ? "Gerando CSV..." : "Exportar CSV"}
    </button>
  );
}
