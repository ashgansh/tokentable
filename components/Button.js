import { classNames } from "@/lib/utils"

export const PrimaryButton = ({ children, disabled = false, type = "button", onClick = () => { } }) => {
  const handleClick = () => { if (!disabled) onClick() }

  return (
    <button
      type={type}
      onClick={handleClick}
      className={classNames(
        "inline-flex items-center rounded-md border border-transparent bg-indigo-600",
        "px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        "disabled:opacity-60"
      )}
      disabled={disabled}
    >
      {children}
    </button>
  )
}