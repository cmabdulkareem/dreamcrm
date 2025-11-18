import { useState } from "react";

export default function FlipCard({ frontContent, backContent, className = "" }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`relative h-full cursor-pointer perspective-1000 ${className}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden">
          {frontContent}
        </div>
        
        {/* Back Side */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          {backContent}
        </div>
      </div>
    </div>
  );
}