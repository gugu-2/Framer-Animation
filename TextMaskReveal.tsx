import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"

// Sub-component for Per-Letter hover mode
function LetterMask({ char, index, images, isEditor, theme, textColor, outerBg, maskTextCol, blendMode, fontFamily, fontSize, fontWeight }) {
    const [isHovered, setIsHovered] = React.useState(false)
    
    // Get the image assigned to this specific letter
    const image = images && images.length > 0 ? images[index % images.length] : null
    
    // In editor, keep the first letter hovered so users can preview the effect
    const forceHover = isEditor && index === 0

    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
            style={{ 
                position: "relative", 
                backgroundColor: outerBg,
                overflow: "hidden" 
            }}
        >
            {/* Gallery Layer (Bottom) */}
            <div style={{ 
                position: "absolute", 
                inset: 0, 
                backgroundColor: textColor,
                overflow: "hidden"
            }}>
                <AnimatePresence>
                    {(isHovered || forceHover) && image && (
                        <motion.img
                            src={typeof image === 'string' ? image : image.src}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                position: "absolute",
                                left: 0,
                                top: 0
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Mask Layer (Top) */}
            <div style={{
                position: "relative", // Dictates the size of the container!
                backgroundColor: outerBg,
                color: maskTextCol,
                mixBlendMode: blendMode,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                userSelect: "none"
            }}>
                <h1 style={{
                    margin: 0,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fontWeight: fontWeight,
                    lineHeight: 1,
                    textAlign: "center"
                }}>
                    {char === ' ' ? '\u00A0' : char}
                </h1>
            </div>
        </div>
    )
}

export default function TextMaskReveal(props) {
    const { 
        text, 
        theme,
        hoverMode,
        letterSpacing,
        textColor, 
        images, 
        fontFamily,
        fontSize,
        fontWeight,
        imageSize,
        style 
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = React.useState(0)
    
    // In the editor, always show the first image in the center so users can see what it looks like.
    const isEditor = RenderTarget.current() === RenderTarget.canvas
    const [isHovered, setIsHovered] = React.useState(isEditor)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const smoothX = useSpring(mouseX, { damping: 30, stiffness: 200 })
    const smoothY = useSpring(mouseY, { damping: 30, stiffness: 200 })

    // Center image initially in editor (for Sweep mode)
    React.useEffect(() => {
        if (isEditor && containerRef.current && hoverMode === "sweep") {
            const rect = containerRef.current.getBoundingClientRect()
            mouseX.set(rect.width / 2)
            mouseY.set(rect.height / 2)
        }
    }, [isEditor, hoverMode])

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (hoverMode !== "sweep") return
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
        
        const x = clientX - rect.left
        const y = clientY - rect.top
        
        mouseX.set(x)
        mouseY.set(y)
        setIsHovered(true)
        
        if (images && images.length > 0) {
            const progress = Math.max(0, Math.min(1, x / rect.width))
            const newIndex = Math.min(Math.floor(progress * images.length), images.length - 1)
            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex)
            }
        }
    }

    const handlePointerLeave = () => {
        if (hoverMode !== "sweep") return
        if (!isEditor) {
            setIsHovered(false)
        }
    }

    const isDark = theme === "dark"
    const outerBg = isDark ? "#000000" : "#FFFFFF"
    const maskTextCol = isDark ? "#FFFFFF" : "#000000"
    const blendMode = isDark ? "multiply" : "screen"

    // PER-LETTER RENDER
    if (hoverMode === "per-letter") {
        return (
            <div 
                style={{ 
                    ...style, 
                    position: "relative", 
                    width: "100%", 
                    height: "100%", 
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: letterSpacing,
                    backgroundColor: outerBg 
                }}
            >
                {text.split('').map((char, index) => (
                    <LetterMask 
                        key={index} 
                        char={char} 
                        index={index}
                        images={images}
                        isEditor={isEditor}
                        theme={theme}
                        textColor={textColor}
                        outerBg={outerBg}
                        maskTextCol={maskTextCol}
                        blendMode={blendMode}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fontWeight={fontWeight}
                    />
                ))}
            </div>
        )
    }

    // SWEEP RENDER
    return (
        <div 
            ref={containerRef}
            style={{ 
                ...style, 
                position: "relative", 
                width: "100%", 
                height: "100%", 
                overflow: "hidden", 
                backgroundColor: outerBg 
            }}
            onMouseMove={handlePointerMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handlePointerLeave}
            onTouchMove={handlePointerMove}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={handlePointerLeave}
        >
            {/* Gallery Layer (Bottom) */}
            <div style={{ 
                position: "absolute", 
                inset: 0, 
                backgroundColor: textColor,
                overflow: "hidden"
            }}>
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        x: smoothX,
                        y: smoothY,
                        width: 0,
                        height: 0,
                        pointerEvents: "none"
                    }}
                >
                    <AnimatePresence>
                        {isHovered && images && images.length > 0 && images[currentIndex] && (
                            <motion.img
                                key={currentIndex}
                                src={typeof images[currentIndex] === 'string' ? images[currentIndex] : images[currentIndex].src}
                                initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                                exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    position: "absolute",
                                    width: imageSize,
                                    height: "auto",
                                    maxWidth: "none", // Prevent Framer from squishing it
                                    objectFit: "contain"
                                }}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Mask Layer (Top) */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: outerBg,
                color: maskTextCol,
                mixBlendMode: blendMode,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                userSelect: "none"
            }}>
                <h1 style={{
                    margin: 0,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fontWeight: fontWeight,
                    lineHeight: 1,
                    textAlign: "center",
                    whiteSpace: "pre-wrap"
                }}>
                    {text}
                </h1>
            </div>
        </div>
    )
}

addPropertyControls(TextMaskReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "WARHOL",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [],
    },
    hoverMode: {
        type: ControlType.Enum,
        title: "Hover Mode",
        options: ["sweep", "per-letter"],
        optionTitles: ["Cursor Sweep", "Per Letter"],
        defaultValue: "sweep",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -50,
        max: 100,
        hidden(props) { return props.hoverMode !== "per-letter" }
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark Mode (Multiply)", "Light Mode (Screen)"],
        defaultValue: "dark",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Base Color",
        defaultValue: "#FAD6C6",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Impact, sans-serif",
    },
    fontSize: {
        type: ControlType.String,
        title: "Font Size",
        defaultValue: "18vw",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 900,
        min: 100,
        max: 900,
        step: 100,
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 10,
        hidden(props) { return props.hoverMode !== "sweep" }
    }
})
