"use client"

import { useSize } from "ahooks"
import { CSSProperties, FC, forwardRef, HTMLAttributes, useEffect, useRef, useState } from "react"

export interface TransitionBoxProps extends HTMLAttributes<HTMLDivElement> {
    containerClassName?: string
    containerStyle?: CSSProperties
    vertical?: boolean
    horizontal?: boolean
    time?: number
}

/** 尺寸渐变的组件 */
export const TransitionBox: FC<TransitionBoxProps> = forwardRef<HTMLDivElement, TransitionBoxProps>((props, ref) => {
    const { style, containerClassName, containerStyle, children, vertical = true, horizontal = true, time = 3000, ...rest } = props
    const container = useRef<HTMLDivElement>(null)
    const size = useSize(container)
    const width = size?.width ?? 0
    const height = size?.height ?? 0
    const [count, setCount] = useState(0)

    useEffect(() => {
        setCount(count => Math.min(count + 1, 3))
    }, [width, height])

    const outerStyle: CSSProperties = { transitionProperty: count === 3 ? [horizontal && "width", vertical && "height"].filter(Boolean).join(", ") : undefined, transitionDuration: count === 3 ? `${time}ms` : undefined, width, height, overflow: "hidden", position: "relative", ...style }

    return (
        <div ref={ref} style={outerStyle} {...rest}>
            <div className={containerClassName} style={{ position: "absolute", ...containerStyle }} ref={container}>
                {children}
            </div>
        </div>
    )
})
