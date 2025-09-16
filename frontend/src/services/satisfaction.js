import api from "./api";

export const createSatisfaction = (payload) => api.post("/satisfaction/", payload);
export const listSatisfaction   = () => api.get("/satisfaction/");
export const rptSatisfactionByProgram = () => api.get("/satisfaction/reports/by-program");
