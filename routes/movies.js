import express from "express";
import {client, redisClient } from "../mongoConfig.js";
import { ObjectId } from "mongodb";

const router = express.Router();
const db = client.db("sample_mflix");
const moviesCollection = db.collection("movies");
const cacheKey = (id) => `movie-${id}`;

// GET /movies: Get the first 10 Movies
router.get("/movies", async (req, res) => {
  try {
    const movies = await moviesCollection.find({}).limit(10).toArray();
    res.json(movies);
  } catch (error) {
    res.status(500).send(error);
  }
});

// GET /movie/:id: Get one Movie by its ID
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  const cachedMovie = await redisClient.get(cacheKey(movieId));

  if (cachedMovie) {
    return res.json(cachedMovie);
  }

  try {
    const movie = await moviesCollection.findOne({
      _id: new ObjectId(movieId),
    });
    if (movie) {
      await redisClient.set(cacheKey(movieId), JSON.stringify(movie));
      res.json(movie);
    } else {
      res.status(404).send("Movie not found");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// PATCH /movie/:id: Update one Movie's title by its ID
router.patch("/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  const newTitle = req.body.title;

  try {
    const result = await moviesCollection.updateOne(
      { _id: new ObjectId(movieId) },
      { $set: { title: newTitle } }
    );
    if (result.matchedCount > 0) {
      const updatedMovie = await moviesCollection.findOne({
        _id: new ObjectId(movieId),
      });
      await redisClient.set(cacheKey(movieId), JSON.stringify(updatedMovie)); // Write-through
      res.json(updatedMovie);
    } else {
      res.status(404).send("Movie not found");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// DELETE /movie/:id: Delete a movie by its ID
router.delete("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const result = await moviesCollection.deleteOne({
      _id: new ObjectId(movieId),
    });
    if (result.deletedCount > 0) {
      await redisClient.del(cacheKey(movieId)); // Invalidate cache
      res.send("Movie deleted");
    } else {
      res.status(404).send("Movie not found");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
