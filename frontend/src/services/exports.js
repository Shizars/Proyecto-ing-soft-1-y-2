import api from "./api";

export const exportSatisfactionCSV = (params = {}) =>
  api.get("/satisfaction/exports/satisfaction.csv", {
    params,
    responseType: "blob",
  });

export const exportAuditsCSV = (params = {}) =>
  api.get("/v2/exports/audits.csv", {
    params,
    responseType: "blob",
  });
