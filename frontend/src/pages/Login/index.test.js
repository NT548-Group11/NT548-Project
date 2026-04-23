import { render } from "@testing-library/react";
import Login from "./index";
import { login } from "../../services/usersServices";

// mock API
jest.mock("../../services/usersServices", () => ({
  login: jest.fn(),
}));

// mock redux + router cho khỏi lỗi
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  NavLink: ({ children }) => children,
}));

test("render login page", () => {
  login.mockResolvedValue({ token: "123", role: "admin" });

  render(<Login />); // chỉ cần render không lỗi là OK
});
