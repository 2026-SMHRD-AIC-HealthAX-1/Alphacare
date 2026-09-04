import axios from "axios";

const test_URL = import.meta.env.BASE_URL;

export const api = axios.create({
  baseURL : test_URL,
  headers : {
    "Content-Type" : "application/json",
  },
});