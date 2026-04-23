import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddNewProducts from "./AddNewProducts";
import { BrowserRouter } from "react-router-dom";
import { message } from "antd";

// mock API
jest.mock("../../services/productsService", () => ({
  createProduct: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../../services/categoryService", () => ({
  getCategories: jest.fn(() =>
    Promise.resolve([
      { _id: "1", name: "Category 1" },
      { _id: "2", name: "Category 2" },
    ]),
  ),
}));

// mock antd message
jest.spyOn(message, "error").mockImplementation(() => {});
jest.spyOn(message, "success").mockImplementation(() => {});
jest.spyOn(message, "warning").mockImplementation(() => {});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AddNewProducts />
    </BrowserRouter>,
  );
};

describe("AddNewProducts", () => {
  test("renders component", () => {
    renderComponent();
    expect(screen.getByText(/chi tiết sản phẩm/i)).toBeInTheDocument();
  });

  test("fetch categories on mount", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Category 1")).toBeInTheDocument();
    });
  });

  test("add image success", async () => {
    renderComponent();

    const input = screen.getByPlaceholderText(/nhập url ảnh/i);
    const button = screen.getByText(/apply/i);

    fireEvent.change(input, {
      target: { value: "https://test.com/image.jpg" },
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  test("add image invalid url", async () => {
    renderComponent();

    const input = screen.getByPlaceholderText(/nhập url ảnh/i);
    const button = screen.getByText(/apply/i);

    fireEvent.change(input, {
      target: { value: "invalid-url" },
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalled();
    });
  });

  test("add image empty", async () => {
    renderComponent();

    const button = screen.getByText(/apply/i);

    fireEvent.click(button);

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalled();
    });
  });

  test("submit form success", async () => {
    renderComponent();

    const submitBtn = screen.getByRole("button", { name: /submit/i });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalled();
    });
  });
});
const abc = 1222;
