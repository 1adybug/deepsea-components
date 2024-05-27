"use client"

import { css } from "@emotion/css"
import { clsx } from "deepsea-tools"
import { forwardRef, HTMLAttributes, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react"
import { px, transformCSSVariable } from "../utils"

export interface AutoFitProps extends HTMLAttributes<HTMLDivElement> {
    /** 设计稿宽度，默认 1920 */
    width?: number
    /** 设计稿高度，默认 1080 */
    height?: number
    /**
     * 在哪些方向进行缩放，默认缩放所有方向
     * 1. 水平方向是指，宽度按照设计稿进行占满，高度反向缩放
     * 2. 垂直方向是指，高度按照设计稿进行占满，宽度反向缩放
     * 3. 默认是水平和垂直方向都进行缩放，类似于 background-size: contain 的效果
     */
    direction?: "horizontal" | "vertical" | "both"
}

/**
 * 自适应缩放组件
 *
 * 注意：
 * 1. 父元素必须设置非 static 定位方式
 * 2. 父元素只能有且仅有一个子元素，那就是 AutoFit
 * 3. 不要设置 AutoFit 的 position、left、top、transform、width、height 属性
 * 4. 在第一次完成缩放前，无论 props 是什么，返回的都是 <div style={{ display: "none" }} />
 * 5. 元素的属性、事件、资源并不是立即加载的，会有一帧的延迟，在第一次完成缩放后才会显示
 */
export const AutoFit = forwardRef<HTMLDivElement, AutoFitProps>((props, ref) => {
    const { width: designWidth = 1920, height: designHeight = 1080, direction, className, style, ...rest } = props
    const ele = useRef<HTMLDivElement>(null)
    const [show, setShow] = useState(false)
    const [transform, setTransform] = useState<string | undefined>(undefined)
    const [width, setWidth] = useState<string | undefined>(undefined)
    const [height, setHeight] = useState<string | undefined>(undefined)

    useImperativeHandle(ref, () => ele.current!, [ele.current])
    useLayoutEffect(() => {
        const element = ele.current
        const parent = element?.parentElement
        if (!element || !parent) return
        function listener(entries: ResizeObserverEntry[]) {
            const entry = entries[0]
            const { contentRect } = entry
            if (direction === "horizontal") {
                const scale = contentRect.width / designWidth
                setTransform(`scale(${scale})`)
                setWidth(px(designWidth))
                setHeight(px(contentRect.height / scale))
            } else if (direction === "vertical") {
                const scale = contentRect.height / designHeight
                setTransform(`scale(${scale})`)
                setWidth(px(contentRect.width / scale))
                setHeight(px(designHeight))
            } else {
                const scale = Math.min(contentRect.width / designWidth, contentRect.height / designHeight)
                setTransform(`translateX(${(contentRect.width - designWidth * scale) / 2}px) translateY(${(contentRect.height - designHeight * scale) / 2}px) scale(${scale})`)
                setWidth(px(designWidth))
                setHeight(px(designHeight))
            }
            setShow(true)
        }
        const observer = new ResizeObserver(listener)
        observer.observe(parent)
        return () => observer.disconnect()
    }, [ele.current?.parentElement, designWidth, designHeight, direction])

    if (process.env.NODE_ENV === "development") {
        useEffect(() => {
            const parent = ele.current?.parentElement
            if (!parent) return
            const style = getComputedStyle(parent)
            if (style.position === "static") {
                console.warn("AutoFit 组件的父元素的 position 属性不应该是 static")
            }
        }, [ele.current?.parentElement])
    }

    if (!show) return <div ref={ele} style={{ display: "none" }} />

    return (
        <div
            ref={ele}
            className={clsx(
                css`
                    position: absolute;
                    transform: var(--transform);
                    transform-origin: top left;
                    width: var(--width);
                    height: var(--height);
                `,
                className
            )}
            style={transformCSSVariable({ transform, width, height }, style)}
            {...rest}
        />
    )
})
