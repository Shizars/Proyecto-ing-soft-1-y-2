import React from "react";
import "./PdfPreviewModal.css";
import CommentsPanel from "./CommentsPanel";

export default function PdfPreviewModal({ isOpen, url, docId, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-xxl pdf-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <div className="pdf-layout">
          <div className="pdf-view">
            <iframe
              title="preview"
              src={url}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
          <CommentsPanel docId={docId} />
        </div>
      </div>
    </div>
  );
}
