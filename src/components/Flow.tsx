"use client"

import { css } from "@emotion/css"
import { useSize } from "ahooks"
import { clsx } from "deepsea-tools"
import { CSSProperties, HTMLAttributes, Key, ReactNode, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react"
import { px, transformCSSVariable } from "../utils"

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
    /**
     * 列间距
     * 1. 如果是数字，表示列间距是固定的
     * 2. 如果是 auto，表示会在尽可能放进更多列的情况下，列间距是平均的
     * 2. 如果是数组，表示列间距是区间的，第一个元素是最小值，第二个元素是最大值
     */
    columnGap?: number | "auto" | [number | "auto", number | "auto"]
    /** 行间距 */
    rowGap?: number
    gap?: number
    /** 最大行数 */
    maxRows?: number | null
    /** 源数据 */
    data?: T[]
    /** 渲染 */
    render: (item: T, index: number, arr: T[]) => ReactNode
    /** key释放器，默认为 index */
    keyExactor?: (item: T, index: number, arr: T[]) => Key
    /**
     * 渲染的元素由两层容器包裹，外层容器类名
     */
    wrapperClassName?: string
    /**
     * 渲染的元素由两层容器包裹，外层容器样式
     */
    wrapperStyle?: CSSProperties
    /**
     * 渲染的元素由两层容器包裹，内层容器类名
     */
    containerClassName?: string
    /**
     * 渲染的元素由两层容器包裹，内层容器样式
     */
    containerStyle?: CSSProperties
    /** 节流时间，单位毫秒，默认200ms，传入 0 不节流 */
    throttle?: number
    /** 动画时间，单位毫秒，默认400ms，传入 0 不展示动画 */
    transitionDuration?: number
    /** 变化的回调函数 */
    onSizeChange?: (sizeData: FlowSizeData) => void
    element?: RefObject<HTMLDivElement>
}

export function getGapRange(gap?: undefined | number | "auto" | (number | "auto")[]): [number, number | "auto"] {
    if (typeof gap === "number") return [gap, gap]
    if (Array.isArray(gap)) return [typeof gap[0] === "number" ? gap[0] : 0, gap[1]]
    return [0, "auto"]
}

export interface GapAndCount {
    count: number
    gap: number
}

export function getGapCountAndSize(width: number, itemWidth: number, minGap: number, maxGap: number | "auto"): GapAndCount {
    const count = Math.floor((width + minGap) / (itemWidth + minGap)) || 1
    if (count === 1) return { count, gap: 0 }
    const averageGap = (width - itemWidth * count) / (count - 1)
    if (averageGap < minGap) return { count, gap: minGap }
    if (maxGap !== "auto" && averageGap > maxGap) return { count, gap: maxGap }
    return { count, gap: averageGap }
}

export interface ManualFlowProps<T> extends FlowProps<T> {
    /** 组件宽度，必须指定 */
    width: number
}

/** 手动组件，由外界指定宽度，性能更好 */
export function ManualFlow<T>(props: ManualFlowProps<T>) {
    let { itemWidth, itemHeight, columnGap, rowGap, maxRows, data = [], render, keyExactor, className, style, wrapperClassName, wrapperStyle, throttle, transitionDuration, onSizeChange, containerClassName, containerStyle, gap = 0, width, element, ...rest } = props
    rowGap ??= gap
    columnGap ??= gap
    const [minColumnGap, maxColumnGap] = getGapRange(columnGap)
    const [{ count: columnCount, gap: columnGapSize }, setGapAndCount] = useState(() => getGapCountAndSize(width, itemWidth, minColumnGap, maxColumnGap))
    const ele = useRef<HTMLDivElement>(null)
    const contentRows = Math.ceil(data.length / columnCount)
    const contentShownRows = typeof maxRows === "number" ? Math.min(contentRows, maxRows) : contentRows
    const height = contentShownRows > 0 ? contentShownRows * (itemHeight + rowGap) - rowGap : 0

    function getPosition(index: number) {
        const y = Math.floor(index / columnCount)
        const x = index - y * columnCount
        return {
            left: x * (itemWidth + columnGapSize),
            top: y * (itemHeight + rowGap!)
        }
    }

    function getHidden(index: number) {
        if (typeof maxRows !== "number") return false
        return index >= maxRows * columnCount
    }

    useImperativeHandle(element, () => ele.current!, [ele.current])

    useEffect(() => {
        function task() {
            setGapAndCount(getGapCountAndSize(width, itemWidth, minColumnGap, maxColumnGap))
        }
        if (throttle === 0) return task()
        const timeout = setTimeout(task, throttle || 200)
        return () => clearTimeout(timeout)
    }, [width, itemWidth, throttle, minColumnGap, maxColumnGap])

    useEffect(() => {
        onSizeChange?.({ width, height, itemWidth, itemHeight, columnGap: columnGapSize, columnCount, rowGap: rowGap!, rowCount: contentShownRows, overflow: data.length > contentShownRows * columnCount, itemCount: data.length, maxRows: maxRows ?? null })
    }, [width, height, columnGapSize, columnCount, rowGap, contentShownRows, data.length, itemWidth, itemHeight, maxRows])

    return (
        <div
            ref={ele}
            className={clsx(
                css`
                    position: relative;
                    height: var(--height);
                    overflow: hidden;
                `,
                className
            )}
            style={transformCSSVariable({ height: px(height) }, style)}
            {...rest}>
            {data.map((item, index, arr) => (
                <div
                    key={keyExactor ? keyExactor(item, index, arr) : index}
                    className={clsx(
                        css`
                            position: absolute;
                            width: var(--width);
                            height: var(--height);
                            transition: var(--transition);
                            left: 0;
                            top: 0;
                            transform: translate(var(--left), var(--top));
                        `,
                        wrapperClassName
                    )}
                    style={transformCSSVariable(
                        {
                            width: px(itemWidth),
                            height: px(itemHeight),
                            transition: transitionDuration === 0 ? "none" : `all ${transitionDuration || 400}ms`,
                            left: px(getPosition(index).left),
                            top: px(getPosition(index).top)
                        },
                        wrapperStyle
                    )}>
                    <div
                        className={clsx(
                            css`
                                width: 100%;
                                height: 100%;
                                display: var(--display);
                            `,
                            containerClassName
                        )}
                        style={transformCSSVariable({ display: getHidden(index) ? "none" : "block" }, containerStyle)}>
                        {render(item, index, arr)}
                    </div>
                </div>
            ))}
        </div>
    )
}

/** 自适应浮动组件 */
export function Flow<T>(props: FlowProps<T>) {
    const { itemWidth, itemHeight, columnGap, rowGap, gap, maxRows, data, render, keyExactor, wrapperClassName, wrapperStyle, containerClassName, containerStyle, throttle, transitionDuration, onSizeChange, element, ...rest } = props
    const ele = useRef<HTMLDivElement>(null)
    const size = useSize(ele)
    useImperativeHandle(element, () => ele.current!, [ele.current])
    // 如果无法获取到宽度，直接返回
    if (!size || size.width === 0) return <div ref={ele} {...rest} />
    return <ManualFlow element={ele} {...props} width={size.width} />
}
