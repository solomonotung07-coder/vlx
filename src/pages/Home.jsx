import { Link } from "react-router-dom";
import GradientText from "../components/GradientText";
import Plasma from "../components/Plasma";
import Silk from "../components/Silk";
import SpotlightCard from "../components/SpotlightCard";
import useRentals from "../hooks/useRentals";

const buildRentalMessage = (item) =>
  `Hello, I would like to rent the ${item.name} (${item.price}) from your website.`;

const Home = () => {
  const { rentals, loading, error } = useRentals();

  return (
    <div className="sectionContainer" id="top">
      <div className="heroSection" id="borderRightLeft">
        <div className="orbBackground">
          <Plasma
            color="#c7d9dd"
            speed={4.5}
            direction="forward"
            scale={1.8}
            opacity={0.3}
            mouseInteractive={true}
          />
        </div>

        <div className="heroContent">
          <GradientText
            colors={[
              "#4792c2",
              "#4A1942",
              "#0F766E",
              " #1E3A5F",
              "#2A2A2A",
              "#0F766E",
            ]}
            animationSpeed={6}
            showBorder={false}
            className="custom-class"
          >
            <h1 id="eventTheme">
              <span className="eventThemeLine">Media And Production Gear</span>
              <span className="eventThemeLine">For Every Vision</span>
            </h1>
          </GradientText>
          <div className="eventTitleContainer">
            <p>
              Access industry-standard cinema cameras, premium optics, and
              professional lighting kits from the world's most trusted
              production marketplace.
            </p>
          </div>
          <div className="heroTags">
            <div className="heroTagsCard">4K Cinema Cameras</div>
            <div className="heroTagsCard">Pro Lighting Gear</div>
            <div className="heroTagsCard">Premium Lens Kits</div>
            <div className="heroTagsCard">Live Streaming</div>
            <div className="heroTagsCard">Event Production</div>
          </div>
        </div>
      </div>
      <div className="subThemeSection" data-section>
        <div className="orbBackground">
          <Silk
            speed={15}
            scale={8.75}
            color="#f7f9fa"
            noiseIntensity={0.4}
            rotation={0}
          />
        </div>
        <div className="subThemeSectionHeaderWrapper">
          <h1 className="subThemeSectionHeader">Featured Rentals</h1>
          <h3 className="subThemeSectionSubHeader">
            Ready for immediate dispatch from our flagship hubs.
          </h3>
        </div>

        <div className="cards-container" aria-busy={loading}>
          {loading &&
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="rental-card-skeleton" aria-hidden="true" />
            ))}

          {!loading &&
            rentals.map((item) => (
              <SpotlightCard
                key={item.id}
                className="custom-spotlight-card"
                spotlightColor="#b4c3d0"
              >
                <div className="rental-card-inner">
                  <div className="rental-card-media">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="rental-card-image"
                      style={item.imageStyle}
                      loading="lazy"
                    />
                  </div>
                  <h3 className="rental-card-title">{item.name}</h3>
                  <p className="rental-card-price">{item.price}</p>
                  <a
                    href={`${item.whatsapp}?text=${encodeURIComponent(
                      buildRentalMessage(item),
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rental-card-button"
                  >
                    Rent Now
                  </a>
                </div>
              </SpotlightCard>
            ))}
        </div>

        {!loading && rentals.length === 0 && (
          <p className="rental-cards-message">
            {error
              ? "We couldn’t load our rentals right now. "
              : "New gear is on the way. "}
            <a
              href="https://wa.me/2349051376816"
              target="_blank"
              rel="noreferrer"
            >
              Chat with us on WhatsApp
            </a>{" "}
            for what’s available today.
          </p>
        )}
      </div>

      <div className="servicesSection" id="our-services" data-section>
        <div className="servicesSectionContent">
          <div className="servicesSectionHeaderWrapper">
            <h2 className="servicesSectionHeader">Our Services</h2>
            <p className="servicesSectionSubHeader">
              Tailored production support for creators, agencies, and studios
              that need premium gear with zero hassle.
            </p>
          </div>

          <div className="servicesGrid">
            <div className="serviceCard">
              <h3>Media Production Services</h3>
              <p>
                We provide end-to-end media production services, from capturing
                stunning visuals to live broadcasting and strategic content
                management, helping your brand tell impactful stories.
              </p>
              <Link
                target="_blank"
                to="https://wa.me/2349051376816"
                className="serviceCardLearnMore"
              >
                Book Now <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="serviceCard">
              <h3>Rental Service </h3>
              <p>
                Get access to top-quality cameras, lighting, sound, and
                production gear and everything you need for a professional shoot
                or event.
              </p>
              <Link
                target="_blank"
                to="https://wa.me/2349051376816"
                className="serviceCardLearnMore"
              >
                Book Now <span aria-hidden="true">→</span>
              </Link>
            </div>
            {/* <div className="serviceCard">
              <h3>Live-Streaming</h3>
              <p>
                Broadcasting your events in real time with crystal-clear video
                and sound, connecting you to audiences anywhere in the world.
              </p>
              <Link to="/our-services" className="serviceCardLearnMore">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="serviceCard">
              <h3>Content Management</h3>
              <p>
                Planning, organizing, and publishing your content effectively,
                ensuring your brand stays consistent, visible, and impactful.
              </p>
              <Link to="/our-services" className="serviceCardLearnMore">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="serviceCard">
              <h3>Rentals</h3>
              <p>
                Get access to top-quality cameras, lighting, sound, and
                production gear and everything you need for a professional shoot
                or event.
              </p>
              <Link to="/our-services" className="serviceCardLearnMore">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div> */}
          </div>
        </div>
      </div>

      <div className="servicesSection" id="about" data-section>
        <div className="servicesSectionContent">
          <div className="servicesSectionHeaderWrapper">
            <h2 className="servicesSectionHeader">About Us</h2>
            <div className="aboutBody">
              <div className="paraText">
                Virelix Limited is a creative media company specializing in
                events live streaming, professional photography, and video
                editing. We help you capture and share your special moments with
                high-quality visuals, seamless coverage, and engaging content.
              </div>
              <div className="paraText">
                Whether it’s corporate events, weddings, church programs, or
                private celebrations, our team ensures every detail is
                documented and delivered with excellence. We are equipped to
                serve government agencies, international institutions, and
                development organisations with professional, results-oriented
                media and communication services.
              </div>
            </div>
          </div>

          <div className="aboutStoryLayout">
            <div className="aboutStoryPanel">
              <p className="aboutStoryLabel">Who We Are</p>
              <h3>We turn ideas into polished visual experiences.</h3>
              <p>
                Virelix Limited brings together creativity, technical precision,
                and dependable execution to shape memorable moments for brands,
                events, and audiences.
              </p>
            </div>
            <div className="aboutStoryPanel aboutStoryPanelAlt">
              <p className="aboutStoryLabel">Why Choose Us</p>
              <h3>Because calm planning creates exceptional results.</h3>
              <p>
                From premium equipment to seamless delivery, we make complex
                productions feel effortless so your team can focus on the bigger
                picture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
