import { CSSProperties } from "react"

export type CSSVariableName = `--${string}`

export type CSSVariableValue = string | number

export interface StyleWithCSSVariable extends CSSProperties {
    [X: CSSVariableName]: CSSVariableValue
}

export function styleWithCSSVariable(style: StyleWithCSSVariable): CSSProperties {
    return style
}

export function px(value: number): string {
    return `${value}px`
}