import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

export default function BrushTransition(props) {
    const { 
        isOpen, 
        color, 
        speed, 
        direction,
        splatter, 
        style 
    } = props
    
    const isLTR = direction === "left-to-right"
    
    // We make the container 200vw wide so it has plenty of room to slide across
    // the screen without the rough edge clipping prematurely.
    const initialX = 0
    const targetX = isLTR ? "200vw" : "-200vw"
    
    // A unique ID for the filter to avoid conflicts if multiple components exist
    const filterId = React.useId() + "-exact-brush-filter"

    return (
        <div 
            style={{ 
                ...style, 
                width: "100%", 
                height: "100%", 
                position: "absolute",
                top: 0, 
                left: 0,
                // Only block clicks when the transition is active
                pointerEvents: isOpen ? "auto" : "none",
                zIndex: 9999,
                overflow: "hidden" // Ensure we don't bleed out of the Framer canvas
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    // Make it taller than the screen to hide the top/bottom displaced edges
                    top: "-20vh", 
                    height: "140vh",
                    width: "200vw",
                    // Start completely offscreen
                    left: isLTR ? "-200vw" : "100vw",
                }}
                initial={{ x: initialX }}
                animate={{ x: isOpen ? targetX : initialX }}
                transition={{
                    duration: speed,
                    ease: [0.16, 1, 0.3, 1] // Custom smooth easing (Expo Out)
                }}
            >
                <svg 
                    width="100%" 
                    height="100%" 
                    preserveAspectRatio="none"
                >
                    <defs>
                        <filter 
                            id={filterId}
                            // Give the filter plenty of room to bleed horizontally
                            x="-20%" y="0%" width="140%" height="100%"
                            colorInterpolationFilters="sRGB"
                        >
                            {/* Anisotropic noise: Very low frequency on X (long streaks), high on Y (rough edges) */}
                            <feTurbulence 
                                type="fractalNoise" 
                                baseFrequency="0.005 0.15" 
                                numOctaves="4" 
                                result="noise" 
                            />
                            <feDisplacementMap 
                                in="SourceGraphic" 
                                in2="noise" 
                                scale={splatter} 
                                xChannelSelector="R" 
                                yChannelSelector="G" 
                            />
                        </filter>
                    </defs>

                    {/* 
                        If Left-to-Right: Draw a solid box on the left half, overlapping the midpoint.
                        If Right-to-Left: Draw a solid box on the right half, overlapping the midpoint.
                    */}
                    <rect 
                        x={isLTR ? "0" : "45%"} 
                        y="0" 
                        width="55%" 
                        height="100%" 
                        fill={color} 
                        filter={`url(#${filterId})`} 
                    />
                    
                    {/* An inner safe-zone rect to ensure the very back doesn't get distorted into a gap */}
                    <rect 
                        x={isLTR ? "0" : "55%"} 
                        y="0" 
                        width="45%" 
                        height="100%" 
                        fill={color} 
                    />
                </svg>
            </motion.div>
        </div>
    )
}

BrushTransition.defaultProps = {
    isOpen: true,
    color: "#000000",
    speed: 0.8,
    direction: "left-to-right",
    splatter: 250,
}

addPropertyControls(BrushTransition, {
    isOpen: {
        type: ControlType.Boolean,
        title: "Is Open",
        defaultValue: true,
    },
    color: {
        type: ControlType.Color,
        title: "Ink Color",
        defaultValue: "#000000",
    },
    speed: {
        type: ControlType.Number,
        title: "Wipe Speed",
        min: 0.1,
        max: 3.0,
        step: 0.1,
        defaultValue: 0.8,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left-to-right", "right-to-left"],
        optionTitles: ["Left to Right", "Right to Left"],
        defaultValue: "left-to-right",
    },
    splatter: {
        type: ControlType.Number,
        title: "Bristle Length",
        min: 0,
        max: 500,
        defaultValue: 250,
    }
})
