const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express, { Request, Response } from "express";

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
import { MongoClient, ServerApiVersion } from "mongodb";
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const database = client.db("ForexMaster-DB");
        const analysisCollection = database.collection("analysis")
        const userCollection = database.collection('user')


        app.post("/api/post-analysis", async (req: Request, res: Response) => {
            const data = req.body;
            const newData = {
                ...data,
                createdAt: new Date()
            }
            // console.log(newData)

            const result = await analysisCollection.insertOne(newData);
            res.json(result)
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})