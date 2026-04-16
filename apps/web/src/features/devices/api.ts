import api from "@/shared/api/client";

export async function listDevices() {
  const { data } = await api.get("/devices");
  return data;
}
