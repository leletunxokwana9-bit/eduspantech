import React, { useState, useEffect } from 'react';
import { useHomeData } from '../../../hooks/useHomeData';
import './Testimonials.css';

const Testimonials = () => {
  const { data, loading, error } = useHomeData();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => 
        prev === (data?.testimonials?.items?.length - 1) ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [data]);

  if (loading) return <div className="testimonials-loading">Loading...</div>;
  if (error) return <div className="testimonials-error">Error loading data</div>;
  if (!data) return <div className="testimonials-empty">No data available</div>;

  const testimonials = data?.testimonials?.items || [];

  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <span className="testimonials-badge">💬 Testimonials</span>
          <h2>{data?.testimonials?.title || 'What Our Students Say'}</h2>
          <p>{data?.testimonials?.subtitle || 'Hear from students who transformed their math skills'}</p>
        </div>
        <div className="testimonials-carousel">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className={`testimonial-slide ${index === currentIndex ? 'active' : ''}`}
            >
              <div className="testimonial-card">
                <div className="testimonial-avatar">{testimonial.avatar}</div>
                <div className="testimonial-rating">{'⭐'.repeat(testimonial.rating)}</div>
                <p className="testimonial-review">"{testimonial.review}"</p>
                <h4 className="testimonial-name">{testimonial.name}</h4>
                <span className="testimonial-country">{testimonial.country}</span>
              </div>
            </div>
          ))}
          <button className="carousel-btn prev" onClick={goToPrev}>‹</button>
          <button className="carousel-btn next" onClick={goToNext}>›</button>
        </div>
        <div className="carousel-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;