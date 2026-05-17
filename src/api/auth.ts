import { createApi } from "./api";

const authBaseUri = "/auth";
export const authApi = {
  sendSMS: createApi(authBaseUri).post("/sms/send"),
  smsLogin: createApi(authBaseUri).post("/sms/login"),
  logout: createApi(authBaseUri).post("/logout"),
  current: createApi(authBaseUri).get("/current"),
  token: createApi(authBaseUri).get("/token"),
  githubLogin: createApi(authBaseUri).get("/github/login"),
  githubCallback: createApi(authBaseUri).get("/github/callback"),
};

