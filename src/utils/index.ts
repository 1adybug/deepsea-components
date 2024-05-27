import { CSSProperties } from "react"

export type CSSVariableName = `--${string}`

export type CSSVariableValue = string | number | undefined

export interface StyleWithCSSVariable extends CSSProperties {
    [X: CSSVariableName]: CSSVariableValue
}

const cssVariableReg = /[A-Z]/

function addCSSVariableLine(match: string): string {
    return `-${match}`
}

export function transformCSSVariableName(name: string): CSSVariableName {
    return `--${name.replace(cssVariableReg, addCSSVariableLine).toLowerCase()}`
}

export function transformCSSVariable(style: Partial<Record<string, CSSVariableValue>>, style2?: CSSProperties): CSSProperties {
    return Object.assign(
        Object.entries(style).reduce((acc: StyleWithCSSVariable, [key, value]) => {
            acc[transformCSSVariableName(key)] = value
            return acc
        }, {}),
        style2
    )
}

export function px(value: string | number | undefined): string | undefined {
    return typeof value === "number" ? `${value}px` : value
}
