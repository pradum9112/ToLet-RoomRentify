import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../assets/styles/featuredcards.css";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from 'swiper/modules';

import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import "swiper/css";

function FeaturedCards({ images, type }) {
  const [windowSize, setWindowSize] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowSize(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <section className="featuredopp feature-feature">
        <div className="featuredopp-container container">
          <div className="featuredopp-content">
            <h2>Some featured {type}</h2>
            <p>
              Get in these exceptional opportunities curated for the
              exceptional you!
            </p>
          </div>
          <Swiper
            spaceBetween={10}
            modules={[Autoplay, Pagination]}
            slidesPerView={
              windowSize <= 900
                ? windowSize <= 800
                  ? 1
                  : 2
                : 3
            }
            autoplay={{
              delay: 2000,
              disableOnInteraction: true,
            }}
            loop={true}
            speed={800}
          >
            {images.map((data) => {
              // Per Night Pricing with 10% Discount Math
              const basePrice = Number(data.price) || 0;
              const discount = Math.round(basePrice * 0.10);
              const discountedPrice = basePrice - discount;

              return (
                <SwiperSlide key={data._id}>
                  <Link to={`/detail/${data._id}`}>
                    <div className="featureopp-card">
                      <div className="featureopp-card-img">
                        <img 
                          src={data.photos && data.photos.length > 0 ? data.photos[0] : ""} 
                          alt={data.title || "featured item"} 
                        />
                      </div>
                      <div className="featureopp-card-content">
                        <h4>{data.title}</h4>
                        <h5>{data.address}</h5>
                        
                        {/* Per Night Price Display with 10% Discount */}
                        <div className="d-flex flex-row align-items-center mb-1">
                          {/* Discounted Price */}
                          <h4 className="me-1">₹{discountedPrice}</h4>
                          
                          {/* Original Base Price Cut-through */}
                          <span className="text-danger">
                            <s>₹{basePrice}</s>
                          </span>
                          
                          {/* Always Per Night */}
                          <h4>&nbsp;per night</h4>
                        </div>

                        {/* 10% Off Badge */}
                        <div 
                          className="small font-weight-bold" 
                          style={{ color: "#2e7d32", fontWeight: "bold" }}
                        >
                          10% OFF Applied
                        </div>

                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </section>
    </div>
  );
}

export default FeaturedCards;