import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteOutlined } from "@ant-design/icons";
import { getCategories } from "../../services/categoryService";
import {
  Input,
  InputNumber,
  Button,
  Form,
  Row,
  Col,
  message,
  Select,
} from "antd";
import { createProduct } from "../../services/productsService";

const { TextArea } = Input;
const test = 366;

const AddNewProducts = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]); // thong tin danh muc
  const [imageUrls, setImageUrls] = useState([]);
  const [urlInput, setUrlInput] = useState("");

  // Get all caterories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await getCategories();
        setCategories(res);
      } catch (err) {
        message.error("Không lấy được danh mục!");
      }
    }
    fetchCategories();
  }, []);
  // Add image
  const handleAddImage = () => {
    if (!urlInput.trim()) {
      message.warning("Vui lòng nhập URL ảnh");
      return;
    }
    try {
      new URL(urlInput);
    } catch {
      message.error("URL không hợp lệ");
      return;
    }
    setImageUrls([...imageUrls, urlInput]);
    setUrlInput("");
  };
  // Remove image
  const handleRemoveImage = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };
  //Update Product
  const handleFinish = async (values) => {
    try {
      const submitData = {
        ...values,
        description: (values.description || []).filter((desc) => !!desc), // loại bỏ mô tả rỗng
        category: values.category,
        images: imageUrls,
      };
      console.log("submitData", submitData);
      await createProduct(submitData);
      navigate("/admin/products");

      message.success("Cập nhật sản phẩm thành công!");
    } catch (err) {
      message.error("Cập nhật sản phẩm thất bại!");
    }
  };

  return (
    <div style={{ padding: 24, background: "#f4f4f2", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Chi tiết sản phẩm</h2>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 24,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <Row gutter={32}>
          <Col xs={24} md={14}>
            {/* Tên sản phẩm */}
            <Form.Item
              label="Tên sản phẩm"
              name="title"
              rules={[{ required: true, message: "Please enter product name" }]}
            >
              <Input placeholder="Type name here" />
            </Form.Item>
            {/* Mô tả */}
            <Form.Item label="Mô tả" required>
              <Form.List
                name="description"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập ít nhất một mô tả",
                  },
                ]}
              >
                {(fields, { add, remove }) => (
                  <>
                    {fields.length === 0 && (
                      <div style={{ color: "red" }}>Cần ít nhất 1 mô tả</div>
                    )}
                    {fields.map((field, idx) => (
                      <div
                        key={field.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Form.Item
                          key={field.key}
                          {...field}
                          name={[field.name]}
                          rules={[
                            {
                              required: true,
                              message: "Không được để trống mô tả",
                            },
                          ]}
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <TextArea
                            placeholder={`Mô tả #${idx + 1}`}
                            autoSize={{ minRows: 2, maxRows: 6 }}
                          />
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button
                            danger
                            type="text"
                            onClick={() => remove(field.name)}
                            style={{ marginLeft: 8 }}
                          >
                            x
                          </Button>
                        )}
                      </div>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon="+"
                      >
                        Thêm mô tả
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
            {/* Category */}
            <Form.Item
              label="Danh mục"
              name="category"
              rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
            >
              <Select
                placeholder="Chọn danh mục"
                showSearch
                optionFilterProp="label"
                options={categories.map((cat) => ({
                  label: cat.name,
                  value: cat._id,
                }))}
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            {/* Số lượng tồn kho */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Số lượng tồn kho" name="quantity">
                  <Input placeholder="1258" type="number" />
                </Form.Item>
              </Col>
            </Row>
            {/* Giá sản phẩm */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Giá sản phẩm" name="price">
                  <Input placeholder="₫1000" type="number" />
                </Form.Item>
              </Col>
            </Row>
            {/*Discount*/}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Discount" name="discountPercentage">
                  <InputNumber placeholder="10%" min={0} max={100} />
                </Form.Item>
              </Col>
            </Row>
          </Col>
          {/* Ảnh sản phẩm */}
          <Col xs={24} md={10}>
            <h3>Danh sách ảnh sản phẩm</h3>
            <Row gutter={8}>
              <Col span={18}>
                <Input
                  placeholder="Nhập URL ảnh"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </Col>
              <Col span={6}>
                <Button type="primary" onClick={handleAddImage}>
                  Apply
                </Button>
              </Col>
            </Row>

            {/* Preview ảnh */}
            <div style={{ marginTop: 20 }}>
              <Row gutter={[16, 16]}>
                {imageUrls.map((url, index) => (
                  <Col key={url}>
                    <div
                      style={{
                        position: "relative",
                        width: 120,
                        height: 120,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={url}
                        alt="preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      {/* Nút xoá */}
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveImage(index)}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          background: "rgba(255,255,255,0.8)",
                        }}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col>
            <Button type="primary" htmlType="submit" style={{ minWidth: 120 }}>
              Thêm mới
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddNewProducts;
