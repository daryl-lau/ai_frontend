import { createApi } from "./api";

const authBaseUri = "/auth/sms";
export const authApi = {
  send_sms: createApi(authBaseUri).post("/send"),
  login: createApi(authBaseUri).post("/login"),
  current: createApi().get("/auth/current"),
  githubLogin: createApi().get("/auth/github/login"),
  githubCallback: createApi().get("/auth/github/callback"),
};

