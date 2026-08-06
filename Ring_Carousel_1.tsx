import * as React from "react"
import {
    addPropertyControls,
    ControlType,
    RenderTarget,
    useIsStaticRenderer,
} from "framer"
import {
    animate,
    AnimatePresence,
    motion,
    useAnimationFrame,
    useInView,
    useMotionValue,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion"

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

interface CarouselItem {
    title?: string
    image?: { src?: string; srcSet?: string; alt?: string } | string
    video?: string
    link?: string
    alt?: string
    media?: {
        type?: "image" | "video"
        image?: { src?: string; srcSet?: string; alt?: string }
        video?: string
        poster?: { src?: string; srcSet?: string; alt?: string }
    }
}

interface MyComponentProps {
    collectionItem?: {
        title?: string
        image?: { src?: string; srcSet?: string; alt?: string } | string
        video?: string
        link?: string
    }
    items: CarouselItem[]
    background: string
    ringGeometry: {
        radius: number
        ellipseHeight: number
        perspective: number
        itemWidth: number
        aspect: number
        visibleArc: number
    }
    itemAppearance: {
        frontScale: number
        sideScale: number
        minOpacity: number
        sideBlur: number
        itemRadius: string
        faceAmount: number
    }
    centerPreviewSettings: {
        centerPreview: boolean
        previewWidth: number
        previewAspect: number
        previewRadius: string
        previewShadow: boolean
        previewClickThrough: boolean
        frontHandoff: number
        fadeDuration: number
    }
    interaction: {
        dragSense: number
        dragFriction: number
        snap: boolean
        snapStrength: number
        wheelStrength: number
        autoRotate: boolean
        autoSpeed: number
    }
    mouseTiltSettings: {
        mouseTilt: boolean
        tiltX: number
        tiltY: number
        tiltShift: number
        tiltShiftY: number
        tiltSmooth: number
    }
    titleBar: {
        show: boolean
        font: {
            fontFamily?: string
            fontSize?: number | string
            fontWeight?: number
            fontStyle?: "normal" | "italic"
            lineHeight?: number | string
            letterSpacing?: number | string
            textAlign?: "left" | "center" | "right"
        }
        titleColor: string
        barFill: string
        textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
        textAlign: "left" | "center" | "right"
        padding: string
    }
    caseButton: {
        show: boolean
        label: string
        background: string
        textColor: string
        hoverBackground: string
        hoverTextColor: string
        hoverTransition: number
        radius: string
        padding: string
        font: {
            fontFamily?: string
            fontSize?: number | string
            fontWeight?: number
            fontStyle?: "normal" | "italic"
            lineHeight?: number | string
            letterSpacing?: number | string
            textAlign?: "left" | "center" | "right"
        }
    }
    responsive: {
        enabled: boolean
        referenceWidth: number
        minScale: number
    }
    mobileBreakpoint: number
    mobileDisableMouse: boolean
    mobilePreviewWidthPercent: number
    mobileRingWidthPercent: number
}

const defaultItems: CarouselItem[] = [
    { title: "Hypasia Space", image: { src: "https://framerusercontent.com/images/ypxfzBKyWn8aTzMmgcmJKu07BtE.png", alt: "Hypasia Space" }, video: "", alt: "Hypasia Space", link: "https://hypasia.space", media: { type: "image", image: { src: "https://framerusercontent.com/images/ypxfzBKyWn8aTzMmgcmJKu07BtE.png", alt: "Hypasia Space" }, video: "", poster: { src: "https://framerusercontent.com/images/ypxfzBKyWn8aTzMmgcmJKu07BtE.png", alt: "Hypasia Space" } } },
    { title: "ROK GLASSES", image: { src: "https://framerusercontent.com/images/gRz52liKURUzoYbAGAt3xmdJf4A.png", alt: "ROK GLASSES" }, video: "", alt: "ROK GLASSES", link: "https://glass.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/gRz52liKURUzoYbAGAt3xmdJf4A.png", alt: "ROK GLASSES" }, video: "", poster: { src: "https://framerusercontent.com/images/gRz52liKURUzoYbAGAt3xmdJf4A.png", alt: "ROK GLASSES" } } },
    { title: "One Logo Portfolio", image: { src: "https://framerusercontent.com/images/YOys9nOpsqMPUpeTyIoROpswxE.png", alt: "One Logo Portfolio" }, video: "", alt: "One Logo Portfolio", link: "https://one-logo.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/YOys9nOpsqMPUpeTyIoROpswxE.png", alt: "One Logo Portfolio" }, video: "", poster: { src: "https://framerusercontent.com/images/YOys9nOpsqMPUpeTyIoROpswxE.png", alt: "One Logo Portfolio" } } },
    { title: "Snowgroup", image: { src: "https://framerusercontent.com/images/m0opWllaj5iel6LFM8hDXYdojSM.png", alt: "Snowgroup" }, video: "", alt: "Snowgroup", link: "https://ski.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/m0opWllaj5iel6LFM8hDXYdojSM.png", alt: "Snowgroup" }, video: "", poster: { src: "https://framerusercontent.com/images/m0opWllaj5iel6LFM8hDXYdojSM.png", alt: "Snowgroup" } } },
    { title: "One Strategy Group", image: { src: "https://framerusercontent.com/images/ItLmJ3RSKM80gGYWHQ7DK2J49r8.png", alt: "One Strategy Group" }, video: "", alt: "One Strategy Group", link: "https://one.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/ItLmJ3RSKM80gGYWHQ7DK2J49r8.png", alt: "One Strategy Group" }, video: "", poster: { src: "https://framerusercontent.com/images/ItLmJ3RSKM80gGYWHQ7DK2J49r8.png", alt: "One Strategy Group" } } },
    { title: "Arch", image: { src: "https://framerusercontent.com/images/EshTcw5Ro6BqbHOrVsxP6JTm6E.png", alt: "Arch" }, video: "", alt: "Arch", link: "https://arch.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/EshTcw5Ro6BqbHOrVsxP6JTm6E.png", alt: "Arch" }, video: "", poster: { src: "https://framerusercontent.com/images/EshTcw5Ro6BqbHOrVsxP6JTm6E.png", alt: "Arch" } } },
    { title: "Rare Candy", image: { src: "https://framerusercontent.com/images/bpMfmA9NJsb3ySbMLbRRGXjCbg.png", alt: "Rare Candy" }, video: "", alt: "Rare Candy", link: "https://pikachu-marketplace.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/bpMfmA9NJsb3ySbMLbRRGXjCbg.png", alt: "Rare Candy" }, video: "", poster: { src: "https://framerusercontent.com/images/bpMfmA9NJsb3ySbMLbRRGXjCbg.png", alt: "Rare Candy" } } },
    { title: "Minimal", image: { src: "https://framerusercontent.com/images/s63nLTZ1tazYrLKXJQIfljlSTI.png", alt: "Minimal" }, video: "", alt: "Minimal", link: "https://glass-scrool.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/s63nLTZ1tazYrLKXJQIfljlSTI.png", alt: "Minimal" }, video: "", poster: { src: "https://framerusercontent.com/images/s63nLTZ1tazYrLKXJQIfljlSTI.png", alt: "Minimal" } } },
    { title: "Sona AI", image: { src: "https://framerusercontent.com/images/uurkoMtWL9PXJL6VrYb9zkGISeI.png", alt: "Sona AI" }, video: "", alt: "Sona AI", link: "https://sona-ai.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/uurkoMtWL9PXJL6VrYb9zkGISeI.png", alt: "Sona AI" }, video: "", poster: { src: "https://framerusercontent.com/images/uurkoMtWL9PXJL6VrYb9zkGISeI.png", alt: "Sona AI" } } },
    { title: "Athleads", image: { src: "https://framerusercontent.com/images/XwXsUocwwADhUd8pl7SSewG9Poo.png", alt: "Athleads" }, video: "", alt: "Athleads", link: "https://athlet-sa.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/XwXsUocwwADhUd8pl7SSewG9Poo.png", alt: "Athleads" }, video: "", poster: { src: "https://framerusercontent.com/images/XwXsUocwwADhUd8pl7SSewG9Poo.png", alt: "Athleads" } } },
    { title: "FlowSync", image: { src: "https://framerusercontent.com/images/H01RqDzD6SJ2Pa9QjkMfAo.png", alt: "FlowSync" }, video: "", alt: "FlowSync", link: "https://purple-saas.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/H01RqDzD6SJ2Pa9QjkMfAo.png", alt: "FlowSync" }, video: "", poster: { src: "https://framerusercontent.com/images/H01RqDzD6SJ2Pa9QjkMfAo.png", alt: "FlowSync" } } },
    { title: "Stratdev", image: { src: "https://framerusercontent.com/images/URjz40m3VZiNu8L4PWJpR29CEKo.png", alt: "Stratdev" }, video: "", alt: "Stratdev", link: "https://3d.agarthan.space/studio.app/index.html", media: { type: "image", image: { src: "https://framerusercontent.com/images/URjz40m3VZiNu8L4PWJpR29CEKo.png", alt: "Stratdev" }, video: "", poster: { src: "https://framerusercontent.com/images/URjz40m3VZiNu8L4PWJpR29CEKo.png", alt: "Stratdev" } } },
    { title: "Appmakers LA", image: { src: "https://framerusercontent.com/images/zoYQD3wmltsg16gjzpPyuYdeFQ.png", alt: "Appmakers LA" }, video: "", alt: "Appmakers LA", link: "https://market.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/zoYQD3wmltsg16gjzpPyuYdeFQ.png", alt: "Appmakers LA" }, video: "", poster: { src: "https://framerusercontent.com/images/zoYQD3wmltsg16gjzpPyuYdeFQ.png", alt: "Appmakers LA" } } },
    { title: "Appmakers 3D Play", image: { src: "https://framerusercontent.com/images/3iWIac6sK6ENGa9vJRPe1KuHU.png", alt: "Appmakers 3D Play" }, video: "", alt: "Appmakers 3D Play", link: "https://3dplay.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/3iWIac6sK6ENGa9vJRPe1KuHU.png", alt: "Appmakers 3D Play" }, video: "", poster: { src: "https://framerusercontent.com/images/3iWIac6sK6ENGa9vJRPe1KuHU.png", alt: "Appmakers 3D Play" } } },
    { title: "Appmakers Graphic", image: { src: "https://framerusercontent.com/images/ZA0sG4UPMtbn5niLn5UClwWkcXU.png", alt: "Appmakers Graphic" }, video: "", alt: "Appmakers Graphic", link: "https://graphic.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/ZA0sG4UPMtbn5niLn5UClwWkcXU.png", alt: "Appmakers Graphic" }, video: "", poster: { src: "https://framerusercontent.com/images/ZA0sG4UPMtbn5niLn5UClwWkcXU.png", alt: "Appmakers Graphic" } } },
    { title: "Appmakers Chinki", image: { src: "https://framerusercontent.com/images/POZ817OsB5z2uloHXFS8Jxi9jZo.png", alt: "Appmakers Chinki" }, video: "", alt: "Appmakers Chinki", link: "https://chinki.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/POZ817OsB5z2uloHXFS8Jxi9jZo.png", alt: "Appmakers Chinki" }, video: "", poster: { src: "https://framerusercontent.com/images/POZ817OsB5z2uloHXFS8Jxi9jZo.png", alt: "Appmakers Chinki" } } },
    { title: "Agentic", image: { src: "https://framerusercontent.com/images/S0r0nQzkkqxXxqsPgk0NBMrDbc.png", alt: "Agentic" }, video: "", alt: "Agentic", link: "https://scroll.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/S0r0nQzkkqxXxqsPgk0NBMrDbc.png", alt: "Agentic" }, video: "", poster: { src: "https://framerusercontent.com/images/S0r0nQzkkqxXxqsPgk0NBMrDbc.png", alt: "Agentic" } } },
    { title: "3D Text Scroll", image: { src: "https://framerusercontent.com/images/mh0Lt8NvfOpJwxeZUkepRxQaq0.png", alt: "3D Text Scroll" }, video: "", alt: "3D Text Scroll", link: "https://text.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/mh0Lt8NvfOpJwxeZUkepRxQaq0.png", alt: "3D Text Scroll" }, video: "", poster: { src: "https://framerusercontent.com/images/mh0Lt8NvfOpJwxeZUkepRxQaq0.png", alt: "3D Text Scroll" } } },
    { title: "Appmakers Cube", image: { src: "https://framerusercontent.com/images/crVMjvDvOulN4pqU0aIPEp6ysks.png", alt: "Appmakers Cube" }, video: "", alt: "Appmakers Cube", link: "https://cube.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/crVMjvDvOulN4pqU0aIPEp6ysks.png", alt: "Appmakers Cube" }, video: "", poster: { src: "https://framerusercontent.com/images/crVMjvDvOulN4pqU0aIPEp6ysks.png", alt: "Appmakers Cube" } } },
    { title: "Tellbyte", image: { src: "https://framerusercontent.com/images/5ql3EmCqkftzWSfK9YEQD8z10A.png", alt: "Tellbyte" }, video: "", alt: "Tellbyte", link: "https://tellbyte.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/5ql3EmCqkftzWSfK9YEQD8z10A.png", alt: "Tellbyte" }, video: "", poster: { src: "https://framerusercontent.com/images/5ql3EmCqkftzWSfK9YEQD8z10A.png", alt: "Tellbyte" } } },
    { title: "BOLT", image: { src: "https://framerusercontent.com/images/dH2u3QV0jdk8IF3h1owEfv9zU4.png", alt: "BOLT" }, video: "", alt: "BOLT", link: "https://gug.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/dH2u3QV0jdk8IF3h1owEfv9zU4.png", alt: "BOLT" }, video: "", poster: { src: "https://framerusercontent.com/images/dH2u3QV0jdk8IF3h1owEfv9zU4.png", alt: "BOLT" } } },
    { title: "Premium", image: { src: "https://framerusercontent.com/images/mS4I8tptPTDbRGZgBZYz9BJmlxk.png", alt: "Premium" }, video: "", alt: "Premium", link: "https://space.agarthan.space/", media: { type: "image", image: { src: "https://framerusercontent.com/images/mS4I8tptPTDbRGZgBZYz9BJmlxk.png", alt: "Premium" }, video: "", poster: { src: "https://framerusercontent.com/images/mS4I8tptPTDbRGZgBZYz9BJmlxk.png", alt: "Premium" } } },
]

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

function normalizeAngle(angle: number): number {
    let normalized = ((angle + 180) % 360 + 360) % 360 - 180
    if (normalized === -180) normalized = 180
    return normalized
}

function nonEmptyString(value: unknown, fallback: string): string {
    if (typeof value !== "string") return fallback
    return value.trim() === "" ? fallback : value
}

function isUnsetItemText(value: unknown, placeholderPattern: RegExp): boolean {
    if (typeof value !== "string") return true
    const trimmed = value.trim()
    if (trimmed === "") return true
    return placeholderPattern.test(trimmed)
}

function resolveItemMedia(item: CarouselItem, index: number) {
    const fallback = defaultItems[index % defaultItems.length]
    const fallbackName = fallback.title || "Project"
    
    let flatImage = item.image
    if (typeof flatImage === "string") {
        flatImage = { src: flatImage, alt: item.title || fallbackName }
    }

    const media = item.media
    const video = item.video ?? media?.video ?? ""
    const isVideo = video.trim() !== "" || media?.type === "video"
    const image = flatImage ?? media?.image ?? fallback.media?.image
    const poster = media?.poster ?? image ?? fallback.media?.poster
    
    const isUnsetAlt = isUnsetItemText(item.alt, /^carousel poster(?:\s+\d+)?$/i)
    const isUnsetTitle = isUnsetItemText(item.title, /^project(?:\s+\d+)?$/i)
    const alt = isUnsetAlt ? poster?.alt || image?.alt || fallbackName : (item.alt as string)
    const title = isUnsetTitle ? fallbackName : (item.title as string)
    
    return { isVideo, image, poster, video, alt, title, link: item.link || "" }
}

function hasCollectionItemContent(value: MyComponentProps["collectionItem"]): boolean {
    if (!value) return false
    const hasTitle = typeof value.title === "string" && value.title.trim() !== ""
    const hasLink = typeof value.link === "string" && value.link.trim() !== ""
    const hasImage = typeof value.image === "string" ? value.image.trim() !== "" : (typeof value.image?.src === "string" && value.image.src.trim() !== "")
    const hasVideo = typeof value.video === "string" && value.video.trim() !== ""
    return hasTitle || hasLink || hasImage || hasVideo
}

interface RingItemProps {
    item: CarouselItem
    index: number
    itemCount: number
    itemWidth: number
    itemHeight: number
    radius: number
    ellipseHeight: number
    perspective: number
    rotation: MotionValue<number>
    sideScale: number
    safeFrontScale: number
    safeMinOpacity: number
    sideBlur: number
    cornerRadius: string
    faceAmount: number
    visibleArc: number
    showCenterPreview: boolean
    frontHandoff: number
    layer: "back" | "front"
    springTiltX: MotionValue<number>
    springTiltY: MotionValue<number>
    mouseTilt: boolean
    isStaticPreview: boolean
    tiltX: number
    tiltY: number
    tiltShift: number
    tiltShiftY: number
}

function RingItem(props: RingItemProps) {
    const {
        item,
        index,
        itemCount,
        itemWidth,
        itemHeight,
        radius,
        ellipseHeight,
        perspective,
        rotation,
        sideScale,
        safeFrontScale,
        safeMinOpacity,
        sideBlur,
        cornerRadius,
        faceAmount,
        visibleArc,
        showCenterPreview,
        frontHandoff,
        layer,
        springTiltX,
        springTiltY,
        mouseTilt,
        isStaticPreview,
        tiltX,
        tiltY,
        tiltShift,
        tiltShiftY,
    } = props

    const mediaData = resolveItemMedia(item, index)
    const baseAngle = (360 / itemCount) * index
    const angleFromFront = useTransform(rotation, (r) => normalizeAngle(baseAngle + r))
    const distanceFromFront = useTransform(angleFromFront, (a) => Math.abs(a))
    const thetaRadians = useTransform(angleFromFront, (a) => (a * Math.PI) / 180)
    const zDepth = useTransform(thetaRadians, (radians) => Math.cos(radians))
    const horizontalOffset = useTransform(thetaRadians, (radians) => Math.sin(radians) * radius)
    const verticalOffset = useTransform(
        zDepth,
        (z) => -((1 - z) / 2) * clamp(ellipseHeight, 0, 300)
    )
    const projectedScale = useTransform(zDepth, (z) => {
        const perspectiveFactor = Math.max(1.1, perspective / 220)
        const frontRaw = perspectiveFactor / (perspectiveFactor - 1)
        const backRaw = perspectiveFactor / (perspectiveFactor + 1)
        const raw = perspectiveFactor / (perspectiveFactor - z)
        const normalized = clamp((raw - backRaw) / Math.max(0.0001, frontRaw - backRaw), 0, 1)
        return sideScale + (safeFrontScale - sideScale) * normalized
    })
    const depthOpacity = useTransform(zDepth, (z) => {
        const normalized = clamp((z + 1) / 2, 0, 1)
        return safeMinOpacity + (1 - safeMinOpacity) * normalized
    })
    const arcOpacityFactor = useTransform(distanceFromFront, (d) => {
        const fadeRange = 30
        const safeVisibleArc = clamp(visibleArc, 60, 180)
        const fadeStart = Math.max(0, safeVisibleArc - fadeRange)
        if (d <= fadeStart) return 1
        if (d >= safeVisibleArc) return 0
        return 1 - (d - fadeStart) / Math.max(0.0001, safeVisibleArc - fadeStart)
    })
    const frontHandoffFactor = useTransform(distanceFromFront, (d) => {
        if (!showCenterPreview) return 1
        const safeFrontHandoff = clamp(frontHandoff, 0, 90)
        if (safeFrontHandoff <= 0) return 1
        const normalized = clamp(d / safeFrontHandoff, 0, 1)
        return Math.pow(normalized, 0.85)
    })
    const frontLayerFactor = useTransform(zDepth, (z) => {
        const t = clamp((z + 0.04) / 0.08, 0, 1)
        return t * t * (3 - 2 * t)
    })
    const layerOpacityFactor = useTransform(frontLayerFactor, (frontFactor) =>
        layer === "front" ? frontFactor : 1 - frontFactor
    )
    const finalOpacity = useTransform(
        [depthOpacity, arcOpacityFactor, frontHandoffFactor, layerOpacityFactor],
        (values) => {
            const [baseOpacity, arcFade, handoffFade, layerFade] = values as number[]
            return clamp(baseOpacity * arcFade * handoffFade * layerFade, 0, 1)
        }
    )
    const blurAmount = useTransform(zDepth, (z) => sideBlur * (1 - clamp((z + 1) / 2, 0, 1)))
    const blurFilter = useTransform(blurAmount, (b) => `blur(${b.toFixed(3)}px)`)
    const cardZIndex = useTransform(zDepth, (z) => Math.round((z + 1) * 1000))
    const cardRotateY = useTransform([thetaRadians, zDepth], (values) => {
        const [thetaRadiansValue, z] = values as number[]
        const maxYaw = 55
        const baseYaw = Math.sin(thetaRadiansValue) * maxYaw
        const frontness = Math.pow(clamp((z + 1) / 2, 0, 1), 2.5)
        return baseYaw * (1 - clamp(faceAmount, 0, 1) * frontness)
    })
    const parallaxFactor = useTransform(zDepth, (z) => 0.35 + 0.65 * clamp((z + 1) / 2, 0, 1))
    const parallaxX = useTransform([springTiltX, parallaxFactor], (values) => {
        const [tiltNormX, parallax] = values as number[]
        if (!mouseTilt || isStaticPreview) return 0
        return tiltNormX * clamp(tiltShift, 0, 120) * parallax
    })
    const parallaxY = useTransform([springTiltY, parallaxFactor], (values) => {
        const [tiltNormY, parallax] = values as number[]
        if (!mouseTilt || isStaticPreview) return 0
        return tiltNormY * clamp(tiltShiftY, 0, 120) * parallax
    })
    const composedX = useTransform([horizontalOffset, parallaxX], (values) => {
        const [ringX, pointerX] = values as number[]
        return ringX + pointerX
    })
    const composedY = useTransform([verticalOffset, parallaxY], (values) => {
        const [ringY, pointerY] = values as number[]
        return ringY + pointerY
    })
    const cardRotateX = useTransform([springTiltY, zDepth], (values) => {
        const [tiltNormY, z] = values as number[]
        if (!mouseTilt || isStaticPreview) return 0
        const frontFactor = 0.15 + 0.55 * clamp((z + 1) / 2, 0, 1)
        return tiltNormY * -clamp(tiltX, 0, 40) * frontFactor
    })
    const composedRotateY = useTransform([cardRotateY, springTiltX], (values) => {
        const [baseRotateY, tiltNormX] = values as number[]
        if (!mouseTilt || isStaticPreview) return baseRotateY
        return clamp(baseRotateY + tiltNormX * clamp(tiltY, 0, 40), -65, 65)
    })

    const poster = (
        <motion.img
            src={mediaData.poster?.src || mediaData.image?.src}
            srcSet={mediaData.poster?.srcSet || mediaData.image?.srcSet}
            alt={mediaData.alt}
            draggable={false}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: cornerRadius,
                opacity: finalOpacity,
                filter: blurFilter,
                scale: projectedScale,
                userSelect: "none",
            }}
        />
    )

    return (
        <motion.div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: itemWidth,
                height: itemHeight,
                transform: "translate(-50%, -50%)",
                zIndex: cardZIndex,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    x: composedX,
                    y: composedY,
                    rotateX: cardRotateX,
                    rotateY: composedRotateY,
                    pointerEvents: "none",
                }}
            >
                {poster}
            </motion.div>
        </motion.div>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function RingCarousel(props: MyComponentProps) {
    const {
        collectionItem,
        items = defaultItems,
        background = "transparent",
        ringGeometry,
        itemAppearance,
        centerPreviewSettings,
        interaction,
        mouseTiltSettings,
        titleBar,
        caseButton,
        responsive,
        mobileBreakpoint = 810,
        mobileDisableMouse = true,
        mobilePreviewWidthPercent = 90,
        mobileRingWidthPercent = 100,
    } = props
    const ringGeometryDefaults = {
        radius: 480,
        ellipseHeight: 110,
        perspective: 700,
        itemWidth: 126,
        aspect: 0.72,
        visibleArc: 180,
    }
    const itemAppearanceDefaults = {
        frontScale: 1,
        sideScale: 0.3,
        minOpacity: 0.85,
        sideBlur: 0,
        itemRadius: "0px",
        faceAmount: 0.55,
    }
    const centerPreviewSettingsDefaults = {
        centerPreview: true,
        previewWidth: 400,
        previewAspect: 0.86,
        previewRadius: "0px",
        previewShadow: false,
        previewClickThrough: true,
        frontHandoff: 0,
        fadeDuration: 0,
    }
    const interactionDefaults = {
        dragSense: 0.44,
        dragFriction: 0.8,
        snap: false,
        snapStrength: 0.45,
        wheelStrength: 0.6,
        autoRotate: false,
        autoSpeed: 9,
    }
    const mouseTiltSettingsDefaults = {
        mouseTilt: true,
        tiltX: 26,
        tiltY: 12,
        tiltShift: 40,
        tiltShiftY: 90,
        tiltSmooth: 0.65,
    }
    const titleBarDefaults = {
        show: true,
        font: {
            fontSize: "15px",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            fontWeight: 500,
            fontStyle: "normal" as const,
            textAlign: "left" as const,
        },
        titleColor: "#FFFFFF",
        barFill: "#000000",
        textTransform: "none" as const,
        textAlign: "left" as const,
        padding: "12px 14px",
    }
    const caseButtonDefaults = {
        show: true,
        label: "View Case",
        background: "#FFFFFF",
        textColor: "#000000",
        hoverBackground: "#000000",
        hoverTextColor: "#FFFFFF",
        hoverTransition: 0.2,
        radius: "0px",
        padding: "6px 10px",
        font: {
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
            fontWeight: 600,
            fontStyle: "normal" as const,
            textAlign: "center" as const,
        },
    }
    const responsiveDefaults = {
        enabled: true,
        referenceWidth: 1152,
        minScale: 0.3,
    }

    const mergedRingGeometry = { ...ringGeometryDefaults, ...(ringGeometry ?? {}) }
    const mergedItemAppearance = { ...itemAppearanceDefaults, ...(itemAppearance ?? {}) }
    const mergedCenterPreviewSettings = {
        ...centerPreviewSettingsDefaults,
        ...(centerPreviewSettings ?? {}),
    }
    const mergedInteraction = { ...interactionDefaults, ...(interaction ?? {}) }
    const mergedMouseTiltSettings = {
        ...mouseTiltSettingsDefaults,
        ...(mouseTiltSettings ?? {}),
    }
    const mergedTitleBar = {
        ...titleBarDefaults,
        ...(titleBar ?? {}),
        font: {
            ...titleBarDefaults.font,
            ...(titleBar?.font ?? {}),
        },
    }
    const mergedCaseButton = {
        ...caseButtonDefaults,
        ...(caseButton ?? {}),
        font: {
            ...caseButtonDefaults.font,
            ...(caseButton?.font ?? {}),
        },
    }
    const mergedResponsive = { ...responsiveDefaults, ...(responsive ?? {}) }
    const titleBarBackgroundColor = nonEmptyString(mergedTitleBar.barFill, "#000000")
    const titleBarTextColor = nonEmptyString(mergedTitleBar.titleColor, "#FFFFFF")
    const titleBarPadding = nonEmptyString(mergedTitleBar.padding, "12px 14px")
    const caseButtonLabel = nonEmptyString(mergedCaseButton.label, "View Case")
    const caseButtonBackground = nonEmptyString(mergedCaseButton.background, "#FFFFFF")
    const caseButtonTextColor = nonEmptyString(mergedCaseButton.textColor, "#000000")
    const caseButtonHoverBackground = nonEmptyString(mergedCaseButton.hoverBackground, "#000000")
    const caseButtonHoverTextColor = nonEmptyString(mergedCaseButton.hoverTextColor, "#FFFFFF")
    const caseButtonHoverTransition =
        typeof mergedCaseButton.hoverTransition === "number"
            ? clamp(mergedCaseButton.hoverTransition, 0, 1)
            : 0.2
    const caseButtonRadius = nonEmptyString(mergedCaseButton.radius, "0px")
    const caseButtonPadding = nonEmptyString(mergedCaseButton.padding, "6px 10px")

    const rawRadius = mergedRingGeometry.radius
    const rawEllipseHeight = mergedRingGeometry.ellipseHeight
    const perspective = mergedRingGeometry.perspective
    const rawItemWidth = mergedRingGeometry.itemWidth
    const itemAspectRatio = mergedRingGeometry.aspect
    const visibleArc = mergedRingGeometry.visibleArc

    const frontScale = mergedItemAppearance.frontScale
    const sideScale = mergedItemAppearance.sideScale
    const minOpacity = mergedItemAppearance.minOpacity
    const sideBlur = mergedItemAppearance.sideBlur
    const cornerRadius = mergedItemAppearance.itemRadius
    const faceAmount = mergedItemAppearance.faceAmount

    const showCenterPreview = mergedCenterPreviewSettings.centerPreview
    const rawCenterPreviewWidth = mergedCenterPreviewSettings.previewWidth
    const centerPreviewAspect = mergedCenterPreviewSettings.previewAspect
    const centerPreviewRadius = mergedCenterPreviewSettings.previewRadius
    const centerPreviewShadow = mergedCenterPreviewSettings.previewShadow
    const frontHandoff = mergedCenterPreviewSettings.frontHandoff
    const previewFadeDuration = mergedCenterPreviewSettings.fadeDuration
    const previewClickThrough = mergedCenterPreviewSettings.previewClickThrough
    const responsiveEnabled = mergedResponsive.enabled
    const responsiveReferenceWidth = Math.max(1, mergedResponsive.referenceWidth)
    const responsiveMinScale = clamp(mergedResponsive.minScale, 0.2, 1)

    const dragSensitivity = mergedInteraction.dragSense
    const dragFriction = mergedInteraction.dragFriction
    const snapToItem = mergedInteraction.snap
    const snapStrength = mergedInteraction.snapStrength
    const wheelStrength = mergedInteraction.wheelStrength
    const autoRotate = mergedInteraction.autoRotate
    const autoRotateSpeed = mergedInteraction.autoSpeed

    const mouseTilt = mergedMouseTiltSettings.mouseTilt
    const tiltX = mergedMouseTiltSettings.tiltX
    const tiltY = mergedMouseTiltSettings.tiltY
    const tiltShift = mergedMouseTiltSettings.tiltShift
    const tiltShiftY = mergedMouseTiltSettings.tiltShiftY
    const tiltSmoothing = mergedMouseTiltSettings.tiltSmooth

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const [measuredContainerWidth, setMeasuredContainerWidth] = React.useState(() => {
        if (typeof window !== "undefined" && Number.isFinite(window.innerWidth) && window.innerWidth > 0) {
            return window.innerWidth
        }
        return responsiveReferenceWidth
    })
    const [hasMeasured, setHasMeasured] = React.useState(false)
    const isInView = useInView(containerRef, { amount: 0.2 })
    const isStaticRenderer = useIsStaticRenderer()
    const renderTarget = RenderTarget.current()
    const isCanvasLikeTarget =
        renderTarget === RenderTarget.canvas ||
        renderTarget === RenderTarget.export ||
        renderTarget === RenderTarget.thumbnail
    const isStaticPreview = isStaticRenderer || isCanvasLikeTarget

    useIsomorphicLayoutEffect(() => {
        if (typeof window === "undefined") return
        const element = containerRef.current
        if (!element) return
        const width = element.getBoundingClientRect().width
        if (!Number.isFinite(width) || width <= 0) return
        React.startTransition(() => {
            setMeasuredContainerWidth(width)
            setHasMeasured(true)
        })
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const element = containerRef.current
        if (!element) return
        const readWidth = () => {
            const width = element.getBoundingClientRect().width
            if (!Number.isFinite(width) || width <= 0) return
            React.startTransition(() => {
                setMeasuredContainerWidth(width)
                setHasMeasured(true)
            })
        }
        readWidth()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() => {
            readWidth()
        })
        observer.observe(element)
        return () => {
            observer.disconnect()
        }
    }, [responsiveReferenceWidth])

    const responsiveScale = React.useMemo(() => {
        if (!responsiveEnabled) return 1
        const ratio = measuredContainerWidth / responsiveReferenceWidth
        return clamp(ratio, responsiveMinScale, 1)
    }, [
        measuredContainerWidth,
        responsiveEnabled,
        responsiveMinScale,
        responsiveReferenceWidth,
    ])
    const isMobileMode = measuredContainerWidth <= mobileBreakpoint
    const safeMobileRingWidthPercent = clamp(mobileRingWidthPercent, 50, 140)
    const safeMobilePreviewWidthPercent = clamp(mobilePreviewWidthPercent, 50, 100)
    const baseRadius = rawRadius * responsiveScale
    const baseEllipseHeight = rawEllipseHeight * responsiveScale
    const baseItemWidth = rawItemWidth * responsiveScale
    const mobileRadius = (measuredContainerWidth * safeMobileRingWidthPercent) / 100 / 2
    const mobileRingScale = baseRadius > 0 ? mobileRadius / baseRadius : 1
    const radius = isMobileMode ? mobileRadius : baseRadius
    const ellipseHeight = isMobileMode ? baseEllipseHeight * mobileRingScale : baseEllipseHeight
    const itemWidth = isMobileMode ? baseItemWidth * mobileRingScale : baseItemWidth
    const itemHeight = itemWidth / Math.max(itemAspectRatio, 0.1)
    const baseScaledPreviewWidth = rawCenterPreviewWidth * responsiveScale
    const maxPreviewWidthByContainer = measuredContainerWidth * 0.86
    const preferredResponsivePreviewWidth = Math.min(
        rawCenterPreviewWidth,
        maxPreviewWidthByContainer
    )
    const centerPreviewWidth = isMobileMode
        ? (measuredContainerWidth * safeMobilePreviewWidthPercent) / 100
        : responsiveEnabled
          ? Math.max(baseScaledPreviewWidth, preferredResponsivePreviewWidth)
          : rawCenterPreviewWidth
    const centerPreviewHeight = centerPreviewWidth / Math.max(centerPreviewAspect, 0.1)
    const disableMouseInMobileMode = isMobileMode && mobileDisableMouse
    const shouldRenderSizedContent = isStaticPreview || hasMeasured

    const rotation = useMotionValue(0)
    const pointerXNormalized = useMotionValue(0)
    const pointerYNormalized = useMotionValue(0)
    const rotationStep = React.useMemo(
        () => (items.length > 0 ? 360 / items.length : 360),
        [items.length]
    )
    const tiltSpringConfig = React.useMemo(() => {
        const normalizedSmoothing = clamp(tiltSmoothing, 0, 1)
        return {
            stiffness: 420 - normalizedSmoothing * 300,
            damping: 20 + normalizedSmoothing * 22,
            mass: 0.8 + normalizedSmoothing * 0.45,
            restDelta: 0.001,
            restSpeed: 0.001,
        }
    }, [tiltSmoothing])
    const springTiltX = useSpring(pointerXNormalized, tiltSpringConfig)
    const springTiltY = useSpring(pointerYNormalized, tiltSpringConfig)
    const dragStateRef = React.useRef({
        active: false,
        pointerId: -1,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastTime: 0,
        hasCaptured: false,
        velocitySamples: [] as Array<{ t: number; v: number }>,
    })

    const inertiaStopRef = React.useRef<(() => void) | null>(null)
    const wheelVelocityRef = React.useRef(0)
    const wheelSnapPendingRef = React.useRef(false)
    const previewPressRef = React.useRef({
        pointerId: -1,
        startX: 0,
        startY: 0,
        startTime: 0,
        maxDistance: 0,
        hadMovement: false,
    })
    const [isDragging, setIsDragging] = React.useState(false)
    const [isCaseButtonHovered, setIsCaseButtonHovered] = React.useState(false)

    const stopInertia = React.useCallback(() => {
        if (inertiaStopRef.current) {
            inertiaStopRef.current()
            inertiaStopRef.current = null
        }
    }, [])

    const snapToNearest = React.useCallback(
        (initialVelocity = 0) => {
            if (!snapToItem || items.length <= 1) return
            stopInertia()
            const safeSnapStrength = clamp(snapStrength, 0, 1)
            inertiaStopRef.current = animate(rotation, Math.round(rotation.get() / rotationStep) * rotationStep, {
                type: "spring",
                stiffness: 140 + safeSnapStrength * 280,
                damping: 28 + safeSnapStrength * 18,
                mass: 0.9 + (1 - safeSnapStrength) * 0.45,
                velocity: initialVelocity,
            }).stop
        },
        [items.length, rotation, rotationStep, snapStrength, snapToItem, stopInertia]
    )

    const startInertia = React.useCallback(
        (velocity: number) => {
            stopInertia()
            const safeFriction = clamp(dragFriction, 0.1, 1)
            const speed = Math.abs(velocity)
            const lowVelocityThreshold = 18
            if (snapToItem && speed < lowVelocityThreshold) {
                snapToNearest(velocity)
                return
            }
            inertiaStopRef.current = animate(rotation, rotation.get(), {
                type: "inertia",
                velocity,
                power: 0.2 + safeFriction * 0.8,
                timeConstant: 160 + safeFriction * 700,
                bounceStiffness: 120,
                bounceDamping: 18,
                modifyTarget: (target) => {
                    if (!snapToItem || items.length <= 1) return target
                    return Math.round(target / rotationStep) * rotationStep
                },
            }).stop
        },
        [dragFriction, items.length, rotation, rotationStep, snapToItem, snapToNearest, stopInertia]
    )

    const onPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticPreview) return
            if (disableMouseInMobileMode && event.pointerType === "mouse") return
            stopInertia()
            wheelVelocityRef.current = 0
            wheelSnapPendingRef.current = false
            const now = typeof performance !== "undefined" ? performance.now() : Date.now()
            dragStateRef.current = {
                active: true,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                lastX: event.clientX,
                lastTime: now,
                hasCaptured: false,
                velocitySamples: [],
            }
            React.startTransition(() => setIsDragging(true))
        },
        [disableMouseInMobileMode, isStaticPreview, stopInertia]
    )

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (disableMouseInMobileMode && event.pointerType === "mouse") return
            if (!isStaticPreview && mouseTilt && !disableMouseInMobileMode) {
                const rect = event.currentTarget.getBoundingClientRect()
                const normalizedX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1)
                const normalizedY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1)
                pointerXNormalized.set(normalizedX)
                pointerYNormalized.set(normalizedY)
            }
            const state = dragStateRef.current
            if (!state.active || state.pointerId !== event.pointerId || isStaticPreview) return
            const captureThresholdPx = 5
            if (!state.hasCaptured && event.currentTarget.setPointerCapture) {
                const dragDistance = Math.hypot(
                    event.clientX - state.startX,
                    event.clientY - state.startY
                )
                if (dragDistance > captureThresholdPx) {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    state.hasCaptured = true
                }
            }
            const now = typeof performance !== "undefined" ? performance.now() : Date.now()
            const dx = event.clientX - state.lastX
            const dt = Math.max(1, now - state.lastTime)
            const degreesDelta = dx * dragSensitivity
            rotation.set(rotation.get() + degreesDelta)
            const instantaneousVelocity = (degreesDelta / dt) * 1000
            const nextSamples = [...state.velocitySamples, { t: now, v: instantaneousVelocity }].filter(
                (sample) => now - sample.t <= 120
            )
            state.velocitySamples = nextSamples
            state.lastX = event.clientX
            state.lastTime = now
            dragStateRef.current = state
        },
        [
            disableMouseInMobileMode,
            dragSensitivity,
            isStaticPreview,
            mouseTilt,
            pointerXNormalized,
            pointerYNormalized,
            rotation,
        ]
    )

    const onPointerUp = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const state = dragStateRef.current
            if (!state.active || state.pointerId !== event.pointerId || isStaticPreview) return
            dragStateRef.current.active = false
            if (state.hasCaptured && event.currentTarget.releasePointerCapture) {
                event.currentTarget.releasePointerCapture(event.pointerId)
            }
            React.startTransition(() => setIsDragging(false))
            const now = typeof performance !== "undefined" ? performance.now() : Date.now()
            const recentSamples = state.velocitySamples.filter((sample) => now - sample.t <= 120)
            const averagedVelocity =
                recentSamples.length > 0
                    ? recentSamples.reduce((acc, sample) => acc + sample.v, 0) / recentSamples.length
                    : 0
            startInertia(averagedVelocity)
        },
        [isStaticPreview, startInertia]
    )

    const onPointerCancel = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const state = dragStateRef.current
            if (!state.active || state.pointerId !== event.pointerId || isStaticPreview) return
            if (!state.hasCaptured) return
            dragStateRef.current.active = false
            if (event.currentTarget.releasePointerCapture) {
                event.currentTarget.releasePointerCapture(event.pointerId)
            }
            React.startTransition(() => setIsDragging(false))
            startInertia(0)
        },
        [isStaticPreview, startInertia]
    )

    const onPointerLeave = React.useCallback(() => {
        pointerXNormalized.set(0)
        pointerYNormalized.set(0)
    }, [pointerXNormalized, pointerYNormalized])

    const onWheel = React.useCallback(
        (event: React.WheelEvent<HTMLDivElement>) => {
            if (isStaticPreview) return
            if (disableMouseInMobileMode) return
            event.preventDefault()
            stopInertia()
            if (wheelStrength <= 0) return
            const dominantDelta =
                Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
            const impulseDegrees = -dominantDelta * dragSensitivity * 0.22 * clamp(wheelStrength, 0, 4)
            wheelVelocityRef.current += impulseDegrees * 45
            wheelSnapPendingRef.current = snapToItem
        },
        [
            disableMouseInMobileMode,
            dragSensitivity,
            isStaticPreview,
            snapToItem,
            stopInertia,
            wheelStrength,
        ]
    )

    useAnimationFrame((_, deltaMs) => {
        if (isStaticPreview) return
        const deltaSeconds = deltaMs / 1000
        const epsilonVelocity = 0.2
        const safeFriction = clamp(dragFriction, 0.1, 1)
        const decayLambda = 0.8 + (1 - safeFriction) * 9

        if (Math.abs(wheelVelocityRef.current) > epsilonVelocity) {
            rotation.set(rotation.get() + wheelVelocityRef.current * deltaSeconds)
            wheelVelocityRef.current *= Math.exp(-decayLambda * deltaSeconds)
        } else if (wheelVelocityRef.current !== 0) {
            wheelVelocityRef.current = 0
            if (wheelSnapPendingRef.current && snapToItem) {
                wheelSnapPendingRef.current = false
                snapToNearest()
            }
        } else if (wheelSnapPendingRef.current) {
            if (snapToItem) snapToNearest()
            wheelSnapPendingRef.current = false
        }

        if (!autoRotate || isDragging || !isInView) return
        rotation.set(rotation.get() + autoRotateSpeed * deltaSeconds)
    })

    React.useEffect(() => {
        if (!mouseTilt || isStaticPreview || disableMouseInMobileMode) {
            pointerXNormalized.set(0)
            pointerYNormalized.set(0)
        }
    }, [
        disableMouseInMobileMode,
        isStaticPreview,
        mouseTilt,
        pointerXNormalized,
        pointerYNormalized,
    ])

    React.useEffect(() => {
        return () => {
            stopInertia()
        }
    }, [stopInertia])

    const previewLinkThresholdPx = 6
    const onPreviewPointerDown = React.useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now()
        previewPressRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startTime: now,
            maxDistance: 0,
            hadMovement: false,
        }
    }, [])

    const onPreviewPointerMove = React.useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
        const state = previewPressRef.current
        if (state.pointerId !== event.pointerId) return
        const dx = event.clientX - state.startX
        const dy = event.clientY - state.startY
        const distance = Math.hypot(dx, dy)
        state.maxDistance = Math.max(state.maxDistance, distance)
        if (distance > 1) state.hadMovement = true
        previewPressRef.current = state
    }, [])

    const onPreviewPointerEnd = React.useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
        const state = previewPressRef.current
        if (state.pointerId !== event.pointerId) return
        previewPressRef.current = { ...state, pointerId: -1 }
    }, [])

    const onPreviewClick = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
        const state = previewPressRef.current
        const exceededDistance = state.maxDistance > previewLinkThresholdPx
        if (exceededDistance) {
            event.preventDefault()
        }
    }, [])
    const preventNativeDrag = React.useCallback((event: React.DragEvent<HTMLElement>) => {
        event.preventDefault()
    }, [])

    const safeFrontScale = Math.max(frontScale, sideScale)
    const safeMinOpacity = clamp(minOpacity, 0, 1)
    const collectionItems = React.useMemo<CarouselItem[] | null>(() => {
        if (!hasCollectionItemContent(collectionItem)) return null
        const fallback = defaultItems[0]
        const title = nonEmptyString(collectionItem?.title, fallback.title || "")
        const link = typeof collectionItem?.link === "string" ? collectionItem.link : ""
        let image = collectionItem?.image
        if (typeof image === "string") {
            image = { src: image, alt: title }
        } else if (!image?.src) {
            image = fallback.media?.image
        }
        const video = typeof collectionItem?.video === "string" ? collectionItem.video : ""

        return [
            {
                title,
                link,
                image,
                video,
                alt: typeof image === "object" ? image?.alt || title : title,
                media: {
                    type: "image",
                    image: typeof image === "object" ? image : { src: image, alt: title },
                    poster: typeof image === "object" ? image : { src: image, alt: title },
                    video: video,
                },
            },
        ]
    }, [collectionItem])
    const activeItems = collectionItems ?? (items.length > 0 ? items : defaultItems)
    const [activeIndex, setActiveIndex] = React.useState(0)
    const activeIndexRef = React.useRef(0)

    React.useEffect(() => {
        if (activeItems.length <= 0) return
        if (isStaticPreview) {
            activeIndexRef.current = 0
            React.startTransition(() => setActiveIndex(0))
            return
        }

        const step = 360 / activeItems.length
        const hysteresisDegrees = 2
        const updateActiveFromRotation = (rotationValue: number) => {
            let nearestIndex = 0
            let nearestDistance = Number.POSITIVE_INFINITY
            for (let i = 0; i < activeItems.length; i++) {
                const distance = Math.abs(normalizeAngle(i * step + rotationValue))
                if (distance < nearestDistance) {
                    nearestDistance = distance
                    nearestIndex = i
                }
            }

            const currentIndex = activeIndexRef.current
            const currentDistance = Math.abs(normalizeAngle(currentIndex * step + rotationValue))
            if (
                nearestIndex !== currentIndex &&
                nearestDistance + hysteresisDegrees < currentDistance
            ) {
                activeIndexRef.current = nearestIndex
                React.startTransition(() => setActiveIndex(nearestIndex))
            }
        }

        updateActiveFromRotation(rotation.get())
        const unsubscribe = rotation.on("change", updateActiveFromRotation)
        return () => {
            unsubscribe()
        }
    }, [activeItems.length, isStaticPreview, rotation])

    const centerItem = activeItems[activeIndex] ?? activeItems[0]
    const centerMedia = resolveItemMedia(centerItem, activeIndex)
    const centeredLink = centerMedia.link.trim()
    const canLinkCenterPreview = previewClickThrough && !isStaticPreview && centeredLink !== ""
    const previewCursor = canLinkCenterPreview ? (isDragging ? "grabbing" : "pointer") : undefined
    const titleBarElement = mergedTitleBar.show ? (
        <div
            style={{
                background: titleBarBackgroundColor,
                backgroundColor: titleBarBackgroundColor,
                color: titleBarTextColor,
                textTransform: mergedTitleBar.textTransform,
                textAlign: mergedTitleBar.textAlign,
                padding: titleBarPadding,
                fontFamily: mergedTitleBar.font.fontFamily,
                fontSize: mergedTitleBar.font.fontSize,
                fontWeight: mergedTitleBar.font.fontWeight,
                fontStyle: mergedTitleBar.font.fontStyle,
                lineHeight: mergedTitleBar.font.lineHeight,
                letterSpacing: mergedTitleBar.font.letterSpacing,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
            }}
        >
            <span
                style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {centerMedia.title}
            </span>
            {mergedCaseButton.show && (
                <a
                    href={centerMedia.link || undefined}
                    onMouseEnter={() => {
                        if (disableMouseInMobileMode) return
                        React.startTransition(() => setIsCaseButtonHovered(true))
                    }}
                    onMouseLeave={() => {
                        if (disableMouseInMobileMode) return
                        React.startTransition(() => setIsCaseButtonHovered(false))
                    }}
                    onPointerLeave={() => {
                        if (disableMouseInMobileMode) return
                        React.startTransition(() => setIsCaseButtonHovered(false))
                    }}
                    onBlur={() => {
                        React.startTransition(() => setIsCaseButtonHovered(false))
                    }}
                    onPointerDown={(event) => {
                        event.stopPropagation()
                    }}
                    onClick={(event) => {
                        event.stopPropagation()
                    }}
                    style={{
                        pointerEvents: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isCaseButtonHovered
                            ? caseButtonHoverBackground
                            : caseButtonBackground,
                        backgroundColor: isCaseButtonHovered
                            ? caseButtonHoverBackground
                            : caseButtonBackground,
                        color: isCaseButtonHovered ? caseButtonHoverTextColor : caseButtonTextColor,
                        border: "none",
                        borderRadius: caseButtonRadius,
                        padding: caseButtonPadding,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        cursor: "pointer",
                        transition: `background ${caseButtonHoverTransition}s ease, color ${caseButtonHoverTransition}s ease`,
                        fontFamily: mergedCaseButton.font.fontFamily,
                        fontSize: mergedCaseButton.font.fontSize,
                        fontWeight: mergedCaseButton.font.fontWeight,
                        fontStyle: mergedCaseButton.font.fontStyle,
                        lineHeight: mergedCaseButton.font.lineHeight,
                        letterSpacing: mergedCaseButton.font.letterSpacing,
                    }}
                    aria-label={`${caseButtonLabel} - ${centerMedia.title}`}
                >
                    {caseButtonLabel}
                </a>
            )}
        </div>
    ) : null
    const renderRingLayer = (layer: "back" | "front", zIndex: number) => (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${perspective}px`,
                transformStyle: "preserve-3d",
                overflow: "hidden",
                zIndex,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        pointerEvents: "none",
                    }}
                >
                    {activeItems.map((item, index) => (
                        <RingItem
                            key={`${layer}-${index}`}
                            item={item}
                            index={index}
                            itemCount={activeItems.length}
                            itemWidth={itemWidth}
                            itemHeight={itemHeight}
                            radius={radius}
                            ellipseHeight={ellipseHeight}
                            perspective={perspective}
                            rotation={rotation}
                            sideScale={sideScale}
                            safeFrontScale={safeFrontScale}
                            safeMinOpacity={safeMinOpacity}
                            sideBlur={sideBlur}
                            cornerRadius={cornerRadius}
                            faceAmount={faceAmount}
                            visibleArc={visibleArc}
                            showCenterPreview={showCenterPreview}
                            frontHandoff={frontHandoff}
                            layer={layer}
                            springTiltX={springTiltX}
                            springTiltY={springTiltY}
                            mouseTilt={mouseTilt && !disableMouseInMobileMode}
                            isStaticPreview={isStaticPreview}
                            tiltX={tiltX}
                            tiltY={tiltY}
                            tiltShift={tiltShift}
                            tiltShiftY={tiltShiftY}
                        />
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background,
                userSelect: "none",
                cursor: isStaticPreview ? "default" : isDragging ? "grabbing" : "grab",
                touchAction: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerLeave={onPointerLeave}
            onWheel={onWheel}
            role="region"
            aria-label="3D media ring carousel"
        >
            {shouldRenderSizedContent && renderRingLayer("back", 0)}
            {shouldRenderSizedContent && showCenterPreview && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: centerPreviewWidth,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: canLinkCenterPreview ? "auto" : "none",
                        cursor: previewCursor,
                        zIndex: 1,
                    }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={`${activeIndex}-${centerMedia.video || centerMedia.image?.src || centerMedia.poster?.src || "fallback"}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: clamp(previewFadeDuration, 0, 1), ease: "linear" }}
                            style={{
                                position: "relative",
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: centerPreviewRadius,
                                overflow: "hidden",
                                boxShadow: centerPreviewShadow ? "0px 24px 60px rgba(0,0,0,0.24)" : "none",
                                pointerEvents: canLinkCenterPreview ? "auto" : "none",
                            }}
                        >
                            {centerMedia.isVideo && centerMedia.video ? (
                                <>
                                    <div
                                        style={{
                                            width: "100%",
                                            aspectRatio: `${Math.max(centerPreviewAspect, 0.1)}`,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {canLinkCenterPreview ? (
                                            <a
                                                href={centeredLink}
                                                draggable={false}
                                                onPointerDown={onPreviewPointerDown}
                                                onPointerMove={onPreviewPointerMove}
                                                onPointerUp={onPreviewPointerEnd}
                                                onPointerCancel={onPreviewPointerEnd}
                                                onClick={onPreviewClick}
                                                onDragStart={preventNativeDrag}
                                                style={{
                                                    display: "block",
                                                    width: "100%",
                                                    height: "100%",
                                                    pointerEvents: "auto",
                                                    cursor: previewCursor,
                                                    touchAction: "none",
                                                    ["WebkitUserDrag" as any]: "none",
                                                    userSelect: "none",
                                                }}
                                                aria-label={`Open ${centerMedia.title}`}
                                            >
                                                <video
                                                    src={centerMedia.video}
                                                    poster={centerMedia.poster?.src}
                                                    draggable={false}
                                                    onDragStart={preventNativeDrag}
                                                    muted
                                                    loop
                                                    playsInline
                                                    autoPlay
                                                    preload="metadata"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        userSelect: "none",
                                                    }}
                                                />
                                            </a>
                                        ) : (
                                            <video
                                                src={centerMedia.video}
                                                poster={centerMedia.poster?.src}
                                                muted
                                                loop
                                                playsInline
                                                autoPlay
                                                preload="metadata"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    userSelect: "none",
                                                }}
                                            />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div
                                        style={{
                                            width: "100%",
                                            aspectRatio: `${Math.max(centerPreviewAspect, 0.1)}`,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {canLinkCenterPreview ? (
                                            <a
                                                href={centeredLink}
                                                draggable={false}
                                                onPointerDown={onPreviewPointerDown}
                                                onPointerMove={onPreviewPointerMove}
                                                onPointerUp={onPreviewPointerEnd}
                                                onPointerCancel={onPreviewPointerEnd}
                                                onClick={onPreviewClick}
                                                onDragStart={preventNativeDrag}
                                                style={{
                                                    display: "block",
                                                    width: "100%",
                                                    height: "100%",
                                                    pointerEvents: "auto",
                                                    cursor: previewCursor,
                                                    touchAction: "none",
                                                    ["WebkitUserDrag" as any]: "none",
                                                    userSelect: "none",
                                                }}
                                                aria-label={`Open ${centerMedia.title}`}
                                            >
                                                <img
                                                    src={centerMedia.image?.src || centerMedia.poster?.src}
                                                    srcSet={centerMedia.image?.srcSet || centerMedia.poster?.srcSet}
                                                    alt={centerMedia.alt}
                                                    draggable={false}
                                                    onDragStart={preventNativeDrag}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        userSelect: "none",
                                                    }}
                                                />
                                            </a>
                                        ) : (
                                            <img
                                                src={centerMedia.image?.src || centerMedia.poster?.src}
                                                srcSet={centerMedia.image?.srcSet || centerMedia.poster?.srcSet}
                                                alt={centerMedia.alt}
                                                draggable={false}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    userSelect: "none",
                                                }}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
            {shouldRenderSizedContent && renderRingLayer("front", 2)}
            {shouldRenderSizedContent && showCenterPreview && mergedTitleBar.show && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: `calc(50% - ${centerPreviewHeight / 2}px)`,
                        width: centerPreviewWidth,
                        transform: "translate(-50%, -100%)",
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={`title-${activeIndex}-${centerMedia.title}-${centerMedia.link || "nolink"}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: clamp(previewFadeDuration, 0, 1), ease: "linear" }}
                            style={{ pointerEvents: "none" }}
                        >
                            {titleBarElement}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

addPropertyControls(RingCarousel, {
    collectionItem: {
        type: ControlType.Object,
        title: "CMS Item",
        defaultValue: {
            title: "",
            link: "",
        },
        controls: {
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "",
            },
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
            },
            video: {
                type: ControlType.File,
                title: "Video File",
                allowedFileTypes: ["mp4", "webm", "mov"],
            },
            link: {
                type: ControlType.Link,
                title: "Link",
                defaultValue: "",
            },
        },
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        defaultValue: defaultItems,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                video: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
                media: {
                    type: ControlType.Object,
                    title: "Media (Legacy)",
                    controls: {
                        type: {
                            type: ControlType.Enum,
                            title: "Type",
                            options: ["image", "video"],
                            optionTitles: ["Image", "Video"],
                            displaySegmentedControl: true,
                            defaultValue: "image",
                        },
                        image: {
                            type: ControlType.ResponsiveImage,
                            title: "Image",
                        },
                        video: {
                            type: ControlType.File,
                            title: "Video",
                            allowedFileTypes: ["mp4", "webm", "mov"],
                        },
                        poster: {
                            type: ControlType.ResponsiveImage,
                            title: "Poster",
                        },
                    },
                },
            },
        },
        maxCount: 24,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
    ringGeometry: {
        type: ControlType.Object,
        title: "Ring & Geometry",
        defaultValue: {
            radius: 480,
            ellipseHeight: 110,
            perspective: 700,
            itemWidth: 126,
            aspect: 0.72,
            visibleArc: 180,
        },
        controls: {
            radius: { type: ControlType.Number, defaultValue: 480, min: 140, max: 900, step: 1, unit: "px" },
            ellipseHeight: { type: ControlType.Number, defaultValue: 110, min: 0, max: 300, step: 1, unit: "px" },
            perspective: { type: ControlType.Number, defaultValue: 700, min: 300, max: 2800, step: 1, unit: "px" },
            itemWidth: { type: ControlType.Number, defaultValue: 126, min: 120, max: 720, step: 1, unit: "px" },
            aspect: { type: ControlType.Number, defaultValue: 0.72, min: 0.4, max: 1.6, step: 0.01 },
            visibleArc: { type: ControlType.Number, defaultValue: 180, min: 60, max: 180, step: 1, unit: "°" },
        },
    },
    itemAppearance: {
        type: ControlType.Object,
        title: "Item Appearance",
        defaultValue: {
            frontScale: 1,
            sideScale: 0.3,
            minOpacity: 0.85,
            sideBlur: 0,
            itemRadius: "0px",
            faceAmount: 0.55,
        },
        controls: {
            frontScale: { type: ControlType.Number, defaultValue: 1, min: 0.6, max: 1.8, step: 0.01 },
            sideScale: { type: ControlType.Number, defaultValue: 0.3, min: 0.1, max: 0.9, step: 0.01 },
            minOpacity: { type: ControlType.Number, defaultValue: 0.85, min: 0, max: 1, step: 0.01 },
            sideBlur: { type: ControlType.Number, defaultValue: 0, min: 0, max: 24, step: 0.1, unit: "px" },
            itemRadius: { type: ControlType.BorderRadius, title: "Item Radius", defaultValue: "0px" },
            faceAmount: { type: ControlType.Number, defaultValue: 0.55, min: 0, max: 1, step: 0.01 },
        },
    },
    centerPreviewSettings: {
        type: ControlType.Object,
        title: "Center Preview",
        defaultValue: {
            centerPreview: true,
            previewWidth: 400,
            previewAspect: 0.86,
            previewRadius: "0px",
            previewShadow: false,
            previewClickThrough: true,
            frontHandoff: 0,
            fadeDuration: 0,
        },
        controls: {
            centerPreview: { type: ControlType.Boolean, defaultValue: true },
            previewWidth: { type: ControlType.Number, defaultValue: 400, min: 160, max: 960, step: 1, unit: "px" },
            previewAspect: { type: ControlType.Number, defaultValue: 0.86, min: 0.4, max: 1.6, step: 0.01 },
            previewRadius: { type: ControlType.BorderRadius, defaultValue: "0px" },
            previewShadow: { type: ControlType.Boolean, defaultValue: false },
            previewClickThrough: { type: ControlType.Boolean, defaultValue: true },
            frontHandoff: { type: ControlType.Number, defaultValue: 0, min: 0, max: 90, step: 1, unit: "°" },
            fadeDuration: { type: ControlType.Number, defaultValue: 0, min: 0, max: 1, step: 0.01, unit: "s" },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        defaultValue: {
            dragSense: 0.44,
            dragFriction: 0.8,
            snap: false,
            snapStrength: 0.45,
            wheelStrength: 0.6,
            autoRotate: false,
            autoSpeed: 9,
        },
        controls: {
            dragSense: { type: ControlType.Number, defaultValue: 0.44, min: 0.02, max: 1.2, step: 0.01 },
            dragFriction: { type: ControlType.Number, defaultValue: 0.8, min: 0.1, max: 1, step: 0.01 },
            snap: { type: ControlType.Boolean, defaultValue: false },
            snapStrength: { type: ControlType.Number, defaultValue: 0.45, min: 0, max: 1, step: 0.01 },
            wheelStrength: { type: ControlType.Number, defaultValue: 0.6, min: 0, max: 4, step: 0.05 },
            autoRotate: { type: ControlType.Boolean, defaultValue: false },
            autoSpeed: { type: ControlType.Number, defaultValue: 9, min: -60, max: 60, step: 0.1, unit: "°/s" },
        },
    },
    mouseTiltSettings: {
        type: ControlType.Object,
        title: "Mouse Tilt",
        defaultValue: {
            mouseTilt: true,
            tiltX: 26,
            tiltY: 12,
            tiltShift: 40,
            tiltShiftY: 90,
            tiltSmooth: 0.65,
        },
        controls: {
            mouseTilt: { type: ControlType.Boolean, defaultValue: true },
            tiltX: { type: ControlType.Number, defaultValue: 26, min: 0, max: 40, step: 1, unit: "°" },
            tiltY: { type: ControlType.Number, defaultValue: 12, min: 0, max: 40, step: 1, unit: "°" },
            tiltShift: { type: ControlType.Number, defaultValue: 40, min: 0, max: 120, step: 1, unit: "px" },
            tiltShiftY: { type: ControlType.Number, defaultValue: 90, min: 0, max: 120, step: 1, unit: "px" },
            tiltSmooth: { type: ControlType.Number, defaultValue: 0.65, min: 0, max: 1, step: 0.01 },
        },
    },
    titleBar: {
        type: ControlType.Object,
        title: "Title Bar",
        defaultValue: {
            show: true,
            font: {
                fontSize: "15px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
                textAlign: "left",
            },
            titleColor: "#FFFFFF",
            barFill: "#000000",
            textTransform: "none",
            textAlign: "left",
            padding: "12px 14px",
        },
        controls: {
            show: { type: ControlType.Boolean, defaultValue: true },
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                    textAlign: "left",
                },
            },
            titleColor: { type: ControlType.Color, defaultValue: "#FFFFFF" },
            barFill: { type: ControlType.Color, defaultValue: "#000000" },
            textTransform: {
                type: ControlType.Enum,
                defaultValue: "none",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Upper", "Lower", "Capitalize"],
            },
            textAlign: {
                type: ControlType.Enum,
                defaultValue: "left",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            padding: { type: ControlType.Padding, defaultValue: "12px 14px" },
        },
    },
    caseButton: {
        type: ControlType.Object,
        title: "Case Button",
        defaultValue: {
            show: true,
            label: "View Case",
            background: "#FFFFFF",
            textColor: "#000000",
            hoverBackground: "#000000",
            hoverTextColor: "#FFFFFF",
            hoverTransition: 0.2,
            radius: "0px",
            padding: "6px 10px",
            font: {
                fontSize: "14px",
                variant: "Semibold",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
                textAlign: "center",
            },
        },
        controls: {
            show: { type: ControlType.Boolean, defaultValue: true },
            label: { type: ControlType.String, defaultValue: "View Case" },
            background: { type: ControlType.Color, defaultValue: "#FFFFFF" },
            textColor: { type: ControlType.Color, defaultValue: "#000000" },
            hoverBackground: { type: ControlType.Color, defaultValue: "#000000" },
            hoverTextColor: { type: ControlType.Color, defaultValue: "#FFFFFF" },
            hoverTransition: {
                type: ControlType.Number,
                defaultValue: 0.2,
                min: 0,
                max: 1,
                step: 0.01,
                unit: "s",
            },
            radius: { type: ControlType.BorderRadius, defaultValue: "0px" },
            padding: { type: ControlType.Padding, defaultValue: "6px 10px" },
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                    textAlign: "center",
                },
            },
        },
    },
    responsive: {
        type: ControlType.Object,
        title: "Responsive",
        defaultValue: {
            enabled: true,
            referenceWidth: 1152,
            minScale: 0.3,
        },
        controls: {
            enabled: { type: ControlType.Boolean, defaultValue: true },
            referenceWidth: {
                type: ControlType.Number,
                defaultValue: 1152,
                min: 320,
                max: 2400,
                step: 1,
                unit: "px",
            },
            minScale: {
                type: ControlType.Number,
                defaultValue: 0.3,
                min: 0.15,
                max: 1,
                step: 0.01,
            },
        },
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Below",
        defaultValue: 810,
        min: 320,
        max: 1600,
        step: 1,
        unit: "px",
    },
    mobileDisableMouse: {
        type: ControlType.Boolean,
        title: "Disable Mouse",
        defaultValue: true,
    },
    mobilePreviewWidthPercent: {
        type: ControlType.Number,
        title: "Preview Width",
        defaultValue: 90,
        min: 50,
        max: 100,
        step: 1,
        unit: "%",
    },
    mobileRingWidthPercent: {
        type: ControlType.Number,
        title: "Ring Width",
        defaultValue: 100,
        min: 50,
        max: 140,
        step: 1,
        unit: "%",
    },
})
