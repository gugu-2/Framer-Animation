import * as React from "react"
import { useRef, useEffect } from "react"
import { ControlType, addPropertyControls, RenderTarget } from "framer"
import { useScroll, useTransform, useSpring, useAnimationFrame } from "framer-motion"

interface Props {
    image?: string | { src?: string; srcSet?: string; alt?: string }
    shredLine: number
    stripCount: number
    gapWidth: number
    waveAmplitude: number
    waveFrequency: number
    waveSpeed: number
    fallSpeed: number
    scrollOffset: number
    clipBackground: boolean
    loopImage: boolean
    previewProgress: number
    style?: React.CSSProperties
}

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
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_progress;
uniform float u_time;
uniform float u_shredLine;
uniform float u_stripCount;
uniform float u_gapWidth;
uniform float u_waveAmp;
uniform float u_waveFreq;
uniform float u_waveSpeed;
uniform float u_fallSpeed;
uniform float u_clipBackground;
uniform float u_loopImage;

void main() {
    vec2 uv = v_texCoord;
    
    float raw_doc_y = uv.y + u_progress;
    float doc_y = u_loopImage > 0.5 ? fract(raw_doc_y) : raw_doc_y;
    
    vec4 color = vec4(0.0);
    if (doc_y >= 0.0 && doc_y <= 1.0) {
        color = texture2D(u_image, vec2(uv.x, doc_y));
    }
    
    float fallDistance = u_progress * u_fallSpeed;
    float stripBottom = u_shredLine + fallDistance;
    
    if (uv.y >= u_shredLine && uv.y <= stripBottom && u_progress > 0.0) {
        float t = (uv.y - u_shredLine) / max(0.001, fallDistance);
        
        float wave = sin(t * u_waveFreq - u_time * u_waveSpeed + uv.x * 10.0) * u_waveAmp;
        float original_x = uv.x - wave;
        
        if (original_x >= 0.0 && original_x <= 1.0) {
            float stripUV = fract(original_x * u_stripCount);
            if (stripUV > u_gapWidth) {
                float raw_sample_y = u_shredLine + u_progress * (1.0 - t);
                float sample_y = u_loopImage > 0.5 ? fract(raw_sample_y) : raw_sample_y;
                
                if (sample_y >= 0.0 && sample_y <= 1.0) {
                    vec4 stripColor = texture2D(u_image, vec2(original_x, sample_y));
                    
                    float edgeShadow = smoothstep(u_gapWidth, u_gapWidth + 0.05, stripUV) * smoothstep(1.0, 0.95, stripUV);
                    stripColor.rgb *= (0.7 + 0.3 * edgeShadow);
                    stripColor.rgb *= (1.0 - wave * 2.0);
                    
                    color = stripColor;
                }
            }
        }
    }
    
    if (u_clipBackground > 0.5 && uv.y < u_shredLine) {
        color = vec4(0.0);
    }
    
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

export default function PaperShredder(props: Props) {
    const {
        image,
        shredLine = 0.2,
        stripCount = 60,
        gapWidth = 0.1,
        waveAmplitude = 0.015,
        waveFrequency = 12.0,
        waveSpeed = 3.0,
        fallSpeed = 1.0,
        scrollOffset = 1.5,
        clipBackground = false,
        loopImage = true,
        previewProgress = 0.0,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<{
        gl: WebGLRenderingContext
        program: WebGLProgram
        locations: any
        texture: WebGLTexture
        positionBuffer: WebGLBuffer
        texCoordBuffer: WebGLBuffer
    } | null>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })
    
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    const isEditor = RenderTarget.current() === RenderTarget.canvas

    const imageSrc = typeof image === "string" ? image : image?.src

    useEffect(() => {
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
            progress: gl.getUniformLocation(program, "u_progress"),
            time: gl.getUniformLocation(program, "u_time"),
            shredLine: gl.getUniformLocation(program, "u_shredLine"),
            stripCount: gl.getUniformLocation(program, "u_stripCount"),
            gapWidth: gl.getUniformLocation(program, "u_gapWidth"),
            waveAmp: gl.getUniformLocation(program, "u_waveAmp"),
            waveFreq: gl.getUniformLocation(program, "u_waveFreq"),
            waveSpeed: gl.getUniformLocation(program, "u_waveSpeed"),
            fallSpeed: gl.getUniformLocation(program, "u_fallSpeed"),
            clipBackground: gl.getUniformLocation(program, "u_clipBackground"),
            loopImage: gl.getUniformLocation(program, "u_loopImage"),
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

    useEffect(() => {
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

        const currentProgress = isEditor ? previewProgress * scrollOffset : smoothProgress.get() * scrollOffset

        gl.uniform1f(locations.progress, currentProgress)
        gl.uniform1f(locations.time, time / 1000.0)
        gl.uniform1f(locations.shredLine, shredLine)
        gl.uniform1f(locations.stripCount, stripCount)
        gl.uniform1f(locations.gapWidth, gapWidth)
        gl.uniform1f(locations.waveAmp, waveAmplitude)
        gl.uniform1f(locations.waveFreq, waveFrequency)
        gl.uniform1f(locations.waveSpeed, waveSpeed)
        gl.uniform1f(locations.fallSpeed, fallSpeed)
        gl.uniform1f(locations.clipBackground, clipBackground ? 1.0 : 0.0)
        gl.uniform1f(locations.loopImage, loopImage ? 1.0 : 0.0)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
    })

    return (
        <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", ...style }}>
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

addPropertyControls(PaperShredder, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Document Image",
    },
    shredLine: {
        type: ControlType.Number,
        title: "Shred Line",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.0,
    },
    loopImage: {
        type: ControlType.Boolean,
        title: "Loop Image",
        defaultValue: true,
    },
    clipBackground: {
        type: ControlType.Boolean,
        title: "Clip Background",
        defaultValue: false,
    },
    previewProgress: {
        type: ControlType.Number,
        title: "Preview Progress",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.0,
    },
    stripCount: {
        type: ControlType.Number,
        title: "Strip Count",
        min: 10,
        max: 200,
        step: 1,
        defaultValue: 60,
    },
    gapWidth: {
        type: ControlType.Number,
        title: "Gap Width",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Amplitude",
        min: 0,
        max: 0.1,
        step: 0.001,
        defaultValue: 0.015,
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Wave Frequency",
        min: 0,
        max: 50,
        step: 0.1,
        defaultValue: 12.0,
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 3.0,
    },
    fallSpeed: {
        type: ControlType.Number,
        title: "Fall Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1.0,
    },
    scrollOffset: {
        type: ControlType.Number,
        title: "Scroll Multiply",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1.5,
    },
})
