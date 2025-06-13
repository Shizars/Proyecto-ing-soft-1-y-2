import React from "react";
import "./PdfPreviewModal.css";

export default function PdfPreviewModal({ isOpen, url, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pdf-modal-close" onClick={onClose}>
          ×
        </button>
        <iframe
          src={url}
          title="Vista previa del documento"
          width="100%"
          height="100%"
          frameBorder="0"
        />
      </div>
    </div>
  );
}
