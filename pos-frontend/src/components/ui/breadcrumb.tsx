"use client"

import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  separator?: React.ReactNode
}

function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

interface BreadcrumbListProps extends React.ComponentPropsWithoutRef<"ol"> {}

function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      className={cn("flex items-center space-x-2", className)}
      {...props}
    />
  )
}

interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<"li"> {}

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return (
    <li
      className={cn("inline-flex items-center space-x-2", className)}
      {...props}
    />
  )
}

interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  asChild?: boolean
}

function BreadcrumbLink({
  className,
  asChild,
  ...props
}: BreadcrumbLinkProps) {
  const Comp = asChild ? React.Fragment : "a"

  return (
    <Comp
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors hover:text-foreground cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

interface BreadcrumbPageProps extends React.ComponentPropsWithoutRef<"span"> {}

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

interface BreadcrumbSeparatorProps extends React.ComponentPropsWithoutRef<"li"> {
  children?: React.ReactNode
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("flex items-center", className)}
      {...props}
    >
      {children ?? <ChevronRight className="h-4 w-4" />}
    </li>
  )
}

interface BreadcrumbEllipsisProps extends React.ComponentPropsWithoutRef<"span"> {}

function BreadcrumbEllipsis({
  className,
  ...props
}: BreadcrumbEllipsisProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
