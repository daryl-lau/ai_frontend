import { createApi } from "./api";

const uploadBaseUri = "/upload";
export const uploadApi = {
  get_status: createApi(uploadBaseUri).get("/status"),
  upload_chunk: createApi(uploadBaseUri).post("/chunk"),
  init: createApi(uploadBaseUri).post("/init"),
  complete: createApi(uploadBaseUri).post("/complete"),
};
