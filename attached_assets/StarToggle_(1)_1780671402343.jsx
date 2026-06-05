import { useState } from "react";

const StarToggle = ({ onChange }) => {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    const next = !active;
    setActive(next);
    onChange?.(next);
  };

  return (
    <button
      onClick={handleClick}
      aria-pressed={active}
      aria-label="Toggle view"
      style={{
        background: "none",
        border: "none",
        padding: "4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        transition: "transform 0.1s",
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1.15)")}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer 4-point star */}
        <path
          d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
          fill={active ? "#fff" : "none"}
          stroke="#fff"
          strokeWidth={active ? "0" : "0.9"}
          strokeLinejoin="round"
          style={{ transition: "fill 0.15s, stroke-width 0.15s" }}
        />
        {/* Inner subtle star — visible only when active */}
        <path
          d="M12 6 L12.8 11.2 L18 12 L12.8 12.8 L12 18 L11.2 12.8 L6 12 L11.2 11.2 Z"
          fill="none"
          stroke="#fff"
          strokeWidth={active ? "0.5" : "0"}
          opacity="0.4"
          style={{ transition: "stroke-width 0.15s" }}
        />
      </svg>
    </button>
  );
};


/* ── Demo: star toggle controlling a container ── */
export default function App() {
  const [active, setActive] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        background: "#1a1a2e",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        padding: "24px",
        width: "280px",
        position: "relative",
      }}>
        {/* Star toggle in top-right corner */}
        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
          <StarToggle onChange={setActive} />
        </div>

        {/* Content swaps based on toggle */}
        <div style={{ color: "#fff", minHeight: "80px" }}>
          {active ? (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                Option 2
              </p>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 500 }}>
                $149 / mo
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                Annual billing
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                Option 1
              </p>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 500 }}>
                $19 / mo
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                Monthly billing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
