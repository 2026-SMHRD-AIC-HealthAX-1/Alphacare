import axios from "axios";

const URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL : URL,
  headers : {
    "Content-Type" : "application/json",
  },
  timeout : 5000,
});