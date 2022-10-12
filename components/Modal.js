import { Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';

export const ModalTitle = ({ children }) => (
  <h3 className="border-bottom p-4 text-lg font-medium leading-6 text-gray-900">
    {children}
  </h3>
);

export const ModalSubtitle = ({children}) => {
    return <div className='px-4 leading-5 text-sm text-gray-500'>
        {children}
    </div>
}

export const ModalBody = ({ children }) => (
  <div className="p-4">{children}</div>
);

export const ModalActionFooter = ({ children }) => (
  <div className="flex justify-end p-4">{children}</div>
);

export const Modal = ({ children, show, onClose = () => null }) => (
  <Transition.Root show={show} as={Fragment}>
    <Dialog
      as="div"
      className="fixed inset-0 z-40 overflow-y-auto"
      onClose={onClose}
    >
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div className="inline-block transform rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:align-middle">
            {children}
          </div>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition.Root>
);
