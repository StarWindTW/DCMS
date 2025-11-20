"use client"

import { Group } from "@chakra-ui/react"
import type { GroupProps } from "@chakra-ui/react"
import { cloneElement, forwardRef } from "react"

export interface InputGroupProps extends GroupProps {
  startElement?: React.ReactElement
  endElement?: React.ReactElement
  startElementProps?: GroupProps
  endElementProps?: GroupProps
  children: React.ReactElement
}

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup(props, ref) {
    const {
      startElement,
      startElementProps,
      endElement,
      endElementProps,
      children,
      ...rest
    } = props

    return (
      <Group ref={ref} position="relative" {...rest}>
        {startElement && (
          <GroupElement placement="start" {...startElementProps}>
            {startElement}
          </GroupElement>
        )}
        {cloneElement(children, {
          ...(startElement && { ps: "calc(var(--input-height) - 6px)" }),
          ...(endElement && { pe: "calc(var(--input-height) - 6px)" }),
          ...children.props,
        })}
        {endElement && (
          <GroupElement placement="end" {...endElementProps}>
            {endElement}
          </GroupElement>
        )}
      </Group>
    )
  },
)

interface GroupElementProps extends GroupProps {
  placement: "start" | "end"
  children: React.ReactNode
}

const GroupElement = forwardRef<HTMLDivElement, GroupElementProps>(
  function GroupElement(props, ref) {
    const { placement, children, ...rest } = props
    return (
      <Group
        ref={ref}
        position="absolute"
        top="0"
        insetStart={placement === "start" ? "0" : undefined}
        insetEnd={placement === "end" ? "0" : undefined}
        width="var(--input-height)"
        height="var(--input-height)"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
        zIndex={1}
        {...rest}
      >
        {children}
      </Group>
    )
  },
)
