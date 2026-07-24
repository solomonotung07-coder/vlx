import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      const clickedInsidePanel = panelRef.current?.contains(event.target);
      const clickedToggleButton = toggleRef.current?.contains(event.target);

      if (!clickedInsidePanel && !clickedToggleButton) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <div className="navSectionContainer" id="borderBottom">
      <div className="navLayout">
        <NavLink to="/" onClick={() => setIsOpen(false)}>
          <img
            src="/logo/vlxlogo.png"
            alt="Virlix Limited"
            className="navImage"
          />
        </NavLink>

        <div className="navLink desktopNav">
          <ul className="navLinkItems" id="mainLinks">
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

        <div className="navLinkRight desktopNav">
          <ul className="navLinkItems socialLinks">
            <li>
              <a
                href="https://www.facebook.com/share/18ARrfyUqs/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="socialNavIcon"
                aria-label="Visit our Facebook page"
              >
                <img src="/facebook.png" alt="Facebook" />
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/vlx_ltd?igsh=MTdvb2VuY2c3bmFyeA%3D%3D&utm_source=qr"
                target="_blank"
                rel="noreferrer"
                className="socialNavIcon"
                aria-label="Visit our Instagram page"
              >
                <img src="/instagram.png" alt="Instagram" />
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@vlx.com"
                className="socialNavIcon"
                aria-label="Send us an email"
              >
                <img src="/email.png" alt="Email" />
              </a>
            </li>
          </ul>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="navMenuButton"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span aria-hidden="true">⋯</span>
        </button>

        <div
          className={`mobileNavOverlay ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        <div
          ref={panelRef}
          className={`mobileNavPanel ${isOpen ? "open" : ""}`}
        >
          <div className="mobileNavPanelHeader">
            <span>Menu</span>
            <button
              type="button"
              className="mobileNavClose"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
            >
              ×
            </button>
          </div>

          <ul className="mobileNavLinks">
            <li>
              <a href="#top" onClick={() => setIsOpen(false)}>
                Home
              </a>
            </li>
            <li>
              <a href="#our-services" onClick={() => setIsOpen(false)}>
                Our Services
              </a>
            </li>
            <li>
              <a href="#about" onClick={() => setIsOpen(false)}>
                About
              </a>
            </li>
          </ul>

          <div className="mobileNavSocials">
            <a
              href="https://www.facebook.com/share/18ARrfyUqs/?mibextid=wwXIfr"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit our Facebook page"
            >
              <img src="/facebook.png" alt="Facebook" />
            </a>
            <a
              href="https://www.instagram.com/vlx_ltd?igsh=MTdvb2VuY2c3bmFyeA%3D%3D&utm_source=qr"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit our Instagram page"
            >
              <img src="/instagram.png" alt="Instagram" />
            </a>
            <a href="mailto:hello@vlx.com" aria-label="Send us an email">
              <img src="/email.png" alt="Email" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
