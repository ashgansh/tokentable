import { PrimaryButton } from "@/components/Button"
import { LayoutWrapper } from "@/components/LayoutWrapper"
import Link from "next/link"

const Contracts = () => {
  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Vesting Contracts</h1>
          <Link href="/contracts/create">
            <a>
              <PrimaryButton>Create</PrimaryButton>
            </a>
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        
      </div>
    </LayoutWrapper>
  )
}

export default Contracts