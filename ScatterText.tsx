import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { motion, useMotionValue, useSpring, useAnimationFrame, animate } from "framer-motion"

// Simple deterministic random number generator
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

function ScatterItem({ 
    text, 
    index,
    totalWords,
    columns,
    rowGap,
    columnGap,
    effect, 
    animProgress,
    mouseX,
    mouseY,
    intensity, 
    fontSize,
    fontFamily,
    textColor,
    borderColor
}) {
    // Determine Grid Position
    const col = index % columns
    const row = Math.floor(index / columns)
    const totalRows = Math.ceil(totalWords / columns)
    
    // Calculate offsets from the exact center of the grid
    const baseX = (col - (columns - 1) / 2) * columnGap
    const baseY = (row - (totalRows - 1) / 2) * rowGap

    // Generate deterministic random properties based on index
    const r1 = seededRandom(index * 10 + 1)
    const r2 = seededRandom(index * 10 + 2)
    const r3 = seededRandom(index * 10 + 3)
    
    // Magnetic pull properties (how much it tries to follow mouse)
    // Increased range to -200 to 200 for dramatic scramble on hover
    const magneticPullX = (seededRandom(index * 10 + 5) - 0.5) * 400 
    const magneticPullY = (seededRandom(index * 10 + 6) - 0.5) * 400
    
    // Maximum local rotation (up to 360 degrees either direction)
    const maxLocalRot = (r3 - 0.5) * 720 

    // Motion values for smooth 60fps animation
    const x = useMotionValue(baseX)
    const y = useMotionValue(baseY)
    const r = useMotionValue(0)

    // Increased stiffness and damping for much faster movement response
    const smoothX = useSpring(x, { damping: 25, stiffness: 500 })
    const smoothY = useSpring(y, { damping: 25, stiffness: 500 })
    const smoothR = useSpring(r, { damping: 25, stiffness: 500 })

    useAnimationFrame(() => {
        const p = animProgress.get()
        const mx = mouseX.get()
        const my = mouseY.get()

        let targetX = baseX
        let targetY = baseY
        let targetRot = 0

        // Scale the grid outwards from the center based on intensity and progress
        const scaleDist = intensity * p

        if (effect === "blast") {
            // Expansion only (no rotation)
            targetX = baseX + (baseX * scaleDist)
            targetY = baseY + (baseY * scaleDist)
        } else if (effect === "rotate") {
            // Local rotation only (no expansion)
            targetRot = maxLocalRot * p
        } else if (effect === "mix") {
            // Both expansion and local rotation
            targetX = baseX + (baseX * scaleDist)
            targetY = baseY + (baseY * scaleDist)
            targetRot = maxLocalRot * p
        }

        // Apply subtle magnetic hover pull
        targetX += mx * magneticPullX
        targetY += my * magneticPullY

        x.set(targetX)
        y.set(targetY)
        r.set(targetRot)
    })

    const cornerSize = 6
    const cornerOffset = -3
    
    const CornerMark = ({ top, bottom, left, right }) => (
        <div 
            style={{
                position: "absolute",
                width: cornerSize,
                height: cornerSize,
                backgroundColor: "#fff",
                border: `1px solid ${borderColor}`,
                top, bottom, left, right,
                boxSizing: "border-box"
            }}
        />
    )

    return (
        <motion.div
            style={{
                position: "absolute",
                x: smoothX,
                y: smoothY,
                rotate: smoothR,
                zIndex: Math.floor(seededRandom(index * 10 + 7) * 100)
            }}
        >
            <motion.div
                drag
                dragConstraints={false}
                whileDrag={{ scale: 1.1, zIndex: 9999 }}
                style={{
                    position: "relative",
                    padding: "8px 12px",
                    border: `1px solid ${borderColor}`,
                    backgroundColor: "transparent",
                    color: textColor,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    transformOrigin: "center center",
                    cursor: "grab",
                }}
            >
                <CornerMark top={cornerOffset} left={cornerOffset} bottom={undefined} right={undefined} />
                <CornerMark top={cornerOffset} right={cornerOffset} bottom={undefined} left={undefined} />
                <CornerMark bottom={cornerOffset} left={cornerOffset} top={undefined} right={undefined} />
                <CornerMark bottom={cornerOffset} right={cornerOffset} top={undefined} left={undefined} />
                {text}
            </motion.div>
        </motion.div>
    )
}

export default function ScatterText(props) {
    const { 
        words, 
        columns,
        rowGap,
        columnGap,
        effect, 
        playback,
        progress, 
        intensity, 
        speed,
        fontSize,
        fontFamily,
        textColor,
        borderColor,
        style 
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const animProgress = useMotionValue(0)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const isEditor = RenderTarget.current() === RenderTarget.canvas

    React.useEffect(() => {
        if (playback === "manual" || isEditor) {
            animProgress.set(progress / 100)
        } else if (playback === "loop") {
            const controls = animate(animProgress, 1, {
                duration: 2 / speed,
                ease: "easeOut",
                repeat: Infinity,
                repeatType: "loop", 
                repeatDelay: 1 / speed 
            })
            return controls.stop
        } else if (playback === "play-once") {
            const controls = animate(animProgress, 1, {
                duration: 2 / speed,
                ease: "easeOut"
            })
            return controls.stop
        }
    }, [playback, progress, speed, isEditor])

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        
        let clientX = 0
        let clientY = 0
        
        if ("touches" in e) {
            if (e.touches.length === 0) return
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }
        
        // Map mouse position from -1 to 1 relative to center of container
        const x = ((clientX - rect.left) / rect.width) * 2 - 1
        const y = ((clientY - rect.top) / rect.height) * 2 - 1
        
        mouseX.set(x)
        mouseY.set(y)
    }

    const handlePointerLeave = () => {
        // Return to center when mouse leaves
        mouseX.set(0)
        mouseY.set(0)
    }

    return (
        <div 
            ref={containerRef}
            style={{ 
                ...style, 
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "visible"
            }}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onMouseLeave={handlePointerLeave}
            onTouchEnd={handlePointerLeave}
        >
            {words.map((word, index) => (
                <ScatterItem 
                    key={index}
                    text={word}
                    index={index}
                    totalWords={words.length}
                    columns={columns}
                    rowGap={rowGap}
                    columnGap={columnGap}
                    effect={effect}
                    animProgress={animProgress}
                    mouseX={mouseX}
                    mouseY={mouseY}
                    intensity={intensity}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    textColor={textColor}
                    borderColor={borderColor}
                />
            ))}
        </div>
    )
}

addPropertyControls(ScatterText, {
    words: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String },
        defaultValue: [
            "Software design", 
            "Craft", 
            "Interaction design", 
            "Craft", 
            "Software design", 
            "Craft",
            "Interaction design"
        ],
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 10,
        defaultValue: 3,
        displayStepper: true,
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        min: 0,
        max: 1000,
        defaultValue: 250,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        min: 0,
        max: 1000,
        defaultValue: 100,
    },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["blast", "rotate", "mix"],
        optionTitles: ["Blast (Expand)", "Rotate (Local)", "Mix (Both)"],
        defaultValue: "blast",
    },
    playback: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["manual", "loop", "play-once"],
        optionTitles: ["Manual (Slider)", "Auto Loop", "Play Once on Mount"],
        defaultValue: "loop",
    },
    progress: {
        type: ControlType.Number,
        title: "Manual Progress",
        min: 0,
        max: 100,
        defaultValue: 0,
        displayStepper: true,
        hidden(props) {
            return props.playback !== "manual"
        }
    },
    intensity: {
        type: ControlType.Number,
        title: "Blast Intensity",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 1.5,
        hidden(props) {
            return props.effect === "rotate"
        }
    },
    speed: {
        type: ControlType.Number,
        title: "Animation Speed",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 2,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 24,
        min: 10,
        max: 200,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    }
})
