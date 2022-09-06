import { LayoutWrapper } from "@/components/LayoutWrapper"
import { portfolioSelector, portfolioStore } from "@/lib/portfolio"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form";

const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

const PortfolioAddForm = () => {
  const { register, handleSubmit } = useForm();
  const addPortfolioItem = portfolioStore(state => state.addPortfolioItem)

  const onSubmit = (data) => {
    const { contractType, contractAddress, beneficiaryAddress } = data
    addPortfolioItem(1, contractType, contractAddress, beneficiaryAddress)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2.5 py-8">
        <div className="flex flex-col gap-1.5">
          <label>Contract Type (request, curve, ...)</label>
          <input placeholder="curve" type="text" {...register("contractType")} className="border-2" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label>Contract Address (must be EIP55 formatted)</label>
          <input placeholder="contract address" type="text" {...register("contractAddress")} className="border-2" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label>Beneficiary Address (must be EIP55 formatted)</label>
          <input placeholder="beneficiary address" type="text" {...register("beneficiaryAddress")} className="border-2" />
        </div>
        <input type="submit" className="w-20 border-2 hover:cursor-pointer" />
      </div>
    </form>
  );
}

const PortfolioEdit = () => {
  const hasMounted = useHasMounted()
  const portfolio = portfolioStore(portfolioSelector)
  const reset = portfolioStore(state => state.reset)
  const removePortfolioItem = portfolioStore(state => state.removePortfolioItem)

  const handleRemoveItem = (index) => {
    removePortfolioItem(index)
  }

  if (!hasMounted) return

  return (
    <LayoutWrapper>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Portfolio Address Book</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <span className="text-red-500 hover:cursor-pointer" onClick={() => reset()}>Reset</span>
        <ul>
          <li>contract type - contract address - beneficiary address</li>
          {portfolio.map((item, index) => (
            <li key={index}>
              {item.contractType} - {item.contractAddress} - {item.beneficiaryAddress} <span className="hover:cursor-pointer text-red-500" onClick={() => handleRemoveItem(index)}>(X)</span>
            </li>
          ))}
        </ul>
        <PortfolioAddForm />
      </div>
    </LayoutWrapper>
  )
}

export default PortfolioEdit