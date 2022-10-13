import clientPromise from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }

  if (req.method === "POST") {
    // TODO: validate incoming params
    const {
      startTime,
      endTime,
      amount,
      beneficiary,
      tokenAddress,
      contractAddress,
      chainId,
    } = req.body;

    const client = await clientPromise;
    const collection = client.db("tokenops").collection("drafts");
    await collection.insertOne({
      startTime,
      endTime,
      beneficiary,
      amount,
      tokenAddress,
      contractAddress,
      chainId,
      admin: token.sub,
    });
    res.status(201).json({ message: "Added to drafts" });
    return;
  }

  if (req.method === "GET") {
    const client = await clientPromise;
    const collection = client.db("tokenops").collection("drafts");
    const collections = await collection.find({ admin: token.sub }).toArray();
    res.status(200).json(collections);
    return;
  }

  res.status(405).json({ message: "Invalid request method" });
}
