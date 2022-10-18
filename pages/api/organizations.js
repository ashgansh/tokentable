import clientPromise from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }

  if (req.method === "GET") {
    const client = await clientPromise;
    const collection = client.db("tokenops").collection("operators");
    const operators = await collection
      .aggregate([
        {
          $match: { account: token.sub },
        },
        {
          $lookup: {
            from: "organizations",
            localField: "organization",
            foreignField: "_id",
            as: "organizations",
          },
        },
      ])
      .toArray();

    const organizations = operators.map(operator => operator.organizations.shift())

    res.status(200).json(organizations);
    return;
  }

  res.status(405).json({ message: "Invalid request method" });
}