import { LayoutWrapper } from "@/components/LayoutWrapper"
import Link from "next/link"

const Home = () => (
  <LayoutWrapper>
    <ul>
      <li><Link href="/vesting/request/0x45E6fF0885ebf5d616e460d14855455D92d6CC04">Request Network</Link></li>
      <li><Link href="/vesting/zoracles/0x2369921551f2417d8d5cD4C1EDb1ac7eEe156380">Zoracles</Link></li>
      <li><Link href="/vesting/curve/0x2a7d59e327759acd5d11a8fb652bf4072d28ac04">Curve</Link></li>
    </ul>
  </LayoutWrapper>
)

export default Home