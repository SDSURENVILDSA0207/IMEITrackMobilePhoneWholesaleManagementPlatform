import api from "@/shared/api/client";

export async function listDeviceModels() {
  const { data } = await api.get("/device-models");
  return data;
}
