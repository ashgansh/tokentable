/* This example requires Tailwind CSS v2.0+ */
import { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
import {
    ArrowPathIcon,
    Bars3Icon,
    ChartBarIcon,
    CursorArrowRaysIcon,
    DocumentChartBarIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline'

import { ChevronDownIcon } from '@heroicons/react/20/solid'
import TokenOpsLogo from '../images/tokenops-logo.svg'
import AccountButton from './AccountButton'
import { useAccount } from 'wagmi'
import Link from 'next/link'



export default function Header() {

    return (
        <Popover className="relative bg-white">
            <div className="flex items-center justify-between px-4 py-6 sm:px-6 md:justify-start md:space-x-10">
                <div className="flex justify-start lg:w-0 lg:flex-1">
                    <a href="#">
                        <span className="sr-only">Your Company</span>
                        <img
                            className="h-8 w-auto sm:h-10"
                            src={TokenOpsLogo.src}
                            alt=""
                        />
                    </a>
                </div>
                <Link href="/demo">
                    <a className="text-base font-medium text-gray-500 hover:text-gray-900">
                        Portfolio Demo
                    </a>
                </Link>
                <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
                    <AccountButton />
                    <div>
                        <a
                            href="#"
                            className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-tokenops-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-tokenops-primary-700"
                        >
                            Sign up
                        </a>
                    </div>

                </div>
            </div>
        </Popover>
    )
}
