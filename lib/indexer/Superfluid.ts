import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { BigNumber } from "ethers";

const getGrants = async (senderAccount, client) => {
  const query = gql`
    query ($senderAccount: String!) {
      streamPeriods(where: { sender: $senderAccount }) {
        id
        receiver {
          id
        }
        token {
          id
          underlyingAddress
        }
        deposit
        flowRate
        startedAtTimestamp
        stoppedAtTimestamp
        totalAmountStreamed
      }
    }
  `;
  const result = await client.query({
    query,
    variables: { senderAccount: senderAccount.toLowerCase() },
  });

  const grants = result.data.streamPeriods.map((streamPeriod) => {
    const {
      totalAmountStreamed,
      flowRate,
      startedAtTimestamp,
      stoppedAtTimestamp,
      receiver,
      id,
    } = streamPeriod;

    const beneficiary = receiver.id;
    const startTime = Number(startedAtTimestamp);
    const endTime = Number(stoppedAtTimestamp);
    const cliffTime = startTime;
    const now = Date.now() / 1000;
    const nowOrEndTime = Math.min(now, endTime);
    const timeElapsed = startTime - nowOrEndTime;
    const vestedAmount = totalAmountStreamed
      ? BigNumber.from(totalAmountStreamed)
      : BigNumber.from(flowRate).mul(timeElapsed);

    return {
      id,
      beneficiary,
      startTime,
      endTime,
      cliffTime,
      vestedAmount,
    };
  });

  return grants;
};

export const getVestingData = async (
  chainId: number,
  senderAccount: string
) => {
  const client = new ApolloClient({
    uri: "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic",
    cache: new InMemoryCache(),
  });

  const grants = await getGrants(senderAccount, client);
  const withdrawals = [];
  const admins = [senderAccount];

  const tokens = {};

  // Totals
  const totalWithdrawnAmounts = {}; //getTotalWithdrawnAmounts(withdrawals);
  const totalAllocatedAmounts = {}; //getTotalAllocatedAmounts(grants);
  const totalVestedAmounts = {}; //getTotalVestedAmounts(grants);

  // Capabilities
  const capabilities = {
    multiToken: false,
    addVestingSchedule: false,
  };

  return {
    grants,
    withdrawals,
    totalWithdrawnAmounts,
    totalAllocatedAmounts,
    totalVestedAmounts,
    tokens,
    capabilities,
    admins,
  };
};
