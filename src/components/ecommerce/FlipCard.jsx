import { useState } from "react";

export default function FlipCard({ frontContent, backContent, className = "" }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`relative cursor-pointer perspective-1000 h-full w-full ${className}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div className="relative w-full h-full backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
          {frontContent}
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {backContent}
        </div>
      </div>
    </div>
  );
}