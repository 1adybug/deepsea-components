import { css } from "@emotion/css"
import { clsx } from "deepsea-tools"
import { CSSProperties, ForwardedRef, forwardRef, HTMLAttributes, useEffect, useImperativeHandle, useRef, useState } from "react"
import SmoothScrollbar from "smooth-scrollbar"
import type { ScrollbarOptions } from "smooth-scrollbar/interfaces"

export interface ScrollOptions extends Partial<ScrollbarOptions> {
    /** 滑块宽度 */
    thumbWidth?: number
}

export interface ScrollProps extends HTMLAttributes<HTMLDivElement> {
    /** 滚动的配置 */
    options?: ScrollOptions
    /** 容器宽度 */
    containerClassName?: string
    /** 容器样式 */
    containerStyle?: CSSProperties
    /** 滚动条实例 */
    scrollbar?: ForwardedRef<SmoothScrollbar>
}

/**
 * 滚动条组件
 * @description 注意 children 不是直接渲染在组件上的，而是渲染在内部的容器上
 */
export const Scroll = forwardRef<HTMLDivElement, ScrollProps>((props, ref) => {
    const { children, containerClassName, containerStyle, options, className, scrollbar, ...rest } = props
    const { thumbWidth, ...scrollbarOptions } = options || {}
    const ele = useRef<HTMLDivElement>(null)
    const [ins, setIns] = useState<SmoothScrollbar | null>(null)

    useImperativeHandle(ref, () => ele.current!)
    useImperativeHandle(scrollbar, () => ins!, [ins])

    useEffect(() => {
        const ins = SmoothScrollbar.init(ele.current!, scrollbarOptions)
        setIns(ins)
        return () => ins.destroy()
    }, [])

    return (
        <div
            ref={ele}
            className={clsx(
                typeof thumbWidth === "number" &&
                    css`
                        .scrollbar-track.scrollbar-track-x {
                            height: ${thumbWidth}px;
                        }

                        .scrollbar-thumb.scrollbar-thumb-x {
                            height: ${thumbWidth}px;
                        }

                        .scrollbar-track.scrollbar-track-y {
                            width: ${thumbWidth}px;
                        }

                        .scrollbar-thumb.scrollbar-thumb-y {
                            width: ${thumbWidth}px;
                        }
                    `,
                className
            )}
            {...rest}>
            <div className={containerClassName} style={containerStyle}>
                {children}
            </div>
        </div>
    )
})
