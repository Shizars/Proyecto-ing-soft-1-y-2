import api from "./api";

// CRUD básico
export const createAuditV2 = (payload) => api.post("/v2/audits", payload);
export const updateAuditV2 = (id, payload) =>
  api.put(`/v2/audits/${id}`, payload);
export const listAuditsV2 = (params) =>
  api.get("/v2/audits", { params });

// Reportes
export const rptRespPorProgramaV2 = () =>
  api.get("/v2/reports/respuestas-por-programa");
export const rptRankingV2 = (promedio = true) =>
  api.get("/v2/reports/ranking-programas", { params: { promedio } });
export const rptExistenciaGlobalV2 = () =>
  api.get("/v2/reports/existencia-global");
export const rptPRTV2 = () =>
  api.get("/v2/reports/pii-registro-tribunal");
export const rptRankingProgramasV2 = (promedio = false) =>
  api.get(`/v2/reports/ranking-programas?promedio=${promedio}`);

export const rptExistenciaGlobal = () => api.get("/v2/reports/existencia-global");


// Export
export const exportAuditsCsvV2 = () =>
  api.get("/v2/exports/audits.csv", { responseType: "blob" });


