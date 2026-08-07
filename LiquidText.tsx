import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { useAnimationFrame, useMotionValue, animate } from "framer-motion"

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`

const fragmentShaderSource = `
precision highp float;
uniform sampler2D u_image;
uniform float u_time;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_pulseWidth;
uniform float u_speed;
uniform float u_trigger; 
uniform float u_direction; 
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_progress;
varying vec2 v_texCoord;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = v_texCoord;
    float mask = 0.0;
    
    if (u_trigger == 0.0) {
        // Auto Sweep
        float sweepProgress = fract(u_time * u_speed);
        float center = u_direction > 0.0 ? sweepProgress : 1.0 - sweepProgress;
        center = center * 1.4 - 0.2; 
        float dist = abs(uv.x - center);
        mask = exp(-dist * dist * u_pulseWidth);
    } else if (u_trigger == 1.0) {
        // Mouse Hover Tracking
        float aspect = u_resolution.x / u_resolution.y;
        vec2 aspUv = vec2(uv.x * aspect, uv.y);
        vec2 aspMouse = vec2(u_mouse.x * aspect, u_mouse.y);
        float dist = distance(aspUv, aspMouse);
        mask = exp(-dist * dist * u_pulseWidth);
    } else if (u_trigger == 2.0) {
        // Hover Sweep (progress goes from -0.2 to 1.2)
        float center = u_direction > 0.0 ? u_progress : 1.0 - u_progress;
        float dist = abs(uv.x - center);
        mask = exp(-dist * dist * u_pulseWidth);
    } else if (u_trigger == 3.0) {
        // Hover Splash (progress goes 0 -> 1 -> 0)
        mask = u_progress;
    }
    
    float nx = snoise(uv * u_frequency + u_time * 2.0);
    float ny = snoise(uv * u_frequency + vec2(100.0, 100.0) - u_time * 2.0);
    
    vec2 offset = vec2(nx, ny) * u_amplitude * mask;
    
    vec4 color = texture2D(u_image, uv + offset);
    gl_FragColor = color;
}
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
    }
    return program
}

export default function LiquidText(props) {
    const { 
        text, 
        subText,
        fontFamily,
        fontSize,
        letterSpacing,
        textColor,
        backgroundColor,
        trigger, 
        direction, 
        amplitude, 
        frequency, 
        pulseWidth, 
        speed,
        style 
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const canvas2dRef = React.useRef<HTMLCanvasElement | null>(null)
    const glRef = React.useRef<{
        gl: WebGLRenderingContext
        program: WebGLProgram
        locations: any
        texture: WebGLTexture
        positionBuffer: WebGLBuffer
        texCoordBuffer: WebGLBuffer
    } | null>(null)

    const mousePos = React.useRef({ x: 0.5, y: 0.5 })
    const effectProgress = useMotionValue(-0.2) // Used for hover-sweep and hover-splash
    
    const isEditor = RenderTarget.current() === RenderTarget.canvas

    // WebGL Initialization
    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false })
        if (!gl) return

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
        if (!vertexShader || !fragmentShader) return
        
        const program = createProgram(gl, vertexShader, fragmentShader)
        if (!program) return

        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1.0, -1.0,
                 1.0, -1.0,
                -1.0,  1.0,
                -1.0,  1.0,
                 1.0, -1.0,
                 1.0,  1.0,
            ]),
            gl.STATIC_DRAW
        )

        const texCoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0,
            ]),
            gl.STATIC_DRAW
        )

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        // Initialize with 1x1 clear pixel
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        const locations = {
            position: gl.getAttribLocation(program, "a_position"),
            texCoord: gl.getAttribLocation(program, "a_texCoord"),
            image: gl.getUniformLocation(program, "u_image"),
            time: gl.getUniformLocation(program, "u_time"),
            amplitude: gl.getUniformLocation(program, "u_amplitude"),
            frequency: gl.getUniformLocation(program, "u_frequency"),
            pulseWidth: gl.getUniformLocation(program, "u_pulseWidth"),
            speed: gl.getUniformLocation(program, "u_speed"),
            trigger: gl.getUniformLocation(program, "u_trigger"),
            direction: gl.getUniformLocation(program, "u_direction"),
            mouse: gl.getUniformLocation(program, "u_mouse"),
            resolution: gl.getUniformLocation(program, "u_resolution"),
            progress: gl.getUniformLocation(program, "u_progress"),
        }

        glRef.current = { gl, program, locations, texture, positionBuffer: positionBuffer!, texCoordBuffer: texCoordBuffer! }

        return () => {
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
            if (positionBuffer) gl.deleteBuffer(positionBuffer)
            if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer)
            gl.deleteTexture(texture)
        }
    }, [])

    // 2D Canvas Text Generation
    const updateTexture = React.useCallback(() => {
        if (!glRef.current || !containerRef.current) return
        const { gl, texture } = glRef.current
        const rect = containerRef.current.getBoundingClientRect()
        
        const dpr = window.devicePixelRatio || 1
        const width = Math.round(rect.width * dpr)
        const height = Math.round(rect.height * dpr)
        
        if (width === 0 || height === 0) return

        if (!canvas2dRef.current) {
            canvas2dRef.current = document.createElement("canvas")
        }
        const canvas2d = canvas2dRef.current
        canvas2d.width = width
        canvas2d.height = height
        
        const ctx = canvas2d.getContext("2d")
        if (!ctx) return
        
        // Draw background
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)
        
        // Draw main text
        ctx.fillStyle = textColor
        ctx.font = `900 ${fontSize * dpr}px ${fontFamily}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        if ('letterSpacing' in ctx) {
            (ctx as any).letterSpacing = `${letterSpacing * dpr}px`
        }
        
        ctx.fillText(text, width / 2, height / 2)
        
        // Draw sub text (top left)
        if (subText) {
            ctx.font = `900 ${18 * dpr}px ${fontFamily}`
            ctx.textAlign = "left"
            ctx.textBaseline = "top"
            if ('letterSpacing' in ctx) {
                (ctx as any).letterSpacing = "0px"
            }
            ctx.fillText(subText, 32 * dpr, 32 * dpr)
        }
        
        // Upload to WebGL
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d)
    }, [text, subText, fontFamily, fontSize, letterSpacing, textColor, backgroundColor])

    // Setup ResizeObserver and Font Loading
    React.useEffect(() => {
        if (!containerRef.current) return
        
        const observer = new ResizeObserver(() => {
            updateTexture()
        })
        observer.observe(containerRef.current)
        
        if (document.fonts) {
            document.fonts.ready.then(() => {
                updateTexture()
            })
        }
        
        return () => observer.disconnect()
    }, [updateTexture])

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
        
        mousePos.current = {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        }
    }

    const handleMouseEnter = () => {
        // Stop any running animation to ensure it instantly restarts when hovered again
        effectProgress.stop()

        if (trigger === "hover-sweep") {
            // Use linear easing to eliminate the slow startup delay of easeInOut
            effectProgress.set(-0.1)
            animate(effectProgress, 1.1, { duration: 1.0 / speed, ease: "linear" })
        } else if (trigger === "hover-splash") {
            // Hit max splash instantly (5% of duration), then slowly fade out
            effectProgress.set(0)
            animate(effectProgress, [0, 1, 0], { duration: 1.5, times: [0, 0.05, 1], ease: "easeOut" })
        }
    }

    useAnimationFrame((time) => {
        if (!glRef.current || !canvasRef.current || !containerRef.current) return
        const { gl, program, locations, texture, positionBuffer, texCoordBuffer } = glRef.current
        
        const rect = containerRef.current.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        const displayWidth = Math.round(rect.width * dpr)
        const displayHeight = Math.round(rect.height * dpr)
        
        if (canvasRef.current.width !== displayWidth || canvasRef.current.height !== displayHeight) {
            canvasRef.current.width = displayWidth
            canvasRef.current.height = displayHeight
            gl.viewport(0, 0, displayWidth, displayHeight)
        }

        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.useProgram(program)

        gl.enableVertexAttribArray(locations.position)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0)

        gl.enableVertexAttribArray(locations.texCoord)
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
        gl.vertexAttribPointer(locations.texCoord, 2, gl.FLOAT, false, 0, 0)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(locations.image, 0)

        // Math to invert pulseWidth logic for UI (10 is wide, 1 is narrow)
        const shaderPulseWidth = 100.0 / pulseWidth

        // If in editor and auto-sweep, force animation to be frozen in middle for preview
        const t = (isEditor && trigger === "auto") ? 0.5 / speed : time / 1000.0

        let triggerVal = 0.0
        if (trigger === "hover") triggerVal = 1.0
        if (trigger === "hover-sweep") triggerVal = 2.0
        if (trigger === "hover-splash") triggerVal = 3.0
        
        // In editor, if hover-sweep or hover-splash, force progress to middle so user sees it
        let currentProgress = effectProgress.get()
        if (isEditor && (trigger === "hover-sweep" || trigger === "hover-splash")) {
            currentProgress = 0.5
        }

        gl.uniform1f(locations.time, t)
        gl.uniform1f(locations.amplitude, amplitude)
        gl.uniform1f(locations.frequency, frequency)
        gl.uniform1f(locations.pulseWidth, shaderPulseWidth)
        gl.uniform1f(locations.speed, speed)
        gl.uniform1f(locations.trigger, triggerVal)
        gl.uniform1f(locations.direction, direction === "left-to-right" ? 1.0 : -1.0)
        gl.uniform2f(locations.resolution, displayWidth, displayHeight)
        gl.uniform1f(locations.progress, currentProgress)
        
        // Convert mouse y to GL coordinates (bottom up)
        gl.uniform2f(locations.mouse, mousePos.current.x, 1.0 - mousePos.current.y)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
    })

    return (
        <div 
            ref={containerRef} 
            style={{ width: "100%", height: "100%", position: "relative", ...style }}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            // Removed onMouseEnter from here so it doesn't trigger on empty space
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none"
                }}
            />
            
            {/* Invisible Overlay for Precise Text Hitboxes */}
            <div style={{
                position: "absolute",
                top: 0, left: 0, width: "100%", height: "100%",
                pointerEvents: "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <div 
                    onMouseEnter={handleMouseEnter}
                    style={{
                        fontWeight: 900,
                        fontFamily: fontFamily,
                        fontSize: fontSize,
                        letterSpacing: letterSpacing,
                        lineHeight: 1,
                        color: "transparent",
                        pointerEvents: "auto",
                        whiteSpace: "nowrap"
                    }}
                >
                    {text}
                </div>
            </div>

            {subText && (
                <div style={{
                    position: "absolute",
                    top: 32, left: 32,
                    pointerEvents: "none"
                }}>
                    <div 
                        onMouseEnter={handleMouseEnter}
                        style={{
                            fontWeight: 900,
                            fontFamily: fontFamily,
                            fontSize: 18,
                            letterSpacing: 0,
                            lineHeight: 1,
                            color: "transparent",
                            pointerEvents: "auto",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {subText}
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(LiquidText, {
    text: {
        type: ControlType.String,
        title: "Main Text",
        defaultValue: "404",
    },
    subText: {
        type: ControlType.String,
        title: "Sub Text",
        defaultValue: "YRN. BWE",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Impact, sans-serif",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 250,
        min: 10,
        max: 800,
        step: 5,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -5,
        min: -100,
        max: 100,
        step: 1,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E80B20",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["auto", "hover", "hover-sweep", "hover-splash"],
        optionTitles: ["Auto Sweep", "Mouse Track", "Hover Sweep", "Hover Splash"],
        defaultValue: "hover-sweep",
    },
    direction: {
        type: ControlType.Enum,
        title: "Sweep Direction",
        options: ["left-to-right", "right-to-left"],
        optionTitles: ["Left to Right", "Right to Left"],
        defaultValue: "right-to-left",
        hidden(props) {
            return props.trigger !== "auto"
        },
    },
    amplitude: {
        type: ControlType.Number,
        title: "Distortion",
        min: 0,
        max: 0.2,
        step: 0.005,
        defaultValue: 0.05,
    },
    frequency: {
        type: ControlType.Number,
        title: "Ripple Size",
        min: 1,
        max: 50,
        step: 0.5,
        defaultValue: 15,
    },
    pulseWidth: {
        type: ControlType.Number,
        title: "Band Width",
        min: 1,
        max: 20,
        step: 0.5,
        defaultValue: 4,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 0.8,
        hidden(props) {
            return props.trigger !== "auto"
        },
    }
})
