import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = ({ footerData }) => {
  if (!footerData) {
    return (
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            <p>© 2026 EduSpantech - Education for the love of your life ❤️</p>
          </div>
        </div>
      </footer>
    );
  }

  const { columns, social, languages } = footerData;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {columns?.map((column, index) => (
            <div key={index} className="footer-column">
              <h4>{column.title}</h4>
              <ul>
                {column.links?.map((link, idx) => (
                  <li key={idx}>
                    <Link to={`/${link.toLowerCase().replace(/\s+/g, '')}`}>
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer-column">
            <h4>Follow Us</h4>
            <div className="footer-social">
              {social?.map((icon, index) => (
                <span key={index} className="social-icon">{icon}</span>
              ))}
            </div>
            <div className="footer-languages">
              {languages?.map((lang, index) => (
                <span key={index} className="language-tag">{lang}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {currentYear} EduSpantech - Education for the love of your life ❤️</p>
        </div>
      </div>
    </footer>
  );
};

// THIS MUST BE HERE
export default Footer;