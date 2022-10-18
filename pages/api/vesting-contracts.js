import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getToken } from "next-auth/jwt";

const isOperatorOfOrganization = async (account, organization) => {
  const client = await clientPromise;
  const count = await client
    .db("tokenops")
    .collection("operators")
    .count({ account, organization: ObjectId(organization) })
  return count > 0;
};

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }

  if (req.method === "GET") {
    const { organization } = req.query;

    if (!organization) {
      res.status(400).json({ message: "Missing required query parameter" });
      return;
    }

    if (!ObjectId.isValid(organization)) {
      res.status(400).json({ message: "Invalid organization" });
      return;
    }

    const isOperator = await isOperatorOfOrganization(token.sub, organization);
    if (!isOperator) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const client = await clientPromise;
    const collection = client.db("tokenops").collection("vestingContracts");
    const contracts = await collection.find({ organization: ObjectId(organization) }).toArray();

    res.status(200).json(contracts);
    return;
  }

  res.status(405).json({ message: "Invalid request method" });
}