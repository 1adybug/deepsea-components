"use client"

import { ButtonHTMLAttributes, ChangeEvent, Fragment, InputHTMLAttributes, MouseEvent as ReactMouseEvent, forwardRef, useRef, useState } from "react"
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
    const { multiple = false, type = "file", onChange, disabled: inputDisabled, clearAfterChange, ...rest } = props
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

    return <input ref={ref} disabled={disabled || inputDisabled} type="file" multiple={multiple} onChange={onInputChange} {...rest} />
})

export type InputFileButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    input: InputFileProps
}

/** 专用于读取文件的 button 组件 */
export const InputFileButton = forwardRef<HTMLButtonElement, InputFileButtonProps>((props, ref) => {
    const { onClick, input: inputProps, ...rest } = props
    const { style, ...restInputProps } = inputProps
    const input = useRef<HTMLInputElement>(null)

    function onBtnClick(e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) {
        input.current?.click()
        onClick?.(e)
    }

    return (
        <Fragment>
            <InputFile ref={input} style={{ display: "none", ...style }} {...restInputProps} />
            <button ref={ref} type="button" onClick={onBtnClick} {...rest} />
        </Fragment>
    )
})

export interface ImportExcelProps extends Omit<InputFileProps, "multiple" | "onChange" | "accept" | "type"> {
    onChange?: (data: Record<string, string>[]) => void
}

/** 专门用于读取 excel 的组件 */
export const ImportExcel = forwardRef<HTMLInputElement, ImportExcelProps>((props, ref) => {
    const { onChange, ...rest } = props

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

    return <InputFile ref={ref} accept=".xlsx" type="arrayBuffer" onChange={onInputChange} {...rest} />
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
    const { data, fileName, onClick, ...rest } = props

    function onButtonClick(e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) {
        exportExcel(data, fileName)
        onClick?.(e)
    }

    return <button ref={ref} onClick={onButtonClick} {...rest} />
})
