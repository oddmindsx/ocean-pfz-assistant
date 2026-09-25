import { useState } from "react";
import "./index.css";

type Theme = "bright" | "dark";

type UserProfile = {
  name: string;
  profession: string;
  frequency: string;
  interests: string[];
  location: string;
};

const professions = [
  { icon: "🎣", label: "Fisherman" },
  { icon: "🔭", label: "Observer" },
  { icon: "🔬", label: "Researcher" },
  { icon: "⚓", label: "Marine Navy" },
  { icon: "🏛", label: "Coastal Authority" },
  { icon: "◉", label: "Other" },
];

const frequencies = [
  "Daily",
  "Several times a week",
  "Occasionally",
  "Rarely",
];

const interests = [
  "Fishing zones",
  "Sea safety",
  "Weather",
  "Tides",
  "Marine life",
  "Ocean conditions",
  "Marine alerts",
];

const quickActions = [
  {
    icon: "🐟",
    title: "Find fishing zones",
    text: "Discover recommended PFZ near you",
  },
  {
    icon: "🛟",
    title: "Check sea safety",
    text: "Understand today's sea conditions",
  },
  {
    icon: "☁️",
    title: "Weather & sea",
    text: "View weather, waves and wind",
  },
  {
    icon: "🐋",
    title: "Marine life",
    text: "Explore nearby marine life",
  },
];

function App() {
  const [theme, setTheme] = useState<Theme>("bright");
  const [onboarding, setOnboarding] = useState(true);
  const [step, setStep] = useState(1);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    profession: "",
    frequency: "",
    interests: [],
    location: "",
  });

  const [message, setMessage] = useState("");

  const toggleInterest = (interest: string) => {
    setProfile((current) => {
      const exists = current.interests.includes(interest);

      if (exists) {
        return {
          ...current,
          interests: current.interests.filter((item) => item !== interest),
        };
      }

      if (current.interests.length >= 3) {
        return current;
      }

      return {
        ...current,
        interests: [...current.interests, interest],
      };
    });
  };

  const nextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      setOnboarding(false);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setProfile((current) => ({
        ...current,
        location: "Location unavailable",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        /*
         * IMPORTANT:
         * We intentionally don't reverse-geocode the coordinates here.
         * Later this will connect to the real location service.
         */
        setProfile((current) => ({
          ...current,
          location: "Current location detected",
        }));
      },
      () => {
        setProfile((current) => ({
          ...current,
          location: "Location permission denied",
        }));
      }
    );
  };

  const submitMessage = () => {
    if (!message.trim()) return;

    setMessage("");
  };

  return (
    <div className={`app ${theme}`}>

      {/* Decorative background */}
      <div className="decor decor-flower flower-one">✿</div>
      <div className="decor decor-flower flower-two">✿</div>
      <div className="decor decor-dots dots-one">•••••••••</div>
      <div className="decor decor-dots dots-two">•••••••••</div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <header className="navbar">

        <div className="brand">
          <div className="brand-logo">
            ◒
          </div>

          <div>
            <h1>MANTHAN</h1>
            <span>Marine Intelligence</span>
          </div>
        </div>

        <nav className="nav-links">
          <button className="active">Chat</button>
          <button>Map</button>
          <button>Advisories</button>
          <button>Marine Life</button>
          <button>About</button>
        </nav>

        <div className="nav-actions">

          <button className="location-pill">
            📍
            <span>{profile.location || "Kerala Coast"}</span>
           ⌄
          </button>

          <button
            className="theme-switch"
            onClick={() =>
              setTheme(theme === "bright" ? "dark" : "bright")
            }
          >
            <span className={theme === "bright" ? "selected" : ""}>
              ☀
            </span>

            <span className={theme === "dark" ? "selected" : ""}>
              ☾
            </span>
          </button>

          <button className="profile-button">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "○"}
          </button>

        </div>

      </header>


      {/* =====================================================
          ONBOARDING
      ===================================================== */}

      {onboarding ? (

        <main className="onboarding">

          <div className="onboarding-art">

            <div className="sun" />

            <div className="art-title">
              <span>WELCOME TO</span>
              <h2>MANTHAN</h2>
              <p>
                Understand the ocean.
                <br />
                Navigate it wisely.
              </p>
            </div>

            <div className="ocean-art">

              <div className="wave wave-one" />
              <div className="wave wave-two" />
              <div className="wave wave-three" />

              <div className="fish-art">
                🐟
              </div>

              <div className="shell-art">
                🐚
              </div>

              <div className="flower-art">
                ✿
              </div>

            </div>

          </div>


          <div className="onboarding-card">

            <div className="progress">

              {[1, 2, 3, 4, 5].map((number) => (
                <div
                  key={number}
                  className={`progress-item ${
                    number <= step ? "active" : ""
                  }`}
                >
                  <span>{number}</span>

                  {number !== 5 && <i />}
                </div>
              ))}

            </div>


            {/* STEP 1 */}
            {step === 1 && (
              <div className="step-content">

                <span className="step-label">
                  LET'S GET STARTED
                </span>

                <h2>What should we call you?</h2>

                <p>
                  MANTHAN can personalize your ocean
                  experience around you.
                </p>

                <label>Your name</label>

                <input
                  autoFocus
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter your name"
                />

              </div>
            )}


            {/* STEP 2 */}
            {step === 2 && (
              <div className="step-content">

                <span className="step-label">
                  ABOUT YOU
                </span>

                <h2>What do you do?</h2>

                <p>
                  This helps us show you information
                  that actually matters.
                </p>

                <div className="choice-grid">

                  {professions.map((profession) => (
                    <button
                      key={profession.label}
                      className={`choice ${
                        profile.profession === profession.label
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          profession: profession.label,
                        })
                      }
                    >
                      <span>{profession.icon}</span>
                      {profession.label}
                    </button>
                  ))}

                </div>

              </div>
            )}


            {/* STEP 3 */}
            {step === 3 && (
              <div className="step-content">

                <span className="step-label">
                  YOUR ROUTINE
                </span>

                <h2>How often do you go to sea?</h2>

                <p>
                  We'll use this to personalize your
                  recommendations.
                </p>

                <div className="vertical-choices">

                  {frequencies.map((frequency) => (
                    <button
                      key={frequency}
                      className={`large-choice ${
                        profile.frequency === frequency
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          frequency,
                        })
                      }
                    >
                      <span>
                        {frequency === "Daily"
                          ? "◉"
                          : frequency === "Several times a week"
                          ? "◌"
                          : frequency === "Occasionally"
                          ? "◍"
                          : "○"}
                      </span>

                      {frequency}
                    </button>
                  ))}

                </div>

              </div>
            )}


            {/* STEP 4 */}
            {step === 4 && (
              <div className="step-content">

                <span className="step-label">
                  PERSONALIZE
                </span>

                <h2>What matters most to you?</h2>

                <p>
                  Choose up to 3 things you want
                  MANTHAN to prioritize.
                </p>

                <div className="interest-grid">

                  {interests.map((interest) => (
                    <button
                      key={interest}
                      className={`interest ${
                        profile.interests.includes(interest)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {profile.interests.includes(interest)
                        ? "✓"
                        : "+"}

                      {interest}
                    </button>
                  ))}

                </div>

              </div>
            )}


            {/* STEP 5 */}
            {step === 5 && (
              <div className="step-content location-step">

                <span className="step-label">
                  ONE LAST THING
                </span>

                <div className="location-illustration">
                  📍
                </div>

                <h2>Where are you?</h2>

                <p>
                  Your location helps MANTHAN show
                  nearby fishing zones, marine conditions
                  and safety information.
                </p>

                <button
                  className="location-button"
                  onClick={useLocation}
                >
                  📍 Use my current location
                </button>

                {profile.location && (
                  <div className="location-success">
                    ✓ {profile.location}
                  </div>
                )}

                <button className="manual-location">
                  Enter location manually
                </button>

              </div>
            )}


            <div className="step-footer">

              {step > 1 ? (
                <button
                  className="secondary-button"
                  onClick={previousStep}
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                className="primary-button"
                onClick={nextStep}
              >
                {step === 5 ? "Enter MANTHAN" : "Continue →"}
              </button>

            </div>

          </div>

        </main>

      ) : (

        /* =====================================================
           DASHBOARD
        ===================================================== */

        <main className="dashboard">

          {/* LEFT CHAT PANEL */}

          <section className="chat-panel">

            <div className="chat-heading">

              <span className="tiny-label">
                MARINE ADVISOR
              </span>

              <h2>
                Hello {profile.name || "there"}! 👋
              </h2>

              <p>
                What would you like to understand
                about the ocean today?
              </p>

            </div>


            <div className="quick-actions">

              {quickActions.map((action) => (
                <button
                  className="quick-action"
                  key={action.title}
                  onClick={() =>
                    setMessage(action.title)
                  }
                >

                  <span className="action-icon">
                    {action.icon}
                  </span>

                  <span>
                    <strong>{action.title}</strong>
                    <small>{action.text}</small>
                  </span>

                  <b>→</b>

                </button>
              ))}

            </div>


            <div className="chat-area">

              <div className="chat-message assistant">

                <div className="assistant-icon">
                  ≋
                </div>

                <div>
                  <span className="message-name">
                    MANTHAN
                  </span>

                  <p>
                    I can help you explore fishing zones,
                    sea safety, weather, ocean conditions
                    and marine life.
                  </p>
                </div>

              </div>

            </div>


            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                submitMessage();
              }}
            >

              <input
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Ask about the ocean..."
              />

              <button type="submit">
                →
              </button>

            </form>

            <div className="language-row">
              🌐 English
              <span>⌄</span>
              <span>•</span>
              <span>Indian regional languages</span>
            </div>

          </section>


          {/* MAP */}

          <section className="map-panel">

            <div className="map-toolbar">

              <button>
                ◈ Layers
              </button>

              <button>
                ⌖ My location
              </button>

            </div>


            <div className="map-real-placeholder">

              <div className="map-coast" />

              <div className="map-label arabian">
                ARABIAN SEA
              </div>

              <div className="map-label kochi">
                ● Kochi
              </div>

              <div className="map-pfz">

                <div>
                  🐟
                </div>

                <strong>
                  Recommended PFZ
                </strong>

                <small>
                  Nearby fishing zone
                </small>

              </div>

              <div className="map-user">
                ●
              </div>

              <div className="map-vessel vessel-one">
                ⛵
              </div>

              <div className="map-vessel vessel-two">
                ⛵
              </div>

              <div className="map-compass">
                N
                <span>▲</span>
              </div>

              <div className="map-scale">
                ─────────
                <small>50 km</small>
              </div>

              <div className="map-note">
                <strong>Map preview</strong>
                <span>
                  Live geospatial layers will be connected next.
                </span>
              </div>

            </div>


            {/* CONDITIONS */}

            <div className="condition-row">

              <Condition
                icon="🌡"
                title="Sea Surface Temp."
                value="28.4°C"
                status="Favourable"
                type="orange"
              />

              <Condition
                icon="🌿"
                title="Chlorophyll-a"
                value="1.72 mg/m³"
                status="High"
                type="green"
              />

              <Condition
                icon="🌊"
                title="Wave Height"
                value="1.4 m"
                status="Moderate"
                type="blue"
              />

              <Condition
                icon="≋"
                title="Wind"
                value="14 km/h NE"
                status="Light"
                type="yellow"
              />

            </div>


            {/* LOWER INFORMATION */}

            <div className="map-information">

              <div className="why-card">

                <div className="why-heading">
                  <h3>Why this recommendation?</h3>
                  <span>✦</span>
                </div>

                <div className="reason-grid">

                  <Reason
                    icon="🌡"
                    title="SST Gradient"
                    text="Thermal patterns can indicate productive waters."
                  />

                  <Reason
                    icon="🌿"
                    title="Chlorophyll"
                    text="Higher concentration can indicate biological productivity."
                  />

                  <Reason
                    icon="🌊"
                    title="Sea conditions"
                    text="Wave and wind conditions are considered."
                  />

                  <Reason
                    icon="📍"
                    title="Location"
                    text="Analysis is centered around your current location."
                  />

                </div>

              </div>


              <div className="data-status">

                <span>DATA STATUS</span>

                <strong>
                  Marine information
                </strong>

                <p>
                  Sources and timestamps will be
                  displayed with each dataset.
                </p>

                <div className="live-indicator">
                  ● System ready
                </div>

              </div>

            </div>

          </section>

        </main>

      )}

    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Condition({
  icon,
  title,
  value,
  status,
  type,
}: {
  icon: string;
  title: string;
  value: string;
  status: string;
  type: string;
}) {
  return (
    <div className={`condition condition-${type}`}>

      <div className="condition-icon">
        {icon}
      </div>

      <div className="condition-content">

        <span>{title}</span>

        <strong>{value}</strong>

        <small>{status}</small>

      </div>

      <div className="mini-wave">
        ∿∿∿
      </div>

    </div>
  );
}


function Reason({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="reason">

      <div className="reason-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>

    </div>
  );
}

export default App;
