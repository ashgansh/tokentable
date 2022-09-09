import { Fragment } from "react"
import { Transition, Dialog } from "@headlessui/react"

export const ModalTitle = ({ children }) => (
  <h3 className="font-space text-xl p-4 border-bottom border-b-2">
    {children}
  </h3>
)

export const ModalBody = ({ children }) => (
  <div className="p-4">{children}</div>
)

export const ModalActionFooter = ({ children }) => (
  <div className="flex justify-end p-4">
    {children}
  </div>
)

export const Modal = ({ children, show, onClose }) => (
  <Transition.Root show={show} as={Fragment}>
    <Dialog as="div" className="fixed z-40 inset-0 overflow-y-auto" onClose={onClose}>
      <div className="flex justify-center items-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
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
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
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
          <div className="bg-white inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
            {children}
          </div>
        </Transition.Child>
      </div>
    </Dialog >
  </Transition.Root >
)