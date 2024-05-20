"use client"

import { css } from "@emotion/css"
import { clsx } from "deepsea-tools"
import { CSSProperties, forwardRef, HTMLAttributes, useEffect, useImperativeHandle, useRef, useState } from "react"

export interface LoopSwiperProps extends HTMLAttributes<HTMLDivElement> {
    direction?: "horizontal" | "vertical"
    reverse?: boolean
    period: number
    gap?: CSSProperties["gap"]
}

/** 循环播放组件 */
export const LoopSwiper = forwardRef<HTMLDivElement, LoopSwiperProps>((props, ref) => {
    const { className, style, children, direction, period, reverse, gap, ...rest } = props
    const wrapper = useRef<HTMLDivElement>(null)
    const container = useRef<HTMLDivElement>(null)
    const [swiper, setSwiper] = useState(false)
    const directionRef = useRef(direction)
    directionRef.current = direction
    const flexDirection: CSSProperties["flexDirection"] = direction === "vertical" ? (reverse ? "column-reverse" : "column") : reverse ? "row-reverse" : "row"
    const animationName = swiper ? (direction === "vertical" ? (reverse ? "deepsea-reverse-vertical-loop-swipe" : "deepsea-vertical-loop-swipe") : reverse ? "deepsea-reverse-horizontal-loop-swipe" : "deepsea-horizontal-loop-swipe") : "none"
    const animationDuration = `${period}ms`
    const animationTimingFunction = "linear"
    const animationIterationCount = "infinite"

    useImperativeHandle(ref, () => wrapper.current!, [])

    useEffect(() => {
        const wrapperEle = wrapper.current!
        const containerEle = container.current!
        let wrapperWidth = 0
        let wrapperHeight = 0
        let containerWidth = 0
        let containerHeight = 0
        const observer = new ResizeObserver(entries => {
            entries.forEach(entry => {
                if (entry.target === wrapperEle) {
                    wrapperWidth = entry.contentRect.width
                    wrapperHeight = entry.contentRect.height
                } else if (entry.target === containerEle) {
                    containerWidth = entry.contentRect.width
                    containerHeight = entry.contentRect.height
                }
            })
            setSwiper(directionRef.current === "vertical" ? containerHeight > wrapperHeight : containerWidth > wrapperWidth)
        })
        observer.observe(wrapperEle)
        observer.observe(containerEle)
    }, [])

    return (
        <div
            ref={wrapper}
            className={clsx(
                css`
                    @keyframes deepsea-horizontal-loop-swipe {
                        from {
                            transform: translateX(0);
                        }
                        to {
                            transform: translateX(-100%);
                        }
                    }
                    @keyframes deepsea-reverse-horizontal-loop-swipe {
                        from {
                            transform: translateX(0);
                        }
                        to {
                            transform: translateX(100%);
                        }
                    }
                    @keyframes deepsea-vertical-loop-swipe {
                        from {
                            transform: translateY(0);
                        }
                        to {
                            transform: translateY(-100%);
                        }
                    }
                    @keyframes deepsea-reverse-vertical-loop-swipe {
                        from {
                            transform: translateY(0);
                        }
                        to {
                            transform: translateY(100%);
                        }
                    }
                `,
                className
            )}
            style={{ display: "flex", flexDirection, gap, ...style }}
            {...rest}>
            <div ref={container} style={{ display: "flex", flexDirection, gap, animationName, animationTimingFunction, animationDuration, animationIterationCount }}>
                {children}
            </div>
            <div style={{ display: swiper ? "flex" : "none", flexDirection, gap, animationName, animationTimingFunction, animationDuration, animationIterationCount }}>{children}</div>
        </div>
    )
})
