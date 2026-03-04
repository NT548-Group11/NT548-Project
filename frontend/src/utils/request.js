import { getCookie } from "../helpers/cookie";
import { refreshToken } from "../services/usersServices";

const API_DOMAIN = "";

export const get = async (path) => {
  let token = getCookie("accessToken");
  let headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  let response = await fetch(API_DOMAIN + path, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    // Token hết hạn
    const newToken = await refreshToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(API_DOMAIN + path, {
        method: "GET",
        headers,
        credentials: "include",
      });
    } else {
      throw new Error("Failed to refresh token");
    }
  }

  return await response.json();
};

export const post = async (path, options) => {
  const token = getCookie("accessToken");
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const fetchOptions = {
    method: "POST",
    headers,
    credentials: "include",
    ...(options && { body: JSON.stringify(options) }),
  };
  const response = await fetch(API_DOMAIN + path, fetchOptions);
  const data = await response.json().catch(() => ({})); // tránh lỗi JSON parse nếu rỗng

  return data;
};

export const del = async (path, options = {}) => {
  const token = getCookie("accessToken");
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), // Thêm token vào header nếu tồn tại
  };

  const response = await fetch(API_DOMAIN + path, {
    method: "DELETE",
    headers,
    body: JSON.stringify(options), // Gửi dữ liệu trong body
    credentials: "include", // Đảm bảo cookies được gửi kèm
  });

  return await response.json();
};

export const patch = async (path, options) => {
  const token = getCookie("accessToken");
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), 
  };
  const response = await fetch(API_DOMAIN + path, {
    method: "PATCH",
    headers,
    body: JSON.stringify(options),
    credentials: "include", // Đảm bảo cookies được gửi kèm
  });
  return await response.json();
};

export const put = async (path, options) => {
  const token = getCookie("accessToken"); // Lấy token từ cookies
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), // Thêm token vào header nếu tồn tại
  };

  const response = await fetch(API_DOMAIN + path, {
    method: "PUT",
    headers,
    body: JSON.stringify(options),
    credentials: "include", // Đảm bảo cookies được gửi kèm
  });
  return await response.json();
};
