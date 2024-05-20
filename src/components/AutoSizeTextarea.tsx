"use client"

import { forwardRef, TextareaHTMLAttributes, useEffect, useImperativeHandle, useRef } from "react"

/**
 * 自适应高度的文本域
 */
export const AutoSizeTextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    const { style = {}, ...rest } = props
    const { height, resize, overflowY, ...restStyle } = style
    const ele = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ele.current!, [])

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

    return <textarea ref={ele} style={{ ...restStyle, resize: "none", overflowY: "hidden" }} {...rest} />
})
