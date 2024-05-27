"use client"

import { css } from "@emotion/css"
import { clsx } from "deepsea-tools"
import { forwardRef, TextareaHTMLAttributes, useImperativeHandle, useLayoutEffect, useRef, useState } from "react"
import { px, transformCSSVariable } from "../utils"

/**
 * 自适应高度的文本域
 */
export const AutoSizeTextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    const { className, style, ...rest } = props
    const [height, setHeight] = useState<string | undefined>(undefined)
    const ele = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ele.current!, [])

    useLayoutEffect(() => {
        const textarea = ele.current!
        function resizeTextarea() {
            setHeight("auto")
            setHeight(px(textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight))
        }
        resizeTextarea()
        textarea.addEventListener("input", resizeTextarea)
        textarea.addEventListener("change", resizeTextarea)

        return () => {
            textarea.removeEventListener("input", resizeTextarea)
            textarea.removeEventListener("change", resizeTextarea)
        }
    }, [])

    return (
        <textarea
            ref={ele}
            className={clsx(
                css`
                    height: var(--height);
                    resize: none;
                    overflow-y: hidden;
                `,
                className
            )}
            style={transformCSSVariable({ height }, style)}
            {...rest}
        />
    )
})
