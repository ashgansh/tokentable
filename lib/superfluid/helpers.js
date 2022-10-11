import { Framework } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";

// tested ✅
export async function updateFlowPermissions({
  operator,
  flowRateAllowance = 0,
  permissionType = 4,
  signer,
  chainId,
  superTokenSymbol,
}) {
  const sf = await Framework.create({
    chainId,
    provider: signer,
  });

  const SuperTokenContract = await sf.loadSuperToken(superTokenSymbol);
  const superToken = SuperTokenContract.address;

  console.log(sf.cfaV1);
  try {
    const amountInWei = ethers.BigNumber.from(flowRateAllowance);
    const updateFlowOperatorOperation = sf.cfaV1.updateFlowOperatorPermissions({
      flowOperator: operator,
      permissions: permissionType,
      flowRateAllowance: amountInWei,
      superToken: superToken,
    });

    console.log("Updating your flow permissions...");

    const result = await updateFlowOperatorOperation.exec(signer);
    console.log(result);

    console.log(
      `Congrats - you've just updated flow permissions for 
      Network: ${chainId}
      Super Token: ${superTokenSymbol}
      Operator: ${operator}
      Permission Type: ${permissionType},
      Flow Rate Allowance: ${flowRateAllowance}
      `
    );
  } catch (error) {
    console.log(
      "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
    );
    console.error(error);
  }
}

export const getSuperTokenContract = async (
  superTokenSymbol,
  chainId = 137,
  provider
) => {
  const sf = await Framework.create({
    chainId: Number(chainId),
    provider,
  });

  const SuperTokenContract = await sf.loadSuperToken(superTokenSymbol);
  return SuperTokenContract;
};

//where the Superfluid logic takes place ⬇️ not thested
export async function deleteFlowAsOperator({
  sender,
  recipient,
  signer,
  chainId = 137,
  superTokenSymbol,
}) {
  const sf = await Framework.create({
    chainId: Number(chainId),
    provider: signer,
  });

  const SuperTokenContract = await sf.loadSuperToken(superTokenSymbol);
  const SuperToken = SuperTokenContract.address;

  try {
    const deleteFlowOperation = sf.cfaV1.deleteFlowByOperator({
      sender: sender,
      receiver: recipient,
      superToken: SuperToken,
    });

    console.log("Deleting your stream...");

    const result = await deleteFlowOperation.exec(signer);
    console.log(result);

    console.log(
      `Congrats - you've just deleted your money stream!
    View Your Stream At: https://app.superfluid.finance/dashboard/${recipient}
    Network: ${chainId}
    Super Token: ${superTokenSymbol}
    Receiver: ${recipient},
    `
    );
  } catch (error) {
    console.log(
      "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
    );
    console.error(error);
  }
}
