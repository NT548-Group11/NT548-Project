import { render, screen, fireEvent } from "@testing-library/react";
import Login from "./index";
import { login } from "../../services/usersServices";
import { BrowserRouter } from "react-router-dom";

jest.mock("../../services/usersServices", () => ({
  login: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

test("login success basic test", async () => {
  login.mockResolvedValue({
    token: "123",
    role: "admin",
  });

  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>,
  );

  fireEvent.change(screen.getByLabelText("User"), {
    target: { value: "admin" },
  });

  fireEvent.change(screen.getByLabelText("Pass"), {
    target: { value: "123" },
  });

  fireEvent.click(screen.getByText("Đăng Nhập"));
});
