"use client"

import { FC, Fragment, HTMLAttributes } from "react"

export interface CircleTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
    /** 每一个方块的宽度 */
    width: number
    /** 每一个方块的高度 */
    height: number
    /** 圆弧的半径，不包含方块的高度 */
    radius: number
    /** 开始旋转的弧度，逆时针增加，0 为 x 轴方向 */
    startAngel?: number
    /** 每一个方块之间间隔的弧度 */
    gapAngel?: number
    /** 文字对齐的方式，默认居中 */
    align?: "left" | "center" | "right"
    /** 文字朝向圆心还是外侧，默认外侧 */
    direction?: "inner" | "outer"
    /** 是否反转文字顺序 */
    reverse?: boolean
    /** 分割文字的方法 */
    separator?: string | RegExp | ((text: string) => string[])
    /** 显示的文字 */
    children: string
}

/** 环形文字 */
export const CircleText: FC<CircleTextProps> = props => {
    const { width, height, radius, startAngel = 0, gapAngel = 0, align = "center", style, direction = "outer", reverse = false, separator, children, ...rest } = props
    const unitAngle = Math.atan(width / 2 / radius) * 2
    const totalAngle = (unitAngle + gapAngel) * children.length - gapAngel
    const offsetAngle = align === "left" ? 0 : align === "right" ? totalAngle : totalAngle / 2

    function getTransform(idx: number) {
        const angle = startAngel - idx * (unitAngle + gapAngel) + offsetAngle - unitAngle / 2
        const x = (radius + height / 2) * Math.cos(angle) - width / 2
        const y = (radius + height / 2) * Math.sin(angle) * -1 - height / 2
        const z = Math.PI / 2 - angle + (direction === "inner" ? Math.PI : 0)
        return `translateX(${x}px) translateY(${y}px) rotateZ(${(z / Math.PI) * 180}deg)`
    }

    const words = typeof separator === "function" ? separator(children) : children.split(separator ?? "")

    if (reverse) words.reverse()

    return (
        <Fragment>
            {words.map((w, idx) => (
                <span key={idx} style={{ position: "absolute", ...style, transform: getTransform(idx), textAlign: "center", width, lineHeight: `${height}px`, height: height }} {...rest}>
                    {w}
                </span>
            ))}
        </Fragment>
    )
}
