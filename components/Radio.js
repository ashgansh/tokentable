import { useState } from 'react';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import Alert, { SmartContractAudit } from './Alert';

const protocolList = [
{
    id: 2,
    title: 'Superfluid',
    disabled: false,
    description:
      'Create your vesting contract on Superfluid. Superfluid is trusted by organisations everywhere to create realtime payments. ',
  },
  {
    id: 1,
    title: 'Sablier (coming soon)',
    disabled: true,
    description:
      'Create your vesting contract on sablier. Sablier secures $55M+ of assets.',
  },
  {
    id: 3,
    title: 'TokenOps (coming soon)',
    disabled: true,
    description: (
      <div>
        <SmartContractAudit />
        Get all the power of TokenOps at your disposal. Use advanced
        functionalities such post-vesting lockups, or deploy on any evm-based
        chain. (coming soon)
      </div>
    ),
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ProtocolRadio({ onChange = () => { } }) {
  const [selectedProtocol, setSelectedProtocol] = useState(
    protocolList[0]
  );
  const handleSelect = (e) => {
    console.log(e)
    setSelectedProtocol(e)
  }

  return (
    <RadioGroup value={selectedProtocol} onChange={handleSelect}>
      <RadioGroup.Label className="text-base font-medium text-gray-900"></RadioGroup.Label>

      <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
        {protocolList.map((mailingList) => (
          <RadioGroup.Option
            key={mailingList.id}
            value={mailingList}
            className={({ checked, active }) =>
              classNames(
                checked ? 'border-transparent' : 'border-gray-300',
                active
                  ? 'border-tokenops-primary-600 ring-2 ring-tokenops-primary-600'
                  : '',
                'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none',
                mailingList.disabled ? 'opacity-50' : ''
              )
            }
          >
            {({ checked, active }) => (
              <>
                <span className="flex flex-1">
                  <span className="flex flex-col">
                    <RadioGroup.Label
                      as="span"
                      className="block text-sm font-medium text-gray-900"
                    >
                      {mailingList.title}
                    </RadioGroup.Label>
                    <RadioGroup.Description
                      as="span"
                      className="mt-1 flex items-center text-sm text-gray-500"
                    >
                      {mailingList.description}
                    </RadioGroup.Description>
                  </span>
                </span>
                <CheckCircleIcon
                  className={classNames(
                    !checked ? 'invisible' : '',
                    'h-5 w-5 text-tokenops-primary-500'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={classNames(
                    active ? 'border' : 'border-2',
                    checked
                      ? 'border-tokenops-primary-600'
                      : 'border-transparent',
                    'pointer-events-none absolute -inset-px rounded-lg'
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup >
  );
}
