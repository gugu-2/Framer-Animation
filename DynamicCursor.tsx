import * as React from "react"
import { motion, useMotionValue, useSpring, useAnimationFrame } from "framer-motion"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * DynamicCursor
 * A layered custom cursor component that creates a 3D depth effect 
 * by having a solid main cursor and a softer, physics-damped trailing shadow.
 */
export default function DynamicCursor(props) {
    const { 
        cursorColor, cursorSize, 
        shadowColor, shadowSize, shadowBlur, shadowLag, shadowRandomness,
        zIndex, isGlobal, style 
    } = props
    
    // RenderTarget.canvas means we are inside the Framer editor UI
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    
    // 1. Motion Values for precise mouse coordinates
    const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0)
    const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0)
    
    // 2. Fast Spring for the main cursor (very snappy, near instant)
    const cursorX = useSpring(mouseX, { damping: 40, stiffness: 800, mass: 0.1 })
    const cursorY = useSpring(mouseY, { damping: 40, stiffness: 800, mass: 0.1 })
    
    // 3. Slow/Damped Spring for the trailing shadow (creates the depth lag effect)
    // Higher shadowLag = lower stiffness, higher mass, higher damping
    const shadowStiffness = Math.max(20, 200 - (shadowLag * 15)) 
    const shadowDamping = 10 + (shadowLag * 2) 
    const shadowMass = 0.5 + (shadowLag * 0.1)
    
    const shadowX = useSpring(mouseX, { damping: shadowDamping, stiffness: shadowStiffness, mass: shadowMass })
    const shadowY = useSpring(mouseY, { damping: shadowDamping, stiffness: shadowStiffness, mass: shadowMass })
    
    // 4. Blob Physics for organic shape
    const shadowRotate = useMotionValue(0)
    useAnimationFrame((t, delta) => {
        if (!isCanvas) {
            shadowRotate.set(shadowRotate.get() + delta * 0.05)
        }
    })
    
    // Calculate organic, distorted border-radius based on randomness slider (0-100)
    // 0 = perfect circle (50%), 100 = highly distorted blob
    const maxOffset = 25 
    const d = (shadowRandomness / 100) * maxOffset 
    const organicBorderRadius = `${50 - d}% ${50 + d}% ${50 + d * 0.5}% ${50 - d * 0.8}% / ${50 - d * 0.5}% ${50 + d * 0.8}% ${50 - d}% ${50 + d}%`
    
    React.useEffect(() => {
        if (isCanvas) return
        
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }
        
        window.addEventListener("mousemove", handleMouseMove)
        
        // Hide global cursor if requested
        if (isGlobal) {
            document.body.style.cursor = 'none'
            // Ensure child elements don't override the cursor
            const styleEl = document.createElement("style")
            styleEl.innerHTML = `* { cursor: none !important; }`
            styleEl.id = "dynamic-cursor-global-style"
            document.head.appendChild(styleEl)
        }
        
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            if (isGlobal) {
                document.body.style.cursor = 'auto'
                const styleEl = document.getElementById("dynamic-cursor-global-style")
                if (styleEl) styleEl.remove()
            }
        }
    }, [isCanvas, isGlobal])
    
    // If in canvas, just render a static preview so the user can design the cursor visually
    if (isCanvas) {
        return (
            <div style={{ ...style, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
                <div style={{ position: "absolute", width: shadowSize, height: shadowSize, borderRadius: organicBorderRadius, background: shadowColor, filter: `blur(${shadowBlur}px)` }} />
                <div style={{ position: "absolute", width: cursorSize, height: cursorSize, borderRadius: "50%", background: cursorColor }} />
            </div>
        )
    }

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: zIndex }}>
            {/* Shadow Layer */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    x: shadowX,
                    y: shadowY,
                    translateX: "-50%",
                    translateY: "-50%",
                    width: shadowSize,
                    height: shadowSize,
                    borderRadius: organicBorderRadius,
                    rotate: shadowRotate,
                    background: shadowColor,
                    filter: `blur(${shadowBlur}px)`,
                    willChange: "transform"
                }}
            />
            {/* Main Cursor Layer */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                    width: cursorSize,
                    height: cursorSize,
                    borderRadius: "50%",
                    background: cursorColor,
                    willChange: "transform"
                }}
            />
        </div>
    )
}

DynamicCursor.defaultProps = {
    cursorColor: "#222222",
    cursorSize: 20,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowSize: 60,
    shadowBlur: 15,
    shadowLag: 5,
    shadowRandomness: 50,
    zIndex: 9999,
    isGlobal: true,
}

addPropertyControls(DynamicCursor, {
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#222222",
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        min: 5,
        max: 100,
        defaultValue: 20,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.3)",
    },
    shadowSize: {
        type: ControlType.Number,
        title: "Shadow Size",
        min: 10,
        max: 300,
        defaultValue: 60,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        min: 0,
        max: 100,
        defaultValue: 15,
    },
    shadowLag: {
        type: ControlType.Number,
        title: "Shadow Lag",
        description: "Higher lag makes the shadow trail further behind when moving fast.",
        min: 1,
        max: 10,
        defaultValue: 5,
    },
    shadowRandomness: {
        type: ControlType.Number,
        title: "Shadow Random",
        description: "Controls how much of an organic blob shape the shadow is (0 = perfect circle).",
        min: 0,
        max: 100,
        defaultValue: 50,
    },
    isGlobal: {
        type: ControlType.Boolean,
        title: "Global",
        defaultValue: true,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 9999,
    }
})
