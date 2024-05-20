"use client"

import { CSSProperties, HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react"

export interface FlowSizeData {
    /** 容器宽度 */
    width: number
    /** 容器高度 */
    height: number
    /** 元素宽度 */
    itemWidth: number
    /** 元素高度 */
    itemHeight: number
    /** 列间距 */
    columnGap: number
    /** 列数 */
    columnCount: number
    /** 行间距 */
    rowGap: number
    /** 行数 */
    rowCount: number
    /** 元素格数 */
    itemCount: number
    /** 最大行数 */
    maxRows: number | null
    /** 是否有元素被隐藏 */
    overflow: boolean
}

export interface FlowProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    /** 元素宽度 */
    itemWidth: number
    /** 元素高度 */
    itemHeight: number
    /** 列间距 */
    columnGap?: number | null | (number | null)[]
    /** 行间距 */
    rowGap?: number
    /** 最大行数 */
    maxRows?: number | null
    /** 源数据 */
    data: T[]
    /** 渲染 */
    render: (item: T, index: number, hidden: boolean) => ReactNode
    /** key释放器，默认为 index */
    keyExactor?: (item: T, index: number) => string | number
    /** 容器类名 */
    containerClassName?: string
    /** 容器样式 */
    containerStyle?: CSSProperties
    /** 节流时间，单位毫秒，默认200ms，传入 null 不节流 */
    throttle?: number | null
    /** 动画时间，单位毫秒，默认400ms，传入 null 不展示动画 */
    transitionDuration?: number | null
    /** 变化的回调函数 */
    onSizeChange?: (sizeData: FlowSizeData) => void
}

export function getGapRange(gap?: undefined | number | null | (number | null)[]): [number, number | null] {
    if (typeof gap === "number") return [gap, gap]
    if (Array.isArray(gap)) return [gap[0] || 0, gap[1]]
    return [0, null]
}

export function getGapCountAndSize(width: number, itemWidth: number, minGap: number, maxGap: number | null): [number, number] {
    const count = Math.floor((width + minGap) / (itemWidth + minGap)) || 1
    if (count === 1) return [count, 0]
    const averageGap = (width - itemWidth * count) / (count - 1)
    if (averageGap < minGap) return [count, minGap]
    if (maxGap !== null && averageGap > maxGap) return [count, maxGap]
    return [count, averageGap]
}

interface Position {
    left: number
    top: number
}

/** 自适应浮动组件 */
export function Flow<T>(props: FlowProps<T>) {
    const { itemWidth, itemHeight, columnGap, rowGap = 0, maxRows, data, render, keyExactor, className, style, containerClassName, containerStyle, throttle, transitionDuration, onSizeChange, ...rest } = props
    const [minColumnGap, maxColumnGap] = getGapRange(columnGap)
    const [width, setWidth] = useState(0)
    const [columnCount, setColumnCount] = useState(1)
    const [columnGapSize, setColumnGapSize] = useState(minColumnGap)
    const [showItems, setShowItems] = useState(false)
    const ele = useRef<HTMLDivElement>(null)
    const contentRows = Math.ceil(data.length / columnCount)
    const contentShownRows = typeof maxRows === "number" ? Math.min(contentRows, maxRows) : contentRows
    const height = contentShownRows > 0 ? contentShownRows * (itemHeight + rowGap) - rowGap : 0

    function getPosition(index: number): Position {
        const y = Math.floor(index / columnCount)
        const x = index - y * columnCount
        return {
            left: x * (itemWidth + columnGapSize),
            top: y * (itemHeight + rowGap)
        }
    }

    function getHidden(index: number) {
        if (typeof maxRows !== "number") return false
        return index >= maxRows * columnCount
    }

    useEffect(() => {
        let timeout: number
        const observer = new ResizeObserver(entries => {
            clearTimeout(timeout)
            function task() {
                const { width } = entries[0].contentRect
                const [newColumnCount, newColumnGapSize] = getGapCountAndSize(width, itemWidth, minColumnGap, maxColumnGap)
                setShowItems(true)
                setWidth(width)
                setColumnCount(newColumnCount)
                setColumnGapSize(newColumnGapSize)
            }
            if (throttle === null) {
                task()
            } else {
                timeout = window.setTimeout(task, throttle || 200)
            }
        })
        observer.observe(ele.current!)

        return () => {
            observer.disconnect()
        }
    }, [itemWidth, throttle, columnGap])

    useEffect(() => {
        onSizeChange?.({ width, height, itemWidth, itemHeight, columnGap: columnGapSize, columnCount, rowGap, rowCount: contentShownRows, overflow: data.length > contentShownRows * columnCount, itemCount: data.length, maxRows: maxRows ?? null })
    }, [width, height, columnGapSize, columnCount, rowGap, contentShownRows, data.length, itemWidth, itemHeight, maxRows])

    return (
        <div ref={ele} className={className} style={{ position: "relative", boxSizing: "border-box", height, ...style }} {...rest}>
            {showItems &&
                data.map((item, index) => (
                    <div
                        key={keyExactor ? keyExactor(item, index) : index}
                        className={containerClassName}
                        style={{
                            position: "absolute",
                            width: itemWidth,
                            height: itemHeight,
                            transition: transitionDuration !== null ? `all ${transitionDuration ?? 400}ms` : undefined,
                            ...getPosition(index)
                        }}>
                        <div style={{ width: itemWidth, height: itemHeight, display: maxRows && index >= maxRows * columnCount ? "none" : "block", ...containerStyle }}>{render(item, index, getHidden(index))}</div>
                    </div>
                ))}
        </div>
    )
}
