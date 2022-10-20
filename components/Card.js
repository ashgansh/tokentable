import { classNames } from "@/lib/utils";

const Card = ({ children, className }) => (
  <div
    className={classNames(
      "border border-gray-200 shadow rounded-lg px-4 py-4 md:px-6 bg-white",
      className
    )}
  >
    {children}
  </div>
);

export default Card