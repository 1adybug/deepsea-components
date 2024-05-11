"use client"
import { css } from "@emotion/css"
import { useSize } from "ahooks"
import { DrawArcOptions, clsx, drawArc, setFrameInterval } from "deepsea-tools"
import { ButtonHTMLAttributes, CSSProperties, ChangeEvent, FC, Fragment, HTMLAttributes, InputHTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode, TextareaHTMLAttributes, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import SmoothScrollBar from "smooth-scrollbar"
import type { ScrollbarOptions } from "smooth-scrollbar/interfaces"
import { read, utils, writeFile } from "xlsx"

export interface InputFileDataTypes {
    base64: string
    text: string
    arrayBuffer: ArrayBuffer
    binary: string
    file: File
}

export type InputFileDataType = keyof InputFileDataTypes

export interface InputFileData<T> {
    result: T
    file: File
}

export type InputFileProps = (
    | {
          multiple?: false
          type: "base64" | "text" | "binary"
          onChange?: (data: InputFileData<string>) => void
      }
    | {
          multiple?: false
          type: "arrayBuffer"
          onChange?: (data: InputFileData<ArrayBuffer>) => void
      }
    | {
          multiple?: false
          type?: "file"
          onChange?: (data: InputFileData<File>) => void
      }
    | {
          multiple: true
          type: "base64" | "text" | "binary"
          onChange?: (data: InputFileData<string>[]) => void
      }
    | {
          multiple: true
          type: "arrayBuffer"
          onChange?: (data: InputFileData<ArrayBuffer>[]) => void
      }
    | {
          multiple: true
          type?: "file"
          onChange?: (data: InputFileData<File>[]) => void
      }
) &
    Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "multiple" | "type"> & {
        /** 是否在捕获文件后清除 input 上的文件，默认为 false，主要区别在于如果不清除，连续两次选择同样的文件不会触发 onChange 事件，如果用于 form 表单，请设置为 flase */
        clearAfterChange?: boolean
    }

export async function getFileData<T extends InputFileDataType>(file: File, type: T): Promise<InputFileDataTypes[T]> {
    const fileReader = new FileReader()
    switch (type) {
        case "arrayBuffer":
            fileReader.readAsArrayBuffer(file)
            break
        case "binary":
            fileReader.readAsBinaryString(file)
            break
        case "base64":
            fileReader.readAsDataURL(file)
            break
        case "text":
            fileReader.readAsText(file)
            break
        default:
            return file as any
    }
    return new Promise(resolve => {
        fileReader.addEventListener("load", () => {
            resolve(fileReader.result as any)
        })
    })
}

/** 专用于读取文件的组件 */
export const InputFile = forwardRef<HTMLInputElement, InputFileProps>((props, ref) => {
    const { multiple = false, type = "file", onChange, disabled: inputDisabled, clearAfterChange, ...others } = props
    const [disabled, setDisabled] = useState(false)

    async function onInputChange(e: ChangeEvent<HTMLInputElement>) {
        const input = e.target
        const { files } = input
        if (!files || files.length === 0) return
        setDisabled(true)
        try {
            if (multiple) {
                const result: any[] = []
                for (const file of Array.from(files)) {
                    result.push({
                        result: await getFileData(file, type),
                        file
                    })
                }
                onChange?.(result as any)
            } else {
                onChange?.({
                    result: await getFileData(files[0], type),
                    file: files[0]
                } as any)
            }
            setDisabled(false)
            if (clearAfterChange) input.value = ""
        } catch (error) {
            setDisabled(false)
            if (clearAfterChange) input.value = ""
            throw error
        }
    }

    return <input disabled={disabled && inputDisabled} ref={ref} type="file" multiple={multiple} onChange={onInputChange} {...others} />
})

export interface ImportExcelProps extends Omit<InputFileProps, "multiple" | "onChange" | "accept" | "type"> {
    onChange?: (data: Record<string, string>[]) => void
}

export type InputFileButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    input: InputFileProps
}

/** 专用于读取文件的 button 组件 */
export const InputFileButton = forwardRef<HTMLButtonElement, InputFileButtonProps>((props, ref) => {
    const { onClick, children, input: inputProps, ...others } = props
    const { style, ...otherInputProps } = inputProps
    const input = useRef<HTMLInputElement>(null)

    function onBtnClick(e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) {
        input.current?.click()
        onClick?.(e)
    }

    return (
        <button ref={ref} type="button" onClick={onBtnClick} {...others}>
            <InputFile ref={input} style={{ display: "none", ...style }} {...otherInputProps} />
            {children}
        </button>
    )
})

/** 专门用于读取 excel 的组件 */
export const ImportExcel = forwardRef<HTMLInputElement, ImportExcelProps>((props, ref) => {
    const { onChange, ...others } = props

    function onInputChange(data: InputFileData<ArrayBuffer>) {
        const wb = read(data.result)
        const result = utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]])
        if (typeof result === "object") {
            const $ = result.map(it => {
                const _: Record<string, string> = {}
                Object.keys(it)
                    .filter(key => key !== "__rowNum__")
                    .forEach(key => (_[key] = String(it[key])))
                return _
            })
            onChange?.($)
        }
    }

    return <InputFile ref={ref} accept=".xlsx" type="arrayBuffer" onChange={onInputChange} {...others} />
})

/** 手动导出 excel */
export function exportExcel(data: Record<string, string>[], name: string) {
    const workSheet = utils.json_to_sheet(data)
    const workBook = utils.book_new()
    utils.book_append_sheet(workBook, workSheet)
    writeFile(workBook, `${name}${name.endsWith(".xlsx") ? "" : ".xlsx"}`)
}

export interface ExportExcelProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    data: Record<string, string>[]
    fileName: string
}

/** 导出 excel 的 button 组件 */
export const ExportExcel = forwardRef<HTMLButtonElement, ExportExcelProps>((props, ref) => {
    const { data, fileName, onClick, ...others } = props

    function onButtonClick(e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) {
        exportExcel(data, fileName)
        onClick?.(e)
    }

    return <button ref={ref} onClick={onButtonClick} {...others} />
})

export interface TransitionBoxProps extends HTMLAttributes<HTMLDivElement> {
    containerClassName?: string
    containerStyle?: CSSProperties
    vertical?: boolean
    horizontal?: boolean
    time?: number
}

/** 尺寸渐变的组件 */
export const TransitionBox: FC<TransitionBoxProps> = props => {
    const { style, containerClassName, containerStyle, children, vertical = true, horizontal = true, time = 3000, ...others } = props
    const box = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [count, setCount] = useState(0)

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            const { width: currentWidth, height: currentHeight } = entries[0].contentRect
            setWidth(currentWidth)
            setHeight(currentHeight)
        })

        observer.observe(box.current!)

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        setCount(count => Math.min(count + 1, 3))
    }, [width, height])

    const outerStyle: CSSProperties = { transitionProperty: count === 3 ? [horizontal && "width", vertical && "height"].filter(Boolean).join(", ") : undefined, transitionDuration: count === 3 ? `${time}ms` : undefined, width, height, overflow: "hidden", position: "relative", ...style }

    return (
        <div style={outerStyle} {...others}>
            <div className={containerClassName} style={{ position: "absolute", ...containerStyle }} ref={box}>
                {children}
            </div>
        </div>
    )
}

export interface SeaRadarTarget {
    /** 半径 */
    radius: number
    /** 弧度 */
    angle: number
    /** 元素 */
    element: ReactNode
}

export interface SeaRadarProps {
    /** 最小圆的半径 */
    unitRadius?: number
    /** 一共的全数 */
    circleCount?: number
    /** 角度分成多少份 */
    directionCount?: number
    /** 圈的宽度 */
    circleWidth?: number
    /** 圈的颜色 */
    circleColor: string
    /** 角度的宽度 */
    directionWidth?: number
    /** 角度颜色 */
    directionColor: string
    /** 背景色 */
    backgroundColor: string
    /** 扫描的颜色 */
    scanColor: string
    /** 扫描的弧度 */
    scanAngle?: number
    /** 扫描一周的时间，单位秒 */
    period?: number
    /** 目标列表 */
    targets?: SeaRadarTarget[]
    /** 展示圈 */
    showCircle?: boolean
    /** 展示方位 */
    showDirection?: boolean
    /** 展示刻度线 */
    showGraduationLine?: boolean
    /** 展示刻度文字 */
    showGraduationText?: boolean
}

/** 雷达组件 */
export const SeaRadar: FC<SeaRadarProps> = props => {
    const { unitRadius = 50, circleCount = 4, circleWidth = 1, circleColor, directionCount = 36, directionWidth = 1, directionColor, backgroundColor, scanColor, scanAngle = Math.PI / 6, period = 8, targets, showGraduationLine, showGraduationText, showCircle, showDirection } = props
    const style = { "--unit-radius": `${unitRadius}px`, "--circle-count": circleCount, "--circle-width": `${circleWidth}px`, "--circle-color": circleColor, "--direction-count": directionCount, "--direction-width": `${directionWidth}px`, "--direction-color": directionColor, "--background-color": backgroundColor, "--scan-color": scanColor, "--period": `${period}s` } as CSSProperties
    return (
        <div className="sea-radar-wrapper" style={style}>
            {Array(180)
                .fill(0)
                .map((_, index) => (
                    <div className="sea-radar-little-graduation" style={{ transform: `rotateZ(${2 * index}deg)`, display: showGraduationLine ? "block" : "none" }}></div>
                ))}
            {Array(36)
                .fill(0)
                .map((_, index) => (
                    <div className="sea-radar-graduation" style={{ transform: `rotateZ(${10 * index}deg)`, display: showGraduationLine ? "block" : "none" }}>
                        <span className="sea-radar-graduation-text" style={{ display: showGraduationText ? "block" : "none" }}>
                            {String(index * 10).padStart(3, "0")}
                        </span>
                    </div>
                ))}
            <div className="sea-radar">
                <div className="sea-radar-scan" style={{ height: `${unitRadius * circleCount * Math.tan(scanAngle)}px`, clipPath: `polygon(0 0, 0 100%, 100% 100%)` }}></div>
                {showCircle &&
                    Array(circleCount)
                        .fill(0)
                        .map((_, index) => <div className="sea-radar-circle" style={{ width: `${unitRadius * 2 * (index + 1)}px`, height: `${unitRadius * 2 * (index + 1)}px` }}></div>)}
                {showDirection &&
                    Array(directionCount)
                        .fill(0)
                        .map((_, index) => <div className="sea-radar-direction" style={{ transform: `rotateZ(${(360 / directionCount) * index}deg)` }}></div>)}
                {targets?.map(it => (
                    <div className="sea-radar-target" style={{ left: `${unitRadius * circleCount + it.radius * Math.cos(it.angle)}px`, bottom: `${unitRadius * circleCount + it.radius * Math.sin(it.angle)}px` }}>
                        {it.element}
                    </div>
                ))}
            </div>
        </div>
    )
}

export interface RingProps extends HTMLAttributes<HTMLDivElement> {
    outerWidth: number
    innerWidth: number
}

/** 忘了什么组件 */
export const Ring: FC<RingProps> = props => {
    const { outerWidth, innerWidth, style, ...leftProps } = props

    const outerRadius = outerWidth / 2

    const innerRadius = innerWidth / 2

    return <div style={{ ...style, width: `${outerWidth}px`, height: `${outerWidth}px`, clipPath: `path("M0,${outerRadius} a${outerRadius},${outerRadius},0,1,0,${outerWidth},0 a${outerRadius},${outerRadius},0,1,0,-${outerWidth},0 l${outerRadius - innerRadius},0 a${innerRadius},${innerRadius},0,0,1,${innerRadius * 2},0 a${innerRadius},${innerRadius},0,0,1,-${innerRadius * 2},0 Z")` }} {...leftProps} />
}

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

/** 自适应浮动组件 */
export function Flow<T>(props: FlowProps<T>) {
    const { itemWidth, itemHeight, columnGap, rowGap = 0, maxRows, data, render, keyExactor, className, style, containerClassName, containerStyle, throttle, transitionDuration, onSizeChange, ...others } = props
    const [minColumnGap, maxColumnGap] = getGapRange(columnGap)
    const [width, setWidth] = useState(0)
    const [columnCount, setColumnCount] = useState(1)
    const [columnGapSize, setColumnGapSize] = useState(minColumnGap)
    const [showItems, setShowItems] = useState(false)
    const ele = useRef<HTMLDivElement>(null)
    const contentRows = Math.ceil(data.length / columnCount)
    const contentShownRows = typeof maxRows === "number" ? Math.min(contentRows, maxRows) : contentRows
    const height = contentShownRows > 0 ? contentShownRows * (itemHeight + rowGap) - rowGap : 0

    interface Position {
        left: number
        top: number
    }

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
                const { inlineSize: width } = entries[0].borderBoxSize[0]
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
        <div ref={ele} className={className} style={{ position: "relative", boxSizing: "border-box", height, ...style }} {...others}>
            {showItems &&
                data.map((it, idx) => (
                    <div
                        key={keyExactor?.(it, idx) || idx}
                        className={containerClassName}
                        style={{
                            position: "absolute",
                            width: itemWidth,
                            height: itemHeight,
                            transition: transitionDuration !== null ? `all ${transitionDuration ?? 400}ms` : undefined,
                            ...getPosition(idx)
                        }}>
                        <div style={{ width: itemWidth, height: itemHeight, display: maxRows && idx >= maxRows * columnCount ? "none" : "block", ...containerStyle }}>{render(it, idx, getHidden(idx))}</div>
                    </div>
                ))}
        </div>
    )
}

export interface TrapeziumProps extends HTMLAttributes<HTMLDivElement> {
    top: number
    bottom: number
    height: number
    borderRadius: number
}

/** 梯形组件 */
export const Trapezium = forwardRef<HTMLDivElement, TrapeziumProps>((props, ref) => {
    const { top, bottom, height, borderRadius, style, ...other } = props

    const diff = (bottom - top) / 2

    const a = Math.atan(height / diff) / 2

    const b = borderRadius / Math.tan(a)

    const c = b * Math.cos(a * 2)

    const d = b * Math.sin(a * 2)

    const e = Math.PI / 2 - a

    const f = borderRadius / Math.tan(e)

    const g = f * Math.cos(a * 2)

    const h = f * Math.sin(a * 2)

    return <div ref={ref} style={{ width: bottom, height, clipPath: `path("M ${diff + f} ${0}  A ${borderRadius} ${borderRadius} 0 0 0 ${diff - g} ${h} L ${c} ${height - d} A ${borderRadius} ${borderRadius} 0 0 0 ${b} ${height} L ${bottom - b} ${height} A ${borderRadius} ${borderRadius} 0 0 0 ${bottom - c} ${height - d} L ${top + diff + g} ${h} A ${borderRadius} ${borderRadius} 0 0 0 ${top + diff - f} ${0} Z")`, ...style }} {...other} />
})

export interface LoopSwiperProps extends HTMLAttributes<HTMLDivElement> {
    direction?: "horizontal" | "vertical"
    reverse?: boolean
    period: number
    gap?: CSSProperties["gap"]
}

css`
    @keyframes deepsea-horizontal-loop-swipe {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(-100%);
        }
    }
    @keyframes deepsea-reverse-horizontal-loop-swipe {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(100%);
        }
    }
    @keyframes deepsea-vertical-loop-swipe {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(-100%);
        }
    }
    @keyframes deepsea-reverse-vertical-loop-swipe {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(100%);
        }
    }
`

/** 循环播放组件 */
export const LoopSwiper = forwardRef<HTMLDivElement, LoopSwiperProps>((props, ref) => {
    const { style, children, direction, period, reverse, gap, ...others } = props
    const wrapper = useRef<HTMLDivElement>(null)
    const container = useRef<HTMLDivElement>(null)
    const [swiper, setSwiper] = useState(false)
    const directionRef = useRef(direction)
    directionRef.current = direction
    const flexDirection: CSSProperties["flexDirection"] = direction === "vertical" ? (reverse ? "column-reverse" : "column") : reverse ? "row-reverse" : "row"
    const animationName = swiper ? (direction === "vertical" ? (reverse ? "deepsea-reverse-vertical-loop-swipe" : "deepsea-vertical-loop-swipe") : reverse ? "deepsea-reverse-horizontal-loop-swipe" : "deepsea-horizontal-loop-swipe") : "none"
    const animationDuration = `${period}ms`
    const animationTimingFunction = "linear"
    const animationIterationCount = "infinite"

    useImperativeHandle(ref, () => wrapper.current!)

    useEffect(() => {
        const wrapperEle = wrapper.current!
        const containerEle = container.current!
        let wrapperWidth = 0
        let wrapperHeight = 0
        let containerWidth = 0
        let containerHeight = 0
        const observer = new ResizeObserver(entries => {
            entries.forEach(entry => {
                if (entry.target === wrapperEle) {
                    wrapperWidth = entry.contentRect.width
                    wrapperHeight = entry.contentRect.height
                } else if (entry.target === containerEle) {
                    containerWidth = entry.contentRect.width
                    containerHeight = entry.contentRect.height
                }
            })
            setSwiper(directionRef.current === "vertical" ? containerHeight > wrapperHeight : containerWidth > wrapperWidth)
        })
        observer.observe(wrapperEle)
        observer.observe(containerEle)
    }, [])

    return (
        <div ref={wrapper} style={{ display: "flex", flexDirection, gap, ...style }} {...others}>
            <div ref={container} style={{ display: "flex", flexDirection, gap, animationName, animationTimingFunction, animationDuration, animationIterationCount }}>
                {children}
            </div>
            <div style={{ display: swiper ? "flex" : "none", flexDirection, gap, animationName, animationTimingFunction, animationDuration, animationIterationCount }}>{children}</div>
        </div>
    )
})

export interface SectionRingProps extends HTMLAttributes<HTMLDivElement> {
    outerRadius: number
    innerRadius: number
    count: number
    angel: number
}

export const SectionRing: FC<SectionRingProps> = props => {
    const { outerRadius: o, innerRadius: i, count: c, angel: a, style, ...others } = props

    const s = (Math.PI * 2) / c - a

    function arc(radius: number, startAngle: number, endAngle: number, options: DrawArcOptions = {}) {
        return drawArc(o, o, radius, startAngle, endAngle, options)
    }

    return (
        <div
            style={{
                ...style,
                width: o * 2,
                height: o * 2,
                clipPath: `path("${Array(c)
                    .fill(0)
                    .map((it, idx) => `${arc(o, idx * (a + s), idx * (a + s) + a)} ${arc(i, idx * (a + s) + a, idx * (a + s), { line: true, anticlockwise: true })}`)
                    .join(" ")} Z")`
            }}
            {...others}
        />
    )
}

export interface TransitionNumProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    /** 当前数字 */
    children: number
    /** 变换周期，单位帧 */
    period: number
    /** 数字转换为字符串的方法 */
    numToStr?: (num: number) => string
}

export interface TransitionNumIns {
    get(): number
}

/** 渐变数字组件 */
export const TransitionNum = forwardRef<TransitionNumIns, TransitionNumProps>((props, ref) => {
    const { children: num, period, numToStr, ...others } = props
    if (!Number.isInteger(num) || !Number.isInteger(period) || period <= 0) {
        throw new RangeError("目标数字必须是整数，周期必须是正整数")
    }
    const ele = useRef<HTMLDivElement>(null)
    const cache = useRef({ num, period, numToStr, show: num })
    cache.current = { ...cache.current, num, period, numToStr }

    useImperativeHandle(ref, () => ({ get: () => cache.current.show }), [])

    useEffect(() => {
        const { num, period, show, numToStr } = cache.current
        ele.current!.innerText = (numToStr || String)(show)
        if (num === show) return
        const div = ele.current!
        const speed = (num - show) / period
        const cancel = setFrameInterval(() => {
            const { num, numToStr } = cache.current
            cache.current.show += speed
            if ((speed > 0 && cache.current.show > num) || (speed < 0 && cache.current.show < num)) {
                cancel()
                cache.current.show = num
            }
            div.innerText = (numToStr || String)(speed > 0 ? Math.floor(cache.current.show) : Math.ceil(cache.current.show))
        }, 1)

        return cancel
    }, [num])

    return <div ref={ele} {...others} />
})

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
    const { width, height, radius, startAngel = 0, gapAngel = 0, align = "center", style, direction = "outer", reverse = false, separator, children, ...others } = props
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
                <span key={idx} style={{ position: "absolute", ...style, transform: getTransform(idx), textAlign: "center", width, lineHeight: `${height}px`, height: height }} {...others}>
                    {w}
                </span>
            ))}
        </Fragment>
    )
}

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
}

/**
 * 滚动条组件
 * @description 注意 children 不是直接渲染在组件上的，而是渲染在内部的容器上
 */
export const Scroll = forwardRef<HTMLDivElement, ScrollProps>((props, ref) => {
    const { children, containerClassName, containerStyle, options, className, ...others } = props
    const { thumbWidth, ...scrollbarOptions } = options || {}
    const ele = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ele.current!)

    useEffect(() => {
        SmoothScrollBar.init(ele.current!, scrollbarOptions)
    }, [])

    return (
        <div
            ref={ele}
            className={clsx(
                !!thumbWidth &&
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
            {...others}>
            <div className={containerClassName} style={containerStyle}>
                {children}
            </div>
        </div>
    )
})

export const AutoSizeTextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    const { style = {}, ...others } = props
    const { height, resize, overflowY, ...otherStyle } = style
    const ele = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ele.current!)

    useEffect(() => {
        const textarea = ele.current!
        function resizeTextarea() {
            textarea.style.height = "auto"
            textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`
        }
        textarea.addEventListener("input", resizeTextarea)
        textarea.addEventListener("change", resizeTextarea)

        return () => {
            textarea.removeEventListener("input", resizeTextarea)
            textarea.removeEventListener("change", resizeTextarea)
        }
    }, [])

    return <textarea ref={ele} style={{ ...otherStyle, resize: "none", overflowY: "hidden" }} {...others} />
})

export interface AutoFitProps extends HTMLAttributes<HTMLDivElement> {
    /** 设计稿宽度，默认 1920 */
    width?: number
    /** 设计稿高度，默认 1080 */
    height?: number
}

export const AutoFit = forwardRef<HTMLDivElement, AutoFitProps>((props, ref) => {
    const { width = 1920, height = 1080, style, ...rest } = props
    const ele = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState<{ width: number; height: number } | undefined>(undefined)
    useImperativeHandle(ref, () => ele.current!, [ele.current])
    useEffect(() => {
        const parent = ele.current?.parentElement
        if (!parent) return
        function listener(entries: ResizeObserverEntry[]) {
            const entry = entries[0]
            const { width, height } = entry.contentRect
            setSize({ width, height })
        }
        const observer = new ResizeObserver(listener)
        observer.observe(parent)
        return () => observer.disconnect()
    }, [ele.current?.parentElement])
    if (!size) return <div ref={ele} style={{ display: "none" }} />
    const scale = Math.min(size.width / width, size.height / height)
    const translateX = (width - size.width) / 2
    const translateY = (height - size.height) / 2
    return <div ref={ele} style={{ transform: `scale(${scale}) translateX(${translateX}px) translateY(${translateY}px)`, width, height, ...style }} {...rest} />
})
