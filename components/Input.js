import { classNames } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef(function Input({ className, type = "text", ...args }, ref) {
  return (
    <input
      type={type}
      className={classNames("block w-full rounded-md border-gray-300 shadow-sm sm:text-sm", className)}
      ref={ref}
      {...args}
    />
  )
})

export const CurrencyInput = forwardRef(function CurrencyInput ({ symbol, children, className, ...args }, ref) {
  return (
    <div className="relative mt-1 rounded-md shadow-sm">
      <Input
        type="number"
        className={classNames("pr-12", className)}
        ref={ref}
        {...args}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <span className="text-gray-500 sm:text-sm">
          {symbol}
        </span>
      </div>
    </div>
  )
})

export const Label = ({ className, children }) => (
  <label className={classNames("block text-sm pb-1", className)}>
    {children}
  </label>
)