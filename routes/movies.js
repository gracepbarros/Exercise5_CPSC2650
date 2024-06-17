import express from "express";
import Movie from "../models/movie.js";

const router = express.Router();
const cacheKey = (id) => `movie-${id}`;

// GET /movies: Get the first 10 Movies
router.get('/movies', async (req, res) => {
    try {
        const movies = await Movie.find({}).limit(10);
        res.json(movies);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET /movie/:id: Get one Movie by its ID
router.get('/movie/:id', async (req, res) => {
    const movieId = req.params.id;
    const cachedMovie = cache.get(cacheKey(movieId));

    if (cachedMovie) {
        return res.json(cachedMovie);
    }

    try {
        const movie = await Movie.findById(movieId);
        if (movie) {
            cache.set(cacheKey(movieId), movie);
            res.json(movie);
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

// PATCH /movie/:id: Update one Movie's title by its ID
router.patch('/movie/:id', async (req, res) => {
    const movieId = req.params.id;
    const newTitle = req.body.title;

    try {
        const movie = await Movie.findByIdAndUpdate(movieId, { title: newTitle }, { new: true });
        if (movie) {
            cache.set(cacheKey(movieId), movie); // Write-through
            res.json(movie);
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

// DELETE /movie/:id: Delete a movie by its ID
router.delete('/movie/:id', async (req, res) => {
    const movieId = req.params.id;

    try {
        const movie = await Movie.findByIdAndDelete(movieId);
        if (movie) {
            cache.del(cacheKey(movieId)); // Invalidate cache
            res.send('Movie deleted');
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
