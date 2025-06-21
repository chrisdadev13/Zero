import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Pipette, Square } from "lucide-react"

interface HSV {
    h: number // 0-360
    s: number // 0-100
    v: number // 0-100
}

interface RGB {
    r: number // 0-255
    g: number // 0-255
    b: number // 0-255
}

export default function ColorPicker() {
    const [hsv, setHsv] = useState<HSV>({ h: 120, s: 85, v: 25 })
    const [isDraggingHue, setIsDraggingHue] = useState(false)
    const [isDraggingSV, setIsDraggingSV] = useState(false)

    const hueSliderRef = useRef<HTMLDivElement>(null)
    const svAreaRef = useRef<HTMLDivElement>(null)

    // Convert HSV to RGB
    const hsvToRgb = useCallback((h: number, s: number, v: number): RGB => {
        const c = (v / 100) * (s / 100)
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
        const m = v / 100 - c

        let r = 0,
            g = 0,
            b = 0

        if (h >= 0 && h < 60) {
            r = c
            g = x
            b = 0
        } else if (h >= 60 && h < 120) {
            r = x
            g = c
            b = 0
        } else if (h >= 120 && h < 180) {
            r = 0
            g = c
            b = x
        } else if (h >= 180 && h < 240) {
            r = 0
            g = x
            b = c
        } else if (h >= 240 && h < 300) {
            r = x
            g = 0
            b = c
        } else if (h >= 300 && h < 360) {
            r = c
            g = 0
            b = x
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
        }
    }, [])

    // Convert RGB to Hex
    const rgbToHex = useCallback((r: number, g: number, b: number): string => {
        const toHex = (n: number) => {
            const hex = Math.round(n).toString(16)
            return hex.length === 1 ? "0" + hex : hex
        }
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
    }, [])

    // Calculate if we should use light or dark text based on background brightness
    const getTextColor = useCallback((r: number, g: number, b: number): string => {
        // Calculate relative luminance using the standard formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        // Return black text for bright backgrounds, white text for dark backgrounds
        return luminance > 0.5 ? "#000000" : "#ffffff"
    }, [])

    const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v)
    const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b)

    // Handle hue slider interaction
    const handleHueInteraction = useCallback((clientY: number) => {
        if (!hueSliderRef.current) return

        const rect = hueSliderRef.current.getBoundingClientRect()
        const y = Math.max(0, Math.min(clientY - rect.top, rect.height))
        const hue = (y / rect.height) * 360

        setHsv((prev) => ({ ...prev, h: hue }))
    }, [])

    // Handle saturation/value area interaction
    const handleSVInteraction = useCallback((clientX: number, clientY: number) => {
        if (!svAreaRef.current) return

        const rect = svAreaRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const y = Math.max(0, Math.min(clientY - rect.top, rect.height))

        const saturation = (x / rect.width) * 100
        const value = 100 - (y / rect.height) * 100

        setHsv((prev) => ({ ...prev, s: saturation, v: value }))
    }, [])

    // Mouse event handlers
    const handleHueMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDraggingHue(true)
            handleHueInteraction(e.clientY)
        },
        [handleHueInteraction],
    )

    const handleSVMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDraggingSV(true)
            handleSVInteraction(e.clientX, e.clientY)
        },
        [handleSVInteraction],
    )

    // Global mouse move and up handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingHue) {
                handleHueInteraction(e.clientY)
            } else if (isDraggingSV) {
                handleSVInteraction(e.clientX, e.clientY)
            }
        }

        const handleMouseUp = () => {
            setIsDraggingHue(false)
            setIsDraggingSV(false)
        }

        if (isDraggingHue || isDraggingSV) {
            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("mouseup", handleMouseUp)
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDraggingHue, isDraggingSV, handleHueInteraction, handleSVInteraction])

    // Get the pure hue color for the SV area background
    const pureHueRgb = hsvToRgb(hsv.h, 100, 100)
    const pureHueColor = `rgb(${pureHueRgb.r}, ${pureHueRgb.g}, ${pureHueRgb.b})`

    const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value
        if (hex.match(/^#[0-9A-Fa-f]{0,6}$/)) {
            if (hex.length === 7) {
                // Convert hex to HSV and update state
                const r = Number.parseInt(hex.slice(1, 3), 16)
                const g = Number.parseInt(hex.slice(3, 5), 16)
                const b = Number.parseInt(hex.slice(5, 7), 16)

                // Simple RGB to HSV conversion
                const max = Math.max(r, g, b) / 255
                const min = Math.min(r, g, b) / 255
                const diff = max - min

                let h = 0
                if (diff !== 0) {
                    if (max === r / 255) h = ((g - b) / 255 / diff) % 6
                    else if (max === g / 255) h = (b - r) / 255 / diff + 2
                    else h = (r - g) / 255 / diff + 4
                }
                h = Math.round(h * 60)
                if (h < 0) h += 360

                const s = max === 0 ? 0 : Math.round((diff / max) * 100)
                const v = Math.round(max * 100)

                setHsv({ h, s, v })
            }
        }
    }, [])

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Hex Input - Separate Component */}
            <div className="mb-3">
                <div
                    className="flex items-center justify-between px-4 py-2 rounded-lg font-medium border border-black/20"
                    style={{
                        backgroundColor: currentHex,
                        color: getTextColor(currentRgb.r, currentRgb.g, currentRgb.b),
                    }}
                >
                    <Pipette className="w-3.5 h-3.5" />
                    <input
                        type="text"
                        value={currentHex}
                        onChange={handleHexInputChange}
                        className="bg-transparent text-center text-sm font-mono outline-none flex-1 mx-3"
                        maxLength={7}
                    />
                    <Square className="w-3.5 h-3.5" />
                </div>
            </div>

            {/* Color Picker - Smaller and Compact */}
            <div className="p-4 bg-white rounded-xl shadow-lg">
                <div className="flex gap-3">
                    {/* Saturation/Value Area - Even Smaller */}
                    <div
                        ref={svAreaRef}
                        className="relative w-48 h-48 rounded-lg cursor-crosshair select-none"
                        style={{
                            background: `linear-gradient(to right, white, ${pureHueColor}), linear-gradient(to top, black, transparent)`,
                        }}
                        onMouseDown={handleSVMouseDown}
                    >
                        {/* SV Selector */}
                        <div
                            className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
                            style={{
                                left: `${(hsv.s / 100) * 100}%`,
                                top: `${100 - (hsv.v / 100) * 100}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                        />
                    </div>

                    {/* Hue Slider - Shorter to match */}
                    <div
                        ref={hueSliderRef}
                        className="relative w-3 h-48 rounded-lg cursor-pointer select-none"
                        style={{
                            background:
                                "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                        }}
                        onMouseDown={handleHueMouseDown}
                    >
                        {/* Hue Selector - Smaller */}
                        <div
                            className="absolute w-6 h-2 bg-white border border-gray-300 rounded-sm shadow-lg pointer-events-none"
                            style={{
                                top: `${(hsv.h / 360) * 100}%`,
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
