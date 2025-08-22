// src/components/DocumentCard.jsx
import React from "react";
import TagSelector from "./TagSelector";

export default function DocumentCard({ doc, refresh }) {
  return (
    <div className="card">
      <h4>{doc.titulo}</h4>
      {/* …otros datos del documento… */}
      <TagSelector doc={doc} refresh={refresh} />
    </div>
  );
}
