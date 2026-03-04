import { Carousel, Button, Col, Row } from "antd";
import "../../styles/Home.scss";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import tpbs_img from "../../assets/images/Australia's Leading Online Bodybuilding Supplements Store.jpg";
import dc_img from "../../assets/images/Premium Photo _ Flat lay arrangement with sports items and airpods.jpg";
import qa_img from "../../assets/images/tải xuống.jpg";
import subimg from "../../assets/images/Dumbbell An Old Gym Setting With Dumbbells Backgrounds _ JPG Free Download - Pikbest.jpg";
import home_img from "../../assets/images/home-img.png";
import { exercisesData } from "../../data/exerciseData";


const sectionImages = exercisesData.map((item) => ({
  id: item.id,
  image: item.img,
  alt: item.group,
  title: item.group,
}));
const carouselItems = [
  {
    src: tpbs_img,
    alt: "Suplements",
    title: "Thực phẩm bổ sung",
    link: "/products",
  },
  {
    src: dc_img,
    alt: "Equipment",
    title: "Dụng cụ tập luyện",
    link: "/products",
  },
  { src: qa_img, alt: "Clothing", title: "Quần áo", link: "/products" },
];

function Home() {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, []);
  return (
      <>
        {showSuccess && (
          <div className="alert alert-success" style={{textAlign: "center", margin: 16, color: "#52c41a", fontWeight: "bold"}}>
            Thanh toán thành công!
          </div>
        )}
      <div className="home-page">
        {/* Section1 */}
        <section className="home-section">
          <img className="home-bg" src={subimg} alt="background" />
          <div className="home-section__content">
            <Row gutter={[30, 30]} align={"middle"}>
              <Col xs={24} md={12} className="home-content">
                <h1 className="home-title">Nâng tầm thể chất của bạn👹</h1> 
                <p className="home-description">
                  Chào mừng bạn đến với trung tâm Gym của chúng tôi! Tại đây,
                  bạn sẽ tìm thấy các chương trình luyện tập chuyên nghiệp,
                  trang thiết bị hiện đại và đội ngũ huấn luyện viên tận tâm.
                  Hãy bắt đầu hành trình thay đổi bản thân ngay hôm nay!
                </p>
                <Button className="cta-button" type="primary" size="large">
                  <NavLink to="/login">Khám Phá Ngay🐧👹😏</NavLink>
                </Button>
              </Col>
              <Col xs={24} md={12} className="home-image">
                <img src={home_img} alt="Fitness motivation" loading="lazy" />
              </Col>
            </Row>
          </div>
        </section>
        {/* Product section */}
        <section className="products-section">
          <div className="container">
            <h2 className="section-title">Sản phẩm và dịch vụ</h2>
            <Row gutter={[30, 30]}>
              <Col xs={24} lg={6} className="products-intro">
                <h3 className="section-subtitle">
                  Giải pháp thể hình toàn diện
                </h3>
                <p className="products-section__description">
                  Chúng tôi mang đến cho bạn mọi thứ cần thiết để đạt được mục
                  tiêu thể hình: từ thiết bị tập luyện cao cấp, thực phẩm bổ
                  sung dinh dưỡng đến trang phục thể thao chuyên nghiệp. Tất cả
                  đều được tuyển chọn kỹ lưỡng để tối ưu hiệu quả luyện tập của
                  bạn.
                </p>
              </Col>
              <Col xs={24} lg={18}>
                <Carousel
                  arrows
                  infinite={true}
                  autoplay={{ dotDuration: true }}
                  autoplaySpeed={3000}
                  className="product-carousel"
                >
                  {carouselItems.map((item, index) => (
                    <div key={index} className="carousel-item">
                      <NavLink to={item.link}>
                        <img src={item.src} alt={item.alt} loading="lazy" />
                        <div className="carousel-caption">{item.title}</div>
                      </NavLink>
                    </div>
                  ))}
                </Carousel>
              </Col>
            </Row>
          </div>
        </section>
        {/* Excercises Section */}
        <section className="excercise-section">
          <div className="container">
            <div className="section-title"> Bài tập theo nhóm cơ </div>
            <div className="section-divider"></div>
            <div className="section-description">
              Hệ thống bài tập được phân loại theo từng nhóm cơ giúp bạn dễ dàng
              lựa chọn và tập trung phát triển các vùng cơ thể mong muốn.
            </div>
            <Row gutter={[20, 20]} className="excercise-grid">
              {sectionImages.map((item, index) => (
                <Col
                  key={index}
                  xs={24}
                  sm={12}
                  md={8}
                  className="excercise-col"
                >
                  <NavLink to={`/ExerciseDetail/${item.id}`}>
                    <img src={item.image} alt={item.alt} loading="lazy" />
                    <h3>{item.title}</h3>
                  </NavLink>
                </Col>
              ))}
            </Row>
          </div>
        </section>
      </div>
    </>
  );
}
export default Home;
