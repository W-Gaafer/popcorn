import { useState } from "react";
import PropTypes from "prop-types";

const containerStyle = { display: "flex", alignItems: "center", gap: "15px" };
const starContainerStyle = { display: "flex" };

StarRating.propTypes = {
  maxRating: PropTypes.number,
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string,
  messages: PropTypes.array,
  defaultRating: PropTypes.number,
};
export default function StarRating({
  maxRating = 3,
  size = 10,
  color = "#000",
  className = "",
  messages = [],
  defaultRating = 0,
  userRating,
  setUserRating,
}) {
  const [tempRate, setTempRate] = useState(defaultRating);
  const textStyle = {
    lineHeight: "1",
    margin: "0",
    fontSize: `${size}px`,
    color: `${color}`,
  };
  return (
    <div className={className} style={containerStyle}>
      <div style={starContainerStyle}>
        {Array.from({ length: maxRating }, (_, i) => (
          <Star
            key={i}
            handleRate={() => setUserRating(i + 1)}
            full={tempRate ? tempRate > i : userRating > i}
            mouseHoverIn={() => setTempRate(i + 1)}
            mouseHoverOut={() => setTempRate(0)}
            size={size}
            color={"orange"}
          />
        ))}
      </div>
      <p style={textStyle}>
        {messages.length === maxRating
          ? tempRate
            ? messages[tempRate - 1]
            : messages[userRating - 1]
          : tempRate || userRating || ""}
      </p>
    </div>
  );
}

function Star({ handleRate, full, mouseHoverIn, mouseHoverOut, size, color }) {
  const starStyle = {
    width: `${size}px`,
    height: `${size}px`,
    display: "block",
    cursor: "pointer",
  };
  return (
    <>
      {full ? (
        <span
          role="button"
          style={starStyle}
          onClick={handleRate}
          onMouseEnter={mouseHoverIn}
          onMouseLeave={mouseHoverOut}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill={color}
            stroke={color}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      ) : (
        <span
          role="button"
          style={starStyle}
          onClick={handleRate}
          onMouseEnter={mouseHoverIn}
          onMouseLeave={mouseHoverOut}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </span>
      )}
    </>
  );
}
