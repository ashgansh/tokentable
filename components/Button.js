import { classNames } from "@/lib/utils"

export const PrimaryButton = ({ children, className, disabled = false, type = "button", onClick = () => { } }) => {
  const handleClick = () => { if (!disabled) onClick() }
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={classNames(
        "inline-flex items-center rounded-md border border-transparent bg-tokenops-primary-600",
        "px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:opacity-90",
        "disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  )
}

export const SecondaryButton = ({ children, className, disabled = false, type = "button", onClick = () => { } }) => {
  const handleClick = () => { if (!disabled) onClick() }
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={classNames(
        "inline-flex items-center rounded-md border border-transparent bg-tokenops-primary-50",
        "px-3 py-2 text-sm font-medium leading-4 text-tokenops-primary-700 shadow-sm hover:opacity-90",
        "disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  )
}