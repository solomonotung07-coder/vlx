import { Link } from "react-router-dom";
import Silk from "../components/Silk";

const Footer = () => {
  return (
    <footer className="site-footer" id="borderRightLeft">
      <div className="site-footer-bg" aria-hidden="true">
        <Silk
          speed={14}
          scale={8.75}
          color="#f7f9fa"
          noiseIntensity={0.45}
          rotation={0}
        />
      </div>

      <div className="site-footer-inner">
        {/* Brand Section */}
        <div className="footer-brand">
          <div className="footer-brand-header">
            <img
              src="/logo/vlxlogo.png"
              alt="Virlix Limited"
              className="footerImage"
            />
          </div>
          <p className="brand-description">
            Bringing together creativity, technical precision, and dependable
            execution to shape memorable moments for brands, events, and
            audiences.
          </p>
          <div className="social-icons">
            <a
              href="https://www.facebook.com/share/18ARrfyUqs/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/facebook.png"
                alt="Facebook"
                className="social-icon-img"
              />
            </a>
            <a
              href="https://www.instagram.com/vlx_ltd?igsh=MTdvb2VuY2c3bmFyeA%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/instagram.png"
                alt="Instagram"
                className="social-icon-img"
              />
            </a>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="footer-column">
          <h4 className="column-heading">Quick Links</h4>
          <ul className="footer-links">
            <li>
              <a href="#top">Home</a>
            </li>
            <li>
              <a href="#our-services">Our Services</a>
            </li>
            <li>
              <a href="#about">About</a>
            </li>
          </ul>
        </div>

        {/* Our Services Section */}
        <div className="footer-column">
          <h4 className="column-heading">Our Services</h4>
          <ul className="footer-links">
            <li>
              <Link target="_blank" to="https://wa.me/2349051376816">
                Photography
              </Link>
            </li>
            <li>
              <Link target="_blank" to="https://wa.me/2349051376816">
                Videography{" "}
              </Link>
            </li>
            <li>
              <Link target="_blank" to="https://wa.me/2349051376816">
                Content Management
              </Link>
            </li>
            <li>
              <Link target="_blank" to="https://wa.me/2349051376816">
                Rental Service
              </Link>
            </li>
            <li>
              <Link target="_blank" to="https://wa.me/2349051376816">
                Live-Streaming
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Us Section */}
        <div className="footer-column">
          <h4 className="column-heading">Contact Us</h4>
          <ul className="contact-list">
            <li className="contact-item">
              <img src="/email.png" alt="Email" className="contact-icon" />
              <span className="contact-text">
                <a href="mailto:info@acmebusiness.com">info@acmebusiness.com</a>
              </span>
            </li>
            <li className="contact-item">
              <img src="/call.png" alt="Phone" className="contact-icon" />
              <span className="contact-text">
                <a href="tel:+2349051376816">+234 905 137 6816 </a> <br />
                <a href="tel:+2347030562365">+234 703 056 2365</a>
              </span>
            </li>
            <li className="contact-item">
              <img src="/address.png" alt="Address" className="contact-icon" />
              <span className="contact-text">
                Federal Capital Territory (F.C.T), Abuja, Nigeria.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Section */}
      <div className="site-footer-bottom">
        <p className="copyright-text">
          © {new Date().getFullYear()} Virelix Limited. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
