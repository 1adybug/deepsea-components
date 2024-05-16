import { css } from "@emotion/css"
import { useSize } from "ahooks"
import { clsx, getArray } from "deepsea-tools"
import { CSSProperties, FC, MouseEvent as ReactMouseEvent, useEffect, useRef } from "react"
import Scrollbar from "smooth-scrollbar"
import { ScrollStatus } from "smooth-scrollbar/interfaces/scrollbar"
import { Scroll, ScrollProps } from "./Scroll"

export interface SwiperScrollProps extends Omit<ScrollProps, "scrollbar"> {
    /** 轮播的数据 */
    count: number

    /** 轮播元素的高度 */
    itemHeight: number

    /** 轮播动画的时间 */
    animation: number

    /** 每个元素的停留时间 */
    duration: number

    /** 元素之间的间距 */
    gap?: number

    /** 容器类名 */
    containerClassName?: string

    /** 容器样式 */
    containerStyle?: CSSProperties

    /** 在鼠标移入时是否继续播放 */
    playOnMouseEnter?: boolean
}

export const AutoScroll: FC<SwiperScrollProps> = props => {
    const { count, itemHeight, animation, duration, onMouseEnter, onMouseLeave, gap = 0, containerClassName, containerStyle, children, playOnMouseEnter, ...rest } = props
    const bar = useRef<Scrollbar | null>(null)
    const timeout = useRef<NodeJS.Timeout | undefined>(undefined)
    const ele = useRef<HTMLDivElement>(null)
    const size = useSize(ele)
    const pause = useRef(false)

    useEffect(() => {
        if (playOnMouseEnter) pause.current = false
    }, [playOnMouseEnter])

    useEffect(() => {
        if (!size || count === 0) return
        const { height } = size
        const range = getArray(count, index => (itemHeight + gap) * (index + 1) - (index === count - 1 ? gap : 0))
        const scrollHeight = range[range.length - 1]
        if (height >= scrollHeight) return
        function scroll(target: number) {
            clearTimeout(timeout.current)
            timeout.current = setTimeout(() => {
                if (pause.current) return scroll(target)
                bar.current?.scrollTo(0, target, animation)
            }, duration)
        }
        scroll(range[0])
        function listener(status: ScrollStatus) {
            const { y } = status.offset
            const scrollToBottom = Math.abs(y + height - scrollHeight) / itemHeight <= 0.05
            const target = scrollToBottom ? 0 : range.find(item => item > y)!
            scroll(target)
        }
        bar.current?.addListener(listener)
        return () => {
            clearTimeout(timeout.current)
            bar.current?.removeListener(listener)
            bar.current?.scrollTo(0, 0)
        }
    }, [size, count, itemHeight, gap, duration, animation])

    function onContainerMouseEnter(e: ReactMouseEvent<HTMLDivElement, MouseEvent>) {
        if (playOnMouseEnter) return
        pause.current = true
        onMouseEnter?.(e)
    }

    function onContainerMouseLeave(e: ReactMouseEvent<HTMLDivElement, MouseEvent>) {
        if (playOnMouseEnter) return
        pause.current = false
        onMouseLeave?.(e)
    }

    return (
        <Scroll ref={ele} scrollbar={bar} onMouseEnter={onContainerMouseEnter} onMouseLeave={onContainerMouseLeave} {...rest}>
            <div
                className={clsx(
                    css`
                        display: flex;
                        flex-direction: column;
                        gap: var(--gap, 0);
                        & > * {
                            flex: none;
                        }
                    `,
                    containerClassName
                )}
                style={{ "--gap": `${gap}px`, ...containerStyle } as CSSProperties}>
                {children}
            </div>
        </Scroll>
    )
}
