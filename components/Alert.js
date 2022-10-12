import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { LinkIcon } from '@heroicons/react/24/outline';

export const Banner = ({ children, color = 'bg-green-50' }) => {
  return (
    <div className={`rounded-md p-3 ${color}`}>
      <div className="flex">
        <div className="flex-shrink-0"></div>
        <div className="">
          <div className="flex ">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Banner;

export function SmartContractAudit() {
  return (
    <Banner>
      <p className="text-sm font-medium text-green-800">
        Smart Contract Audited by Hacken
      </p>
      <div className="flex flex-col items-end">
        <CheckCircleIcon
          className="h-5 w-5 text-green-400"
          aria-hidden="true"
        />
        <a href="https://github.com/abdelhamidbakhta/token-vesting-contracts/raw/6a039d073f9ed4a295bccd9e1c8c8e873fc68f91/audits/hacken_audit_report.pdf">
          <LinkIcon className="h-4 w-4" />
        </a>
      </div>
    </Banner>
  );
}
