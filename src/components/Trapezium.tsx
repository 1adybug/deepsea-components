"use client"

import { HTMLAttributes, forwardRef } from "react"

export interface TrapeziumProps extends HTMLAttributes<HTMLDivElement> {
    top: number
    bottom: number
    height: number
    borderRadius: number
}

/** 梯形组件 */
export const Trapezium = forwardRef<HTMLDivElement, TrapeziumProps>((props, ref) => {
    const { top, bottom, height, borderRadius, style, ...rest } = props

    const diff = (bottom - top) / 2

    const a = Math.atan(height / diff) / 2

    const b = borderRadius / Math.tan(a)

    const c = b * Math.cos(a * 2)

    const d = b * Math.sin(a * 2)

    const e = Math.PI / 2 - a

    const f = borderRadius / Math.tan(e)

    const g = f * Math.cos(a * 2)

    const h = f * Math.sin(a * 2)

    return <div ref={ref} style={{ width: bottom, height, clipPath: `path("M ${diff + f} ${0}  A ${borderRadius} ${borderRadius} 0 0 0 ${diff - g} ${h} L ${c} ${height - d} A ${borderRadius} ${borderRadius} 0 0 0 ${b} ${height} L ${bottom - b} ${height} A ${borderRadius} ${borderRadius} 0 0 0 ${bottom - c} ${height - d} L ${top + diff + g} ${h} A ${borderRadius} ${borderRadius} 0 0 0 ${top + diff - f} ${0} Z")`, ...style }} {...rest} />
})
