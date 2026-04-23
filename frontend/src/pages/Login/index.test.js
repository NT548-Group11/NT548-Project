import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "./index";
import { login } from "../../services/usersServices";
import { checkLogin } from "../../actions/login";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { notification } from "antd";

// Mock modules
jest.mock("../../services/usersServices", () => ({
  login: jest.fn(),
}));

jest.mock("../../actions/login", () => ({
  checkLogin: jest.fn(() => ({ type: "CHECK_LOGIN" })),
}));

jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  return {
    ...antd,
    notification: {
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

// mock navigate
const mockedNavigate = jest.fn();

// mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

const mockStore = configureStore([]);
const store = mockStore({});

const renderComponent = () =>
  render(
    <Provider store={store}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </Provider>,
  );

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders login form", () => {
    renderComponent();

    expect(screen.getByText("Đăng nhập")).toBeInTheDocument();
    expect(screen.getByLabelText("User")).toBeInTheDocument();
    expect(screen.getByLabelText("Pass")).toBeInTheDocument();
  });

  test("login success -> redirect", async () => {
    login.mockResolvedValue({
      token: "fake-token",
      role: "admin",
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText("User"), {
      target: { value: "admin" },
    });

    fireEvent.change(screen.getByLabelText("Pass"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
      expect(notification.success).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  test("login fail -> show error", async () => {
    login.mockResolvedValue({
      token: null,
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText("User"), {
      target: { value: "wrong" },
    });

    fireEvent.change(screen.getByLabelText("Pass"), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(notification.error).toHaveBeenCalled();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  //   test("login throws error", async () => {
  //     login.mockRejectedValue(new Error("network error"));

  //     renderComponent();

  //     fireEvent.change(screen.getByLabelText("User"), {
  //       target: { value: "test" },
  //     });

  //     fireEvent.change(screen.getByLabelText("Pass"), {
  //       target: { value: "test" },
  //     });

  //     fireEvent.click(screen.getByRole("button", { name: /đăng nhập/i }));

  //     await waitFor(() => {
  //       expect(notification.error).toHaveBeenCalled();
  //     });
  //   });
});
