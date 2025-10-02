import api from "./api";

export const createSatisfaction = (payload) => api.post("/satisfaction/", payload);
export const listSatisfaction   = () => api.get("/satisfaction/");
export const rptSatisfactionByProgram = () => api.get("/satisfaction/reports/by-program");
export const rptSatisfactionOverall = (params) =>
  api.get("/satisfaction/reports/overall", { params });

export const rptSatisfactionByProgramPct = (params) =>
  api.get("/satisfaction/reports/by-program-satisfaction", { params });
