import { LayoutWrapper } from "@/components/LayoutWrapper";
import { useSession } from "next-auth/react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  InsightBody,
  InsightItem,
  InsightsCard,
  InsightMainStat,
  InsightTitle,
  InsightSubStat,
} from "@/components/Insights";

const Unauthenticated = () => (
  <div className="mt-12 flex flex-col items-center">
    <h3 className="text-md mt-2 font-medium text-gray-900">Login</h3>
    <p className="text-md mt-1 text-gray-500">
      Connect your wallet to continue
    </p>
    <div className="mt-6">
      <ConnectButton />
    </div>
  </div>
);

const ProtectedPage = ({ children }) => {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (!session && isLoading) {
    return <LayoutWrapper></LayoutWrapper>;
  }

  if (!session && !isLoading) {
    return (
      <LayoutWrapper>
        <Unauthenticated />
      </LayoutWrapper>
    );
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
};

const OrganizationDashboard = ({ organization }) => {
  const [contracts, setContracts] = useState([]);
  const organizationId = organization._id;

  useEffect(() => {
    if (!organizationId) return;
    const retrieveContracts = async () => {
      const response = await axios.get("/api/vesting-contracts", {
        params: { organization: organizationId },
      });
      setContracts(response.data)
    };
    retrieveContracts()
  }, [organizationId]);

  useEffect(() => {
    console.log(contracts)
  }, [contracts])

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex w-full justify-between">
              <h1 className="text-2xl font-semibold text-gray-800">
                {organization.name}
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8">
        <InsightsCard>
          <InsightItem>
            <InsightTitle>Total Allocated</InsightTitle>
            <InsightBody>
              <InsightMainStat>51.17M REQ</InsightMainStat>
              <InsightSubStat>$18M</InsightSubStat>
            </InsightBody>
          </InsightItem>
          <InsightItem>
            <InsightTitle>Vested Allocation</InsightTitle>
            <InsightBody>
              <InsightMainStat>80.16%</InsightMainStat>
            </InsightBody>
          </InsightItem>
          <InsightItem>
            <InsightTitle>Tokens Withdrawn</InsightTitle>
            <InsightBody>
              <InsightMainStat>38.07M</InsightMainStat>
              <InsightSubStat>$8M</InsightSubStat>
            </InsightBody>
          </InsightItem>
          <InsightItem>
            <InsightTitle>Remaining to allocate</InsightTitle>
            <InsightBody>
              <InsightMainStat>10.7M</InsightMainStat>
              <InsightSubStat>$2M</InsightSubStat>
            </InsightBody>
          </InsightItem>
          <InsightItem>
            <InsightTitle>Stakeholders</InsightTitle>
            <InsightBody>
              <InsightMainStat>120</InsightMainStat>
            </InsightBody>
          </InsightItem>
        </InsightsCard>
      </div>
    </>
  );
};

const OrganizationRouter = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const organization = organizations?.[0];

  useEffect(() => {
    const retrieveOrganizations = async () => {
      setIsLoading(true);
      const response = await axios.get("/api/organizations");
      setOrganizations(response.data);
      setIsLoading(false);
    };
    retrieveOrganizations();
  }, []);

  if (isLoading) return <>Loading</>;

  if (!organization && !isLoading) return <></>;

  return <OrganizationDashboard organization={organization} />;
};

const TeamPage = () => {
  return (
    <ProtectedPage>
      <OrganizationRouter />
    </ProtectedPage>
  );
};

export default TeamPage;
