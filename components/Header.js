/* This example requires Tailwind CSS v2.0+ */
import { Popover, Transition } from "@headlessui/react";

import TokenOpsLogo from "../images/tokentable-logo.svg";
import AccountButton from "./AccountButton";
import Link from "next/link";
import { OutlineButton, SecondaryButton } from "./Button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <Popover className="relative ">
      <div className="flex items-center justify-between px-4 py-6 sm:px-6 md:justify-start md:space-x-10">
        <div className="flex justify-start lg:w-0 lg:flex-1">
          <Link href="/">
            <a>
              <span className="sr-only">Your Company</span>
              <img
                className="h-8 w-auto sm:h-10"
                src={TokenOpsLogo.src}
                alt=""
              />
            </a>
          </Link>
        </div>
        <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
          <Link href="/create">
            <a className="text-base font-medium text-gray-800 hover:text-gray-900 mx-3 min-w-fit">
              Create vesting
            </a>
          </Link>
          {/* <Link href="/contracts/create">
            <a className="text-base font-medium text-gray-800 hover:text-gray-900 mx-3">
              Vestings
            </a>
          </Link> */}
          <Link href="/portfolio">
            <a className="text-base font-medium text-gray-500 hover:text-gray-900 mx-3 min-w-fit">
              Vestings
            </a>
          </Link>
          <div>
            <OutlineButton className="min-w-max">
              <a href="https://tokenops.xyz/register">Get in touch</a>
            </OutlineButton>
          </div>
          <div className="flex flex-shrink-0 ml-4">
            <ConnectButton
              showBalance={{ smallScreen: false, largeScreen: false }}
            />
          </div>
        </div>
      </div>
    </Popover>
  );
}
