"use client"

import { forwardRef, HTMLAttributes } from "react"

export interface RingProps extends HTMLAttributes<HTMLDivElement> {
    outerWidth: number
    innerWidth: number
}

/** 环形组件 */
export const Ring = forwardRef<HTMLDivElement, RingProps>((props, ref) => {
    const { outerWidth, innerWidth, style, ...rest } = props

    const outerRadius = outerWidth / 2

    const innerRadius = innerWidth / 2

    return <div ref={ref} style={{ ...style, width: `${outerWidth}px`, height: `${outerWidth}px`, clipPath: `path("M0,${outerRadius} a${outerRadius},${outerRadius},0,1,0,${outerWidth},0 a${outerRadius},${outerRadius},0,1,0,-${outerWidth},0 l${outerRadius - innerRadius},0 a${innerRadius},${innerRadius},0,0,1,${innerRadius * 2},0 a${innerRadius},${innerRadius},0,0,1,-${innerRadius * 2},0 Z")` }} {...rest} />
})
