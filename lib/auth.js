import { getCsrfToken, signIn } from "next-auth/react";
import { SiweMessage } from "siwe";
import { useAccount, useNetwork, useSignMessage } from "wagmi";

export const useLogin = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();

  const login = async () => {
    const message = new SiweMessage({
      domain: window.location.host,
      address: address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId: chain?.id,
      nonce: await getCsrfToken(),
    });
    const signature = await signMessageAsync({
      message: message.prepareMessage(),
    });
    const response = signIn("credentials", {
      message: JSON.stringify(message),
      redirect: false,
      signature,
    });

    return response?.ok ?? false
  };

  return login
};
