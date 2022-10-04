import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Allert() {
  return (
    <div className="rounded-md bg-green-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <div className="flex gap-2">
            <p className="text-sm font-medium text-green-800">
              Smart Contract Audited by Hacken
            </p>
            <a href="https://github.com/abdelhamidbakhta/token-vesting-contracts/raw/6a039d073f9ed4a295bccd9e1c8c8e873fc68f91/audits/hacken_audit_report.pdf">
              <LinkIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
