import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { useAnimationFrame } from "framer-motion"

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
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
    } else {
        // Mouse Hover
        float dist = distance(uv, u_mouse);
        mask = exp(-dist * dist * u_pulseWidth);
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

export default function LiquidDistortion(props) {
    const { 
        image, 
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
    const glRef = React.useRef<{
        gl: WebGLRenderingContext
        program: WebGLProgram
        locations: any
        texture: WebGLTexture
        positionBuffer: WebGLBuffer
        texCoordBuffer: WebGLBuffer
    } | null>(null)

    const mousePos = React.useRef({ x: 0.5, y: 0.5 })
    const isEditor = RenderTarget.current() === RenderTarget.canvas

    const imageSrc = typeof image === "string" ? image : image?.src

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
                0.0, 1.0,
                1.0, 1.0,
                0.0, 0.0,
                0.0, 0.0,
                1.0, 1.0,
                1.0, 0.0,
            ]),
            gl.STATIC_DRAW
        )

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
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

    React.useEffect(() => {
        if (!glRef.current || !imageSrc) return
        const { gl, texture } = glRef.current
        
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = imageSrc
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        }
    }, [imageSrc])

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

    useAnimationFrame((time) => {
        if (!glRef.current || !canvasRef.current) return
        const { gl, program, locations, texture, positionBuffer, texCoordBuffer } = glRef.current
        
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        
        const displayWidth = Math.round(rect.width * dpr)
        const displayHeight = Math.round(rect.height * dpr)
        
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth
            canvas.height = displayHeight
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

        gl.uniform1f(locations.time, t)
        gl.uniform1f(locations.amplitude, amplitude)
        gl.uniform1f(locations.frequency, frequency)
        gl.uniform1f(locations.pulseWidth, shaderPulseWidth)
        gl.uniform1f(locations.speed, speed)
        gl.uniform1f(locations.trigger, trigger === "auto" ? 0.0 : 1.0)
        gl.uniform1f(locations.direction, direction === "left-to-right" ? 1.0 : -1.0)
        
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
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none"
                }}
            />
        </div>
    )
}

addPropertyControls(LiquidDistortion, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["auto", "hover"],
        optionTitles: ["Auto Sweep", "Mouse Hover"],
        defaultValue: "auto",
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
        defaultValue: 0.04,
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
        defaultValue: 0.5,
        hidden(props) {
            return props.trigger !== "auto"
        },
    }
})
