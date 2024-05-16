import { css } from "@emotion/css"
import { clsx } from "deepsea-tools"
import { CSSProperties, ForwardedRef, forwardRef, HTMLAttributes, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react"
import Scrollbar from "smooth-scrollbar"
import type { ScrollbarOptions, ScrollListener } from "smooth-scrollbar/interfaces"
export { default as Scrollbar } from "smooth-scrollbar"
export * from "smooth-scrollbar/interfaces"

export interface ScrollOptions extends Partial<ScrollbarOptions> {
    /** 滑块宽度 */
    thumbWidth?: number
}

export interface ScrollProps extends HTMLAttributes<HTMLDivElement> {
    /** 滚动的配置 */
    options?: ScrollOptions
    /** 滚动条实例 */
    scrollbar?: ForwardedRef<Scrollbar>
    /** 滚动条滚动事件 */
    onScrollbar?: ScrollListener
}

export const Scroll = forwardRef<HTMLDivElement, ScrollProps>((props, ref) => {
    const { children, options, className, style, scrollbar, onScrollbar, ...rest } = props
    const { thumbWidth, ...scrollbarOptions } = options || {}
    const ele = useRef<HTMLDivElement>(null)
    const bar = useRef<Scrollbar | null>(null)

    useLayoutEffect(() => {
        bar.current = Scrollbar.init(ele.current!, scrollbarOptions)
        return () => bar.current?.destroy()
    }, [])

    useImperativeHandle(ref, () => ele.current!, [])

    useImperativeHandle(scrollbar, () => bar.current!, [])

    useEffect(() => {
        if (!onScrollbar) return
        bar.current?.addListener(onScrollbar)
        return () => bar.current?.removeListener(onScrollbar)
    }, [onScrollbar])

    return (
        <div
            ref={ele}
            className={clsx(
                typeof thumbWidth === "number" &&
                    css`
                        .scrollbar-track.scrollbar-track-x {
                            height: var(--thumb-width);
                        }

                        .scrollbar-thumb.scrollbar-thumb-x {
                            height: var(--thumb-width);
                        }

                        .scrollbar-track.scrollbar-track-y {
                            width: var(--thumb-width);
                        }

                        .scrollbar-thumb.scrollbar-thumb-y {
                            width: var(--thumb-width);
                        }
                    `,
                className
            )}
            style={
                {
                    "--thumb-width": typeof thumbWidth === "number" ? `${thumbWidth}px` : undefined,
                    ...style
                } as CSSProperties
            }
            {...rest}>
            {children}
        </div>
    )
})
