import * as React from "react"
import {
    startTransition,
    useState,
    useRef,
    useMemo,
    useEffect,
    useCallback,
} from "react"
import { ControlType, addPropertyControls, RenderTarget } from "framer"

interface PortfolioItem {
    title: string
    image?:
        | string
        | {
              src?: string
              srcSet?: string
              alt?: string
              width?: number
              height?: number
          }
    url?: string
}

interface MyComponentProps {
    collectionItem?: {
        title?: string
        image?: string | { src?: string; srcSet?: string; alt?: string; width?: number; height?: number }
        url?: string
    }
    items?: PortfolioItem[]
    cardCount?: number
    autoSpeed?: number
    scrollSensitivity?: number
    parallax?: number
    stopInEditor?: boolean
    openInNewTab?: boolean
    maxCardWidth?: number
    maxCardHeight?: number
    bgColor?: string
    font?: React.CSSProperties
}

const defaultCards: PortfolioItem[] = [
    { title: "Hypasia Space", image: { src: "https://framerusercontent.com/images/ypxfzBKyWn8aTzMmgcmJKu07BtE.png" }, url: "https://hypasia.space" },
    { title: "ROK GLASSES", image: { src: "https://framerusercontent.com/images/gRz52liKURUzoYbAGAt3xmdJf4A.png" }, url: "https://glass.agarthan.space/" },
    { title: "One Logo Portfolio", image: { src: "https://framerusercontent.com/images/YOys9nOpsqMPUpeTyIoROpswxE.png" }, url: "https://one-logo.agarthan.space/" },
    { title: "Snowgroup", image: { src: "https://framerusercontent.com/images/m0opWllaj5iel6LFM8hDXYdojSM.png" }, url: "https://ski.agarthan.space/" },
    { title: "One Strategy Group", image: { src: "https://framerusercontent.com/images/ItLmJ3RSKM80gGYWHQ7DK2J49r8.png" }, url: "https://one.agarthan.space/" },
    { title: "Arch", image: { src: "https://framerusercontent.com/images/EshTcw5Ro6BqbHOrVsxP6JTm6E.png" }, url: "https://arch.agarthan.space/" },
    { title: "Rare Candy", image: { src: "https://framerusercontent.com/images/bpMfmA9NJsb3ySbMLbRRGXjCbg.png" }, url: "https://pikachu-marketplace.agarthan.space/" },
    { title: "Minimal", image: { src: "https://framerusercontent.com/images/s63nLTZ1tazYrLKXJQIfljlSTI.png" }, url: "https://glass-scrool.agarthan.space/" },
    { title: "Sona AI", image: { src: "https://framerusercontent.com/images/uurkoMtWL9PXJL6VrYb9zkGISeI.png" }, url: "https://sona-ai.agarthan.space/" },
    { title: "Athleads", image: { src: "https://framerusercontent.com/images/XwXsUocwwADhUd8pl7SSewG9Poo.png" }, url: "https://athlet-sa.agarthan.space/" },
    { title: "FlowSync", image: { src: "https://framerusercontent.com/images/H01RqDzD6SJ2Pa9QjkMfAo.png" }, url: "https://purple-saas.agarthan.space/" },
    { title: "Stratdev", image: { src: "https://framerusercontent.com/images/URjz40m3VZiNu8L4PWJpR29CEKo.png" }, url: "https://3d.agarthan.space/studio.app/index.html" },
    { title: "Appmakers LA", image: { src: "https://framerusercontent.com/images/zoYQD3wmltsg16gjzpPyuYdeFQ.png" }, url: "https://market.agarthan.space/" },
    { title: "Appmakers 3D Play", image: { src: "https://framerusercontent.com/images/3iWIac6sK6ENGa9vJRPe1KuHU.png" }, url: "https://3dplay.agarthan.space/" },
    { title: "Appmakers Graphic", image: { src: "https://framerusercontent.com/images/ZA0sG4UPMtbn5niLn5UClwWkcXU.png" }, url: "https://graphic.agarthan.space/" },
    { title: "Appmakers Chinki", image: { src: "https://framerusercontent.com/images/POZ817OsB5z2uloHXFS8Jxi9jZo.png" }, url: "https://chinki.agarthan.space/" },
    { title: "Agentic", image: { src: "https://framerusercontent.com/images/S0r0nQzkkqxXxqsPgk0NBMrDbc.png" }, url: "https://scroll.agarthan.space/" },
    { title: "3D Text Scroll", image: { src: "https://framerusercontent.com/images/mh0Lt8NvfOpJwxeZUkepRxQaq0.png" }, url: "https://text.agarthan.space/" },
    { title: "Appmakers Cube", image: { src: "https://framerusercontent.com/images/crVMjvDvOulN4pqU0aIPEp6ysks.png" }, url: "https://cube.agarthan.space/" },
    { title: "Tellbyte", image: { src: "https://framerusercontent.com/images/5ql3EmCqkftzWSfK9YEQD8z10A.png" }, url: "https://tellbyte.agarthan.space/" },
    { title: "BOLT", image: { src: "https://framerusercontent.com/images/dH2u3QV0jdk8IF3h1owEfv9zU4.png" }, url: "https://gug.agarthan.space/" },
    { title: "Premium", image: { src: "https://framerusercontent.com/images/mS4I8tptPTDbRGZgBZYz9BJmlxk.png" }, url: "https://space.agarthan.space/" },
]

function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

function getImageData(image?: PortfolioItem["image"]): {
    src: string
    srcSet?: string
    alt?: string
    width?: number
    height?: number
} {
    if (!image) return { src: "" }
    if (typeof image === "string") return { src: image }
    return {
        src: image.src || "",
        srcSet: image.srcSet,
        alt: image.alt,
        width: image.width,
        height: image.height,
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FlyingPortfolio(props: MyComponentProps) {
    const {
        collectionItem,
        items = defaultCards,
        cardCount = 50,
        autoSpeed = 0.02,
        scrollSensitivity = 0.04,
        parallax = 0.8,
        stopInEditor = false,
        openInNewTab = true,
        maxCardWidth = 420,
        maxCardHeight = 320,
        bgColor = "#FFFFFF",
        font = {},
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const cursorRef = useRef<HTMLDivElement | null>(null)
    const scrollRef = useRef({ target: 0, current: 0 })
    const tiltRef = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 })

    const pointerRef = useRef({ x: -1000, y: -1000, inside: false })
    const hoveredRef = useRef("")
    const hoveredUrlRef = useRef("")
    const hoveredIdxRef = useRef<number | null>(null)

    const [containerSize, setContainerSize] = useState({
        width: 1200,
        height: 800,
    })

    const [hovered, setHovered] = useState("")
    const [hoveredUrl, setHoveredUrl] = useState("")
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

    const [frameTick, setFrameTick] = useState(0)
    const [groupTilt, setGroupTilt] = useState({ x: 0, y: 0 })

    const isEditor = RenderTarget.current() === RenderTarget.canvas

    const onWheel = useCallback(
        (event: React.WheelEvent<HTMLDivElement>) => {
            scrollRef.current.target += event.deltaY * scrollSensitivity
            startTransition(() => setFrameTick((value) => value + 1))
        },
        [scrollSensitivity]
    )

    const cloudItemsRef = useRef<any[]>([])

    // Mathematical Raycaster for 3D intersection calculation
    const updateRaycaster = useCallback(() => {
        if (!pointerRef.current.inside) {
            if (hoveredRef.current !== "" || hoveredIdxRef.current !== null) {
                hoveredRef.current = ""
                hoveredUrlRef.current = ""
                hoveredIdxRef.current = null
                startTransition(() => {
                    setHovered("")
                    setHoveredUrl("")
                    setHoveredIdx(null)
                })
            }
            return
        }

        const currentItems = cloudItemsRef.current
        let topTitle = ""
        let topUrl = ""
        let topIdx: number | null = null
        let topDepth = -Infinity

        const localX = pointerRef.current.x
        const localY = pointerRef.current.y
        const centerX = containerSize.width * 0.5
        const centerY = containerSize.height * 0.5

        const radX = tiltRef.current.currentX * (Math.PI / 180)
        const radY = tiltRef.current.currentY * (Math.PI / 180)
        const cx = Math.cos(radX),
            sx = Math.sin(radX)
        const cy = Math.cos(radY),
            sy = Math.sin(radY)
        const P = 1200

        for (let i = 0; i < currentItems.length; i++) {
            const card = currentItems[i]

            if (card.opacity < 0.05) continue

            const x0 = card.px
            const y0 = card.py
            const z0 = card.wrappedZ * card.worldZScale

            const x1 = x0
            const y1 = y0 * cx - z0 * sx
            const z1 = y0 * sx + z0 * cx

            const x2 = x1 * cy + z1 * sy
            const y2 = y1
            const z2 = -x1 * sy + z1 * cy

            if (z2 >= P) continue

            const cssScale = P / (P - z2)
            const screenX = centerX + x2 * cssScale
            const screenY = centerY + y2 * cssScale

            const visualWidth =
                card.baseWidth * card.perspectiveScale * cssScale
            const visualHeight =
                card.baseHeight * card.perspectiveScale * cssScale

            const halfW = visualWidth * 0.5
            const halfH = visualHeight * 0.5

            const isInside =
                localX >= screenX - halfW &&
                localX <= screenX + halfW &&
                localY >= screenY - halfH &&
                localY <= screenY + halfH

            if (isInside && card.wrappedZ > topDepth) {
                topDepth = card.wrappedZ
                topTitle = card.item.title || "Project"
                topUrl = card.item.url || ""
                topIdx = i
            }
        }

        if (
            topTitle !== hoveredRef.current ||
            topIdx !== hoveredIdxRef.current
        ) {
            hoveredRef.current = topTitle
            hoveredUrlRef.current = topUrl
            hoveredIdxRef.current = topIdx
            startTransition(() => {
                setHovered(topTitle)
                setHoveredUrl(topUrl)
                setHoveredIdx(topIdx)
            })
        }
    }, [containerSize.width, containerSize.height])

    const onPointerMove = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const localX = event.clientX - rect.left
            const localY = event.clientY - rect.top

            pointerRef.current.x = localX
            pointerRef.current.y = localY
            pointerRef.current.inside = true

            const x = localX / Math.max(1, rect.width)
            const y = localY / Math.max(1, rect.height)

            tiltRef.current.targetY = (x - 0.5) * parallax * 10
            tiltRef.current.targetX = -(y - 0.5) * parallax * 10

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${localX}px, ${localY}px, 0) translate(16px, -100%)`
            }

            updateRaycaster()
        },
        [parallax, updateRaycaster]
    )

    useEffect(() => {
        const updateSize = () => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            startTransition(() =>
                setContainerSize({
                    width: Math.max(320, rect.width),
                    height: Math.max(320, rect.height),
                })
            )
        }
        updateSize()
        if (typeof window !== "undefined")
            window.addEventListener("resize", updateSize)
        return () => {
            if (typeof window !== "undefined")
                window.removeEventListener("resize", updateSize)
        }
    }, [])

    useEffect(() => {
        let raf = 0
        const animate = () => {
            if (!isEditor || !stopInEditor) {
                scrollRef.current.target += autoSpeed
            }

            scrollRef.current.current +=
                (scrollRef.current.target - scrollRef.current.current) * 0.06
            tiltRef.current.currentX +=
                (tiltRef.current.targetX - tiltRef.current.currentX) * 0.05
            tiltRef.current.currentY +=
                (tiltRef.current.targetY - tiltRef.current.currentY) * 0.05

            startTransition(() => {
                setGroupTilt({
                    x: tiltRef.current.currentX,
                    y: tiltRef.current.currentY,
                })
            })

            updateRaycaster()

            startTransition(() => setFrameTick((value) => value + 1))
            if (typeof window !== "undefined")
                raf = window.requestAnimationFrame(animate)
        }

        if (typeof window !== "undefined")
            raf = window.requestAnimationFrame(animate)
        return () => {
            if (typeof window !== "undefined") window.cancelAnimationFrame(raf)
        }
    }, [autoSpeed, stopInEditor, isEditor, updateRaycaster])

    const activeItems = useMemo(() => {
        if (collectionItem && (collectionItem.title || collectionItem.image || collectionItem.url)) {
            const title = typeof collectionItem.title === "string" ? collectionItem.title : (defaultCards[0].title || "Project")
            const url = typeof collectionItem.url === "string" ? collectionItem.url : ""
            let image = collectionItem.image
            if (typeof image === "string") {
                image = { src: image, alt: title }
            } else if (!image) {
                image = defaultCards[0].image
            }
            return [{ title, image, url }]
        }
        return items.length > 0 ? items : defaultCards
    }, [collectionItem, items])

    const cloudItems = useMemo(() => {
        const source = activeItems

        // Dynamically create array based on user selected cardCount
        const safeCount = Math.max(1, cardCount)
        const repeated = Array.from({ length: safeCount }).map(
            (_, index) => source[index % source.length]
        )

        const worldXScale = (containerSize.width / 35) * 1.35
        const worldYScale = (containerSize.height / 20) * 1.15
        const worldZScale =
            Math.min(containerSize.width, containerSize.height) * 0.18

        const startZ = -90
        const endZ = 5
        const range = endZ - startZ

        return repeated.map((item, index) => {
            const rz = seededRandom(index * 9.99)
            const edgeSeed = seededRandom(index * 17.17)
            const edgeBand = Math.floor(edgeSeed * 4)
            const centerVoid = 0.34
            const offscreen = 0.16
            const span = 1 + offscreen * 2

            let nx = 0,
                ny = 0

            if (edgeBand === 0) {
                nx = -(
                    centerVoid +
                    seededRandom(index * 18.01) * (1 - centerVoid + offscreen)
                )
                ny = -offscreen + seededRandom(index * 18.41) * span
            } else if (edgeBand === 1) {
                nx =
                    centerVoid +
                    seededRandom(index * 18.01) * (1 - centerVoid + offscreen)
                ny = -offscreen + seededRandom(index * 18.41) * span
            } else if (edgeBand === 2) {
                ny = -(
                    centerVoid +
                    seededRandom(index * 19.01) * (1 - centerVoid + offscreen)
                )
                nx = -offscreen + seededRandom(index * 19.41) * span
            } else {
                ny =
                    centerVoid +
                    seededRandom(index * 19.01) * (1 - centerVoid + offscreen)
                nx = -offscreen + seededRandom(index * 19.41) * span
            }

            const x = nx * 17.5
            const y = ny * 10

            // Distributed Z placement based on total count to prevent bunching
            const spreadRatio = 50 / safeCount
            const baseZ = -(index * 2 * spreadRatio) - rz * 5

            const absoluteZ = baseZ + scrollRef.current.current
            const wrappedZ =
                ((((absoluteZ - startZ) % range) + range) % range) + startZ
            const perspectiveScale =
                0.2 + ((wrappedZ - startZ) / Math.max(1, range)) * 1.45
            const px = x * worldXScale
            const py = y * worldYScale

            let opacity = 1
            if (wrappedZ < -70) {
                opacity = (wrappedZ + 90) / 20
            } else if (wrappedZ > 1.5) {
                opacity = (5 - wrappedZ) / 3.5
            }
            opacity = Math.max(0, Math.min(1, opacity))

            const img = getImageData(item.image)

            let baseW = maxCardWidth
            let baseH = maxCardHeight
            if (img.width && img.height) {
                const aspect = img.width / img.height
                if (maxCardWidth / aspect <= maxCardHeight) {
                    baseW = maxCardWidth
                    baseH = maxCardWidth / aspect
                } else {
                    baseH = maxCardHeight
                    baseW = maxCardHeight * aspect
                }
            } else {
                baseW = 240
                baseH = 160
            }

            return {
                key: `${item.title}-${index}`,
                item,
                image: img,
                opacity,
                px,
                py,
                wrappedZ,
                worldZScale,
                baseWidth: baseW,
                baseHeight: baseH,
                perspectiveScale,
                style: {
                    position: "absolute" as const,
                    left: "50%",
                    top: "50%",
                    transform: `translate3d(${px}px, ${py}px, ${wrappedZ * worldZScale}px) translate(-50%, -50%) scale(${perspectiveScale})`,
                    transformStyle: "preserve-3d" as const,
                    transformOrigin: "center center",
                    opacity,
                    width: baseW,
                    height: baseH,
                    borderRadius: 0,
                    overflow: "visible",
                    background: "transparent",
                    visibility:
                        opacity <= 0.001
                            ? ("hidden" as const)
                            : ("visible" as const),
                    transition: "opacity 0.15s ease",
                    pointerEvents: "none" as const,
                },
            }
        })
    }, [
        items,
        cardCount,
        frameTick,
        maxCardWidth,
        maxCardHeight,
        containerSize.width,
        containerSize.height,
    ])

    useEffect(() => {
        cloudItemsRef.current = cloudItems
    }, [cloudItems])

    return (
        <div
            ref={containerRef}
            onWheel={onWheel}
            onMouseMove={onPointerMove}
            onMouseLeave={() => {
                pointerRef.current.inside = false
            }}
            onClick={() => {
                if (!isEditor && hoveredUrl && typeof window !== "undefined") {
                    if (openInNewTab) {
                        window.open(hoveredUrl, "_blank", "noopener,noreferrer")
                    } else {
                        window.location.href = hoveredUrl
                    }
                }
            }}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 420,
                position: "relative",
                overflow: "hidden",
                background: bgColor,
                perspective: 1200,
                cursor: hoveredUrl ? "pointer" : "default",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${groupTilt.x}deg) rotateY(${groupTilt.y}deg)`,
                }}
            >
                {cloudItems.map(({ key, item, style, image }, index) => {
                    const src = image.src
                    const title = item.title || "Project"
                    const isHovered = hoveredIdx === index

                    const currentOpacity = isHovered
                        ? (style.opacity as number) * 0.3
                        : style.opacity

                    return (
                        <div
                            key={key}
                            style={{
                                ...style,
                                opacity: currentOpacity,
                            }}
                        >
                            {src ? (
                                <img
                                    src={src}
                                    srcSet={image.srcSet}
                                    alt={image.alt || title}
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        background: "#e0e0e0",
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            <div
                ref={cursorRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: 2000,
                    mixBlendMode: "difference",
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.05s ease",
                    color: "#FFFFFF",
                    textAlign: "center",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    minWidth: "max-content",
                    ...font,
                }}
            >
                {hovered}
            </div>
        </div>
    )
}

addPropertyControls(FlyingPortfolio, {
    collectionItem: {
        type: ControlType.Object,
        title: "CMS Item",
        defaultValue: {
            title: "",
        },
        controls: {
            title: { type: ControlType.String, title: "Title" },
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            url: { type: ControlType.Link, title: "Link" },
        },
    },
    cardCount: {
        type: ControlType.Number,
        title: "Card Count",
        min: 5,
        max: 100,
        step: 1,
        defaultValue: 50,
    },
    stopInEditor: {
        type: ControlType.Boolean,
        title: "Stop in Editor",
        defaultValue: false,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 24,
            variant: "Medium",
            letterSpacing: -0.02,
            lineHeight: "1em",
        },
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        min: 0,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.02,
    },
    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Power",
        min: 0.01,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.04,
    },
    parallax: {
        type: ControlType.Number,
        title: "Parallax",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 0.8,
    },
    maxCardWidth: {
        type: ControlType.Number,
        title: "Max Card W",
        min: 80,
        max: 1200,
        step: 10,
        defaultValue: 420,
    },
    maxCardHeight: {
        type: ControlType.Number,
        title: "Max Card H",
        min: 80,
        max: 1200,
        step: 10,
        defaultValue: 320,
    },
    items: {
        type: ControlType.Array,
        title: "Uploaded Cards",
        defaultValue: defaultCards,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                url: { type: ControlType.Link, title: "Link" },
            },
        },
    },
})
