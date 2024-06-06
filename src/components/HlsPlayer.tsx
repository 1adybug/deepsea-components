"use client"

import Hls from "hls.js"
import { MediaHTMLAttributes, forwardRef, useEffect, useImperativeHandle, useRef } from "react"

export interface HlsPlayerProps extends Omit<MediaHTMLAttributes<HTMLVideoElement>, "src"> {
    src: string
}

export const HlsPlayer = forwardRef<HTMLVideoElement, HlsPlayerProps>((props, ref) => {
    const { src, ...rest } = props
    const video = useRef<HTMLVideoElement>(null)

    useImperativeHandle(ref, () => video.current!, [])

    useEffect(() => {
        const { current: player } = video
        if (!player || !src) return
        if (player.canPlayType("application/vnd.apple.mpegurl")) {
            player.src = src
            return
        }
        if (Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(src)
            hls.attachMedia(player)
            return () => {
                hls.destroy()
            }
        }
    }, [src])

    return <video ref={video} {...rest} />
})
