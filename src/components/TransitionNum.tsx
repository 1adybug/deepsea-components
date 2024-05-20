"use client"

import { setFrameInterval } from "deepsea-tools"
import { ForwardedRef, HTMLAttributes, forwardRef, useEffect, useImperativeHandle, useRef } from "react"

export interface TransitionNumProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    /** 当前数字 */
    children: number
    /** 变换周期，单位帧 */
    period: number
    /** 数字转换为字符串的方法 */
    numToStr?: (num: number) => string
    /** 实例 */
    ins?: ForwardedRef<TransitionNumIns>
}

export interface TransitionNumIns {
    get(): number
}

/** 渐变数字组件 */
export const TransitionNum = forwardRef<HTMLDivElement, TransitionNumProps>((props, ref) => {
    const { children: num, period, numToStr, ins, ...rest } = props
    if (!Number.isInteger(num) || !Number.isInteger(period) || period <= 0) {
        throw new RangeError("目标数字必须是整数，周期必须是正整数")
    }
    const ele = useRef<HTMLDivElement>(null)
    const cache = useRef({ num, period, numToStr, show: num })
    cache.current = { ...cache.current, num, period, numToStr }

    useImperativeHandle(ref, () => ele.current!, [])
    useImperativeHandle(ins, () => ({ get: () => cache.current.show }), [])

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

    return <div ref={ele} {...rest} />
})
