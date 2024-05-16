import { HTMLAttributes, ReactNode, useEffect, useRef, useState, MouseEvent as ReactMouseEvent } from "react"
import Scrollbar from "smooth-scrollbar"
import { ScrollStatus } from "smooth-scrollbar/interfaces/scrollbar"
import { Scroll, ScrollOptions } from "./Scroll"

export interface SwiperScrollProps<T> extends HTMLAttributes<HTMLDivElement> {
    count: number

    /** 轮播元素的长度 */
    itemHeight: number

    /** 轮播的数据 */
    data: T[]

    /** key 生成器 */
    keyExtractor?: (item: T, index: number, data: T[]) => string | number

    /** 轮播元素的渲染函数 */
    render: (item: T, index: number, data: T[]) => ReactNode

    /** 轮播动画的时间 */
    animationTime: number

    /** 每个元素的停留时间 */
    period: number

    /** 元素之间的间距 */
    gap?: number

    /** 滚动条选项 */
    options?: ScrollOptions
}

export function AutoScroll<T>(props: SwiperScrollProps<T>) {
    const { style, itemHeight, count, data, render, animationTime, period, keyExtractor, options, onMouseEnter, onMouseLeave, gap = 0, ...rest } = props

    const [offset, setOffset] = useState(0)

    const [paused, setPaused] = useState(false)

    const pausedRef = useRef(paused)

    pausedRef.current = paused

    const periodRef = useRef(period)

    periodRef.current = period

    const height = (itemHeight + gap) * count - gap

    const bar = useRef<Scrollbar | null>(null)

    useEffect(() => {
        let timer: NodeJS.Timeout
        const listener = (status: ScrollStatus) => {
            const y = status.offset.y
            const a = y / (itemHeight + gap)
            let newOffset: number
            if (a % 1 <= 0.05) {
                newOffset = Math.floor(a)
            } else {
                newOffset = Math.ceil(a)
            }
            clearTimeout(timer)
            timer = setTimeout(() => {
                setOffset(newOffset)
            }, periodRef.current)
        }
        bar.current?.addListener(listener)
        return () => {
            bar.current?.removeListener(listener)
        }
    }, [])

    useEffect(() => {
        if (data.length <= count || paused === true) return
        const timer = setTimeout(() => {
            setOffset((offset + 1) % (data.length + 1 - count))
        }, periodRef.current)
        return () => clearTimeout(timer)
    }, [count, data.length, offset, paused])

    useEffect(() => {
        setOffset(0)
    }, [itemHeight, count, data.length, animationTime, period, gap])

    useEffect(() => {
        if (pausedRef.current) return
        bar.current?.scrollTo(0, offset * (itemHeight + gap), animationTime)
    }, [offset])

    function onContainerMouseEnter(e: ReactMouseEvent<HTMLDivElement, MouseEvent>) {
        setPaused(true)
        onMouseEnter?.(e)
    }

    function onContainerMouseLeave(e: ReactMouseEvent<HTMLDivElement, MouseEvent>) {
        setPaused(false)
        onMouseLeave?.(e)
    }

    return (
        <Scroll scrollbar={bar} options={options} style={{ height, ...style }} onMouseEnter={onContainerMouseEnter} onMouseLeave={onContainerMouseLeave} {...rest}>
            {data.map((item, index, arr) => (
                <div key={keyExtractor?.(item, index, arr) ?? index} style={{ height: itemHeight, marginTop: index === 0 ? 0 : `${gap}px` }}>
                    {render(item, index, arr)}
                </div>
            ))}
        </Scroll>
    )
}
