import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { motion, useMotionValue, useSpring, useAnimationFrame, animate, useTransform } from "framer-motion"

// --- Helper Components ---

function AnimatedNumber({ value }) {
    const num = useMotionValue(0)
    
    React.useEffect(() => {
        // Reset to 0 and animate to the new value whenever it changes
        num.set(0)
        const controls = animate(num, value, { duration: 2, ease: "easeOut" })
        return controls.stop
    }, [value])
    
    // Format the number to always have 2 digits (e.g. 01, 02)
    const displayStr = useTransform(num, (v) => {
        const rounded = Math.round(v)
        return rounded < 10 ? `0${rounded}` : rounded.toString()
    })
    
    return <motion.span>{displayStr}</motion.span>
}

// Infinite scrolling marquee for LED screen
function MarqueeText({ text, color, fontSize, speed = 20 }) {
    const x = useMotionValue(0)

    useAnimationFrame((time, delta) => {
        // Move left by speed pixels per second
        const movement = (speed * delta) / 1000
        let newX = x.get() - movement
        // Reset when it goes far left
        if (newX < -150) newX = 150 
        x.set(newX)
    })

    return (
        <div style={{
            position: "relative",
            width: "100%",
            height: 40,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            background: "#050505",
            borderRadius: 4,
            boxShadow: "inset 0px 0px 10px rgba(0,0,0,0.8)"
        }}>
            <motion.div style={{
                position: "absolute",
                x: x,
                whiteSpace: "nowrap",
                fontFamily: "'Courier New', Courier, monospace",
                fontWeight: "bold",
                fontSize: fontSize,
                color: color,
                textShadow: `0 0 5px ${color}, 0 0 10px ${color}`
            }}>
                {text}
            </motion.div>
        </div>
    )
}

function CubeFace({ transform, background, border, children }) {
    return (
        <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            transform: transform,
            background: background,
            border: border,
            backfaceVisibility: "hidden",
            boxSizing: "border-box",
            overflow: "hidden"
        }}>
            {children}
        </div>
    )
}

// --- Main Component ---

export default function TechCube(props) {
    const { 
        size,
        ledText,
        ledColor,
        primaryColor, // White/Light grey faces
        accentColor,  // Red button
        borderColor,
        animationMode,
        autoSpeed,
        badgeText,
        topCornerText,
        leftTextTop,
        leftTextBottom,
        backLogoText,
        backDetailsText,
        badgeSize,
        topCornerSize,
        leftTextTopSize,
        leftTextBottomSize,
        backLogoSize,
        backDetailsSize,
        ledTextSize,
        topLogoImage,
        frontLensImage,
        leftStickerImage,
        frontLEDImage,
        style 
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isEditor = RenderTarget.current() === RenderTarget.canvas

    // Motion values for cube rotation
    const rotateX = useMotionValue(25)
    const rotateY = useMotionValue(45)
    
    // Target values for spring when mouse moves
    const targetRotateX = useMotionValue(25)
    const targetRotateY = useMotionValue(45)

    const smoothRotateX = useSpring(rotateX, { damping: 30, stiffness: 200 })
    const smoothRotateY = useSpring(rotateY, { damping: 30, stiffness: 200 })

    // Auto-tumble animation
    useAnimationFrame((time, delta) => {
        if (animationMode === "mouse" && !isEditor) return
        
        const deltaSec = delta / 1000
        const speed = autoSpeed * 10 // degrees per second

        // If in "auto" or "mix", constantly add to the rotation
        if (animationMode !== "mouse") {
            // Slowly tumble Y (Left/Right) endlessly
            rotateY.set(rotateY.get() + speed * deltaSec)
            
            // Oscillate X (Top/Bottom) between -45 and 45 degrees so it NEVER goes upside-down
            const timeSec = time / 1000
            const oscillateSpeed = speed / 10
            rotateX.set(Math.sin(timeSec * oscillateSpeed) * 45)
            
            // Also update targets so it doesn't snap back wildly when mouse interacts in Mix mode
            targetRotateX.set(rotateX.get())
            targetRotateY.set(rotateY.get())
        }
    })

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (animationMode === "auto" || isEditor) return
        if (!containerRef.current) return
        
        const rect = containerRef.current.getBoundingClientRect()
        let clientX = 0
        let clientY = 0
        
        if ("touches" in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }
        
        // Mouse mapped from -1 to 1
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1
        const mouseY = ((clientY - rect.top) / rect.height) * 2 - 1
        
        if (animationMode === "mouse") {
            // Pure mouse tracking: Map screen -1..1 to -180..180 degrees for Y
            rotateY.set(mouseX * 180)
            // Clamp X between -60 and 60 so it never goes upside down
            rotateX.set(-mouseY * 60)
        } else if (animationMode === "mix") {
            // Push the ongoing rotation based on mouse
            rotateY.set(targetRotateY.get() + mouseX * 45)
            rotateX.set(targetRotateX.get() - mouseY * 45)
        }
    }

    const handlePointerLeave = () => {
        if (animationMode === "mouse") {
            // Snap back to isometric default
            animate(rotateX, 25, { type: "spring" })
            animate(rotateY, 45, { type: "spring" })
        }
    }

    const half = size / 2
    const faceBorder = `2px solid ${borderColor}`

    return (
        <div 
            ref={containerRef}
            style={{ 
                ...style,
                perspective: 1200,
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onMouseLeave={handlePointerLeave}
            onTouchEnd={handlePointerLeave}
        >
            <motion.div
                style={{
                    width: size,
                    height: size,
                    transformStyle: "preserve-3d",
                    rotateX: smoothRotateX,
                    rotateY: smoothRotateY
                }}
            >
                {/* 1. FRONT FACE (The Black Screen) */}
                <CubeFace 
                    transform={`translateZ(${half}px)`} 
                    background="#111" 
                    border={`2px solid #000`}
                >
                    {/* Camera Lens or Custom Logo */}
                    {frontLensImage ? (
                        <img src={frontLensImage} style={{
                            position: "absolute", top: 12, right: 12,
                            width: 24, height: 24, borderRadius: "50%",
                            objectFit: "cover"
                        }} alt="Lens" />
                    ) : (
                        <div style={{
                            position: "absolute", top: 12, right: 12,
                            width: 24, height: 24, borderRadius: "50%",
                            background: "#000", border: "4px solid #333",
                            boxShadow: "inset 0 0 5px rgba(255,255,255,0.2)"
                        }} />
                    )}
                    
                    {/* Glowing Green LED or Custom Logo */}
                    {frontLEDImage ? (
                        <img src={frontLEDImage} style={{
                            position: "absolute", bottom: 12, left: 12,
                            width: 8, height: 8, borderRadius: "50%",
                            objectFit: "cover"
                        }} alt="LED" />
                    ) : (
                        <div style={{
                            position: "absolute", bottom: 12, left: 12,
                            width: 8, height: 8, borderRadius: "50%",
                            background: "#0f0", boxShadow: "0 0 8px #0f0"
                        }} />
                    )}

                    {/* Badge */}
                    <div style={{
                        position: "absolute", bottom: 12, right: 12,
                        width: 16, height: 12, borderRadius: 2,
                        background: "#fff", display: "flex", justifyContent: "center", alignItems: "center",
                        fontSize: badgeSize, fontWeight: "bold", color: "#000"
                    }}>
                        {badgeText}
                    </div>

                    {/* Marquee Center */}
                    <div style={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "70%"
                    }}>
                        <MarqueeText text={ledText} color={ledColor} fontSize={ledTextSize} speed={30} />
                    </div>
                </CubeFace>

                {/* 2. BACK FACE */}
                <CubeFace 
                    transform={`rotateY(180deg) translateZ(${half}px)`} 
                    background={primaryColor} 
                    border={faceBorder}
                >
                    <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: "bold", fontSize: backLogoSize }}>{backLogoText}</div>
                        <div style={{ fontSize: backDetailsSize, color: "#666", whiteSpace: "pre-line" }}>
                            {backDetailsText}
                        </div>
                    </div>
                </CubeFace>

                {/* 3. LEFT FACE (Exp. 01) */}
                <CubeFace 
                    transform={`rotateY(-90deg) translateZ(${half}px)`} 
                    background={primaryColor} 
                    border={faceBorder}
                >
                    {/* Top Right Sticker or Custom Logo */}
                    {leftStickerImage ? (
                        <img src={leftStickerImage} style={{
                            position: "absolute", top: 16, right: 16,
                            width: 12, height: 12, objectFit: "cover"
                        }} alt="Sticker" />
                    ) : (
                        <div style={{
                            position: "absolute", top: 16, right: 16,
                            width: 12, height: 12, background: "#fbff00"
                        }} />
                    )}
                    
                    {/* Bottom Left Typography */}
                    <div style={{
                        position: "absolute", bottom: 16, left: 16,
                        display: "flex", flexDirection: "column",
                        fontFamily: "Inter, sans-serif",
                        lineHeight: 0.9
                    }}>
                        <span style={{ fontSize: leftTextTopSize, fontWeight: 300, letterSpacing: -1 }}>{leftTextTop}</span>
                        <span style={{ fontSize: leftTextBottomSize, fontWeight: 700, letterSpacing: -2 }}>
                            <AnimatedNumber value={leftTextBottom} />
                        </span>
                    </div>
                </CubeFace>

                {/* 4. RIGHT FACE */}
                <CubeFace 
                    transform={`rotateY(90deg) translateZ(${half}px)`} 
                    background={primaryColor} 
                    border={faceBorder}
                >
                    {/* Venting / Details */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", gap: 8 }}>
                        <div style={{ width: 8, height: 60, background: "#ddd", borderRadius: 4 }} />
                        <div style={{ width: 8, height: 60, background: "#ddd", borderRadius: 4 }} />
                        <div style={{ width: 8, height: 60, background: "#ddd", borderRadius: 4 }} />
                    </div>
                </CubeFace>

                {/* 5. TOP FACE (Red Button) */}
                <CubeFace 
                    transform={`rotateX(90deg) translateZ(${half}px)`} 
                    background={primaryColor} 
                    border={faceBorder}
                >
                    {/* Little "R" mark */}
                    <div style={{ position: "absolute", top: 12, right: 16, fontWeight: "bold", fontSize: topCornerSize }}>
                        {topCornerText}
                    </div>

                    {/* Big Red Button or Custom Logo */}
                    {topLogoImage ? (
                        <img src={topLogoImage} style={{
                            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            width: size * 0.3, height: size * 0.3,
                            borderRadius: "50%", objectFit: "cover"
                        }} alt="Top Logo" />
                    ) : (
                        <div style={{
                            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            width: size * 0.3, height: size * 0.3,
                            borderRadius: "50%",
                            background: accentColor,
                            boxShadow: "inset 0 -2px 10px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)"
                        }} />
                    )}
                </CubeFace>

                {/* 6. BOTTOM FACE */}
                <CubeFace 
                    transform={`rotateX(-90deg) translateZ(${half}px)`} 
                    background="#d0d0d0" 
                    border={faceBorder}
                >
                    {/* Mounting hole */}
                    <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#aaa", border: "2px solid #999"
                    }} />
                </CubeFace>

            </motion.div>
        </div>
    )
}

addPropertyControls(TechCube, {
    size: {
        type: ControlType.Number,
        title: "Cube Size",
        min: 50,
        max: 500,
        defaultValue: 200,
    },
    ledText: {
        type: ControlType.String,
        title: "LED Text",
        defaultValue: "I ♥ FD  I ♥ FD  ",
    },
    ledColor: {
        type: ControlType.Color,
        title: "LED Color",
        defaultValue: "#ff5050",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Face Color",
        defaultValue: "#f0f0f0",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#e03131",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#a0a0a0",
    },
    animationMode: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["auto", "mouse", "mix"],
        optionTitles: ["Auto Tumble", "Mouse Tracking", "Mix (Both)"],
        defaultValue: "mix",
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        min: 0,
        max: 10,
        defaultValue: 2,
        hidden(props) {
            return props.animationMode === "mouse"
        }
    },
    badgeText: {
        type: ControlType.String,
        title: "Front Badge",
        defaultValue: "R1",
    },
    topCornerText: {
        type: ControlType.String,
        title: "Top Corner",
        defaultValue: "R",
    },
    leftTextTop: {
        type: ControlType.String,
        title: "Left Top Text",
        defaultValue: "Exp.",
    },
    leftTextBottom: {
        type: ControlType.Number,
        title: "Left Number",
        defaultValue: 1,
        min: 0,
        max: 99
    },
    backLogoText: {
        type: ControlType.String,
        title: "Back Logo",
        defaultValue: "C E",
    },
    backDetailsText: {
        type: ControlType.String,
        title: "Back Details",
        defaultValue: "Model: T-01\nInput: 5V 1A\nDesigned in CA",
        displayTextArea: true,
    },
    badgeSize: { type: ControlType.Number, title: "Badge Size", min: 4, max: 24, defaultValue: 6 },
    topCornerSize: { type: ControlType.Number, title: "Corner Size", min: 8, max: 32, defaultValue: 12 },
    leftTextTopSize: { type: ControlType.Number, title: "Exp Size", min: 10, max: 100, defaultValue: 40 },
    leftTextBottomSize: { type: ControlType.Number, title: "Num Size", min: 10, max: 150, defaultValue: 70 },
    backLogoSize: { type: ControlType.Number, title: "Logo Size", min: 10, max: 100, defaultValue: 24 },
    backDetailsSize: { type: ControlType.Number, title: "Details Size", min: 6, max: 24, defaultValue: 10 },
    ledTextSize: { type: ControlType.Number, title: "LED Size", min: 8, max: 64, defaultValue: 24 },
    topLogoImage: { type: ControlType.Image, title: "Top Button Image" },
    frontLensImage: { type: ControlType.Image, title: "Front Lens Image" },
    leftStickerImage: { type: ControlType.Image, title: "Left Sticker Image" },
    frontLEDImage: { type: ControlType.Image, title: "Front LED Image" }
})
