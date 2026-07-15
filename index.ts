const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express, { Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";

// const express = require('express');
const app = express()
const port = process.env.PORT || 5000

// Extras
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()
app.use(cors());
app.use(express.json());


app.get('/', (req: Request, res: Response) => {
    res.json('ForexMaster server is running smoothly')
})


// const { MongoClient, ServerApiVersion } = require('mongodb');
import { MongoClient, ObjectId, ServerApiVersion, } from "mongodb";
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// Token JWKS
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.NEXT_PUBLIC_CLIENT_URL}/api/auth/jwks`)
);

async function run() {
    try {
        // await client.connect();

        const database = client.db("ForexMaster-DB");
        const analysisCollection = database.collection("analysis")


        // Verification
        const tokenChecker = (req: Request, res: Response, next: Function) => {
            console.log("✅ Auth Header : ", req.headers)
            console.log("💖 Token : ", req.headers.authorization)
            // next()
        }

        // Token verify
        const verifyToken = async (req: Request, res: Response, next: Function) => {
            try {
                // Validations
                const authHeader = req.headers.authorization;
                if (!authHeader) {
                    return res.status(401).json({ message: "Unauthorized: No token provided" });
                }

                const token = authHeader.split(" ")[1];
                if (!token) {
                    return res.status(403).json({ message: "Forbidden: Invalid token" });
                }

                // Verify
                const { payload } = await jwtVerify(token, JWKS)
                console.log("Payload", payload)
                next()

            } catch (error) {
                console.error("Error with token verification", error);
                return res.status(401).json({ message: "Unauthorized user" })
            }
        }

        // Featured section
        app.get("/api/featured-charts", async (req: Request, res: Response) => {
            try {
                const result = await analysisCollection.find({ isFeatured: true }).toArray();
                res.json(result);

            } catch (error) {
                console.error("Error fetching featured charts:", error);
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error: Failed to fetch featured charts"
                });
            }
        });

        // Add Analysis --> Post to database
        app.post("/api/post-analysis", verifyToken, async (req: Request, res: Response) => {
            try {
                const data = req.body;
                const newData = {
                    ...data,
                    createdAt: new Date()
                };
                // console.log(newData)

                const result = await analysisCollection.insertOne(newData);
                res.json(result);

            } catch (error) {
                console.error("Error posting analysis:", error);
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error: Failed to post analysis"
                });
            }
        });

        // Analysis --> get all data from database
        app.get("/api/get-analysis", async (req: Request, res: Response) => {
            try {
                const result = await analysisCollection.find().sort({ createdAt: -1 }).toArray();
                res.json(result);
                
            } catch (error) {
                console.error("Error fetching all analysis:", error);
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error: Failed to fetch analysis data"
                });
            }
        });

        // Details Page --> get single data
        app.get("/api/single-analysis/:id", async (req: Request, res: Response) => {
            try {
                const { id } = req.params as { id: string }
                const query = {
                    _id: new ObjectId(id)
                }
                const result = await analysisCollection.findOne(query)

                // Analysis not found
                if (!result) {
                    return res.status(404).json({
                        success: false,
                        message: "Analysis not found"
                    });
                }

                // Analysis Found
                res.json(result)

            } catch (error) {
                console.error("Single Analysis Fetch Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error"
                });
            }
        })

        // Manage Analysis page --> get data based on authorId with Pagination
        app.get("/api/my-analysis", verifyToken, async (req: Request, res: Response) => {
            try {
                const { authorId } = req.query;

                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 6;
                const skip = (page - 1) * limit;

                const result = await analysisCollection
                    .find({ authorId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray()

                // Total page calculation
                const totalData = await analysisCollection.countDocuments({ authorId });
                const totalPages = Math.ceil(totalData / limit);

                res.json({ data: result, page, totalPages, totalData });

            } catch (error) {
                console.error("Error fetching analysis:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        })

        // Manage Analysis page --> delete the analysis
        app.delete("/api/delete-analysis", verifyToken, async (req: Request, res: Response) => {
            try {
                const { analysisId } = req.query as { analysisId: string }
                const query = {
                    _id: new ObjectId(analysisId)
                }

                const result = await analysisCollection.deleteOne(query)
                res.json(result)

            } catch (error) {
                console.error("Error fetching analysis:", error);
                res.status(500).json({ message: "Internal server error! Analysis not deleted" });
            }
        })



        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})