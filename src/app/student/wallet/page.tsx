import { getWallet } from "@/server/actions/wallet";
import { WalletClient } from "@/features/wallet/wallet-client";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const wallet = await getWallet();
  return <WalletClient wallet={wallet} />;
}
