"use client"

import { css } from "@emotion/css"
import { clsx } from "deepsea-tools"
import { forwardRef, HTMLAttributes } from "react"

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    loading?: boolean
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>((props, ref) => {
    let { className, loading, children, ...rest } = props

    loading ??= children === undefined || children === null

    return (
        <div
            ref={ref}
            className={clsx(
                css`
                    @keyframes shimmer {
                        0% {
                            background-position: -400px 0px;
                        }
                        100% {
                            background-position: 400px 0px;
                        }
                    }
                `,
                loading &&
                    css`
                        background-image: linear-gradient(to right, rgba(0, 0, 0, 0.067) 8%, rgba(0, 0, 0, 0.133) 18%, rgba(0, 0, 0, 0.067) 33%);
                        animation-duration: 1s;
                        animation-fill-mode: forwards;
                        animation-iteration-count: infinite;
                        animation-name: shimmer;
                        animation-timing-function: linear;
                        background-size: 800px 104px;
                    `,
                className
            )}
            {...rest}>
            {children}
        </div>
    )
})
